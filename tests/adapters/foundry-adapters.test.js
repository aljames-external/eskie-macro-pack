import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeFoundryAdapter, BaseFoundryAdapter } from '../../src/adapters/foundry/index.js';
import { BaseFoundryAdapter as BaseAdapterClass, USER_PERMISSION_TIERS } from '../../src/adapters/foundry/base-foundry-adapter.js';
import { FoundryV12Adapter } from '../../src/adapters/foundry/foundry-v12-adapter.js';
import { FoundryV13Adapter } from '../../src/adapters/foundry/foundry-v13-adapter.js';
import { FoundryV14Adapter } from '../../src/adapters/foundry/foundry-v14-adapter.js';
import { adapter } from '../../src/adapters/index.js';

test('BaseFoundryAdapter enforces abstract contracts for version-specific properties and methods', async () => {
    const base = new BaseFoundryAdapter();

    // Abstract getters throw
    assert.throws(() => base.ContextMenu, /BaseFoundryAdapter\.ContextMenu must be implemented/);
    assert.throws(() => base.KeyboardManager, /BaseFoundryAdapter\.KeyboardManager must be implemented/);
    assert.throws(() => base.Token, /BaseFoundryAdapter\.Token must be implemented/);
    assert.throws(() => base.Tile, /BaseFoundryAdapter\.Tile must be implemented/);
    assert.throws(() => base.FilePicker, /BaseFoundryAdapter\.FilePicker must be implemented/);
    assert.throws(() => base.TextEditor, /BaseFoundryAdapter\.TextEditor must be implemented/);

    // Abstract methods throw
    assert.throws(() => base.fromUuidSync('Item.123'), /BaseFoundryAdapter\.fromUuidSync must be implemented/);
    await assert.rejects(async () => base.fromUuid('Item.123'), /BaseFoundryAdapter\.fromUuid must be implemented/);
    assert.throws(() => base.getCombatantsByToken({}, 'tok1'), /BaseFoundryAdapter\.getCombatantsByToken must be implemented/);
    assert.throws(() => base.getRevealOffset({}), /BaseFoundryAdapter\.getRevealOffset must be implemented/);
    assert.throws(() => base.getShapeOffset({}), /BaseFoundryAdapter\.getShapeOffset must be implemented/);
    assert.throws(() => base.getTemplatePosition({}), /BaseFoundryAdapter\.getTemplatePosition must be implemented/);
    assert.throws(() => base.getSceneBackground({}), /BaseFoundryAdapter\.getSceneBackground must be implemented/);
    assert.throws(() => base.formatDeletionUpdate('flags', 'key'), /BaseFoundryAdapter\.formatDeletionUpdate must be implemented/);
    await assert.rejects(async () => base.loadTemplates([]), /BaseFoundryAdapter\.loadTemplates must be implemented/);
});

test('initializeFoundryAdapter selects FoundryV12Adapter on v12, FoundryV13Adapter on v13, and FoundryV14Adapter on v14+', () => {
    // V12 baseline
    game.release = { generation: 12 };
    game.version = '12.331';
    const v12 = initializeFoundryAdapter();
    assert.ok(v12 instanceof FoundryV12Adapter);
    assert.ok(v12 instanceof BaseFoundryAdapter);
    assert.equal(v12.generation, 12);

    // V13
    game.release = { generation: 13 };
    game.version = '13.300';
    const v13 = initializeFoundryAdapter();
    assert.ok(v13 instanceof FoundryV13Adapter);
    assert.ok(v13 instanceof FoundryV12Adapter);
    assert.ok(v13 instanceof BaseFoundryAdapter);
    assert.equal(v13.generation, 13);

    // V14 modern
    game.release = { generation: 14 };
    game.version = '14.000';
    const v14 = initializeFoundryAdapter();
    assert.ok(v14 instanceof FoundryV14Adapter);
    assert.ok(v14 instanceof FoundryV13Adapter);
    assert.ok(v14 instanceof FoundryV12Adapter);
    assert.ok(v14 instanceof BaseFoundryAdapter);
    assert.equal(v14.generation, 14);
});

test('Constructor getters contracts across FoundryV12Adapter, FoundryV13Adapter, and FoundryV14Adapter', () => {
    const v12 = new FoundryV12Adapter();
    assert.equal(v12.ContextMenu, globalThis.ContextMenu);
    assert.equal(v12.KeyboardManager, globalThis.KeyboardManager);
    assert.equal(v12.Token, globalThis.Token);
    assert.equal(v12.Tile, globalThis.Tile);
    assert.equal(v12.FilePicker, globalThis.FilePicker);
    assert.equal(v12.TextEditor, globalThis.TextEditor);

    const v13 = new FoundryV13Adapter();
    assert.equal(v13.ContextMenu, globalThis.foundry.applications.ux.ContextMenu.implementation);
    assert.equal(v13.KeyboardManager, globalThis.foundry.helpers.interaction.KeyboardManager.implementation);
    assert.equal(v13.Token, globalThis.foundry.canvas.placeables.Token.implementation);
    assert.equal(v13.Tile, globalThis.foundry.canvas.placeables.Tile.implementation);
    assert.equal(v13.FilePicker, globalThis.foundry.applications.apps.FilePicker.implementation);
    assert.equal(v13.TextEditor, globalThis.foundry.applications.ux.TextEditor.implementation);

    const v14 = new FoundryV14Adapter();
    // V14 inherits V13 constructors
    assert.equal(v14.ContextMenu, globalThis.foundry.applications.ux.ContextMenu.implementation);
    assert.equal(v14.KeyboardManager, globalThis.foundry.helpers.interaction.KeyboardManager.implementation);
    assert.equal(v14.Token, globalThis.foundry.canvas.placeables.Token.implementation);
    assert.equal(v14.Tile, globalThis.foundry.canvas.placeables.Tile.implementation);
    assert.equal(v14.FilePicker, globalThis.foundry.applications.apps.FilePicker.implementation);
    assert.equal(v14.TextEditor, globalThis.foundry.applications.ux.TextEditor.implementation);
});

