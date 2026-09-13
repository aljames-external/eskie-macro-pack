import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { adapter } from '../../src/adapters/index.js';
import { matt } from '../../src/animation/utils/matt-tiles.js';
import { MODULE_ID } from '../../src/lib/constants.js';

test('matt.trap.setup configures trigger tiles to manually activate trap tiles and trap tiles to target contained tokens', async () => {
    const updatedTiles = new Map();
    globalThis.game.user = { isGM: true, id: 'gm-user-1' };
    globalThis.game.modules.set('monks-active-tiles', { id: 'monks-active-tiles', active: true });

    let trapTileTriggered = false;
    let trapTileTriggerArg = null;

    const triggerTileDoc = {
        id: 'tile-trigger-1',
        flags: {},
        update: async (data) => {
            updatedTiles.set('tile-trigger-1', data);
            return triggerTileDoc;
        }
    };
    const trapTileDoc = {
        id: 'tile-trap-1',
        flags: {},
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        trigger: async (args) => {
            trapTileTriggered = true;
            trapTileTriggerArg = args;
        },
        update: async (data) => {
            updatedTiles.set('tile-trap-1', data);
            return trapTileDoc;
        }
    };

    globalThis.canvas.tiles = {
        controlled: [{ document: triggerTileDoc, id: 'tile-trigger-1' }],
        get: (id) => (id === 'tile-trigger-1' ? { document: triggerTileDoc, id } : id === 'tile-trap-1' ? { document: trapTileDoc, id } : null)
    };

    // Simulate multi-step dialog selection: step 1 trigger tile, step 2 trap animation tile
    let dialogCount = 0;
    adapter.buttonDialog = async () => {
        dialogCount++;
        if (dialogCount === 2) {
            globalThis.canvas.tiles.controlled = [{ document: trapTileDoc, id: 'tile-trap-1' }];
        }
        return 'continue';
    };

    await matt.trap.setup('eskie.traps.spike', { tileCount: 2 });

    // 1. Verify Trigger Tile configuration
    const triggerUpdate = updatedTiles.get('tile-trigger-1');
    assert.ok(triggerUpdate, 'Trigger tile should be updated with MATT configuration');
    assert.equal(triggerUpdate['flags.monks-active-tiles.active'], true);
    assert.equal(triggerUpdate['flags.monks-active-tiles.trigger'], 'enter');

    const triggerAction = triggerUpdate['flags.monks-active-tiles.actions'][0];
    assert.equal(triggerAction.action, 'runcode');
    assert.ok(typeof triggerAction.data.code === 'string');

    // Test executing trigger action code
    const mockTriggerTile = {
        id: 'tile-trigger-1'
    };
    const mockActivatingToken = { id: 'tok-activating', document: { id: 'tok-activating' } };
    const triggerExecFn = new Function('token', 'tile', 'canvas', `return (async () => { ${triggerAction.data.code} })();`);
    await triggerExecFn(mockActivatingToken, mockTriggerTile, globalThis.canvas);

    assert.equal(trapTileTriggered, true, 'Trigger tile execution should manually trigger the linked trap tile');
    assert.equal(trapTileTriggerArg.token.id, 'tok-activating', 'Activating token should be passed to trap tile trigger');

    // 2. Verify Trap Tile configuration
    const trapUpdate = updatedTiles.get('tile-trap-1');
    assert.ok(trapUpdate, 'Trap tile should be updated with MATT configuration');
    assert.equal(trapUpdate['flags.monks-active-tiles.active'], true);
    assert.equal(trapUpdate['flags.monks-active-tiles.trigger'], 'manual');

    const trapAction = trapUpdate['flags.monks-active-tiles.actions'][0];
    assert.equal(trapAction.action, 'runcode');
    assert.ok(typeof trapAction.data.code === 'string');

    // Verify the code string resolves adapter via module API
    assert.ok(trapAction.data.code.includes(`const adapter = game.modules.get('${MODULE_ID}').api.adapter;`), 'Generated code should resolve adapter from module API');
    assert.ok(trapAction.data.code.includes('const trap = adapter.getProperty(globalThis, animation);'), 'Generated code should invoke getProperty on resolved adapter');
    assert.ok(trapAction.data.code.includes('let targets = adapter.getTokensInTile(tilePlaceable);'), 'Generated code should delegate token containment lookup directly to adapter.getTokensInTile');

    // Test executing trap action code
    let playCalled = false;
    let playTargets = [];
    let playConfig = null;
    globalThis.eskie = {
        traps: {
            spike: {
                play: (originTile, tokens, config) => {
                    playCalled = true;
                    playTargets = tokens;
                    playConfig = config;
                    assert.equal(originTile.id, 'tile-trap-1');
                }
            }
        }
    };
    globalThis.game.modules.set(MODULE_ID, { id: MODULE_ID, api: { adapter } });

    // Place tokens on canvas: tokenInside is inside the trap tile (100, 100, 100, 100), tokenOutside is outside (300, 300)
    const tokenInside = { id: 'tok-inside', document: { id: 'tok-inside', x: 120, y: 120, width: 1, height: 1 }, x: 120, y: 120, w: 100, h: 100 };
    const tokenOutside = { id: 'tok-outside', document: { id: 'tok-outside', x: 300, y: 300, width: 1, height: 1 }, x: 300, y: 300, w: 100, h: 100 };
    globalThis.canvas.tokens = {
        placeables: [tokenInside, tokenOutside],
        get: (id) => (id === 'tok-inside' ? tokenInside : (id === 'tok-activating' ? { id: 'tok-activating', document: { id: 'tok-activating' } } : null))
    };
    globalThis.canvas.grid = { size: 100 };

    const mockTrapTilePlaceable = {
        id: 'tile-trap-1',
        document: {
            id: 'tile-trap-1',
            x: 100,
            y: 100,
            width: 100,
            height: 100
        },
        x: 100,
        y: 100,
        width: 100,
        height: 100
    };

    // In MATT runtime, "tile" in action scope is a TileDocument, and canvas.tiles.get(id) returns the placeable
    const mockTrapTileDoc = {
        id: 'tile-trap-1',
        object: mockTrapTilePlaceable
    };
    globalThis.canvas.tiles = {
        get: (id) => (id === 'tile-trap-1' ? mockTrapTilePlaceable : null)
    };

    const trapExecFn = new Function('token', 'tile', 'canvas', `return (async () => { ${trapAction.data.code} })();`);
    await trapExecFn(mockActivatingToken, mockTrapTileDoc, globalThis.canvas);

    assert.equal(playCalled, true, 'Trap play should be invoked successfully');
    assert.equal(playTargets.length, 1, 'Only tokens contained within the trap tile should be targeted');
    assert.equal(playTargets[0].id, 'tok-inside', 'Contained token should be the target');
    assert.equal(playConfig.targetTile, undefined, 'Trap without target tile should not receive targetTile');

    // When no tokens are in the trap tile and the activating token is only on the trigger tile, it must not be targeted
    playCalled = false;
    playTargets = [];
    globalThis.canvas.tokens = {
        placeables: [],
        get: () => null
    };
    await trapExecFn(mockActivatingToken, mockTrapTileDoc, globalThis.canvas);
    assert.equal(playCalled, true, 'Trap play should still trigger');
    assert.equal(playTargets.length, 0, 'Activating token only on trigger tile must not be targeted on separate trap tile');
});

