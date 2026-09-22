import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { viciousMockery } from '../../src/animation/effects/target/vicious-mockery.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('viciousMockery effect API contracts and exports', () => {
    assert.ok(viciousMockery, 'viciousMockery module must exist');
    assert.equal(typeof viciousMockery.create, 'function', 'viciousMockery.create must be a function');
    assert.equal(typeof viciousMockery.play, 'function', 'viciousMockery.play must be a function');
    assert.equal(typeof viciousMockery.stop, 'function', 'viciousMockery.stop must be a function');
    assert.equal(typeof viciousMockery.cast.create, 'function', 'viciousMockery.cast.create must be a function');
    assert.equal(typeof viciousMockery.cast.play, 'function', 'viciousMockery.cast.play must be a function');
    assert.equal(typeof viciousMockery.cast.stop, 'function', 'viciousMockery.cast.stop must be a function');
    assert.equal(typeof viciousMockery.impact.create, 'function', 'viciousMockery.impact.create must be a function');

    assert.ok(viciousMockery.default_config, 'default_config must exist');
    assert.ok(viciousMockery.default_config.sound, 'sound config must exist');

    assert.ok(animation.effect.viciousMockery, 'animation.effect.viciousMockery must be registered');
    assert.equal(animation.effect.viciousMockery, viciousMockery);
});

test('viciousMockery.impact.create builds sequence with sequence.motion(target).noise() without copySprite or opacity(0) hiding', async () => {
    const capturedMotionTargets = [];
    let opacitySetZero = false;
    let copySpriteCount = 0;
    let noiseCalled = false;

    const origSequence = globalThis.Sequence;

    class MockViciousMockerySequence {
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

    globalThis.Sequence = MockViciousMockerySequence;

    try {
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

        const seq = await viciousMockery.impact.create(mockTarget, 'Haha!');
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTargets.length, 1, 'Motion target count should be 1');
        assert.equal(capturedMotionTargets[0], mockTarget, 'Motion target must be the target token');
        assert.equal(noiseCalled, true, 'noise must be called on motion');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(copySpriteCount, 0, 'No copySprite should be present in viciousMockery.impact.create');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('viciousMockery.cast.play creates and plays cast and impact sequences', async () => {
    let playCount = 0;

    const origSequence = globalThis.Sequence;
    globalThis.Sequence = class MockPlaySequence {
        constructor() {
            const handler = {
                get(_t, prop) {
                    if (prop === 'play') {
                        return async () => {
                            playCount++;
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
            id: 'tok-caster-1',
            name: 'Caster Token',
            document: { width: 1, height: 1, rotation: 0, texture: { scaleX: 1, scaleY: 1 } }
        };
        const mockTarget = {
            id: 'tok-target-1',
            name: 'Target Token',
            document: { width: 1, height: 1, rotation: 0, texture: { scaleX: 1, scaleY: 1 } }
        };

        await viciousMockery.cast.play(mockToken, mockTarget);
        assert.equal(playCount, 2, 'Both cast and impact sequences should be played');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
