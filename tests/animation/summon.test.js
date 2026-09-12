import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { summon, tokensOfTheDeparted } from '../../src/animation/summon/index.js';
import { animation } from '../../src/animation/index.js';
import { adapter } from '../../src/adapters/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('summon namespace is exported correctly on animation object', () => {
    assert.ok(animation.summon, 'animation.summon must exist');
    assert.equal(animation.summon, summon);
    assert.ok(animation.summon.tokensOfTheDeparted, 'animation.summon.tokensOfTheDeparted must exist');
});

test('tokensOfTheDeparted has required API methods and valid default_config', () => {
    assert.equal(typeof tokensOfTheDeparted.create, 'function', 'tokensOfTheDeparted.create must be a function');
    assert.equal(typeof tokensOfTheDeparted.play, 'function', 'tokensOfTheDeparted.play must be a function');
    assert.equal(typeof tokensOfTheDeparted.stop, 'function', 'tokensOfTheDeparted.stop must be a function');
    assert.equal(tokensOfTheDeparted.summon, undefined, 'tokensOfTheDeparted.summon must not be exposed');

    const config = tokensOfTheDeparted.default_config;
    assert.ok(config, 'default_config must exist');
    assert.equal(config.id, 'tokensOfTheDeparted');
    assert.equal(config.tint, '#58feb0');
    assert.equal(config.changeLight, true);
    assert.ok(config.light, 'light config must exist');
    assert.equal(config.light.color, '#58feb0');
    assert.ok(config.sound, 'sound config must exist');
    assert.ok(config.sound.launch, 'sound.launch must exist');
    assert.equal(typeof config.sound.launch.enable, 'boolean', 'sound.launch.enable must be boolean');
    assert.ok(config.sound.manifest, 'sound.manifest must exist');
    assert.equal(typeof config.sound.manifest.enable, 'boolean', 'sound.manifest.enable must be boolean');
    assert.equal(config.sound.manifest.delay, 1000, 'sound.manifest default delay must be 1000');
    assert.ok(config.crosshairParameters, 'crosshairParameters must exist');
    assert.equal(config.crosshairParameters.t, 'circle');
});

test('tokensOfTheDeparted.create with single token adjusts copysprite on that token without summoning', async () => {
    let capturedSpriteRotation = null;
    let attachedObject = null;
    const originalSequence = globalThis.Sequence;

    globalThis.Sequence = class MockSequence {
        constructor() {
            const handler = {
                get(_t, prop) {
                    if (prop === 'spriteRotation') {
                        return (angle) => {
                            capturedSpriteRotation = angle;
                            return proxy;
                        };
                    }
                    if (prop === 'attachTo') {
                        return (obj) => {
                            attachedObject = obj;
                            return proxy;
                        };
                    }
                    if (prop === 'play') return async () => proxy;
                    if (prop === 'then') return undefined;
                    return (..._args) => proxy;
                }
            };
            const proxy = new Proxy(this, handler);
            return proxy;
        }
    };

    try {
        const mockTargetToken = {
            id: 'target-token-1',
            name: 'Spirit Token',
            document: { rotation: 180, x: 200, y: 200 },
            center: { x: 250, y: 250 }
        };

        const seq = await tokensOfTheDeparted.create(mockTargetToken);
        assert.ok(seq, 'Sequence must be created for single token');
        assert.equal(capturedSpriteRotation, -180, 'spriteRotation must counteract token rotation (-180)');
        assert.equal(attachedObject, mockTargetToken, 'Effects must attach directly to provided token');
    } finally {
        globalThis.Sequence = originalSequence;
    }
});

test('tokensOfTheDeparted.create builds sequence with effects and animations', async () => {
    game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
    game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

    const mockCaster = {
        id: 'caster-1',
        name: 'Rogue',
        document: { rotation: 0, x: 100, y: 100 },
        center: { x: 150, y: 150 }
    };
    const mockSummon = {
        id: 'summon-1',
        name: 'Departed Spirit',
        document: { rotation: 0, x: 300, y: 300 },
        center: { x: 350, y: 350 }
    };

    const seq = await tokensOfTheDeparted.create(mockCaster, mockSummon);
    assert.ok(seq, 'Sequence must be returned');

    const playResult = await tokensOfTheDeparted.play(mockCaster, mockSummon);
    assert.ok(playResult, 'Play must return sequence play result');
});

