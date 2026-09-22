import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { banishment } from '../../src/animation/effects/active-effect/banishment.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });
game.modules.set('psfx', { id: 'psfx', active: true, version: '1.0.0' });
game.modules.set('psfx-patreon', { id: 'psfx-patreon', active: true, version: '1.0.0' });


test('banishment effect API contracts and exports', () => {
    assert.ok(banishment, 'banishment module must exist');
    assert.ok(banishment.banish, 'banishment.banish sub-module must exist');
    assert.ok(banishment.return, 'banishment.return sub-module must exist');

    assert.equal(typeof banishment.banish.create, 'function', 'banishment.banish.create must be a function');
    assert.equal(typeof banishment.banish.play, 'function', 'banishment.banish.play must be a function');
    assert.equal(typeof banishment.banish.stop, 'function', 'banishment.banish.stop must be a function');

    assert.equal(typeof banishment.return.create, 'function', 'banishment.return.create must be a function');
    assert.equal(typeof banishment.return.play, 'function', 'banishment.return.play must be a function');

    assert.ok(banishment.default_config, 'default_config must exist');
    assert.ok(banishment.default_config.sound.intro, 'intro sound config must exist');
    assert.ok(banishment.default_config.sound.return, 'return sound config must exist');

    assert.ok(animation.effect.banishment, 'animation.effect.banishment must be registered');
    assert.equal(animation.effect.banishment, banishment);
});

test('banishment.banish.create builds sequence with sequence.motion(target).scaleTo(0).rotateBy(360) without copySprite or opacity(0)', async () => {
    let capturedMotionTarget = null;
    let capturedScaleToValue = null;
    let capturedRotateByValue = null;
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
                            capturedMotionTarget = tok;
                            return proxy;
                        };
                    }
                    if (prop === 'scaleTo') {
                        return (val) => {
                            capturedScaleToValue = val;
                            return proxy;
                        };
                    }
                    if (prop === 'rotateBy') {
                        return (val) => {
                            capturedRotateByValue = val;
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
        const mockTarget = {
            id: 'tok-banish-1',
            name: 'Fiend Target',
            actor: { type: 'fiend', system: {} },
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 }
        };

        const seq = await banishment.banish.create(mockTarget);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockTarget, 'Motion target must be the target token');
        assert.equal(capturedScaleToValue, 0.01, 'scaleTo target scale must be 0.01');
        assert.equal(capturedRotateByValue, 360, 'rotateBy target amount must be 360');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(copySpriteCount, 0, 'No copySprite should be present');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('banishment.return.create builds sequence with sequence.motion(target).scaleTo(1)', async () => {
    let capturedMotionTarget = null;
    let capturedScaleToValue = null;

    const origSequence = globalThis.Sequence;

    class MockSequence {
        constructor() {
            const handler = {
                get(_t, prop) {
                    if (prop === 'motion') {
                        return (tok) => {
                            capturedMotionTarget = tok;
                            return proxy;
                        };
                    }
                    if (prop === 'scaleTo') {
                        return (val) => {
                            capturedScaleToValue = val;
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
        const mockTarget = {
            id: 'tok-return-1',
            name: 'Fiend Target',
            actor: { type: 'fiend', system: {} },
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 }
        };

        const seq = await banishment.return.create(mockTarget);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockTarget, 'Motion target must be the target token');
        assert.equal(capturedScaleToValue, 1, 'scaleTo target scale must be restored to 1');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
