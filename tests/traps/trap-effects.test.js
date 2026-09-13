import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { adapter } from '../../src/adapters/index.js';
import {
    createCasterProxy,
    executeTrapEffect,
    playEffectAsTrap,
    setupTrap
} from '../../src/animation/traps/trap-manager.js';
import { MODULE_ID } from '../../src/lib/constants.js';
import { FoundryV12Adapter } from '../../src/adapters/foundry/foundry-v12-adapter.js';

adapter.foundry = new FoundryV12Adapter(adapter);

test('createCasterProxy: creates Token-compatible proxy for Tile placeable', () => {
    const tile = {
        id: 'tile-origin-1',
        x: 100,
        y: 200,
        w: 100,
        h: 100,
        rotation: 0,
        document: {
            id: 'tile-origin-1',
            uuid: 'Scene.1.Tile.tile-origin-1',
            name: 'Wall Spout',
            x: 100,
            y: 200,
            width: 100,
            height: 100,
            rotation: 0,
            elevation: 0,
            texture: {
                src: 'tiles/spout.png',
                scaleX: 1,
                scaleY: 1
            }
        }
    };

    const targetLoc = { x: 400, y: 600 };
    const proxy = createCasterProxy(tile, targetLoc);

    assert.ok(proxy);
    assert.equal(proxy.id, 'tile-origin-1');
    assert.equal(proxy.name, 'Wall Spout');
    assert.deepEqual(proxy.center, { x: 150, y: 250 });
    assert.equal(proxy.w, 100);
    assert.equal(proxy.h, 100);
    // dx = 400 - 150 = 250, dy = 600 - 250 = 350 -> angle in degrees
    const expectedAngle = Math.atan2(350, 250) * 180 / Math.PI;
    assert.ok(Math.abs(proxy.rotation - expectedAngle) < 0.001);
    assert.ok(proxy.document);
    assert.equal(proxy.document.texture.src, 'tiles/spout.png');
    assert.equal(proxy.document.name, 'Wall Spout');
});

test('createCasterProxy: creates Token-compatible proxy for Region placeable', () => {
    const regionDoc = {
        id: 'region-origin-1',
        name: 'Gargoyle Statue',
        documentName: 'Region',
        shapes: [{ x: 50, y: 50, width: 200, height: 200, center: { x: 150, y: 150 } }],
        elevation: 10,
        texture: { src: 'icons/statue.png', scaleX: 1, scaleY: 1 }
    };

    const targetLoc = { x: 550, y: 150 }; // Straight east: rotation = 0 deg
    const proxy = createCasterProxy(regionDoc, targetLoc);

    assert.ok(proxy);
    assert.equal(proxy.id, 'region-origin-1');
    assert.equal(proxy.name, 'Gargoyle Statue');
    assert.deepEqual(proxy.center, { x: 150, y: 150 });
    assert.equal(proxy.rotation, 0);
    assert.equal(proxy.document.elevation, 10);
    assert.equal(proxy.document.texture.src, 'icons/statue.png');
});

test('createCasterProxy: passes through Token placeables unchanged and handles null', () => {
    const token = {
        id: 'tok-real-1',
        documentName: 'Token',
        document: { id: 'tok-real-1', name: 'Real Mage' }
    };
    assert.equal(createCasterProxy(token), token);
    assert.equal(createCasterProxy(null), null);
});

test('adapter.getTemplatePosition: cleanly handles Tile as template and sets primary to caster proxy', () => {
    const tile = {
        id: 'tile-target-zone',
        documentName: 'Tile',
        x: 300,
        y: 400,
        document: {
            id: 'tile-target-zone',
            documentName: 'Tile',
            x: 300,
            y: 400,
            width: 200,
            height: 200,
            texture: { src: 'tiles/trapzone.png' }
        }
    };

    const casterProxy = {
        id: 'caster-proxy-1',
        center: { x: 50, y: 50 },
        document: { id: 'caster-proxy-1', rotation: 0 }
    };

    const positions = adapter.getTemplatePosition(tile, { token: casterProxy });
    assert.ok(positions);
    assert.equal(positions.length, 3);
    const [primary, secondary, center] = positions;
    assert.deepEqual(primary, { x: 50, y: 50 }, 'Primary must be casterProxy center');
    assert.deepEqual(secondary, { x: 400, y: 500 }, 'Secondary must be tile center (300+100, 400+100)');
    assert.deepEqual(center, { x: 400, y: 500 }, 'Center must be tile center');
});