test('loadTemplates contract across FoundryV12Adapter, FoundryV13Adapter, and FoundryV14Adapter', async () => {
    const v12 = new FoundryV12Adapter();
    const resV12 = await v12.loadTemplates(['templates/test.html']);
    assert.deepEqual(resV12, ['templates/test.html']);

    const v13 = new FoundryV13Adapter();
    const resV13 = await v13.loadTemplates(['templates/test.html']);
    assert.deepEqual(resV13, ['templates/test.html']);

    const v14 = new FoundryV14Adapter();
    const resV14 = await v14.loadTemplates(['templates/test.html']);
    assert.deepEqual(resV14, ['templates/test.html']);
});

test('Tile offset calculations: V12/V13 top-left origin math vs V14+ centered origin math', () => {
    const mockToken = {
        x: 500,
        y: 600,
        center: { x: 550, y: 650 },
        document: {
            documentName: 'Token',
            width: 1,
            height: 1,
            texture: { scaleX: 1.2, scaleY: 1.2 }
        }
    };

    canvas.grid.size = 100;

    // V12 FoundryV12Adapter
    const v12 = new FoundryV12Adapter();
    const v12Reveal = v12.getRevealOffset(mockToken, 1);
    // x = 500 - (100 * 1 * (1.2 - 1) / 2) = 500 - 10 = 490
    // y = 600 - (100 * 1 * (1.2 - 1) / 2) = 600 - 10 = 590
    assert.deepEqual(v12Reveal, { x: 490, y: 590 });
    assert.deepEqual(v12.getShapeOffset(mockToken), { x: 500, y: 600 });
    assert.deepEqual(v12.getTileOffset(mockToken, 'reveal', 1), { x: 490, y: 590 });
    assert.deepEqual(v12.getTileOffset(mockToken, 'shape'), { x: 500, y: 600 });
    assert.throws(() => v12.getTileOffset(mockToken, 'unknown'), /Invalid offset type/);

    // V13 FoundryV13Adapter inherits V12 top-left origin math
    const v13 = new FoundryV13Adapter();
    assert.deepEqual(v13.getRevealOffset(mockToken, 1), { x: 490, y: 590 });
    assert.deepEqual(v13.getShapeOffset(mockToken), { x: 500, y: 600 });
    assert.deepEqual(v13.getTileOffset(mockToken, 'reveal', 1), { x: 490, y: 590 });
    assert.deepEqual(v13.getTileOffset(mockToken, 'shape'), { x: 500, y: 600 });

    // V14+ FoundryV14Adapter overrides with centered origin math
    const v14 = new FoundryV14Adapter();
    assert.deepEqual(v14.getRevealOffset(mockToken, 1), { x: 550, y: 650 });
    assert.deepEqual(v14.getShapeOffset(mockToken), { x: 550, y: 650 });
    assert.deepEqual(v14.getTileOffset(mockToken, 'reveal', 1), { x: 550, y: 650 });
    assert.deepEqual(v14.getTileOffset(mockToken, 'shape'), { x: 550, y: 650 });

    // Tile bounding box: V12/V13 top-left origin (100, 100) vs V14 centered origin (200, 200) for a 200x200 tile
    const v12Tile = { x: 100, y: 100, width: 200, height: 200, document: { x: 100, y: 100, width: 200, height: 200 } };
    assert.deepEqual(v12.getTileBounds(v12Tile), {
        minX: 100,
        maxX: 300,
        minY: 100,
        maxY: 300,
        center: { x: 200, y: 200 },
        width: 200,
        height: 200,
        anchor: { x: 0, y: 0 }
    });

    const v14Tile = { x: 200, y: 200, width: 200, height: 200, document: { x: 200, y: 200, width: 200, height: 200 } };
    assert.deepEqual(v14.getTileBounds(v14Tile), {
        minX: 100,
        maxX: 300,
        minY: 100,
        maxY: 300,
        center: { x: 200, y: 200 },
        width: 200,
        height: 200,
        anchor: { x: 0.5, y: 0.5 }
    });

    // Custom V14 tile anchor: top-left anchor { x: 0, y: 0 }
    const v14TopLeftTile = { x: 100, y: 100, width: 200, height: 200, document: { x: 100, y: 100, width: 200, height: 200, anchor: { x: 0, y: 0 } } };
    assert.deepEqual(v14.getTileBounds(v14TopLeftTile), {
        minX: 100,
        maxX: 300,
        minY: 100,
        maxY: 300,
        center: { x: 200, y: 200 },
        width: 200,
        height: 200,
        anchor: { x: 0, y: 0 }
    });

    // Custom V14 tile anchor: bottom-right anchor { x: 1, y: 1 }
    const v14BottomRightTile = { x: 300, y: 300, width: 200, height: 200, document: { x: 300, y: 300, width: 200, height: 200, anchor: { x: 1, y: 1 } } };
    assert.deepEqual(v14.getTileBounds(v14BottomRightTile), {
        minX: 100,
        maxX: 300,
        minY: 100,
        maxY: 300,
        center: { x: 200, y: 200 },
        width: 200,
        height: 200,
        anchor: { x: 1, y: 1 }
    });

    // Token inside check with V14 centered origin tile
    const tokenInTile = { id: 't-in', x: 120, y: 120, w: 100, h: 100, document: { x: 120, y: 120, width: 1, height: 1 } };
    const tokenOutTile = { id: 't-out', x: 350, y: 350, w: 100, h: 100, document: { x: 350, y: 350, width: 1, height: 1 } };
    canvas.tokens = { placeables: [tokenInTile, tokenOutTile] };

    assert.deepEqual(v14.getTokensInTile(v14Tile).map(t => t.id), ['t-in']);
    assert.deepEqual(v14.getTokensInTile(v14TopLeftTile).map(t => t.id), ['t-in']);
    assert.deepEqual(v14.getTokensInTile(v14BottomRightTile).map(t => t.id), ['t-in']);
});