test('matt.trap.setup correctly handles when the trigger tile is the trap tile (single tile)', async () => {
    const updatedTiles = new Map();
    globalThis.game.user = { isGM: true, id: 'gm-user-1' };
    globalThis.game.modules.set('monks-active-tiles', { id: 'monks-active-tiles', active: true });

    const selfTileDoc = {
        id: 'tile-self-1',
        flags: {},
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        update: async (data) => {
            updatedTiles.set('tile-self-1', data);
            return selfTileDoc;
        }
    };

    globalThis.canvas.tiles = {
        controlled: [{ document: selfTileDoc, id: 'tile-self-1' }],
        get: (id) => (id === 'tile-self-1' ? { document: selfTileDoc, id } : null)
    };

    // Simulate selecting the same tile for trigger and trap
    adapter.buttonDialog = async () => 'continue';

    await matt.trap.setup('eskie.traps.spike', { tileCount: 2 });

    const selfUpdate = updatedTiles.get('tile-self-1');
    assert.ok(selfUpdate, 'Single tile should be updated');
    assert.equal(selfUpdate['flags.monks-active-tiles.active'], true);
    assert.equal(selfUpdate['flags.monks-active-tiles.trigger'], 'enter', 'Combined tile should have enter trigger');
    const action = selfUpdate['flags.monks-active-tiles.actions'][0];
    assert.equal(action.action, 'runcode');

    // Test execution of combined action
    let playCalled = false;
    let playTargets = [];
    globalThis.eskie = {
        traps: {
            spike: {
                play: (tile, tokens) => {
                    playCalled = true;
                    playTargets = tokens;
                    assert.equal(tile.id, 'tile-self-1');
                }
            }
        }
    };
    globalThis.game.modules.set(MODULE_ID, { id: MODULE_ID, api: { adapter } });

    // Place tokens on canvas: tokenInside is on tile
    const tokenInside = { id: 'tok-on-tile', document: { id: 'tok-on-tile', x: 220, y: 220, width: 1, height: 1 }, x: 220, y: 220, w: 100, h: 100 };
    globalThis.canvas.tokens = {
        placeables: [tokenInside],
        get: (id) => (id === 'tok-on-tile' ? tokenInside : null)
    };
    globalThis.canvas.grid = { size: 100 };

    const mockTilePlaceable = {
        id: 'tile-self-1',
        x: 200,
        y: 200,
        width: 100,
        height: 100
    };
    const mockTileDoc = {
        id: 'tile-self-1',
        object: mockTilePlaceable
    };
    mockTilePlaceable.document = mockTileDoc;
    globalThis.canvas.tiles.get = (id) => (id === 'tile-self-1' ? mockTilePlaceable : null);

    const mockToken = { id: 'tok-on-tile', document: { id: 'tok-on-tile' } };

    const execFn = new Function('token', 'tile', 'canvas', `return (async () => { ${action.data.code} })();`);
    await execFn(mockToken, mockTileDoc, globalThis.canvas);

    assert.equal(playCalled, true, 'Trap play should be executed on the tile');
    assert.equal(playTargets.length, 1, 'Token on the tile should be targeted');
    assert.equal(playTargets[0].id, 'tok-on-tile');

    // Test fallback when no tokens on canvas overlap (e.g. pre-update movement entry)
    playCalled = false;
    playTargets = [];
    globalThis.canvas.tokens = {
        placeables: [],
        get: (id) => (id === 'tok-on-tile' ? mockToken : null)
    };
    await execFn(mockToken, mockTileDoc, globalThis.canvas);
    assert.equal(playCalled, true, 'Trap play should still execute with fallback activating token');
    assert.equal(playTargets.length, 1);
    assert.equal(playTargets[0].id, 'tok-on-tile');
});