test('executeTrapEffect: executes template animation with caster proxy and target placeable', async () => {
    let capturedToken = null;
    let capturedConfig = null;

    const mockFireball = {
        default_config: { id: 'fireball', radius: 20 },
        play: async (token, config) => {
            capturedToken = token;
            capturedConfig = config;
            return { played: true, effect: 'fireball' };
        }
    };

    const originTile = {
        id: 'tile-statue-1',
        documentName: 'Tile',
        x: 0,
        y: 0,
        document: {
            id: 'tile-statue-1',
            documentName: 'Tile',
            name: 'Fire Gargoyle',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            texture: { src: 'gargoyle.png' }
        }
    };

    const targetRegion = {
        id: 'reg-landing-1',
        documentName: 'Region',
        shapes: [{ x: 300, y: 400, width: 200, height: 200, center: { x: 400, y: 500 } }],
        document: {
            id: 'reg-landing-1',
            documentName: 'Region',
            shapes: [{ x: 300, y: 400, width: 200, height: 200, center: { x: 400, y: 500 } }]
        }
    };

    const result = await executeTrapEffect(mockFireball, originTile, targetRegion, [], { damage: '8d6' });

    assert.ok(result);
    assert.equal(result.played, true);
    assert.ok(capturedToken, 'Template effect must receive caster proxy as token');
    assert.equal(capturedToken.name, 'Fire Gargoyle');
    assert.deepEqual(capturedToken.center, { x: 50, y: 50 });
    assert.equal(capturedConfig.template, targetRegion, 'Template effect must receive targetPlaceable as template');
    assert.deepEqual(capturedConfig.targetLocation, { x: 400, y: 500 });
    assert.equal(capturedConfig.damage, '8d6');
});

test('executeTrapEffect: executes targeted animation for multiple tokens in trap zone', async () => {
    const targetedCalls = [];

    const mockDisintegrate = {
        default_config: { id: 'disintegrate' },
        play: async (token, target, config) => {
            targetedCalls.push({ token, target, config });
            return { hit: target.name };
        }
    };

    const originTile = {
        id: 'tile-crystal',
        documentName: 'Tile',
        x: 100,
        y: 100,
        document: { id: 'tile-crystal', documentName: 'Tile', name: 'Focus Crystal', x: 100, y: 100, width: 100, height: 100 }
    };

    const target1 = { id: 'tok-1', name: 'Goblin 1', center: { x: 300, y: 300 }, document: { id: 'tok-1', width: 1, height: 1 } };
    const target2 = { id: 'tok-2', name: 'Goblin 2', center: { x: 350, y: 350 }, document: { id: 'tok-2', width: 1, height: 1 } };

    const results = await executeTrapEffect(mockDisintegrate, originTile, null, [target1, target2], { power: 'max' });

    assert.equal(targetedCalls.length, 2, 'Must invoke targeted effect for each target token');
    assert.equal(targetedCalls[0].token.name, 'Focus Crystal');
    assert.equal(targetedCalls[0].target.id, 'tok-1');
    assert.equal(targetedCalls[1].target.id, 'tok-2');
    assert.equal(results.length, 2);
    assert.equal(results[0].hit, 'Goblin 1');
    assert.equal(results[1].hit, 'Goblin 2');
});