test('Template position extraction: V12/V13 MeasuredTemplate vs V14+ Region shapes', () => {
    // V12 MeasuredTemplate
    const v12 = new FoundryV12Adapter();
    const mockTemplate = {
        x: 1000,
        y: 2000,
        distance: 30,
        width: 10,
        ray: { B: { x: 1030, y: 2000 } }
    };
    canvas.grid.size = 100;
    canvas.grid.distance = 5;

    const v12Pos = v12.getTemplatePosition(mockTemplate);
    assert.equal(v12Pos.length, 3);
    assert.deepEqual(v12Pos[0], { x: 1000, y: 2000 }); // primary
    assert.deepEqual(v12Pos[1], { x: 1030, y: 2000 }); // secondary

    // V13 inherits V12 MeasuredTemplate extraction
    const v13 = new FoundryV13Adapter();
    const v13Pos = v13.getTemplatePosition(mockTemplate);
    assert.deepEqual(v13Pos, v12Pos);

    // Template without ray (e.g. Automated Animations templateData)
    const rawTemplateData = {
        x: 500,
        y: 600,
        distance: 100,
        direction: 90,
        width: 5,
        t: 'ray'
    };
    const rawPos = v12.getTemplatePosition(rawTemplateData);
    assert.equal(rawPos.length, 3);
    assert.deepEqual(rawPos[0], { x: 500, y: 600 }); // primary
    // 100 distance / 5 gridDistance * 100 gridSize = 2000px in 90 deg direction (downwards)
    assert.equal(Math.round(rawPos[1].x), 500);
    assert.equal(Math.round(rawPos[1].y), 2600);

    // Template with zero distance and no ray returns undefined secondary
    const zeroTemplate = { x: 100, y: 200, distance: 0 };
    const zeroPos = v12.getTemplatePosition(zeroTemplate);
    assert.equal(zeroPos[1], undefined);

    // V14 Region
    const v14 = new FoundryV14Adapter();
    const mockRegion = {
        documentName: 'Region',
        shapes: [
            {
                x: 800,
                y: 900,
                center: { x: 850, y: 950 },
                radius: 400,
                rotation: 0
            }
        ]
    };
    const v14Pos = v14.getTemplatePosition(mockRegion);
    assert.equal(v14Pos.length, 3);
    assert.deepEqual(v14Pos[0], { x: 800, y: 900 }); // primary
    assert.deepEqual(v14Pos[1], { x: 1200, y: 900 }); // secondary (x + radius)
    assert.deepEqual(v14Pos[2], { x: 850, y: 950 }); // center

    // V14 Region with zero distance
    const zeroRegion = {
        documentName: 'Region',
        shapes: [{ x: 800, y: 900, radius: 0 }]
    };
    const zeroRegionPos = v14.getTemplatePosition(zeroRegion);
    assert.equal(zeroRegionPos[1], undefined);

    // V14 Region with config.distance in grid units (feet) converted to pixels
    const rayRegion = {
        documentName: 'Region',
        shapes: [{ x: 150, y: 100, rotation: 0 }]
    };
    const rayPos = v14.getTemplatePosition(rayRegion, { distance: 100 });
    assert.deepEqual(rayPos[0], { x: 150, y: 100 });
    assert.equal(rayPos[1].x, 2150); // 150 + (100 / 5) * 100 = 2150 px
    assert.equal(rayPos[1].y, 100);

    // V14 delegates MeasuredTemplate to V13 super method
    const v14TemplatePos = v14.getTemplatePosition(mockTemplate);
    assert.deepEqual(v14TemplatePos, v12Pos);
});

test('Permission tiers and ownership evaluation on BaseFoundryAdapter', () => {
    const adapter = new BaseFoundryAdapter();

    const gmUser = { id: 'gm1', isGM: true, role: 4, active: true };
    const trustedUser = { id: 't1', isGM: false, isTrusted: true, role: 2, active: true };
    const playerUser = { id: 'p1', isGM: false, isTrusted: false, role: 1, active: true };

    assert.equal(adapter.getUserPermissionTier(gmUser), USER_PERMISSION_TIERS.GM);
    assert.equal(adapter.getUserPermissionTier(trustedUser), USER_PERMISSION_TIERS.TRUSTED);
    assert.equal(adapter.getUserPermissionTier(playerUser), USER_PERMISSION_TIERS.PLAYER);

    const mockActor = {
        ownership: {
            p1: 3,
            t1: 1,
            default: 0
        },
        getUserLevel: (u) => u.id === 'p1' ? 3 : 1
    };

    const mockToken = {
        actor: mockActor,
        document: { id: 'tok1', actor: mockActor }
    };

    assert.equal(adapter.isUserDocumentOwner(gmUser, mockActor), true);
    assert.equal(adapter.isUserDocumentOwner(playerUser, mockActor), true);
    assert.equal(adapter.isUserDocumentOwner(trustedUser, mockActor), false);

    game.users = [gmUser, playerUser];
    assert.equal(adapter.isUserInCharge(mockToken, playerUser), true);
    assert.equal(adapter.isUserInCharge(mockToken, gmUser), false); // player owns it and is active
});