test('adapter.getTokensInTile returns only overlapping tokens', () => {
    const tile = {
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        document: { x: 100, y: 100, width: 200, height: 200 }
    };

    const token1 = { id: 't1', x: 150, y: 150, w: 100, h: 100, document: { x: 150, y: 150, width: 1, height: 1 } };
    const token2 = { id: 't2', x: 50, y: 50, w: 100, h: 100, document: { x: 50, y: 50, width: 1, height: 1 } }; // Overlaps top-left
    const token3 = { id: 't3', x: 300, y: 300, w: 100, h: 100, document: { x: 300, y: 300, width: 1, height: 1 } }; // Outside
    const token4 = { id: 't4', x: 100, y: 300, w: 100, h: 100, document: { x: 100, y: 300, width: 1, height: 1 } }; // Touching edge (no overlap)

    globalThis.canvas.tokens = {
        placeables: [token1, token2, token3, token4]
    };
    globalThis.canvas.grid = { size: 100 };

    const contained = adapter.getTokensInTile(tile);
    assert.deepEqual(contained.map(t => t.id), ['t1', 't2']);
    assert.deepEqual(adapter.getTokensInTile(null), []);
});

test('matt.trap.setup configures targetLocation in trap config for 3-tile setups', async () => {
    const updatedTiles = new Map();
    globalThis.game.user = { isGM: true, id: 'gm-user-1' };
    globalThis.game.modules.set('monks-active-tiles', { id: 'monks-active-tiles', active: true });

    const createTile = (id) => {
        const doc = {
            id,
            flags: {},
            update: async (data) => {
                updatedTiles.set(id, data);
                return doc;
            }
        };
        return { id, document: doc };
    };

    const triggerTile = createTile('tile-trigger-3');
    const trapTile = createTile('tile-trap-3');
    const targetTile = createTile('tile-target-3');

    globalThis.canvas.tiles = {
        controlled: [triggerTile],
        get: (id) => (id === 'tile-trigger-3' ? triggerTile : id === 'tile-trap-3' ? trapTile : id === 'tile-target-3' ? targetTile : null)
    };

    let step = 0;
    adapter.buttonDialog = async () => {
        step++;
        if (step === 1) globalThis.canvas.tiles.controlled = [triggerTile];
        else if (step === 2) globalThis.canvas.tiles.controlled = [trapTile];
        else if (step === 3) globalThis.canvas.tiles.controlled = [targetTile];
        return 'continue';
    };

    await matt.trap.setup('eskie.traps.rollingBoulder', { tileCount: 3 });

    const trapUpdate = updatedTiles.get('tile-trap-3');
    assert.ok(trapUpdate, 'Trap tile should be updated');
    const trapAction = trapUpdate['flags.monks-active-tiles.actions'][0];
    assert.ok(trapAction.data.code.includes("const targetTile = canvas.tiles.get('tile-target-3');"), 'Generated action code must resolve targetTile placeable');
    assert.ok(!trapAction.data.code.includes('"triggerId"'), 'Generated action code must not contain triggerId');
    assert.ok(!trapAction.data.code.includes('"sourceId"'), 'Generated action code must not contain sourceId');

    let playConfigReceived = null;
    globalThis.eskie = {
        traps: {
            rollingBoulder: {
                play: (_origin, _targets, config) => {
                    playConfigReceived = config;
                }
            }
        }
    };
    globalThis.game.modules.set(MODULE_ID, { id: MODULE_ID, api: { adapter } });

    const trapTilePlaceable = { id: 'tile-trap-3' };
    const mockTrapDoc = {
        id: 'tile-trap-3',
        object: trapTilePlaceable,
        getFlag: (mod, key) => (mod === MODULE_ID && key === 'trap.animation' ? 'eskie.traps.rollingBoulder' : null)
    };
    trapTilePlaceable.document = mockTrapDoc;
    globalThis.canvas.tiles.get = (id) => (id === 'tile-trap-3' ? trapTilePlaceable : (id === 'tile-target-3' ? targetTile : null));

    const execFn = new Function('token', 'tile', 'canvas', `return (async () => { ${trapAction.data.code} })();`);
    await execFn(null, mockTrapDoc, globalThis.canvas);

    assert.ok(playConfigReceived, 'Play function should be called');
    assert.ok(playConfigReceived.targetLocation, 'Play config must receive targetLocation coordinate');
    assert.equal(playConfigReceived.targetTile, undefined, 'Play config must not receive targetTile');
    assert.equal(playConfigReceived.tile, undefined, 'Play config must not contain nested tile object');
});