test('executeTrapEffect: targeted animation with 0 tokens fires at landing placeable proxy', async () => {
    let capturedSource = null;
    let capturedTarget = null;

    const mockBeam = {
        default_config: { id: 'beam' },
        play: async (source, target) => {
            capturedSource = source;
            capturedTarget = target;
            return { fired: true };
        }
    };

    const originTile = {
        id: 'tile-turret',
        documentName: 'Tile',
        x: 0,
        y: 0,
        document: { id: 'tile-turret', documentName: 'Tile', name: 'Turret', x: 0, y: 0, width: 100, height: 100 }
    };

    const landingTile = {
        id: 'tile-landing',
        documentName: 'Tile',
        x: 500,
        y: 500,
        document: { id: 'tile-landing', documentName: 'Tile', name: 'Target Pad', x: 500, y: 500, width: 100, height: 100 }
    };

    const result = await playEffectAsTrap(mockBeam, originTile, landingTile, []);

    assert.ok(result);
    assert.equal(result.fired, true);
    assert.ok(capturedSource);
    assert.equal(capturedSource.name, 'Turret');
    assert.ok(capturedTarget, 'Must create target proxy for landing placeable when no tokens are present');
    assert.equal(capturedTarget.name, 'Target Pad');
    assert.deepEqual(capturedTarget.center, { x: 550, y: 550 });
});

test('setupTrap: generates script invoking adapter.executeTrapEffect for spell effects in region mode', async () => {
    globalThis.game.user = { isGM: true };
    globalThis.game.release = { generation: 14 };
    const { FoundryV14Adapter } = await import('../../src/adapters/foundry/foundry-v14-adapter.js');
    adapter.foundry = new FoundryV14Adapter(adapter);

    let createdBehaviorData = null;
    const triggerRegionDoc = {
        id: 'reg-trig-fireball',
        documentName: 'Region',
        behaviors: [],
        update: async () => triggerRegionDoc,
        createEmbeddedDocuments: async (_type, [data]) => {
            createdBehaviorData = data;
            return [{ id: 'beh-fireball', ...data }];
        }
    };

    const originDoc = {
        id: 'reg-origin-spout',
        documentName: 'Region',
        origin: { x: 100, y: 100 },
        document: { id: 'reg-origin-spout' }
    };

    const targetDoc = {
        id: 'reg-target-room',
        documentName: 'Region',
        origin: { x: 500, y: 500 },
        document: { id: 'reg-target-room' }
    };

    globalThis.canvas.regions = {
        controlled: [{ document: triggerRegionDoc, id: 'reg-trig-fireball' }],
        get: (id) => {
            if (id === 'reg-origin-spout') return { document: originDoc, id };
            if (id === 'reg-target-room') return { document: targetDoc, id };
            if (id === 'reg-trig-fireball') return { document: triggerRegionDoc, id };
            return null;
        }
    };
    globalThis.canvas.tiles = { controlled: [], get: () => null };

    let step = 0;
    adapter.buttonDialog = async () => {
        step++;
        if (step === 2) {
            globalThis.canvas.regions.controlled = [{ document: originDoc, id: 'reg-origin-spout' }];
        } else if (step === 3) {
            globalThis.canvas.regions.controlled = [{ document: targetDoc, id: 'reg-target-room' }];
        }
        return 'continue';
    };

    const setupResult = await setupTrap('eskie.effect.fireball', { mode: 'region' });
    assert.ok(setupResult);
    assert.equal(setupResult.triggerRegions.length, 1);
    assert.equal(setupResult.originElements.length, 1);
    assert.equal(setupResult.targetElements.length, 1);

    assert.ok(createdBehaviorData);
    assert.ok(
        createdBehaviorData.system.source.includes("adapter.executeTrapEffect('eskie.effect.fireball', placeable, targetPlaceable, targets,"),
        'Generated script for spell trap must invoke adapter.executeTrapEffect'
    );

    // Execute generated script to verify execution through adapter.executeTrapEffect
    let trapExecuted = false;
    let passedOrigin = null;
    let passedTarget = null;

    globalThis.eskie = {
        effect: {
            fireball: {
                default_config: { id: 'fireball', radius: 20 },
                play: async (token, config) => {
                    trapExecuted = true;
                    passedOrigin = token;
                    passedTarget = config.template;
                    return { ok: true };
                }
            }
        }
    };

    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const scriptFn = new AsyncFunction('event', createdBehaviorData.system.source);
    await scriptFn({
        region: triggerRegionDoc,
        data: { token: { id: 'hero-1', object: { id: 'hero-1', name: 'Hero' } } }
    });

    assert.equal(trapExecuted, true, 'Script must trigger execution through executeTrapEffect');
    assert.equal(passedOrigin.id, 'reg-origin-spout');
    assert.equal(passedTarget.id, 'reg-target-room');

    delete globalThis.eskie;
});