test('tokensOfTheDeparted.create applies spriteRotation matching counter token rotation', async () => {
    let capturedSpriteRotation = null;
    const originalSequence = globalThis.Sequence;

    globalThis.Sequence = class MockSequence {
        constructor() {
            const handler = {
                get(_t, prop) {
                    if (prop === 'spriteRotation') {
                        return (angle) => {
                            capturedSpriteRotation = angle;
                            return proxy;
                        };
                    }
                    if (prop === 'play') return async () => proxy;
                    if (prop === 'then') return undefined;
                    return (..._args) => proxy;
                }
            };
            const proxy = new Proxy(this, handler);
            return proxy;
        }
    };

    try {
        const mockCaster = { id: 'c1', name: 'Rogue', document: { rotation: 0 } };
        const mockSummon = { id: 's1', name: 'Spirit', document: { rotation: 90 } };
        await tokensOfTheDeparted.create(mockCaster, mockSummon);
        assert.equal(capturedSpriteRotation, -90, 'spriteRotation must be -90 for a 90 degree rotated summon token');
    } finally {
        globalThis.Sequence = originalSequence;
    }
});


test('tokensOfTheDeparted.stop terminates persistent effects on summoned token', async () => {
    let endedEffectName = null;
    let endedObject = null;

    Sequencer.EffectManager.endEffects = (filter) => {
        endedEffectName = filter.name;
        endedObject = filter.object;
    };

    const mockSummon = {
        id: 'summon-1',
        name: 'Departed Spirit'
    };
    const mockCaster = {
        id: 'caster-1',
        name: 'Rogue'
    };

    await tokensOfTheDeparted.stop(mockCaster, mockSummon);
    assert.equal(endedEffectName, 'Departed Spirit Tokens of the Departed');
    assert.equal(endedObject, mockSummon);
});

test('tokensOfTheDeparted.create delegates to adapter.summons.pick when Actor is provided', async () => {
    let pickOptionsPassed = null;
    const mockToken = {
        id: 'summon-token',
        name: 'Departed Spirit',
        document: { rotation: 0, x: 200, y: 200 },
        center: { x: 250, y: 250 }
    };

    adapter.summons.pick = async (options) => {
        pickOptionsPassed = options;
        return mockToken;
    };

    const mockCaster = { id: 'caster-1', name: 'Rogue', document: { rotation: 0 }, center: { x: 100, y: 100 } };
    const mockActor = { id: 'actor-1', name: 'Spirit', uuid: 'Actor.spirit123', documentName: 'Actor' };
    const seq = await tokensOfTheDeparted.create(mockCaster, mockActor, { summonConfig: { drawPing: true, tint: '#58feb0' } });

    assert.ok(seq, 'Sequence must be returned');
    assert.equal(pickOptionsPassed.uuid, 'Actor.spirit123');
    assert.equal(pickOptionsPassed.drawPing, true);
    assert.ok(pickOptionsPassed.tokenData.light);
});

test('tokensOfTheDeparted.create and play fail cleanly when inputs are missing', async () => {
    assert.equal(await tokensOfTheDeparted.create(undefined), null, 'create must return null when token is undefined');
    assert.equal(await tokensOfTheDeparted.play(undefined, { id: 'tok' }), null, 'play must return null when token is undefined');
    assert.equal(await tokensOfTheDeparted.play({ id: 'tok' }, undefined), null, 'play must return null when summonTarget is undefined');
});

test('tokensOfTheDeparted.play summons a token when Actor is provided and plays animation', async () => {
    let pickOptionsPassed = null;
    const mockSpawnedToken = {
        id: 'spawned-token-1',
        name: 'Ghostly Companion',
        document: { rotation: 0, x: 200, y: 200 },
        center: { x: 250, y: 250 }
    };

    adapter.summons.pick = async (options) => {
        pickOptionsPassed = options;
        return mockSpawnedToken;
    };

    const mockCaster = { id: 'caster-1', name: 'Rogue', document: { rotation: 0 }, center: { x: 100, y: 100 } };
    const mockActor = { id: 'actor-ghost', name: 'Ghostly Companion', uuid: 'Actor.ghost123', documentName: 'Actor' };

    const playResult = await tokensOfTheDeparted.play(mockCaster, mockActor);
    assert.ok(playResult, 'Play must return sequence play result for Actor');
    assert.equal(pickOptionsPassed.uuid, 'Actor.ghost123');
});