test('getSceneBackground: V12/V13 Scene#background vs V14+ Level#background and Level#textures', () => {
    // V12 FoundryV12Adapter
    const v12 = new FoundryV12Adapter();
    const v12Scene = {
        background: {
            src: 'maps/dungeon-v12.webp',
            offsetX: 50,
            offsetY: 75
        }
    };
    assert.deepEqual(v12.getSceneBackground(v12Scene), {
        src: 'maps/dungeon-v12.webp',
        offsetX: 50,
        offsetY: 75
    });
    assert.deepEqual(v12.getSceneBackground(null), {
        src: null,
        offsetX: 0,
        offsetY: 0
    });

    // V13 inherits V12 Scene#background
    const v13 = new FoundryV13Adapter();
    assert.deepEqual(v13.getSceneBackground(v12Scene), {
        src: 'maps/dungeon-v12.webp',
        offsetX: 50,
        offsetY: 75
    });

    // V14+ FoundryV14Adapter with Levels
    const v14 = new FoundryV14Adapter();
    const v14SceneWithLevel = {
        activeLevel: 'lvl-1',
        levels: new Map([
            ['lvl-1', {
                background: {
                    src: 'maps/dungeon-level-1.webp',
                    offsetX: 10,
                    offsetY: 20
                }
            }]
        ])
    };
    assert.deepEqual(v14.getSceneBackground(v14SceneWithLevel), {
        src: 'maps/dungeon-level-1.webp',
        offsetX: 10,
        offsetY: 20
    });

    // V14+ with environment fallback
    const v14SceneWithEnv = {
        environment: {
            background: {
                src: 'maps/space-env.webp',
                offsetX: 0,
                offsetY: 0
            }
        }
    };
    assert.deepEqual(v14.getSceneBackground(v14SceneWithEnv), {
        src: 'maps/space-env.webp',
        offsetX: 0,
        offsetY: 0
    });

    // V14+ nested TextureConfiguration object with null inner src (color/tint-only scene)
    const v14SceneWithNullTexture = {
        activeLevel: 'lvl-1',
        levels: new Map([
            ['lvl-1', {
                background: {
                    src: {
                        alphThreshold: 0.76,
                        color: 10066329,
                        src: null,
                        tint: 16777215
                    },
                    offsetX: 0,
                    offsetY: 0
                }
            }]
        ])
    };
    assert.deepEqual(v14.getSceneBackground(v14SceneWithNullTexture), {
        src: null,
        offsetX: 0,
        offsetY: 0
    });

    // V14+ nested TextureConfiguration object with valid inner src
    const v14SceneWithNestedSrc = {
        activeLevel: 'lvl-1',
        levels: new Map([
            ['lvl-1', {
                background: {
                    src: {
                        alphThreshold: 0.76,
                        color: 10066329,
                        src: 'maps/nested-v14.webp',
                        tint: 16777215
                    },
                    offsetX: 5,
                    offsetY: 10
                }
            }]
        ])
    };
    assert.deepEqual(v14.getSceneBackground(v14SceneWithNestedSrc), {
        src: 'maps/nested-v14.webp',
        offsetX: 5,
        offsetY: 10
    });
});

test('DialogV2 and buttonDialog delegation on BaseFoundryAdapter', async () => {
    const v12 = new FoundryV12Adapter();
    assert.ok(v12.DialogV2);

    const buttonData = {
        title: 'Select Spell',
        buttons: [
            { label: 'Fireball', value: 'fireball' },
            { label: 'Lightning', value: 'lightning' }
        ]
    };
    const chosen = await v12.buttonDialog(buttonData);
    assert.equal(chosen, 'fireball');
});

test('buttonDialog guarantees Cancel button is positioned as the rightmost button (last in array, flex order 999)', async () => {
    const v12 = new FoundryV12Adapter();
    let passedButtons = [];
    const origWait = foundry.applications.api.DialogV2.wait;
    try {
        foundry.applications.api.DialogV2.wait = async (config) => {
            passedButtons = config.buttons;
            return config.buttons.find(b => b.action === '1')?.action;
        };

        await v12.buttonDialog({
            title: 'Confirm Action',
            buttons: [
                { label: 'Cancel', value: '0' },
                { label: 'Confirm', value: '1' }
            ]
        });

        assert.equal(passedButtons.length, 2);
        assert.equal(passedButtons[0].label, 'Confirm', 'Confirm must be first (visual left)');
        assert.equal(passedButtons[0].action, '1');
        assert.equal(passedButtons[0].style?.order, '1');
        assert.equal(passedButtons[1].label, 'Cancel', 'Cancel must be last (visual right)');
        assert.equal(passedButtons[1].action, '0');
        assert.equal(passedButtons[1].style?.order, '999');
    } finally {
        foundry.applications.api.DialogV2.wait = origWait;
    }
});

