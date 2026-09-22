import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { enlargeReduce } from '../../src/animation/effects/active-effect/enlarge-reduce.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('enlargeReduce effect API contracts and exports', () => {
    assert.ok(enlargeReduce, 'enlargeReduce module must exist');
    assert.ok(enlargeReduce.enlarge, 'enlargeReduce.enlarge sub-module must exist');
    assert.ok(enlargeReduce.reduce, 'enlargeReduce.reduce sub-module must exist');

    assert.equal(typeof enlargeReduce.enlarge.create, 'function', 'enlargeReduce.enlarge.create must be a function');
    assert.equal(typeof enlargeReduce.enlarge.play, 'function', 'enlargeReduce.enlarge.play must be a function');
    assert.equal(typeof enlargeReduce.enlarge.stop, 'function', 'enlargeReduce.enlarge.stop must be a function');

    assert.equal(typeof enlargeReduce.reduce.create, 'function', 'enlargeReduce.reduce.create must be a function');
    assert.equal(typeof enlargeReduce.reduce.play, 'function', 'enlargeReduce.reduce.play must be a function');
    assert.equal(typeof enlargeReduce.reduce.stop, 'function', 'enlargeReduce.reduce.stop must be a function');

    assert.ok(enlargeReduce.default_config, 'default_config must exist');
    assert.ok(enlargeReduce.default_config.sound.enlarge, 'enlarge sound config must exist');
    assert.ok(enlargeReduce.default_config.sound.reduce, 'reduce sound config must exist');

    assert.ok(animation.effect.enlargeReduce, 'animation.effect.enlargeReduce must be registered');
    assert.equal(animation.effect.enlargeReduce, enlargeReduce);
});

test('enlargeReduce.enlarge.create builds sequence with sequence.motion(token).scaleTo() without copySprite or opacity(0)', async () => {
    let capturedMotionToken = null;
    let capturedScaleToValue = null;
    let opacitySetZero = false;
    let copySpriteCount = 0;

    const origSequence = globalThis.Sequence;

    class MockSequence {
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
                        return (tok) => {
                            currentSection = 'motion';
                            capturedMotionToken = tok;
                            return proxy;
                        };
                    }
                    if (prop === 'scaleTo') {
                        return (val) => {
                            capturedScaleToValue = val;
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

    globalThis.Sequence = MockSequence;

    try {
        const mockToken = {
            id: 'tok-enlarge-1',
            name: 'Giant Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 }
        };

        const seq = await enlargeReduce.enlarge.create(mockToken);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionToken, mockToken, 'Motion target must be the token');
        assert.equal(capturedScaleToValue, 2, 'scaleTo target scale must be 2 (from 1 to 2)');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(copySpriteCount, 0, 'No copySprite should be present');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('enlargeReduce.reduce.create builds sequence with sequence.motion(token).scaleTo() without copySprite or opacity(0)', async () => {
    let capturedMotionToken = null;
    let capturedScaleToValue = null;
    let opacitySetZero = false;
    let copySpriteCount = 0;

    const origSequence = globalThis.Sequence;

    class MockSequence {
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
                        return (tok) => {
                            currentSection = 'motion';
                            capturedMotionToken = tok;
                            return proxy;
                        };
                    }
                    if (prop === 'scaleTo') {
                        return (val) => {
                            capturedScaleToValue = val;
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

    globalThis.Sequence = MockSequence;

    try {
        const mockToken = {
            id: 'tok-reduce-1',
            name: 'Tiny Token',
            document: { width: 2, height: 2, rotation: 0 },
            center: { x: 100, y: 100 }
        };

        const seq = await enlargeReduce.reduce.create(mockToken);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionToken, mockToken, 'Motion target must be the token');
        assert.equal(capturedScaleToValue, 0.5, 'scaleTo target scale must be 0.5 (from 2 to 1)');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(copySpriteCount, 0, 'No copySprite should be present');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
