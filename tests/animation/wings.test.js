import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { wings } from '../../src/animation/effects/token/wings.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('wings effect API contracts and exports', () => {
    assert.ok(wings, 'wings module must exist');
    assert.equal(typeof wings.create, 'function', 'wings.create must be a function');
    assert.equal(typeof wings.play, 'function', 'wings.play must be a function');
    assert.equal(typeof wings.stop, 'function', 'wings.stop must be a function');

    assert.ok(wings.default_config, 'default_config must exist');
    assert.equal(wings.default_config.id, 'wings');
    assert.ok(wings.default_config.sound, 'sound config must exist');
    assert.equal(typeof wings.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.wings, 'animation.effect.wings must be registered');
    assert.equal(animation.effect.wings, wings);
});

test('wings.create builds sequence with sequence.motion(token).moveTo({ y: -0.5 }, { gridUnits: true }).oscillate().persist() without opacity(0) hiding', async () => {
    let capturedMotionTarget = null;
    let opacitySetZero = false;
    let oscillateCalled = false;
    let moveToCalled = false;
    let moveToArgs = null;

    const origSequence = globalThis.Sequence;

    class MockWingsSequence {
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

    globalThis.Sequence = MockWingsSequence;

    try {
        const mockToken = {
            id: 'tok-wings-1',
            name: 'Winged Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 }
        };

        const seq = await wings.create(mockToken);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockToken, 'Motion target must be the token');
        assert.equal(moveToCalled, true, 'moveTo must be called');
        assert.deepEqual(moveToArgs[0], { y: -0.5 }, 'moveTo target position must be { y: -0.5 }');
        assert.deepEqual(moveToArgs[1], { gridUnits: true }, 'moveTo options must specify { gridUnits: true }');
        assert.equal(oscillateCalled, true, 'oscillate must be called');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('wings.play creates and plays sequence, and stop cleans up effects', async () => {
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
            id: 'tok-wings-2',
            name: 'Winged Token 2',
            document: { width: 1, height: 1, rotation: 0 }
        };

        const playResult = await wings.play(mockToken);
        assert.ok(playResult, 'wings.play should return sequence play result');
        assert.equal(playCalled, true, 'sequence.play must be executed');

        wings.stop(mockToken);
        assert.equal(endedEffectName, 'wings - tok-wings-2', 'stop must end effects with label');
    } finally {
        globalThis.Sequence = origSequence;
        Sequencer.EffectManager.endEffects = origEndEffects;
    }
});