test('buttonDialog preserves natural visual left-to-right order for multiple action options with Cancel on the right', async () => {
    const v12 = new FoundryV12Adapter();
    let passedButtons = [];
    let passedConfig = null;
    const origWait = foundry.applications.api.DialogV2.wait;
    try {
        foundry.applications.api.DialogV2.wait = async (config) => {
            passedButtons = config.buttons;
            passedConfig = config;
            return config.buttons[0].action;
        };

        await v12.buttonDialog({
            title: 'Multiple Actions',
            buttons: [
                { label: 'Cancel', value: 'cancel' },
                { label: 'Option A', value: 'a' },
                { label: 'Option B', value: 'b' }
            ]
        });

        assert.equal(passedButtons[0].label, 'Option A');
        assert.equal(passedButtons[0].style?.order, '1');
        assert.equal(passedButtons[1].label, 'Option B');
        assert.equal(passedButtons[1].style?.order, '2');
        assert.equal(passedButtons[2].label, 'Cancel');
        assert.equal(passedButtons[2].style?.order, '999');

        // Verify classes and render hook
        assert.ok(passedConfig.classes.includes('emp-button-dialog'));
        assert.ok(typeof passedConfig.render === 'function');

        // Test render hook DOM operations
        const appended = [];
        const fakeButtonA = { getAttribute: () => 'a', textContent: 'Option A', style: {} };
        const fakeButtonB = { getAttribute: () => 'b', textContent: 'Option B', style: {} };
        const fakeButtonCancel = { getAttribute: () => 'cancel', textContent: 'Cancel', style: {} };
        const fakeFooter = {
            style: {},
            querySelectorAll: () => [fakeButtonA, fakeButtonB, fakeButtonCancel],
            appendChild: (el) => appended.push(el)
        };
        const fakeRoot = {
            querySelector: (sel) => (sel.includes('footer') ? fakeFooter : null)
        };
        passedConfig.render({}, { element: fakeRoot });
        assert.equal(fakeFooter.style.display, 'flex');
        assert.equal(fakeFooter.style.flexDirection, 'row');
        assert.equal(fakeButtonA.style.flex, '1');
        assert.equal(appended.length, 1);
        assert.equal(appended[0].textContent, 'Cancel');
    } finally {
        foundry.applications.api.DialogV2.wait = origWait;
    }
});

test('getDocumentName, isDocumentOfType, and getPlaceable resolution', () => {
    const v12 = new FoundryV12Adapter();

    const mockToken = { id: 'tok-1', documentName: 'Token' };
    const mockTile = { id: 'tile-1', document: { documentName: 'Tile' } };

    assert.equal(v12.getDocumentName(mockToken), 'Token');
    assert.equal(v12.getDocumentName(mockTile), 'Tile');
    assert.equal(v12.getDocumentName(null), undefined);

    assert.equal(v12.isDocumentOfType(mockToken, 'Token'), true);
    assert.equal(v12.isDocumentOfType(mockToken, 'Tile'), false);
    assert.equal(v12.isDocumentOfType(mockTile, 'Tile'), true);

    canvas.tokens.get = (id) => id === 'tok-1' ? mockToken : null;
    canvas.tiles.get = (id) => id === 'tile-1' ? mockTile : null;

    assert.equal(v12.getPlaceable('tok-1'), mockToken);
    assert.equal(v12.getPlaceable('tile-1'), mockTile);
    assert.equal(v12.getPlaceable('unknown'), null);
});

test('getSpeakerToken and getSpeakerActor resolution', () => {
    const v12 = new FoundryV12Adapter();

    const mockActor = { id: 'act-1', name: 'Hero' };
    const mockToken = { id: 'tok-1', name: 'Hero Token', actor: mockActor };

    canvas.tokens.get = (id) => id === 'tok-1' ? mockToken : null;
    canvas.tokens.controlled = [];
    game.user.character = mockActor;

    const message = {
        speaker: { token: 'tok-1', actor: 'act-1' }
    };

    assert.equal(v12.getSpeakerToken(message), mockToken);
    assert.equal(v12.getSpeakerToken(null, 'tok-1'), mockToken);
    assert.equal(v12.getSpeakerActor(message), mockActor);
});

test('getDistance and getNearestSquareCenter 3D math', () => {
    const v12 = new FoundryV12Adapter();

    canvas.grid.size = 100;
    canvas.grid.distance = 5;

    const t1 = {
        x: 0,
        y: 0,
        center: { x: 50, y: 50 },
        document: { elevation: 10 }
    };
    const t2 = {
        x: 300,
        y: 400,
        center: { x: 350, y: 450 },
        document: { width: 2, height: 2, elevation: 10 }
    };

    // 2D distance between centers (50, 50) and (350, 450) = hypot(300, 400) = 500px = 25 units
    // Elevation diff = 0. 3D distance = 25
    assert.equal(v12.getDistance(t1, t2), 25);

    // Nearest square center on 2x2 target t2 (x: 300..500, y: 400..600) to t1 (50, 50)
    // Nearest square is gx=0, gy=0 -> cx = 300 + 50 = 350, cy = 400 + 50 = 450
    const nearest = v12.getNearestSquareCenter(t1, t2);
    assert.deepEqual(nearest, { x: 350, y: 450 });
});

