import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { fly } from '../../src/animation/effects/token/fly.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('fly effect API contracts and exports', () => {
    assert.ok(fly, 'fly module must exist');
    assert.equal(typeof fly.create, 'function', 'fly.create must be a function');
    assert.equal(typeof fly.play, 'function', 'fly.play must be a function');
    assert.equal(typeof fly.stop, 'function', 'fly.stop must be a function');

    assert.ok(fly.default_config, 'default_config must exist');
    assert.equal(fly.default_config.id, 'fly');
    assert.ok(fly.default_config.sound, 'sound config must exist');
    assert.equal(typeof fly.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.fly, 'animation.effect.fly must be registered');
    assert.equal(animation.effect.fly, fly);
});

test('fly.create builds sequence with sequence.motion(token).moveTo({ y: -0.5 }, { gridUnits: true }).oscillate().persist() without opacity(0) hiding', async () => {
    let capturedMotionTarget = null;
    let opacitySetZero = false;
    let oscillateCalled = false;
    let moveToCalled = false;
    let moveToArgs = null;

    const origSequence = globalThis.Sequence;

    class MockFlySequence {
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
                        return (...args) => {
                            moveToCalled = true;
                            moveToArgs = args;
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
                    if (prop === 'play') return async () => proxy;
                    if (prop === 'then') return undefined;
                    return (..._args) => proxy;
                }
            };
            const proxy = new Proxy(this, handler);
            return proxy;
        }
    }

    globalThis.Sequence = MockFlySequence;

    try {
        const mockToken = {
            id: 'tok-fly-1',
            name: 'Flying Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 }
        };

        const seq = await fly.create(mockToken);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockToken, 'Motion target must be the token');
        assert.equal(moveToCalled, true, 'moveTo must be called');
        assert.deepEqual(moveToArgs[0], { y: -0.5 }, 'moveTo target position must be { y: -0.5 }');
        assert.deepEqual(moveToArgs[1], { duration: 1000, gridUnits: true }, 'moveTo options must specify { duration: 1000, gridUnits: true }');
        assert.equal(oscillateCalled, true, 'oscillate must be called');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('fly.play creates and plays sequence, and stop cleans up effects', async () => {
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
            id: 'tok-fly-2',
            name: 'Flying Token 2',
            document: { width: 1, height: 1, rotation: 0 }
        };

        const playResult = await fly.play(mockToken);
        assert.ok(playResult, 'fly.play should return sequence play result');
        assert.equal(playCalled, true, 'sequence.play must be executed');

        fly.stop(mockToken);
        assert.equal(endedEffectName, 'fly - tok-fly-2', 'stop must end effects with label');
    } finally {
        globalThis.Sequence = origSequence;
        Sequencer.EffectManager.endEffects = origEndEffects;
    }
});
