import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { hookAndPull } from '../../src/animation/effects/token/hook-and-pull.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('hookAndPull effect API contracts and exports', () => {
    assert.ok(hookAndPull, 'hookAndPull module must exist');
    assert.equal(typeof hookAndPull.create, 'function', 'hookAndPull.create must be a function');
    assert.equal(typeof hookAndPull.play, 'function', 'hookAndPull.play must be a function');
    assert.equal(typeof hookAndPull.stop, 'function', 'hookAndPull.stop must be a function');

    assert.ok(hookAndPull.default_config, 'default_config must exist');
    assert.ok(hookAndPull.default_config.sound, 'sound config must exist');
    assert.equal(typeof hookAndPull.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.hookAndPull, 'animation.effect.hookAndPull must be registered');
    assert.equal(animation.effect.hookAndPull, hookAndPull);
});

test('hookAndPull.create builds sequence with sequence.motion(target).moveTo() when hit and without copySprite or opacity(0)', async () => {
    let capturedMotionTarget = null;
    let capturedMoveToPos = null;
    let opacitySetZero = false;
    let copySpriteCalled = false;
    let teleportToCalled = false;

    const origSequence = globalThis.Sequence;

    class MockHookSequence {
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
                        return (dest) => {
                            capturedMoveToPos = dest;
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
                    if (prop === 'teleportTo') {
                        return () => {
                            teleportToCalled = true;
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

    globalThis.Sequence = MockHookSequence;

    try {
        const mockToken = {
            id: 'tok-caster-1',
            name: 'Caster Token',
            document: { id: 'tok-caster-1', width: 1, height: 1, rotation: 0, x: 100, y: 100 },
            center: { x: 150, y: 150 },
            x: 100,
            y: 100,
        };
        const mockTarget = {
            id: 'tok-target-1',
            name: 'Target Token',
            document: { id: 'tok-target-1', width: 1, height: 1, rotation: 0, x: 300, y: 300 },
            center: { x: 350, y: 350 },
            x: 300,
            y: 300,
        };

        const seq = await hookAndPull.create(mockToken, mockTarget, { isHit: true });
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockTarget, 'Motion target must be the target token');
        assert.ok(capturedMoveToPos, 'moveTo destination position must be set');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(copySpriteCalled, false, 'copySprite must NOT be called');
        assert.equal(teleportToCalled, false, 'teleportTo must NOT be called');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