test('getTokenOwners and placeable attachment contracts on BaseFoundryAdapter', async () => {
    const v12 = new FoundryV12Adapter();

    const p1 = { id: 'p1', isGM: false, active: true };
    const gm = { id: 'gm1', isGM: true, role: 4, active: true };
    game.users = [p1, gm];

    const actor = {
        ownership: { p1: 3, default: 0 },
        getUserLevel: (u) => u.id === 'p1' ? 3 : 0
    };
    const token = { actor, document: { id: 't1', actor } };

    const owners = v12.getTokenOwners(token);
    assert.equal(owners.length, 2);
    assert.ok(owners.includes(p1));
    assert.ok(owners.includes(gm));

    // Attachment with Token Attacher mock
    globalThis.tokenAttacher = {
        attachElementsToToken: async (elements, target) => ({ attached: true, count: elements.length }),
        detachElementsFromToken: async (elements, target) => ({ detached: true, count: elements.length })
    };
    game.modules.set('token-attacher', { id: 'token-attacher', active: true });

    const attachRes = await v12.attachPlaceableElements([{ id: 'tile-1' }], token);
    assert.deepEqual(attachRes, { attached: true, count: 1 });

    const detachRes = await v12.detachPlaceableElements([{ id: 'tile-1' }], token);
    assert.deepEqual(detachRes, { detached: true, count: 1 });

    // Verify BaseFoundryAdapter reads from parent adapter and navigates to massEdit / tokenAttacher
    const mockParentAdapter = {
        massEdit: {
            link: async (elements, target) => ({ mockLinked: true, targetId: target.id }),
            removeLinks: async (elements, target) => ({ mockUnlinked: true, targetId: target.id })
        },
        tokenAttacher: {
            attachElementsToToken: async (elements, target) => ({ mockAttached: true, targetId: target.id }),
            detachElementsFromToken: async (elements, target) => ({ mockDetached: true, targetId: target.id })
        }
    };
    const adapterWithParent = new FoundryV12Adapter(mockParentAdapter);
    assert.equal(adapterWithParent.adapter, mockParentAdapter);
    assert.equal(adapterWithParent.massEdit, mockParentAdapter.massEdit);
    assert.equal(adapterWithParent.tokenAttacher, mockParentAdapter.tokenAttacher);

    const tileObj = { document: { documentName: 'Tile' }, id: 'tile-target' };
    game.modules.set('multi-token-edit', { id: 'multi-token-edit', active: true });
    const tileAttach = await adapterWithParent.attachPlaceableElements([{ id: 'child-1' }], tileObj);
    assert.deepEqual(tileAttach, { mockLinked: true, targetId: 'tile-target' });

    const tileDetach = await adapterWithParent.detachPlaceableElements([{ id: 'child-1' }], tileObj);
    assert.deepEqual(tileDetach, { mockUnlinked: true, targetId: 'tile-target' });
});

test('BaseFoundryAdapter mergeObject defaults to non-inplace safe merge', () => {
    const adapter = new BaseFoundryAdapter();
    const original = { a: 1, nested: { b: 2, c: 3 } };
    const source = { nested: { c: 99, d: 4 }, extra: 'test' };

    const merged = adapter.mergeObject(original, source);
    assert.deepEqual(merged, { a: 1, nested: { b: 2, c: 99, d: 4 }, extra: 'test' });
    // Verify original object was not mutated
    assert.equal(original.nested.c, 3);
    assert.equal(original.extra, undefined);

    // Verify explicit options pass through
    const inplaceTarget = { x: 10 };
    adapter.mergeObject(inplaceTarget, { y: 20 }, { inplace: true });
    assert.equal(inplaceTarget.y, 20);
});

test('BaseFoundryAdapter and UnifiedAdapter abstract all utility operations cleanly', () => {
    const bfa = new BaseFoundryAdapter();

    // slugify
    assert.equal(bfa.slugify('Fire Blast 01!'), 'fire-blast-01');
    assert.equal(adapter.slugify('Healing Word (Mass)'), 'healing-word-mass');
    assert.equal(bfa.slugify('Épée Flamboyante'), 'epee-flamboyante');
    assert.equal(bfa.slugify(null), '');
    assert.equal(bfa.slugify(undefined), '');

    // hasProperty & getProperty & setProperty
    const obj = { foo: { bar: 42 } };
    assert.equal(bfa.hasProperty(obj, 'foo.bar'), true);
    assert.equal(bfa.hasProperty(obj, 'foo.baz'), false);
    assert.equal(adapter.hasProperty(obj, 'foo.bar'), true);

    adapter.setProperty(obj, 'foo.baz', 100);
    assert.equal(bfa.getProperty(obj, 'foo.baz'), 100);
    assert.equal(adapter.getProperty(obj, 'foo.baz'), 100);

    // isNewerVersion
    assert.equal(bfa.isNewerVersion('2.0.0', '1.9.9'), true);
    assert.equal(bfa.isNewerVersion('1.0.0', '1.0.0'), false);
    assert.equal(adapter.isNewerVersion('1.5.0', '1.4.2'), true);

    // duplicate & deepClone
    const cloned = adapter.deepClone({ nest: { count: 5 } });
    assert.deepEqual(cloned, { nest: { count: 5 } });
    const duplicated = adapter.duplicate({ list: [1, 2, 3] });
    assert.deepEqual(duplicated, { list: [1, 2, 3] });

    // randomID
    const id = adapter.randomID(16);
    assert.equal(typeof id, 'string');
    assert.equal(id.length, 16);
});

