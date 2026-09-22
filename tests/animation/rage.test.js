import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { rageV2 } from '../../src/animation/effects/active-effect/rage/rage_v2.js';
import { rage } from '../../src/animation/effects/active-effect/rage/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('rageV2 effect API contracts and exports', () => {
    assert.ok(rageV2, 'rageV2 module must exist');
    assert.equal(typeof rageV2.create, 'function', 'rageV2.create must be a function');
    assert.equal(typeof rageV2.play, 'function', 'rageV2.play must be a function');

    assert.ok(rageV2.default_config, 'default_config must exist');
    assert.equal(rageV2.default_config.id, 'RageV2');
    assert.ok(rageV2.default_config.sound, 'sound config must exist');
    assert.equal(typeof rageV2.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(rage.v4, 'rage.v4 must be registered');
    assert.equal(rage.v4, rageV2);
});

test('rageV2.create builds sequence with sequence.motion(token).scaleTo(1.05).noise() without copySprite', async () => {
    let capturedMotionTarget = null;
    let capturedScaleToValue = null;
    let noiseCalled = false;
    let copySpriteCount = 0;

    const origSequence = globalThis.Sequence;

    class MockSequence {
        constructor() {
            const handler = {
                get(_t, prop) {
                    if (prop === 'motion') {
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
            id: 'tok-rage-1',
            name: 'Rage Target',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 }
        };

        const seq = rageV2.create(mockToken);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockToken, 'Motion target must be the token');
        assert.equal(capturedScaleToValue, 1.05, 'scaleTo target scale must be 1.05');
        assert.equal(noiseCalled, true, 'noise() must be called on motion');
        assert.equal(copySpriteCount, 0, 'No copySprite should be present in rageV2.create');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
