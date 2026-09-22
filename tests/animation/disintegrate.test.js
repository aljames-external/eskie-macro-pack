import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { disintegrate } from '../../src/animation/effects/target/disintegrate.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('disintegrate effect API contracts and exports', () => {
    assert.ok(disintegrate, 'disintegrate module must exist');
    assert.equal(typeof disintegrate.create, 'function', 'disintegrate.create must be a function');
    assert.equal(typeof disintegrate.play, 'function', 'disintegrate.play must be a function');
    assert.equal(typeof disintegrate.stop, 'function', 'disintegrate.stop must be a function');

    assert.ok(disintegrate.dissolve, 'disintegrate.dissolve sub-module must exist');
    assert.equal(typeof disintegrate.dissolve.create, 'function', 'disintegrate.dissolve.create must be a function');
    assert.equal(typeof disintegrate.dissolve.play, 'function', 'disintegrate.dissolve.play must be a function');

    assert.ok(disintegrate.reform, 'disintegrate.reform sub-module must exist');
    assert.equal(typeof disintegrate.reform.create, 'function', 'disintegrate.reform.create must be a function');
    assert.equal(typeof disintegrate.reform.play, 'function', 'disintegrate.reform.play must be a function');

    assert.ok(disintegrate.default_config, 'default_config must exist');
    assert.ok(disintegrate.default_config.sound, 'sound config must exist');
    assert.equal(typeof disintegrate.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.disintegrate, 'animation.effect.disintegrate must be registered');
    assert.equal(animation.effect.disintegrate, disintegrate);
});

test('disintegrate.dissolve.create builds sequence with sequence.motion(target).scaleTo(0).fadeTo(0) without copySprite or opacity(0)', async () => {
    const capturedMotionTargets = [];
    let opacitySetZero = false;
    let copySpriteCount = 0;
    let capturedScaleTo = null;
    let capturedFadeTo = null;

    const origSequence = globalThis.Sequence;

    class MockDisintegrateSequence {
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
                    if (prop === 'scaleTo') {
                        return (val) => {
                            capturedScaleTo = val;
                            return proxy;
                        };
                    }
                    if (prop === 'fadeTo') {
                        return (val) => {
                            capturedFadeTo = val;
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

    globalThis.Sequence = MockDisintegrateSequence;

    try {
        const mockTarget = {
            id: 'tok-target-1',
            name: 'Target Token',
            document: {
                width: 1,
                height: 1,
                rotation: 0,
                texture: { scaleX: 1, scaleY: 1 }
            },
            center: { x: 200, y: 200 }
        };

        const seq = disintegrate.dissolve.create(mockTarget);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTargets.length, 1, 'Motion target count should be 1');
        assert.equal(capturedMotionTargets[0], mockTarget, 'Motion target must be target token');
        assert.equal(capturedScaleTo, 0.01, 'scaleTo must be 0.01');
        assert.equal(capturedFadeTo, 0, 'fadeTo must be 0');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(copySpriteCount, 0, 'No copySprite should be present in disintegrate.dissolve.create');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('disintegrate.reform.create builds sequence with sequence.motion(target).scaleTo(1).fadeTo(1)', async () => {
    const capturedMotionTargets = [];
    let capturedScaleTo = null;
    let capturedFadeTo = null;

    const origSequence = globalThis.Sequence;

    class MockReformSequence {
        constructor() {
            const handler = {
                get(_t, prop) {
                    if (prop === 'motion') {
                        return (target) => {
                            capturedMotionTargets.push(target);
                            return proxy;
                        };
                    }
                    if (prop === 'scaleTo') {
                        return (val) => {
                            capturedScaleTo = val;
                            return proxy;
                        };
                    }
                    if (prop === 'fadeTo') {
                        return (val) => {
                            capturedFadeTo = val;
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

    globalThis.Sequence = MockReformSequence;

    try {
        const mockTarget = {
            id: 'tok-target-reform',
            name: 'Reform Target',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 200, y: 200 }
        };

        const seq = disintegrate.reform.create(mockTarget);
        assert.ok(seq, 'Reform sequence must be created');
        assert.equal(capturedMotionTargets.length, 1);
        assert.equal(capturedMotionTargets[0], mockTarget);
        assert.equal(capturedScaleTo, 1);
        assert.equal(capturedFadeTo, 1);
    } finally {
        globalThis.Sequence = origSequence;
    }
});
