import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { possession } from '../../src/animation/effects/token/possession/possession.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('possession effect API contracts and exports', () => {
    assert.ok(possession, 'possession module must exist');
    assert.equal(typeof possession.create, 'function', 'possession.create must be a function');
    assert.equal(typeof possession.play, 'function', 'possession.play must be a function');
    assert.equal(typeof possession.stop, 'function', 'possession.stop must be a function');

    assert.ok(possession.default_config, 'default_config must exist');
    assert.equal(possession.default_config.id, 'eskie.effect.possession.main');
    assert.ok(possession.default_config.sound, 'sound config must exist');
    assert.equal(typeof possession.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.possession, 'animation.effect.possession must be registered');
    assert.equal(animation.effect.possession, possession);
});

test('possession.create builds sequence with sequence.motion(token).oscillate() without copySprite(token) or opacity(0) hiding', async () => {
    let capturedMotionTarget = null;
    let opacitySetZero = false;
    let oscillateCalled = false;
    let fadeToValue = null;
    let tintToValue = null;
    let copySpriteTargets = [];

    const origSequence = globalThis.Sequence;

    class MockPossessionSequence {
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
                    if (prop === 'fadeTo') {
                        return (val) => {
                            fadeToValue = val;
                            return proxy;
                        };
                    }
                    if (prop === 'tintTo') {
                        return (val) => {
                            tintToValue = val;
                            return proxy;
                        };
                    }
                    if (prop === 'oscillate') {
                        return () => {
                            oscillateCalled = true;
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
                    if (prop === 'copySprite') {
                        return (target) => {
                            copySpriteTargets.push(target);
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

    globalThis.Sequence = MockPossessionSequence;

    try {
        const mockToken = {
            id: 'tok-pos-1',
            name: 'Possessing Ghost Token',
            document: { uuid: 'Scene.1.Token.1', width: 1, height: 1, rotation: 0, texture: { scaleX: 1 } },
            center: { x: 100, y: 100 }
        };
        const mockTarget = {
            id: 'tok-pos-target-1',
            name: 'Victim Token',
            document: { uuid: 'Scene.1.Token.2', width: 1, height: 1, rotation: 0, texture: { scaleX: 1 } },
            center: { x: 200, y: 200 }
        };

        const seq = await possession.create(mockToken, mockTarget);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockToken, 'Motion target must be the ghost token');
        assert.equal(oscillateCalled, true, 'oscillate must be called on motion');
        assert.equal(fadeToValue, 0.65, 'fadeTo(0.65) must be set on motion');
        assert.equal(tintToValue, '#6ff087', 'tintTo(#6ff087) must be set on motion');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(copySpriteTargets.includes(mockToken), false, 'copySprite must NOT be called on token');
        assert.equal(copySpriteTargets.includes(mockTarget), true, 'copySprite should be called on target for glow aura');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('possession.play creates and plays sequence, and stop cleans up effects', async () => {
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
            id: 'tok-pos-2',
            name: 'Ghost Token 2',
            document: { uuid: 'Scene.1.Token.3', width: 1, height: 1, rotation: 0, texture: { scaleX: 1 } }
        };
        const mockTarget = {
            id: 'tok-pos-target-2',
            name: 'Target Token 2',
            document: { uuid: 'Scene.1.Token.4', width: 1, height: 1, rotation: 0, texture: { scaleX: 1 } }
        };

        await possession.play(mockToken, mockTarget);
        assert.equal(playCalled, true, 'sequence.play must be executed');

        await possession.stop(mockToken, mockTarget);
        assert.equal(endedEffectName, 'eskie.effect.possession.main - Scene.1.Token.4', 'stop must end effects with target label');
    } finally {
        globalThis.Sequence = origSequence;
        Sequencer.EffectManager.endEffects = origEndEffects;
    }
});
