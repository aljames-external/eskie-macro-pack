import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { leap } from '../../src/animation/effects/token/leap.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('leap effect API contracts and exports', () => {
    assert.ok(leap, 'leap module must exist');
    assert.equal(typeof leap.create, 'function', 'leap.create must be a function');
    assert.equal(typeof leap.play, 'function', 'leap.play must be a function');
    assert.equal(typeof leap.stop, 'function', 'leap.stop must be a function');

    assert.ok(leap.default_config, 'default_config must exist');
    assert.equal(leap.default_config.id, 'leap');
    assert.ok(leap.default_config.sound, 'sound config must exist');
    assert.equal(typeof leap.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.leap, 'animation.effect.leap must be registered');
    assert.equal(animation.effect.leap, leap);
});

test('leap.create builds sequence with .motion() animation and ground shadow without hiding token', async () => {
    let capturedMotionConfig = null;
    let capturedAnimationTarget = null;
    let opacitySetZero = false;
    let teleportToCalled = false;
    let copySpriteCount = 0;

    const origSequence = globalThis.Sequence;

    class MockLeapSequence {
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
                    if (prop === 'on') {
                        return (target) => {
                            capturedAnimationTarget = target;
                            return proxy;
                        };
                    }
                    if (prop === 'motion') {
                        return (targetOrCfg) => {
                            if (targetOrCfg && typeof targetOrCfg === 'object' && targetOrCfg.id) {
                                capturedAnimationTarget = targetOrCfg;
                            } else {
                                capturedMotionConfig = targetOrCfg;
                            }
                            return proxy;
                        };
                    }
                    if (prop === 'moveTo') {
                        return (pos, options) => {
                            capturedMotionConfig = options;
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

    globalThis.Sequence = MockLeapSequence;

    try {
        const mockToken = {
            id: 'tok-leap-1',
            name: 'Hero Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 }
        };
        const targetPos = { x: 300, y: 300 };

        const seq = await leap.create(mockToken, { position: targetPos });
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedAnimationTarget, mockToken, 'Animation target must be the token');
        assert.ok(capturedMotionConfig, 'motion configuration must be passed');
        assert.equal(capturedMotionConfig.duration, 1000, 'motion duration must be 1000');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(teleportToCalled, false, 'teleportTo must NOT be called');
        assert.equal(copySpriteCount, 1, 'Only 1 copySprite effect should be present for the ground shadow overlay');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('leap.play creates and plays sequence, and stop cleans up effects', async () => {
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
            id: 'tok-leap-2',
            name: 'Jumper Token',
            document: { width: 1, height: 1, rotation: 0 }
        };
        const targetPos = { x: 200, y: 200 };

        const playResult = await leap.play(mockToken, { position: targetPos });
        assert.ok(playResult, 'leap.play should return sequence play result');
        assert.equal(playCalled, true, 'sequence.play must be executed');

        leap.stop(mockToken);
        assert.equal(endedEffectName, 'leap', 'stop must end effects with id leap');
    } finally {
        globalThis.Sequence = origSequence;
        Sequencer.EffectManager.endEffects = origEndEffects;
    }
});
