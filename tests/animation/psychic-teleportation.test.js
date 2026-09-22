import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { psychicTeleportation } from '../../src/animation/effects/template/psychic-teleportation.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('psychicTeleportation effect API contracts and exports', () => {
    assert.ok(psychicTeleportation, 'psychicTeleportation module must exist');
    assert.equal(typeof psychicTeleportation.create, 'function', 'psychicTeleportation.create must be a function');
    assert.equal(typeof psychicTeleportation.play, 'function', 'psychicTeleportation.play must be a function');
    assert.equal(typeof psychicTeleportation.stop, 'function', 'psychicTeleportation.stop must be a function');

    assert.ok(psychicTeleportation.default_config, 'default_config must exist');
    assert.equal(psychicTeleportation.default_config.id, 'Psychic Teleportation');
    assert.ok(psychicTeleportation.default_config.sound, 'sound config must exist');
    assert.equal(typeof psychicTeleportation.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.psychicTeleportation, 'animation.effect.psychicTeleportation must be registered');
    assert.equal(animation.effect.psychicTeleportation, psychicTeleportation);
});

test('psychicTeleportation.create builds sequence with .motion() animation without copySprite or token opacity hiding', async () => {
    let capturedMotionTarget = null;
    let capturedMotionDestination = null;
    let opacitySetZero = false;
    let teleportToCalled = false;
    let copySpriteCount = 0;

    const origSequence = globalThis.Sequence;

    class MockPsychicSequence {
        constructor() {
            let currentSection = null;
            const handler = {
                get(_t, prop) {
                    if (prop === 'animation') {
                        currentSection = 'animation';
                        return () => proxy;
                    }
                    if (prop === 'effect') {
                        currentSection = 'effect';
                        return () => proxy;
                    }
                    if (prop === 'motion') {
                        currentSection = 'motion';
                        return (target) => {
                            capturedMotionTarget = target;
                            return proxy;
                        };
                    }
                    if (prop === 'moveTo') {
                        return (dest) => {
                            capturedMotionDestination = dest;
                            return proxy;
                        };
                    }
                    if (prop === 'opacity') {
                        return (val) => {
                            if (currentSection === 'animation' && val === 0) {
                                opacitySetZero = true;
                            }
                            return proxy;
                        };
                    }
                    if (prop === 'teleportTo') {
                        return () => {
                            teleportToCalled = true;
                            return proxy;
                        };
                    }
                    if (prop === 'copySprite') {
                        return () => {
                            copySpriteCount++;
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
    }

    globalThis.Sequence = MockPsychicSequence;

    try {
        const mockToken = {
            id: 'tok-psychic-1',
            name: 'Caster Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 }
        };

        const targetPos = { x: 400, y: 400 };

        const seq = await psychicTeleportation.create(mockToken, { position: targetPos });
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockToken, 'Motion target must be the token');
        assert.deepEqual(capturedMotionDestination, { x: 400, y: 400 }, 'Motion destination must match position');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(teleportToCalled, false, 'teleportTo must NOT be called');
        assert.equal(copySpriteCount, 0, 'No copySprite should be present in psychicTeleportation.create');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('psychicTeleportation.play creates and plays sequence, and stop cleans up effects', async () => {
    let playCalled = false;
    let endedEffectName = null;

    const origSequence = globalThis.Sequence;
    globalThis.Sequence = class MockPlaySequence {
        constructor() {
            const handler = {
                get(_t, prop) {
                    if (prop === 'play') {
                        return async () => {
                            playCalled = true;
                            return true;
                        };
                    }
                    if (prop === 'then') return undefined;
                    return (..._args) => proxy;
                }
            };
            const proxy = new Proxy(this, handler);
            return proxy;
        }
    };

    const origEndEffects = Sequencer.EffectManager.endEffects;
    Sequencer.EffectManager.endEffects = (filter) => {
        endedEffectName = filter.name;
    };

    try {
        const mockToken = {
            id: 'tok-psychic-2',
            name: 'Teleporter Token',
            document: { width: 1, height: 1, rotation: 0 }
        };
        const targetPos = { x: 200, y: 200 };

        const playResult = await psychicTeleportation.play(mockToken, { position: targetPos });
        assert.ok(playResult, 'psychicTeleportation.play should return sequence play result');
        assert.equal(playCalled, true, 'sequence.play must be executed');

        psychicTeleportation.stop(mockToken);
        assert.equal(endedEffectName, 'Psychic Teleportation', 'stop must end effects with id Psychic Teleportation');
    } finally {
        globalThis.Sequence = origSequence;
        Sequencer.EffectManager.endEffects = origEndEffects;
    }
});
