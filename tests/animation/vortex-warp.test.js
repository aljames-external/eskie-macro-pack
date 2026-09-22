import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { vortexWarp } from '../../src/animation/effects/target/vortex-warp.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('vortexWarp effect API contracts and exports', () => {
    assert.ok(vortexWarp, 'vortexWarp module must exist');
    assert.equal(typeof vortexWarp.create, 'function', 'vortexWarp.create must be a function');
    assert.equal(typeof vortexWarp.play, 'function', 'vortexWarp.play must be a function');
    assert.equal(typeof vortexWarp.stop, 'function', 'vortexWarp.stop must be a function');

    assert.ok(vortexWarp.default_config, 'default_config must exist');
    assert.ok(vortexWarp.default_config.sound, 'sound config must exist');
    assert.equal(typeof vortexWarp.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.vortexWarp, 'animation.effect.vortexWarp must be registered');
    assert.equal(animation.effect.vortexWarp, vortexWarp);
});

test('vortexWarp.create builds sequence with sequence.motion(target).moveTo() without copySprite or opacity(0)', async () => {
    let capturedMotionTarget = null;
    let capturedMoveToPosition = null;
    let opacitySetZero = false;
    let copySpriteCalled = false;

    const origSequence = globalThis.Sequence;

    class MockVortexSequence {
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
                        return (motionTarget) => {
                            currentSection = 'motion';
                            capturedMotionTarget = motionTarget;
                            return proxy;
                        };
                    }
                    if (prop === 'moveTo') {
                        return (pos) => {
                            capturedMoveToPosition = pos;
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
                            copySpriteCalled = true;
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

    globalThis.Sequence = MockVortexSequence;

    try {
        const mockTarget = {
            id: 'tok-warp-1',
            name: 'Warped Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 }
        };
        const targetPos = { x: 400, y: 400 };

        const seq = await vortexWarp.create(mockTarget, { position: targetPos });
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockTarget, 'Motion target must be the target token');
        assert.deepEqual(capturedMoveToPosition, targetPos, 'moveTo position must match configured position');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(copySpriteCalled, false, 'copySprite must NOT be called');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