test('tokensOfTheDeparted.play summons a token when Actor and config are provided', async () => {
    let pickOptionsPassed = null;
    const mockSpawnedToken = {
        id: 'spawned-token-2',
        name: 'Ghostly Companion 2',
        document: { rotation: 0, x: 200, y: 200 },
        center: { x: 250, y: 250 }
    };

    adapter.summons.pick = async (options) => {
        pickOptionsPassed = options;
        return mockSpawnedToken;
    };

    const mockCaster = { id: 'caster-1', name: 'Rogue', document: { rotation: 0 }, center: { x: 100, y: 100 } };
    const mockActor = { id: 'actor-ghost-2', name: 'Ghost 2', uuid: 'Actor.ghost456', documentName: 'Actor' };

    const playResult = await tokensOfTheDeparted.play(mockCaster, mockActor, {
        summonConfig: { drawPing: true }
    });
    assert.ok(playResult, 'Play must return sequence play result when config is provided');
    assert.equal(pickOptionsPassed.uuid, 'Actor.ghost456');
    assert.equal(pickOptionsPassed.drawPing, true);

    // Also verify play fails cleanly when summonTarget is omitted
    const playResult2 = await tokensOfTheDeparted.play(mockCaster, undefined);
    assert.equal(playResult2, null, 'Play must return null when summonTarget is omitted');
});

test('tokensOfTheDeparted.play uses existing Token directly without invoking summon spawn', async () => {
    let pickCalled = false;
    adapter.summons.pick = async () => {
        pickCalled = true;
        return null;
    };

    const mockCaster = { id: 'caster-1', name: 'Rogue', document: { rotation: 0 }, center: { x: 100, y: 100 } };
    const existingToken = {
        id: 'token-existing',
        name: 'Existing Spirit',
        document: { rotation: 0, x: 300, y: 300 },
        center: { x: 350, y: 350 }
    };

    const playResult = await tokensOfTheDeparted.play(mockCaster, existingToken);
    assert.ok(playResult, 'Play must return sequence play result for existing Token');
    assert.equal(pickCalled, false, 'spawn should not be called when Token is passed directly');
});

test('tokensOfTheDeparted.create places token directly when location is provided in summonConfig', async () => {
    let createdTokenData = null;
    const mockActor = {
        id: 'actor-1',
        name: 'Ghost',
        uuid: 'Actor.ghost1',
        documentName: 'Actor',
        getTokenDocument: async (data) => {
            createdTokenData = data;
            return { id: 'tok-doc-1', ...data, object: { id: 'tok-doc-1', name: 'Ghost', document: data, center: { x: data.x, y: data.y } } };
        }
    };

    game.actors.set('actor-1', mockActor);
    const mockSceneTokens = [];
    canvas.scene = {
        createEmbeddedDocuments: async (_type, docs) => {
            mockSceneTokens.push(...docs);
            return docs;
        }
    };

    const mockCaster = { id: 'caster-1', name: 'Rogue', document: { rotation: 0 }, center: { x: 100, y: 100 } };
    const seq = await tokensOfTheDeparted.create(mockCaster, mockActor, { summonConfig: { location: { x: 500, y: 600 } } });

    assert.ok(seq, 'Sequence must be returned for direct location placement');
    assert.equal(createdTokenData.x, 500);
    assert.equal(createdTokenData.y, 600);
});

test('tokensOfTheDeparted is registered in autorec', () => {
    const aaMenu = adapter.autorec.aa.menu;
    const ontokenEntries = aaMenu.ontoken;
    const entry = ontokenEntries.find(e => e.label === 'Tokens of the Departed');

    assert.ok(entry, 'tokensOfTheDeparted must be registered in AA menu');
    assert.equal(entry.metaData.version, '0.0.5');
    assert.ok(entry.macro.args.includes('eskie.summon.tokensOfTheDeparted'), 'Macro args must contain unquoted eskie.summon.tokensOfTheDeparted');
});