test('matt.trap executes multiple trap tiles concurrently via Promise.all', async () => {
    const updatedTiles = new Map();
    globalThis.game.user = { isGM: true, id: 'gm-user-1' };
    globalThis.game.modules.set('monks-active-tiles', { id: 'monks-active-tiles', active: true });

    let trap1Started = false;
    let trap1Resolved = false;
    let trap2Started = false;
    let trap2Resolved = false;

    let resolveTrap1;
    const trap1Promise = new Promise(resolve => { resolveTrap1 = resolve; });

    let resolveTrap2;
    const trap2Promise = new Promise(resolve => { resolveTrap2 = resolve; });

    const createTile = (id, triggerFn) => {
        const doc = {
            id,
            flags: {},
            trigger: triggerFn,
            update: async (data) => {
                updatedTiles.set(id, data);
                return doc;
            }
        };
        return { id, document: doc };
    };

    const trapTile1 = createTile('tile-trap-parallel-1', async () => {
        trap1Started = true;
        await trap1Promise;
        trap1Resolved = true;
    });

    const trapTile2 = createTile('tile-trap-parallel-2', async () => {
        trap2Started = true;
        await trap2Promise;
        trap2Resolved = true;
    });

    const triggerTile = createTile('tile-trigger-parallel');

    globalThis.canvas.tiles = {
        controlled: [triggerTile],
        get: (id) => (id === 'tile-trigger-parallel' ? triggerTile : id === 'tile-trap-parallel-1' ? trapTile1 : id === 'tile-trap-parallel-2' ? trapTile2 : null)
    };

    let step = 0;
    adapter.buttonDialog = async () => {
        step++;
        if (step === 1) globalThis.canvas.tiles.controlled = [triggerTile];
        else if (step === 2) globalThis.canvas.tiles.controlled = [trapTile1, trapTile2];
        return 'continue';
    };

    await matt.trap.setup('eskie.traps.spike', { tileCount: 2 });

    const triggerUpdate = updatedTiles.get('tile-trigger-parallel');
    assert.ok(triggerUpdate);
    const triggerAction = triggerUpdate['flags.monks-active-tiles.actions'][0];

    // Verify generated code contains Promise.all
    assert.ok(triggerAction.data.code.includes('await Promise.all(promises);'), 'Action code must await Promise.all for concurrent execution');

    // Execute the action code
    const mockTriggerDoc = {
        id: 'tile-trigger-parallel',
        object: triggerTile
    };

    const execFn = new Function('token', 'tile', 'canvas', `return (async () => { ${triggerAction.data.code} })();`);
    const runPromise = execFn(null, mockTriggerDoc, globalThis.canvas);

    // Yield to let both triggers start asynchronously
    await new Promise(r => setTimeout(r, 10));

    // Both trap 1 and trap 2 should have started simultaneously
    assert.equal(trap1Started, true, 'Trap 1 should have started execution');
    assert.equal(trap2Started, true, 'Trap 2 should have started execution concurrently with Trap 1');
    assert.equal(trap1Resolved, false, 'Trap 1 should not have completed yet');
    assert.equal(trap2Resolved, false, 'Trap 2 should not have completed yet');

    // Resolve them both and verify completion
    resolveTrap1();
    resolveTrap2();
    await runPromise;

    assert.equal(trap1Resolved, true);
    assert.equal(trap2Resolved, true);
});

