import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { shockingGrasp } from '../../src/animation/effects/target/shocking-grasp.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('shockingGrasp effect API contracts and exports', () => {
    assert.ok(shockingGrasp, 'shockingGrasp module must exist');
    assert.equal(typeof shockingGrasp.create, 'function', 'shockingGrasp.create must be a function');
    assert.equal(typeof shockingGrasp.play, 'function', 'shockingGrasp.play must be a function');
    assert.equal(typeof shockingGrasp.stop, 'function', 'shockingGrasp.stop must be a function');

    assert.ok(shockingGrasp.default_config, 'default_config must exist');
    assert.ok(shockingGrasp.default_config.sound, 'sound config must exist');
    assert.equal(typeof shockingGrasp.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.shockingGrasp, 'animation.effect.shockingGrasp must be registered');
    assert.equal(animation.effect.shockingGrasp, shockingGrasp);
});

test('shockingGrasp.create builds sequence with sequence.motion(target).noise() without copySprite or opacity(0) hiding', async () => {
    const capturedMotionTargets = [];
    let opacitySetZero = false;
    let copySpriteCount = 0;
    let noiseCalled = false;

    const origSequence = globalThis.Sequence;

    class MockShockingGraspSequence {
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
                            capturedMotionTargets.push(target);
                            return proxy;
                        };
                    }
                    if (prop === 'noise') {
                        return () => {
                            noiseCalled = true;
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

    globalThis.Sequence = MockShockingGraspSequence;

    try {
        const mockToken = {
            id: 'tok-caster-1',
            name: 'Caster Token',
            document: {
                width: 1,
                height: 1,
                rotation: 0,
                texture: { scaleX: 1, scaleY: 1 },
                update: async () => {}
            },
            center: { x: 100, y: 100 }
        };

        const mockTarget = {
            id: 'tok-target-1',
            name: 'Target Token',
            document: {
                width: 1,
                height: 1,
                rotation: 0,
                texture: { scaleX: 1, scaleY: 1 },
                update: async () => {}
            },
            center: { x: 200, y: 200 }
        };

        const seq = await shockingGrasp.create(mockToken, mockTarget);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTargets.length, 1, 'Motion target count should be 1');
        assert.equal(capturedMotionTargets[0], mockTarget, 'Motion target must be the target token');
        assert.equal(noiseCalled, true, 'noise must be called on motion');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(copySpriteCount, 0, 'No copySprite should be present in shockingGrasp.create');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('shockingGrasp.play creates and plays sequence', async () => {
    let playCalled = false;

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

    try {
        const mockToken = {
            id: 'tok-caster-2',
            name: 'Caster Token 2',
            document: {
                width: 1,
                height: 1,
                rotation: 0,
                texture: { scaleX: 1, scaleY: 1 }
            }
        };

        const mockTarget = {
            id: 'tok-target-2',
            name: 'Target Token 2',
            document: {
                width: 1,
                height: 1,
                rotation: 0,
                texture: { scaleX: 1, scaleY: 1 }
            }
        };

        const playResult = await shockingGrasp.play(mockToken, mockTarget);
        assert.ok(playResult, 'shockingGrasp.play should return sequence play result');
        assert.equal(playCalled, true, 'sequence.play must be executed');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