test('formatDeletionUpdate contracts across FoundryV12Adapter (legacy -=), FoundryV13Adapter (legacy -=), and FoundryV14Adapter (ForcedDeletion)', () => {
    const v12 = new FoundryV12Adapter();
    const v13 = new FoundryV13Adapter();
    const v14 = new FoundryV14Adapter();

    // V12 formats legacy -= deletion syntax
    assert.deepEqual(
        v12.formatDeletionUpdate('flags.eskie-macros.token-masks', 'anim-123'),
        { 'flags.eskie-macros.token-masks.-=anim-123': null }
    );
    assert.deepEqual(
        v12.formatDeletionUpdate('', 'anim-123'),
        { '-=anim-123': null }
    );

    // V13 inherits legacy -= deletion syntax
    assert.deepEqual(
        v13.formatDeletionUpdate('flags.eskie-macros.token-masks', 'anim-123'),
        { 'flags.eskie-macros.token-masks.-=anim-123': null }
    );

    // V14+ FoundryV14Adapter formats modern ForcedDeletion operator
    assert.deepEqual(
        v14.formatDeletionUpdate('flags.eskie-macros.token-masks', 'anim-123'),
        { 'flags.eskie-macros.token-masks.anim-123': foundry.data.operators.ForcedDeletion }
    );
    assert.deepEqual(
        v14.formatDeletionUpdate('', 'anim-123'),
        { 'anim-123': foundry.data.operators.ForcedDeletion }
    );

    // Unified adapter delegation
    adapter.foundry = v14;
    assert.deepEqual(
        adapter.formatDeletionUpdate('flags.eskie-macros.token-masks', 'anim-123'),
        { 'flags.eskie-macros.token-masks.anim-123': foundry.data.operators.ForcedDeletion }
    );

    adapter.foundry = v12;
    assert.deepEqual(
        adapter.formatDeletionUpdate('flags.eskie-macros.token-masks', 'anim-123'),
        { 'flags.eskie-macros.token-masks.-=anim-123': null }
    );
});

test('fromUuidSync and fromUuid resolution across FoundryV12Adapter (global) and FoundryV13Adapter / FoundryV14Adapter (foundry.utils)', async () => {
    const v12 = new FoundryV12Adapter();
    const v13 = new FoundryV13Adapter();
    const v14 = new FoundryV14Adapter();

    globalThis.fromUuidSync = (uuid) => uuid === 'Item.123' ? { id: '123', name: 'Legacy Item' } : null;
    globalThis.fromUuid = async (uuid) => uuid === 'Item.123' ? { id: '123', name: 'Legacy Item' } : null;

    globalThis.foundry.utils.fromUuidSync = (uuid) => uuid === 'Item.456' ? { id: '456', name: 'Modern Item' } : null;
    globalThis.foundry.utils.fromUuid = async (uuid) => uuid === 'Item.456' ? { id: '456', name: 'Modern Item' } : null;

    assert.equal(v12.fromUuidSync('Item.123')?.name, 'Legacy Item');
    assert.equal(v12.fromUuidSync('Item.456'), null);
    assert.equal((await v12.fromUuid('Item.123'))?.name, 'Legacy Item');
    assert.equal(await v12.fromUuid('Item.456'), null);

    assert.equal(v13.fromUuidSync('Item.456')?.name, 'Modern Item');
    assert.equal(v13.fromUuidSync('Item.123'), null);
    assert.equal((await v13.fromUuid('Item.456'))?.name, 'Modern Item');
    assert.equal(await v13.fromUuid('Item.123'), null);

    assert.equal(v14.fromUuidSync('Item.456')?.name, 'Modern Item');
    assert.equal(v14.fromUuidSync('Item.123'), null);
    assert.equal((await v14.fromUuid('Item.456'))?.name, 'Modern Item');
    assert.equal(await v14.fromUuid('Item.123'), null);
});

test('getCombatantsByToken and getCombatantByToken across FoundryV12Adapter (singular) and FoundryV13Adapter / FoundryV14Adapter (plural)', () => {
    const v12 = new FoundryV12Adapter();
    const v13 = new FoundryV13Adapter();
    const v14 = new FoundryV14Adapter();

    const mockToken = { id: 'tok1' };
    const mockCombatant1 = { id: 'c1', tokenId: 'tok1' };
    const mockCombatant2 = { id: 'c2', tokenId: 'tok1' };

    const legacyCombat = {
        getCombatantByToken: (tokenId) => tokenId === 'tok1' ? mockCombatant1 : null
    };

    const modernCombat = {
        getCombatantsByToken: (token) => (token === mockToken || token?.id === 'tok1') ? [mockCombatant1, mockCombatant2] : []
    };

    assert.deepEqual(v12.getCombatantsByToken(legacyCombat, mockToken), [mockCombatant1]);
    assert.equal(v12.getCombatantByToken(legacyCombat, mockToken), mockCombatant1);

    assert.deepEqual(v13.getCombatantsByToken(modernCombat, mockToken), [mockCombatant1, mockCombatant2]);
    assert.equal(v13.getCombatantByToken(modernCombat, mockToken), mockCombatant1);

    assert.deepEqual(v14.getCombatantsByToken(modernCombat, mockToken), [mockCombatant1, mockCombatant2]);
    assert.equal(v14.getCombatantByToken(modernCombat, mockToken), mockCombatant1);
});