test('matt.trap.setup appends new runcode action to existing actions without overwriting', async () => {
    const updatedTiles = new Map();
    const existingAction = {
        id: 'existing-action-99',
        action: 'runcode',
        data: { code: 'console.log("pre-existing action");' }
    };

    const triggerTileDoc = {
        id: 'tile-trigger-multi',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        getFlag: (_mod, key) => (key === 'actions' ? [existingAction] : (key === 'trigger' ? 'enter' : null)),
        update: async (data) => {
            updatedTiles.set('tile-trigger-multi', data);
            return triggerTileDoc;
        }
    };
    const triggerTile = {
        id: 'tile-trigger-multi',
        document: triggerTileDoc
    };

    const trapTileDoc = {
        id: 'tile-trap-multi',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        getFlag: (_mod, key) => (key === 'actions' ? [existingAction] : null),
        update: async (data) => {
            updatedTiles.set('tile-trap-multi', data);
            return trapTileDoc;
        }
    };
    const trapTile = {
        id: 'tile-trap-multi',
        document: trapTileDoc
    };

    globalThis.canvas.tiles = {
        controlled: [triggerTile],
        get: (id) => (id === 'tile-trap-multi' ? trapTile : (id === 'tile-trigger-multi' ? triggerTile : null))
    };

    let step = 0;
    adapter.buttonDialog = async () => {
        step++;
        if (step === 2) {
            globalThis.canvas.tiles.controlled = [trapTile];
        }
        return 'continue';
    };

    const result = await matt.trap.setup('eskie.traps.fire', { tileCount: 2 });
    assert.ok(result);

    const triggerUpdate = updatedTiles.get('tile-trigger-multi');
    assert.ok(triggerUpdate);
    const triggerActions = triggerUpdate['flags.monks-active-tiles.actions'];
    assert.equal(triggerActions.length, 2, 'Trigger tile should have both existing and new action');
    assert.equal(triggerActions[0].id, 'existing-action-99', 'Existing action must be preserved at index 0');
    assert.equal(triggerActions[1].action, 'runcode', 'New action must be appended at index 1');
    assert.ok(triggerActions[1].data.code.includes('eskie.traps.fire'));

    const trapUpdate = updatedTiles.get('tile-trap-multi');
    assert.ok(trapUpdate);
    const trapActions = trapUpdate['flags.monks-active-tiles.actions'];
    assert.equal(trapActions.length, 2, 'Trap tile should have both existing and new action');
    assert.equal(trapActions[0].id, 'existing-action-99', 'Existing action must be preserved at index 0');
    assert.equal(trapActions[1].action, 'runcode', 'New action must be appended at index 1');
    assert.ok(trapActions[1].data.code.includes('eskie.traps.fire'));
});

test('matt.trap.setup respects custom trigger string (e.g. door)', async () => {
    const updatedTiles = new Map();
    globalThis.game.user = { isGM: true, id: 'gm-user-1' };
    globalThis.game.modules.set('monks-active-tiles', { id: 'monks-active-tiles', active: true });

    const doorTileDoc = {
        id: 'tile-door-1',
        flags: {},
        update: async (data) => {
            updatedTiles.set('tile-door-1', data);
            return doorTileDoc;
        }
    };

    globalThis.canvas.tiles = {
        controlled: [{ document: doorTileDoc, id: 'tile-door-1' }],
        get: (id) => (id === 'tile-door-1' ? { document: doorTileDoc, id } : null)
    };

    adapter.buttonDialog = async () => 'continue';

    await matt.trap.setup('eskie.traps.electricDoor', { tileCount: 1, trigger: 'door' });

    const doorUpdate = updatedTiles.get('tile-door-1');
    assert.ok(doorUpdate);
    assert.equal(doorUpdate['flags.monks-active-tiles.trigger'], 'door', 'Custom trigger string should be set on the tile');
});


