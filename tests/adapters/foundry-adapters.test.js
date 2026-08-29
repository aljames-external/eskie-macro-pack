import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeFoundryAdapter, BaseFoundryAdapter, FoundryCurrentAdapter, USER_PERMISSION_TIERS } from '../../src/adapters/foundry/index.js';
import { adapter } from '../../src/adapters/index.js';

test('initializeFoundryAdapter returns BaseFoundryAdapter on v12/v13 baseline and FoundryCurrentAdapter on v14+', () => {
    // V12 baseline
    game.release = { generation: 12 };
    game.version = '12.331';
    const v12 = initializeFoundryAdapter();
    assert.ok(v12 instanceof BaseFoundryAdapter);
    assert.equal(v12.generation, 12);

    // V13 baseline
    game.release = { generation: 13 };
    game.version = '13.300';
    const v13 = initializeFoundryAdapter();
    assert.ok(v13 instanceof BaseFoundryAdapter);
    assert.equal(v13.generation, 13);

    // V14 modern
    game.release = { generation: 14 };
    game.version = '14.000';
    const v14 = initializeFoundryAdapter();
    assert.ok(v14 instanceof FoundryCurrentAdapter);
    assert.ok(v14 instanceof BaseFoundryAdapter);
    assert.equal(v14.generation, 14);
});

test('BaseFoundryAdapter and FoundryCurrentAdapter constructor getters contract', () => {
    const v12 = new BaseFoundryAdapter();
    assert.equal(v12.ContextMenu, globalThis.ContextMenu);
    assert.equal(v12.KeyboardManager, globalThis.KeyboardManager);
    assert.equal(v12.Token, globalThis.Token);
    assert.equal(v12.Tile, globalThis.Tile);
    assert.equal(v12.FilePicker, globalThis.FilePicker);
    assert.equal(v12.TextEditor, globalThis.TextEditor);

    const v14 = new FoundryCurrentAdapter();
    assert.equal(v14.ContextMenu, globalThis.foundry.applications.ux.ContextMenu);
    assert.equal(v14.KeyboardManager, globalThis.foundry.helpers.interaction.KeyboardManager);
    assert.equal(v14.Token, globalThis.foundry.canvas.placeables.Token);
    assert.equal(v14.Tile, globalThis.foundry.canvas.placeables.Tile);
    assert.equal(v14.FilePicker, globalThis.foundry.applications.apps.FilePicker.implementation);
    assert.equal(v14.TextEditor, globalThis.foundry.applications.ux.TextEditor.implementation);
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

    // V12/V13 BaseFoundryAdapter
    const v12 = new BaseFoundryAdapter();
    const v12Reveal = v12.getRevealOffset(mockToken, 1);
    // x = 500 - (100 * 1 * (1.2 - 1) / 2) = 500 - 10 = 490
    // y = 600 - (100 * 1 * (1.2 - 1) / 2) = 600 - 10 = 590
    assert.deepEqual(v12Reveal, { x: 490, y: 590 });
    assert.deepEqual(v12.getShapeOffset(mockToken), { x: 500, y: 600 });
    assert.deepEqual(v12.getTileOffset(mockToken, 'reveal', 1), { x: 490, y: 590 });
    assert.deepEqual(v12.getTileOffset(mockToken, 'shape'), { x: 500, y: 600 });
    assert.throws(() => v12.getTileOffset(mockToken, 'unknown'), /Invalid offset type/);

    // V14+ FoundryCurrentAdapter
    const v14 = new FoundryCurrentAdapter();
    assert.deepEqual(v14.getRevealOffset(mockToken, 1), { x: 550, y: 650 });
    assert.deepEqual(v14.getShapeOffset(mockToken), { x: 550, y: 650 });
    assert.deepEqual(v14.getTileOffset(mockToken, 'reveal', 1), { x: 550, y: 650 });
    assert.deepEqual(v14.getTileOffset(mockToken, 'shape'), { x: 550, y: 650 });
});

test('Template position extraction: V12/V13 MeasuredTemplate vs V14+ Region shapes', () => {
    // V12 MeasuredTemplate
    const v12 = new BaseFoundryAdapter();
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

    // V14 Region
    const v14 = new FoundryCurrentAdapter();
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

    assert.equal(adapter.isUserDocumentOwner(gmUser, mockActor, mockToken.document), true);
    assert.equal(adapter.isUserDocumentOwner(playerUser, mockActor, mockToken.document), true);
    assert.equal(adapter.isUserDocumentOwner(trustedUser, mockActor, mockToken.document), false);

    game.users = [gmUser, playerUser];
    assert.equal(adapter.isUserInCharge(mockToken, playerUser), true);
    assert.equal(adapter.isUserInCharge(mockToken, gmUser), false); // player owns it and is active
});

test('getSceneBackground: V12/V13 Scene#background vs V14+ Level#background and Level#textures', () => {
    // V12/V13 BaseFoundryAdapter
    const v12 = new BaseFoundryAdapter();
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

    // V14+ FoundryCurrentAdapter with Levels
    const v14 = new FoundryCurrentAdapter();
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
    const v12 = new BaseFoundryAdapter();
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

test('getDocumentName, isDocumentOfType, and getPlaceable resolution', () => {
    const v12 = new BaseFoundryAdapter();

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
    const v12 = new BaseFoundryAdapter();

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
    const v12 = new BaseFoundryAdapter();

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
    const v12 = new BaseFoundryAdapter();

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
    const adapterWithParent = new BaseFoundryAdapter(mockParentAdapter);
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

test('formatDeletionUpdate contracts across BaseFoundryAdapter (V12/V13 legacy -=) and FoundryCurrentAdapter (V14+ ForcedDeletion)', () => {
    const bfa = new BaseFoundryAdapter();
    const v14 = new FoundryCurrentAdapter();

    // V12/V13 BaseFoundryAdapter formats legacy -= deletion syntax
    assert.deepEqual(
        bfa.formatDeletionUpdate('flags.eskie-macros.token-masks', 'anim-123'),
        { 'flags.eskie-macros.token-masks.-=anim-123': null }
    );
    assert.deepEqual(
        bfa.formatDeletionUpdate('', 'anim-123'),
        { '-=anim-123': null }
    );

    // V14+ FoundryCurrentAdapter formats modern ForcedDeletion operator
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

    adapter.foundry = bfa;
    assert.deepEqual(
        adapter.formatDeletionUpdate('flags.eskie-macros.token-masks', 'anim-123'),
        { 'flags.eskie-macros.token-masks.-=anim-123': null }
    );
});