test('all new summon modules are exported on summon namespace and animation.summon', () => {
    const expectedModules = [
        'air', 'celestial', 'defaultSummon', 'earth', 'fiend',
        'fire', 'futuristic', 'nature', 'shadow', 'water', 'ritualSummonHell'
    ];

    for (const modName of expectedModules) {
        assert.ok(summon[modName], `summon.${modName} must exist`);
        assert.ok(animation.summon[modName], `animation.summon.${modName} must exist`);
    }

    assert.ok(summon.default, 'summon.default alias must exist for defaultSummon');
});

test('all new summon modules have required API methods and valid default_config', () => {
    const modules = [
        { mod: summon.air, id: 'air' },
        { mod: summon.celestial, id: 'celestial' },
        { mod: summon.defaultSummon, id: 'default' },
        { mod: summon.earth, id: 'earth' },
        { mod: summon.fiend, id: 'fiend' },
        { mod: summon.fire, id: 'fire' },
        { mod: summon.futuristic, id: 'futuristic' },
        { mod: summon.nature, id: 'nature' },
        { mod: summon.shadow, id: 'shadow' },
        { mod: summon.water, id: 'water' },
        { mod: summon.ritualSummonHell, id: 'ritualSummonHell' }
    ];

    for (const { mod, id } of modules) {
        assert.equal(typeof mod.create, 'function', `${id}.create must be a function`);
        assert.equal(typeof mod.play, 'function', `${id}.play must be a function`);
        assert.equal(typeof mod.stop, 'function', `${id}.stop must be a function`);
        assert.equal(mod.summon, undefined, `${id}.summon must not be exposed on module`);

        const config = mod.default_config;
        assert.ok(config, `${id}.default_config must exist`);
        if (id !== 'ritualSummonHell') {
            assert.equal(config.id, id);
        } else {
            assert.equal(config.id, undefined, 'ritualSummonHell must not define unused id');
        }
        assert.ok(config.sound, `${id}.sound config must exist`);
        if (id === 'ritualSummonHell') {
            assert.ok(config.sound.circle, 'ritualSummonHell.sound.circle must exist');
            assert.equal(typeof config.sound.circle.enable, 'boolean');
            assert.ok(config.sound.candles, 'ritualSummonHell.sound.candles must exist');
            assert.equal(typeof config.sound.candles.enable, 'boolean');
            assert.equal(config.sound.candles.delay, 2500);
            assert.ok(config.sound.charge, 'ritualSummonHell.sound.charge must exist');
            assert.equal(typeof config.sound.charge.enable, 'boolean');
            assert.equal(config.sound.charge.delay, 3750);
            assert.ok(config.sound.climax, 'ritualSummonHell.sound.climax must exist');
            assert.equal(typeof config.sound.climax.enable, 'boolean');
        } else {
            assert.ok(config.sound.circle, `${id}.sound.circle must exist`);
            assert.equal(typeof config.sound.circle.enable, 'boolean', `${id}.sound.circle.enable must be boolean`);
            assert.ok(config.sound.appear, `${id}.sound.appear must exist`);
            assert.equal(typeof config.sound.appear.enable, 'boolean', `${id}.sound.appear.enable must be boolean`);
            const expectedDelay = id === 'nature' ? 1400 : 1200;
            assert.equal(config.sound.appear.delay, expectedDelay, `${id}.sound.appear.delay must be ${expectedDelay}`);
        }
        assert.ok(config.crosshairParameters, `${id}.crosshairParameters must exist`);
    }
});

test('all new summon modules create sequence with single token without summoning', async () => {
    const modules = [
        summon.air, summon.celestial, summon.defaultSummon, summon.earth, summon.fiend,
        summon.fire, summon.futuristic, summon.nature, summon.shadow, summon.water, summon.ritualSummonHell
    ];

    let pickCalled = false;
    adapter.summons.pick = async () => {
        pickCalled = true;
        return null;
    };

    const mockToken = {
        id: 'tok-single-1',
        name: 'Single Token',
        document: { rotation: 0, x: 100, y: 100, texture: { src: 'icons/test.png', scaleX: 1 } },
        center: { x: 150, y: 150 }
    };

    for (const mod of modules) {
        pickCalled = false;
        const seq = await mod.create(mockToken);
        assert.ok(seq, 'Sequence must be created for single token');
        assert.equal(pickCalled, false, 'adapter.summons.pick must not be called for single token invocation');
    }
});

