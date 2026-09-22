import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { banishingArrow } from '../../src/animation/effects/arcane-shot/banishing-arrow.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('banishingArrow effect API contracts and exports', () => {
    assert.ok(banishingArrow, 'banishingArrow module must exist');
    assert.equal(typeof banishingArrow.create, 'function', 'banishingArrow.create must be a function');
    assert.equal(typeof banishingArrow.play, 'function', 'banishingArrow.play must be a function');
    assert.equal(typeof banishingArrow.stop, 'function', 'banishingArrow.stop must be a function');

    assert.ok(banishingArrow.default_config, 'default_config must exist');
    assert.ok(banishingArrow.default_config.sound, 'sound config must exist');
    assert.equal(typeof banishingArrow.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.arcaneShot.banishingArrow, 'animation.effect.arcaneShot.banishingArrow must be registered');
    assert.equal(animation.effect.arcaneShot.banishingArrow, banishingArrow);
});

test('banishingArrow.create builds sequence with sequence.motion(target).scaleTo(0).rotateBy(360) without copySprite or animation().on(target).hide()', async () => {
    let capturedMotionTarget = null;
    let capturedScaleToValue = null;
    let capturedRotateByValue = null;
    let hideCalled = false;
    let copySpriteCount = 0;

    const origSequence = globalThis.Sequence;

    class MockBanishingArrowSequence {
        constructor() {
            let currentSection = null;
            const handler = {
                get(_t, prop) {
                    if (prop === 'animation') {
                        currentSection = 'animation';
                        return () => proxy;
                    }
                    if (prop === 'hide') {
                        hideCalled = true;
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

    globalThis.Sequence = MockBanishingArrowSequence;

    try {
        const mockToken = {
            id: 'tok-caster-1',
            name: 'Caster Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 }
        };

        const mockTarget = {
            id: 'tok-target-1',
            name: 'Target Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 200, y: 200 }
        };

        const seq = await banishingArrow.create(mockToken, mockTarget);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockTarget, 'Motion target must be the target token');
        assert.equal(capturedScaleToValue, 0.01, 'scaleTo target scale must be 0.01');
        assert.equal(capturedRotateByValue, 360, 'rotateBy target amount must be 360');
        assert.equal(hideCalled, false, 'Token hide must NOT be called');
        assert.equal(copySpriteCount, 0, 'No copySprite should be present in banishingArrow.create');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('banishingArrow.stop builds sequence with sequence.motion(target).scaleTo(1)', async () => {
    let capturedMotionTarget = null;
    let capturedScaleToValue = null;

    const origSequence = globalThis.Sequence;

    class MockStopSequence {
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

    globalThis.Sequence = MockStopSequence;

    try {
        const mockToken = { id: 'tok-caster-2', name: 'Caster Token 2' };
        const mockTarget = { id: 'tok-target-2', name: 'Target Token 2' };

        await banishingArrow.stop(mockToken, mockTarget);
        assert.equal(capturedMotionTarget, mockTarget, 'Motion target must be the target token in stop');
        assert.equal(capturedScaleToValue, 1, 'scaleTo target scale must be restored to 1 in stop');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