test('executeTrapEffect: delegates to trap module when animation is a TrapModule', async () => {
    let capturedTile = null;
    let capturedTargets = null;
    let capturedConfig = null;

    const mockTrap = {
        setup: async () => {},
        play: async (tile, targets, config) => {
            capturedTile = tile;
            capturedTargets = targets;
            capturedConfig = config;
            return { trapFired: true };
        }
    };

    const originTile = { id: 'tile-spike-origin', documentName: 'Tile', x: 0, y: 0 };
    const targets = [{ id: 'victim-1' }];
    const targetLoc = { x: 50, y: 50 };

    const result = await executeTrapEffect(mockTrap, originTile, null, targets, { targetLocation: targetLoc, damage: 10 });

    assert.ok(result.trapFired);
    assert.equal(capturedTile, originTile);
    assert.deepEqual(capturedTargets, targets);
    assert.deepEqual(capturedConfig.targetLocation, targetLoc);
    assert.equal(capturedConfig.damage, 10);
});

test('executeTrapEffect: respects explicit config.type override', async () => {
    let templateCalled = false;
    const mockMulti = {
        play: async (token, config) => {
            templateCalled = true;
            return { token, config };
        }
    };

    const originTile = {
        id: 'tile-multi',
        documentName: 'Tile',
        x: 0,
        y: 0,
        document: { id: 'tile-multi', x: 0, y: 0, width: 100, height: 100 }
    };
    await executeTrapEffect(mockMulti, originTile, null, [], { type: 'template', radius: 15 });
    assert.equal(templateCalled, true, 'Explicit type="template" must dispatch as template effect');
});

test('createCasterProxy: preserves rotation when target location is identical to origin center', () => {
    const tile = {
        id: 'tile-center-test',
        x: 100,
        y: 100,
        w: 100,
        h: 100,
        rotation: 45,
        document: {
            id: 'tile-center-test',
            name: 'Pillar',
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            rotation: 45
        }
    };

    const tileCenter = adapter.getCenter(tile);
    const proxy = createCasterProxy(tile, tileCenter);
    assert.equal(proxy.rotation, 45, 'Must preserve original rotation when distance to target is 0');
});

