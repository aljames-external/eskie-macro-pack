import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { incorporeal } from '../../src/animation/effects/token/incorporeal/incorporeal.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('incorporeal effect API contracts and exports', () => {
    assert.ok(incorporeal, 'incorporeal module must exist');
    assert.equal(typeof incorporeal.create, 'function', 'incorporeal.create must be a function');
    assert.equal(typeof incorporeal.play, 'function', 'incorporeal.play must be a function');
    assert.equal(typeof incorporeal.stop, 'function', 'incorporeal.stop must be a function');
    assert.equal(typeof incorporeal.clean, 'function', 'incorporeal.clean must be a function');

    assert.ok(incorporeal.default_config, 'default_config must exist');
    assert.equal(incorporeal.default_config.id, 'eskie.effect.incorporeal.main');
    assert.ok(incorporeal.default_config.sound, 'sound config must exist');
    assert.equal(typeof incorporeal.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.incorporeal, 'animation.effect.incorporeal must be registered');
    assert.equal(animation.effect.incorporeal, incorporeal);
});

test('incorporeal.create builds sequence with sequence.motion(token).oscillate().fadeTo(0.5) without opacity(0) hiding', async () => {
    let capturedMotionTarget = null;
    let opacitySetZero = false;
    let copySpriteCalled = false;
    let oscillateCalled = false;
    let fadeToValue = null;
    let tintToValue = null;

    const origSequence = globalThis.Sequence;

    class MockIncorporealSequence {
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
                    if (prop === 'copySprite') {
                        copySpriteCalled = true;
                        return () => proxy;
                    }
                    if (prop === 'oscillate') {
                        return () => {
                            oscillateCalled = true;
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
                    if (prop === 'opacity') {
                        return (val) => {
                            if (currentSection === 'animation' && val === 0) {
                                opacitySetZero = true;
                            }
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

    globalThis.Sequence = MockIncorporealSequence;

    try {
        const mockToken = {
            id: 'tok-incorp-1',
            name: 'Incorporeal Token',
            document: { uuid: 'Scene.1.Token.1', width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 }
        };

        const seq = await incorporeal.create(mockToken);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockToken, 'Motion target must be the token');
        assert.equal(oscillateCalled, true, 'oscillate must be called on motion');
        assert.equal(fadeToValue, 0.5, 'fadeTo must be set to 0.5');
        assert.equal(tintToValue, '#6ff087', 'tintTo must be set to tintColor (#6ff087)');
        assert.equal(copySpriteCalled, false, 'copySprite must NOT be called');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('incorporeal.play creates and plays sequence, stop and clean end effects', async () => {
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
            id: 'tok-incorp-2',
            name: 'Incorporeal Token 2',
            document: { uuid: 'Scene.1.Token.2', width: 1, height: 1, rotation: 0, update: async () => {} }
        };

        await incorporeal.play(mockToken);
        assert.equal(playCalled, true, 'sequence.play must be executed');

        await incorporeal.stop(mockToken);
        assert.equal(endedEffectName, 'eskie.effect.incorporeal.main - Scene.1.Token.2', 'stop must end effects with label');

        endedEffectName = null;
        await incorporeal.clean(mockToken);
        assert.equal(endedEffectName, 'eskie.effect.incorporeal.main - Scene.1.Token.2', 'clean must end effects with label');
    } finally {
        globalThis.Sequence = origSequence;
        Sequencer.EffectManager.endEffects = origEndEffects;
    }
});
