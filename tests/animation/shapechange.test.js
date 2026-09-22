import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { shapechange } from '../../src/animation/effects/active-effect/shapechange.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('shapechange effect API contracts and exports', () => {
    assert.ok(shapechange, 'shapechange module must exist');
    assert.ok(shapechange.shapechange, 'shapechange.shapechange must exist');
    assert.ok(shapechange.revert, 'shapechange.revert must exist');
    assert.equal(typeof shapechange.shapechange.create, 'function', 'shapechange.shapechange.create must be a function');
    assert.equal(typeof shapechange.shapechange.play, 'function', 'shapechange.shapechange.play must be a function');
    assert.equal(typeof shapechange.shapechange.stop, 'function', 'shapechange.shapechange.stop must be a function');

    assert.ok(shapechange.default_config, 'default_config must exist');
    assert.equal(shapechange.default_config.id, 'shapechange');
    assert.ok(shapechange.default_config.sound, 'sound config must exist');
    assert.equal(typeof shapechange.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');
});

test('shapechange.create builds sequence with sequence.motion(token).scaleTo(1.25).noise() without copySprite', async () => {
    let capturedMotionTarget = null;
    let capturedScaleToValue = null;
    let noiseCalled = false;
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
                        currentSection = 'motion';
                        return (target) => {
                            capturedMotionTarget = target;
                            return proxy;
                        };
                    }
                    if (prop === 'scaleTo') {
                        return (val) => {
                            capturedScaleToValue = val;
                            return proxy;
                        };
                    }
                    if (prop === 'noise') {
                        return () => {
                            noiseCalled = true;
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
                    if (prop === 'thenDo') {
                        return (fn) => {
                            if (typeof fn === 'function') fn();
                            return proxy;
                        };
                    }
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
            id: 'tok-shapechange-1',
            name: 'Shapechange Target',
            document: {
                width: 1,
                height: 1,
                rotation: 0,
                texture: { src: 'base.png', scaleX: 1 },
                getFlag: () => null,
                setFlag: async () => {},
                update: async () => {}
            },
            center: { x: 100, y: 100 }
        };

        const seq = await shapechange.shapechange.create(mockToken);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockToken, 'Motion target must be the token');
        assert.equal(capturedScaleToValue, 1.25, 'scaleTo target scale must be 1.25');
        assert.equal(noiseCalled, true, 'noise() must be called on motion');
        assert.equal(copySpriteCount, 0, 'No copySprite should be present in shapechange.create');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