test('getSceneDimensions and getSceneCenter calculate safe scene metrics and center coordinates', () => {
    const v12 = new FoundryV12Adapter();

    // With canvas dimensions populated
    globalThis.canvas = {
        dimensions: {
            width: 4000,
            height: 3000,
            size: 100,
            distance: 5,
            maxRayDistance: 5000,
            sceneRect: { x: 0, y: 0, width: 4000, height: 3000 }
        }
    };

    const dims = v12.getSceneDimensions();
    assert.equal(dims.width, 4000);
    assert.equal(dims.height, 3000);
    assert.equal(dims.size, 100);
    assert.equal(dims.distance, 5);

    const center = v12.getSceneCenter();
    assert.deepEqual(center, { x: 2000, y: 1500 });

    // Fallbacks without canvas.dimensions
    globalThis.canvas = {};
    const mockScene = {
        document: {
            width: 2000,
            height: 1000,
            grid: { size: 50, distance: 10 }
        }
    };
    const fallbackDims = v12.getSceneDimensions(mockScene);
    assert.equal(fallbackDims.width, 2000);
    assert.equal(fallbackDims.height, 1000);
    assert.equal(fallbackDims.size, 50);
    assert.equal(fallbackDims.distance, 10);
    assert.deepEqual(v12.getSceneCenter(mockScene), { x: 1000, y: 500 });
});

test('getCenter, getTokenDimensions, and getInterpolatedPoints calculate geometry properties correctly', () => {
    const v12 = new FoundryV12Adapter();
    globalThis.canvas = { grid: { size: 100 } };

    // getCenter with various placeables / documents
    assert.equal(v12.getCenter(null), null);
    assert.deepEqual(v12.getCenter({ center: { x: 150, y: 250 } }), { x: 150, y: 250 });
    assert.deepEqual(v12.getCenter({ object: { center: { x: 300, y: 400 } } }), { x: 300, y: 400 });
    assert.deepEqual(v12.getCenter({ x: 100, y: 200, width: 2, height: 2 }), { x: 200, y: 300 });

    // getTokenDimensions
    const mockToken = {
        document: { width: 2, height: 3 },
        w: 200,
        h: 300
    };
    const tokDims = v12.getTokenDimensions(mockToken);
    assert.equal(tokDims.widthPx, 200);
    assert.equal(tokDims.heightPx, 300);
    assert.equal(tokDims.widthUnits, 2);
    assert.equal(tokDims.heightUnits, 3);
    assert.equal(tokDims.radiusPx, 150);

    // getTokenRotation
    assert.equal(v12.getTokenRotation(null), 0);
    assert.equal(v12.getTokenRotation(mockToken), 0);
    assert.equal(v12.getTokenRotation({ document: { rotation: 180 } }), 180);
    assert.equal(v12.getTokenRotation({ document: { rotation: 90 } }), 90);

    // getInterpolatedPoints
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 300, y: 400 }; // dist = 500
    const points = v12.getInterpolatedPoints(p1, p2, 100);
    assert.equal(points.length, 6);
    assert.deepEqual(points[0], { x: 0, y: 0 });
    assert.deepEqual(points[5], { x: 300, y: 400 });
});

test('getBestAdjacentLocation calculates nearest adjacent cell to line between two tokens', () => {
    const v12 = new FoundryV12Adapter();
    globalThis.canvas = {
        grid: {
            size: 100,
            getCenterPoint: ({ x, y }) => ({ x: x + 50, y: y + 50 })
        }
    };

    const caster = {
        document: { x: 100, y: 100, width: 1, height: 1 },
        center: { x: 150, y: 150 }
    };
    const target = {
        document: { x: 400, y: 100, width: 1, height: 1 },
        center: { x: 450, y: 150 }
    };

    const bestLoc = v12.getBestAdjacentLocation(caster, target);
    assert.ok(bestLoc);
    assert.equal(bestLoc.y, 150);
    // Closest cell on line towards target
    assert.equal(bestLoc.x, 250);
});

test('getGridSize delegates to getSceneDimensions and returns grid size in pixels', () => {
    const v12 = new FoundryV12Adapter();
    globalThis.canvas = {
        grid: { size: 100 },
        scene: { grid: { size: 100 } }
    };
    assert.equal(v12.getGridSize(), 100);
    assert.equal(adapter.getGridSize(), 100);

    const customScene = { grid: { size: 150 }, width: 3000, height: 3000 };
    assert.equal(v12.getGridSize(customScene), 150);
    assert.equal(adapter.getGridSize(customScene), 150);
});

test('adapter.isToken, isActor, and isTile correctly validate documents and placeables', () => {
    const mockTokenDoc = { documentName: 'Token' };
    const mockTokenPlaceable = { document: mockTokenDoc, center: { x: 100, y: 100 } };
    const mockActorDoc = { documentName: 'Actor', items: [], uuid: 'Actor.123' };
    const mockTileDoc = { documentName: 'Tile' };
    const mockTilePlaceable = { document: mockTileDoc, bounds: {} };

    // isToken
    assert.equal(adapter.isToken(mockTokenDoc), true);
    assert.equal(adapter.isToken(mockTokenPlaceable), true);
    assert.equal(adapter.isToken(mockActorDoc), false);
    assert.equal(adapter.isToken(mockTilePlaceable), false);
    assert.equal(adapter.isToken(null), false);
    assert.equal(adapter.isToken(undefined), false);

    // isActor
    assert.equal(adapter.isActor(mockActorDoc), true);
    assert.equal(adapter.isActor(mockTokenPlaceable), false);
    assert.equal(adapter.isActor(mockTokenDoc), false);
    assert.equal(adapter.isActor({ items: [], uuid: 'Actor.fallback' }), true);
    assert.equal(adapter.isActor(null), false);

    // isTile
    assert.equal(adapter.isTile(mockTileDoc), true);
    assert.equal(adapter.isTile(mockTilePlaceable), true);
    assert.equal(adapter.isTile(mockTokenPlaceable), false);
    assert.equal(adapter.isTile(null), false);
});