test('all new summon modules summon token and build sequence when Actor is provided', async () => {
    const modules = [
        summon.air, summon.celestial, summon.defaultSummon, summon.earth, summon.fiend,
        summon.fire, summon.futuristic, summon.nature, summon.shadow, summon.water
    ];

    const mockSpawnedToken = {
        id: 'spawned-elem-1',
        name: 'Elemental Spirit',
        document: { rotation: 0, x: 200, y: 200, texture: { src: 'icons/elem.png', scaleX: 1 } },
        center: { x: 250, y: 250 }
    };

    let pickedActorUuid = null;
    adapter.summons.pick = async (options) => {
        pickedActorUuid = options.uuid;
        return mockSpawnedToken;
    };

    const mockCaster = { id: 'caster-1', name: 'Mage', document: { rotation: 0 }, center: { x: 100, y: 100 } };
    const mockActor = { id: 'actor-elem-1', name: 'Elemental', uuid: 'Actor.elem123', documentName: 'Actor' };

    for (const mod of modules) {
        pickedActorUuid = null;
        const result = await mod.play(mockCaster, mockActor);
        assert.ok(result, 'play should return sequence result');
        assert.equal(pickedActorUuid, 'Actor.elem123', 'Actor UUID must be passed to adapter.summons.pick');
    }
});