test('matt.trap.setup: configures adapter.executeTrapEffect for spell effects', async () => {
    globalThis.game.user = { isGM: true, id: 'gm-user-1' };
    globalThis.game.modules.set('monks-active-tiles', { id: 'monks-active-tiles', active: true });

    const editedTiles = [];
    const triggerTile = {
        id: 'matt-trig-spell',
        documentName: 'Tile',
        getFlag: () => [],
        update: async (data) => {
            editedTiles.push({ tileId: 'matt-trig-spell', data });
            return triggerTile;
        }
    };
    const originTile = {
        id: 'matt-origin-spell',
        documentName: 'Tile',
        getFlag: () => [],
        update: async (data) => {
            editedTiles.push({ tileId: 'matt-origin-spell', data });
            return originTile;
        }
    };
    const targetTile = {
        id: 'matt-target-spell',
        documentName: 'Tile',
        getFlag: () => [],
        update: async (data) => {
            editedTiles.push({ tileId: 'matt-target-spell', data });
            return targetTile;
        }
    };

    globalThis.canvas.tiles = {
        controlled: [{ document: triggerTile }],
        get: (id) => {
            if (id === 'matt-trig-spell') return { document: triggerTile, id };
            if (id === 'matt-origin-spell') return { document: originTile, id };
            if (id === 'matt-target-spell') return { document: targetTile, id };
            return null;
        }
    };

    let step = 0;
    adapter.buttonDialog = async () => {
        step++;
        if (step === 2) {
            // Step 2: select origin
            globalThis.canvas.tiles.controlled = [{ document: originTile }];
        } else if (step === 3) {
            // Step 3: select target
            globalThis.canvas.tiles.controlled = [{ document: targetTile }];
        }
        return 'continue';
    };

    const { matt } = await import('../../src/animation/utils/matt-tiles.js');
    await matt.trap.setup('eskie.effect.lightningBolt', { tileCount: 3 });

    assert.equal(editedTiles.length, 2, 'Must configure trigger and origin tiles');
    const originEdit = editedTiles.find(e => e.tileId === 'matt-origin-spell');
    assert.ok(originEdit);
    const actionCode = originEdit.data['flags.monks-active-tiles.actions'][0].data.code;
    assert.ok(
        actionCode.includes("await adapter.executeTrapEffect(animation, tilePlaceable, targetTile, targets,"),
        'MATT action code must call adapter.executeTrapEffect for non-eskie-traps'
    );
});

test('traps.setup: direct string invocation or config.animation routes to setupTrap', async () => {
    const { traps } = await import('../../src/animation/traps/index.js');

    assert.equal(traps.setupTrap, undefined, 'setupTrap should not be exported on public traps namespace');

    // Test direct string animation call
    let calledAnimation = null;
    let calledConfig = null;
    const { matt } = await import('../../src/animation/utils/matt-tiles.js');
    const originalMattSetup = matt.trap.setup;
    matt.trap.setup = async (anim, cfg) => {
        calledAnimation = anim;
        calledConfig = cfg;
        return { success: true };
    };

    globalThis.game.release = { generation: 12 };
    globalThis.game.user = { isGM: true };

    await traps.setup('eskie.effect.fireball', { customOption: true });
    assert.equal(calledAnimation, 'eskie.effect.fireball');
    assert.equal(calledConfig.customOption, true);

    // Test config with animation property
    calledAnimation = null;
    calledConfig = null;
    await traps.setup({ animation: 'eskie.effect.lightningBolt', speed: 500 });
    assert.equal(calledAnimation, 'eskie.effect.lightningBolt');
    assert.equal(calledConfig.speed, 500);

    matt.trap.setup = originalMattSetup;
});

test('traps.setup: interactive dialog includes Spell / Animation Effect option', async () => {
    const { traps } = await import('../../src/animation/traps/index.js');

    let passedButtons = null;
    adapter.buttonDialog = async (data) => {
        passedButtons = data.buttons;
        return 'customEffect';
    };

    const dialogCls = adapter.foundry.DialogV2 ?? globalThis.foundry?.applications?.api?.DialogV2;
    const originalPrompt = dialogCls.prompt;
    dialogCls.prompt = async () => 'disintegrate';

    let calledAnimation = null;
    const { matt } = await import('../../src/animation/utils/matt-tiles.js');
    const originalMattSetup = matt.trap.setup;
    matt.trap.setup = async (anim) => {
        calledAnimation = anim;
        return { success: true };
    };

    globalThis.game.release = { generation: 12 };
    globalThis.game.user = { isGM: true };

    await traps.setup();

    assert.ok(passedButtons);
    const customEffectBtn = passedButtons.find(b => b.value === 'customEffect');
    assert.ok(customEffectBtn, 'Must include customEffect option in setup dialog');
    assert.equal(customEffectBtn.label, 'Spell / Animation Effect');
    assert.equal(calledAnimation, 'eskie.effect.disintegrate', 'Must resolve and execute custom effect');

    dialogCls.prompt = originalPrompt;
    matt.trap.setup = originalMattSetup;
});