test('ritualSummonHell builds non-interactive sequence and creates lights with copySprite', async () => {
    const createdLights = [];
    canvas.scene = {
        createEmbeddedDocuments: async (type, docs) => {
            if (type === 'AmbientLight') createdLights.push(...docs);
            return docs;
        },
        deleteEmbeddedDocuments: async () => []
    };

    let copySpriteCalledWith = null;
    let fromCalled = false;
    let capturedSpriteRotation = null;
    const origSequence = globalThis.Sequence;
    globalThis.Sequence = class MockClimaxSequence {
        constructor() {
            const handler = {
                get(_t, prop) {
                    if (prop === 'copySprite') {
                        return (tok) => {
                            copySpriteCalledWith = tok;
                            return proxy;
                        };
                    }
                    if (prop === 'spriteRotation') {
                        return (rot) => {
                            capturedSpriteRotation = rot;
                            return proxy;
                        };
                    }
                    if (prop === 'from') {
                        return () => {
                            fromCalled = true;
                            throw new Error('Sequence.effect().from is not a function');
                        };
                    }
                    if (prop === 'play') return async () => proxy;
                    if (prop === 'then') return undefined;
                    return (..._args) => proxy;
                }
            };
            const proxy = new Proxy(this, handler);
            return proxy;
        }
    };

    try {
        const mockToken = {
            id: 'tok-hell-1',
            name: 'Fiend Token',
            document: { width: 2, height: 2, rotation: 90, texture: { src: 'icons/demon.png', scaleX: 1 } },
            center: { x: 500, y: 500 }
        };

        const seq = await summon.ritualSummonHell.create(mockToken, undefined, { interactive: false });
        assert.ok(seq, 'ritualSummonHell.create must return a Sequence');
        assert.equal(fromCalled, false, '.from must not be called');
        assert.equal(copySpriteCalledWith, mockToken, '.copySprite must be called with targetToken');
        assert.equal(capturedSpriteRotation, -90, '.spriteRotation must be -90 for a 90 degree rotated summon token');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('ritualSummonHell.stop cleans up lights and effects', async () => {
    let deletedLightIds = [];
    canvas.scene = {
        lights: [
            { id: 'light-1', flags: { 'eskie-macro-pack': { ritualSummonHell: true } } },
            { id: 'light-2', flags: {} }
        ],
        deleteEmbeddedDocuments: async (type, ids) => {
            if (type === 'AmbientLight') deletedLightIds = ids;
            return ids;
        }
    };

    let endedEffects = [];
    const origEndEffects = Sequencer.EffectManager.endEffects;
    Sequencer.EffectManager.endEffects = (opts) => {
        endedEffects.push(opts.name);
    };

    try {
        const mockTarget = { id: 'target-1', name: 'Fiend' };
        await summon.ritualSummonHell.stop(mockTarget);

        assert.ok(endedEffects.includes('Summoning Core - Fiend'));
        assert.ok(endedEffects.includes('Summoning Circle - Fiend'));
        assert.ok(endedEffects.includes('Summoning Flames - Fiend'));
        assert.deepEqual(deletedLightIds, ['light-1']);
    } finally {
        Sequencer.EffectManager.endEffects = origEndEffects;
    }
});

test('ritualSummonHell.play interactive prompts button dialog and runs climax on confirmation', async () => {
    let buttonDialogCalled = false;
    adapter.buttonDialog = async (data) => {
        buttonDialogCalled = true;
        assert.equal(data.title, 'Ritual Summon Hell');
        return '1';
    };

    const mockCaster = { id: 'caster-1', name: 'Warlock', document: { rotation: 0 }, center: { x: 100, y: 100 } };
    const mockSummon = {
        id: 'summon-demon-1',
        name: 'Pit Fiend',
        document: { width: 2, height: 2, rotation: 0, texture: { src: 'icons/pitfiend.png', scaleX: 1 } },
        center: { x: 300, y: 300 }
    };

    const playResult = await summon.ritualSummonHell.play(mockCaster, mockSummon, { interactive: true });
    assert.ok(playResult, 'Interactive play must succeed when user confirms');
    assert.equal(buttonDialogCalled, true, 'adapter.buttonDialog must be called');
});

test('ritualSummonHell names effects with - ${label}, supports custom label & No Caster fallback, and clean() ends all', async () => {
    let endedEffects = [];
    const origEndEffects = Sequencer.EffectManager.endEffects;
    Sequencer.EffectManager.endEffects = (opts) => {
        endedEffects.push(opts.name);
    };

    const origSequence = globalThis.Sequence;
    const effectsCreated = [];
    const thenDoCallbacks = [];

    class TestMockSequence {
        constructor() {
            let currentEffect = null;
            const handler = {
                get(_t, prop) {
                    if (prop === 'effect') {
                        currentEffect = {};
                        effectsCreated.push(currentEffect);
                        return () => proxy;
                    }
                    if (prop === 'name') {
                        return (name) => {
                            if (currentEffect) currentEffect.name = name;
                            return proxy;
                        };
                    }
                    if (prop === 'file') {
                        return (file) => {
                            if (currentEffect) currentEffect.file = file;
                            return proxy;
                        };
                    }
                    if (prop === 'thenDo') {
                        return (fn) => {
                            thenDoCallbacks.push(fn);
                            return proxy;
                        };
                    }
                    if (prop === 'play') {
                        return async () => {
                            for (const fn of thenDoCallbacks) {
                                await fn();
                            }
                            return proxy;
                        };
                    }
                    if (prop === 'then') return undefined;
                    return (..._args) => proxy;
                }
            };
            const proxy = new Proxy(this, handler);
            return proxy;
        }
    }

    const origCreateDocs = canvas.scene?.createEmbeddedDocuments;
    const origDeleteDocs = canvas.scene?.deleteEmbeddedDocuments;
    if (canvas.scene) {
        canvas.scene.createEmbeddedDocuments = async (_type, docs) => docs;
        canvas.scene.deleteEmbeddedDocuments = async () => [];
    }

    globalThis.Sequence = TestMockSequence;
    try {
        const mockCaster = { id: 'c1', name: 'Warlock', document: { rotation: 0 }, center: { x: 100, y: 100 } };
        const mockSummon = {
            id: 's1',
            name: 'Pit Fiend',
            document: { width: 2, height: 2, rotation: 0, texture: { src: 'icons/pitfiend.png', scaleX: 1 } },
            center: { x: 300, y: 300 }
        };

        // 1. Non-Interactive Mode (default caster name label)
        effectsCreated.length = 0;
        thenDoCallbacks.length = 0;
        endedEffects.length = 0;

        await summon.ritualSummonHell.play(mockCaster, mockSummon, { interactive: false });

        const flameEffect = effectsCreated.find(e => e.name === 'Summoning Flames - Warlock');
        assert.ok(flameEffect, 'jb2a.flames.01 effect must be assigned name Summoning Flames - Warlock');
        assert.ok(effectsCreated.some(e => e.name === 'Summoning Circle - Warlock'));
        assert.ok(effectsCreated.some(e => e.name === 'Summoning Core - Warlock'));

        assert.ok(endedEffects.includes('Summoning Flames - Warlock'), 'Non-interactive climax must end Summoning Flames - Warlock');
        assert.ok(endedEffects.includes('Summoning Core - Warlock'), 'Non-interactive climax must end Summoning Core - Warlock');

        // 2. Interactive Mode (default caster name label)
        effectsCreated.length = 0;
        thenDoCallbacks.length = 0;
        endedEffects.length = 0;

        adapter.buttonDialog = async () => '1';
        await summon.ritualSummonHell.play(mockCaster, mockSummon, { interactive: true });

        assert.ok(endedEffects.includes('Summoning Flames - Warlock'), 'Interactive climax must end Summoning Flames - Warlock upon SUMMON! confirmation');
        assert.ok(endedEffects.includes('Summoning Core - Warlock'), 'Interactive climax must end Summoning Core - Warlock upon SUMMON! confirmation');

        // 3. Custom configurable label (e.g. "Summon Animation")
        effectsCreated.length = 0;
        thenDoCallbacks.length = 0;
        endedEffects.length = 0;

        await summon.ritualSummonHell.play(mockCaster, mockSummon, { label: 'Summon Animation', interactive: false });

        assert.ok(effectsCreated.some(e => e.name === 'Summoning Flames - Summon Animation'));
        assert.ok(endedEffects.includes('Summoning Flames - Summon Animation'));
        assert.ok(endedEffects.includes('Summoning Core - Summon Animation'));

        // 4. Fallback to "No Caster" when token has no name
        effectsCreated.length = 0;
        thenDoCallbacks.length = 0;
        endedEffects.length = 0;

        const mockCasterNoName = { id: 'c-anon', document: { rotation: 0 }, center: { x: 100, y: 100 } };
        await summon.ritualSummonHell.play(mockCasterNoName, mockSummon, { interactive: false });

        assert.ok(effectsCreated.some(e => e.name === 'Summoning Flames - No Caster'));
        assert.ok(endedEffects.includes('Summoning Flames - No Caster'));
        assert.ok(endedEffects.includes('Summoning Core - No Caster'));

        // 5. clean() function removes all animations from all labels
        endedEffects.length = 0;
        await summon.ritualSummonHell.clean();

        assert.ok(endedEffects.includes('Summoning Core*'), 'clean() must end Summoning Core* across all labels');
        assert.ok(endedEffects.includes('Summoning Circle*'), 'clean() must end Summoning Circle* across all labels');
        assert.ok(endedEffects.includes('Summoning Flames*'), 'clean() must end Summoning Flames* across all labels');
    } finally {
        Sequencer.EffectManager.endEffects = origEndEffects;
        globalThis.Sequence = origSequence;
        if (canvas.scene) {
            canvas.scene.createEmbeddedDocuments = origCreateDocs;
            canvas.scene.deleteEmbeddedDocuments = origDeleteDocs;
        }
    }
});

test('all new summon modules are registered in autorec with token type', () => {
    const aaMenu = adapter.autorec.aa.menu;
    const ontokenEntries = aaMenu.ontoken;

    const expectedRegistrations = [
        { label: 'Summon Air', macro: 'eskie.summon.air' },
        { label: 'Summon Celestial', macro: 'eskie.summon.celestial' },
        { label: 'Summon Default', macro: 'eskie.summon.defaultSummon' },
        { label: 'Summon Earth', macro: 'eskie.summon.earth' },
        { label: 'Summon Fiend', macro: 'eskie.summon.fiend' },
        { label: 'Summon Fire', macro: 'eskie.summon.fire' },
        { label: 'Summon Futuristic', macro: 'eskie.summon.futuristic' },
        { label: 'Summon Nature', macro: 'eskie.summon.nature' },
        { label: 'Summon Shadow', macro: 'eskie.summon.shadow' },
        { label: 'Summon Water', macro: 'eskie.summon.water' },
        { label: 'Ritual Summon Hell', macro: 'eskie.summon.ritualSummonHell' }
    ];

    for (const { label, macro } of expectedRegistrations) {
        const entry = ontokenEntries.find(e => e.label === label);
        assert.ok(entry, `${label} must be registered in AA menu`);
        assert.equal(entry.metaData.version, '0.0.2');
        assert.ok(entry.macro.args.includes(macro), `Macro args must contain unquoted ${macro}`);
    }
});

test('all new summon modules dispatch phased sounds at key points with correct delays', async () => {
    const origSequence = globalThis.Sequence;
    const recordedSounds = [];

    class MockSoundSequence {
        constructor() {
            const self = this;
            const handler = {
                get(_t, prop) {
                    if (prop === 'sound') {
                        return () => {
                            const callRecord = { calls: [] };
                            recordedSounds.push(callRecord);
                            const sndHandler = {
                                get(_st, sprop) {
                                    return (...args) => {
                                        callRecord.calls.push({ method: sprop, args });
                                        return sndProxy;
                                    };
                                }
                            };
                            const sndProxy = new Proxy({}, sndHandler);
                            return sndProxy;
                        };
                    }
                    if (prop === 'play') return async () => self;
                    if (prop === 'then') return undefined;
                    return (..._args) => selfProxy;
                }
            };
            const selfProxy = new Proxy(this, handler);
            return selfProxy;
        }
    }

    globalThis.Sequence = MockSoundSequence;
    try {
        const mockCaster = { id: 'c1', name: 'Caster', document: { rotation: 0 }, center: { x: 100, y: 100 } };
        const mockTarget = { id: 't1', name: 'Target', document: { rotation: 0, texture: { src: 'test.png' } }, center: { x: 200, y: 200 } };

        // Test tokensOfTheDeparted phased sounds
        recordedSounds.length = 0;
        await summon.tokensOfTheDeparted.create(mockCaster, mockTarget, {
            sound: {
                launch: { enable: true, file: 'audio/launch.mp3' },
                manifest: { enable: true, file: 'audio/manifest.mp3', delay: 1000 }
            }
        });
        assert.equal(recordedSounds.length, 2, 'tokensOfTheDeparted must attach 2 sounds');
        assert.equal(recordedSounds[0].calls.find(c => c.method === 'file')?.args[0], 'audio/launch.mp3');
        assert.equal(recordedSounds[1].calls.find(c => c.method === 'file')?.args[0], 'audio/manifest.mp3');
        assert.equal(recordedSounds[1].calls.find(c => c.method === 'delay')?.args[0], 1000);

        // Test ritualSummonHell phased sounds in create
        recordedSounds.length = 0;
        await summon.ritualSummonHell.create(mockCaster, mockTarget, {
            sound: {
                circle: { enable: true, file: 'audio/circle.mp3' },
                candles: { enable: true, file: 'audio/candles.mp3', delay: 2500 },
                charge: { enable: true, file: 'audio/charge.mp3', delay: 3750 },
                climax: { enable: true, file: 'audio/climax.mp3' }
            }
        });
        assert.equal(recordedSounds.length, 4, 'ritualSummonHell must attach circle, candles, charge, and climax sounds');
        const candleSound = recordedSounds.find(r => r.calls.some(c => c.args?.[0] === 'audio/candles.mp3'));
        assert.ok(candleSound);
        assert.equal(candleSound.calls.find(c => c.method === 'delay')?.args[0], 2500);
        const chargeSound = recordedSounds.find(r => r.calls.some(c => c.args?.[0] === 'audio/charge.mp3'));
        assert.ok(chargeSound);
        assert.equal(chargeSound.calls.find(c => c.method === 'delay')?.args[0], 3750);

        // Test air elemental phased sounds
        recordedSounds.length = 0;
        await summon.air.create(mockCaster, mockTarget, {
            sound: {
                circle: { enable: true, file: 'audio/air-circle.mp3' },
                appear: { enable: true, file: 'audio/air-appear.mp3', delay: 1200 }
            }
        });
        assert.equal(recordedSounds.length, 2, 'air summon must attach circle and appear sounds');
        const airAppear = recordedSounds.find(r => r.calls.some(c => c.args?.[0] === 'audio/air-appear.mp3'));
        assert.ok(airAppear);
        assert.equal(airAppear.calls.find(c => c.method === 'delay')?.args[0], 1200);

        // Test flat sound backward compatibility
        recordedSounds.length = 0;
        await summon.fire.create(mockCaster, mockTarget, {
            sound: { enable: true, file: 'audio/legacy-fire.mp3' }
        });
        assert.ok(recordedSounds.length >= 1, 'fire summon must support flat sound fallback');
        assert.equal(recordedSounds[0].calls.find(c => c.method === 'file')?.args[0], 'audio/legacy-fire.mp3');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
