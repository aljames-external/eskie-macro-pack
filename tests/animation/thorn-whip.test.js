import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { thornWhip } from '../../src/animation/effects/target/thorn-whip.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('thornWhip effect API contracts and exports', () => {
    assert.ok(thornWhip, 'thornWhip module must exist');
    assert.equal(typeof thornWhip.create, 'function', 'thornWhip.create must be a function');
    assert.equal(typeof thornWhip.play, 'function', 'thornWhip.play must be a function');
    assert.equal(typeof thornWhip.stop, 'function', 'thornWhip.stop must be a function');

    assert.ok(thornWhip.default_config, 'default_config must exist');
    assert.ok(thornWhip.default_config.sound, 'sound config must exist');
    assert.equal(typeof thornWhip.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.thornWhip, 'animation.effect.thornWhip must be registered');
    assert.equal(animation.effect.thornWhip, thornWhip);
});

test('thornWhip.create builds sequence with sequence.motion(target).moveTo() without copySprite or opacity(0)', async () => {
    let capturedMotionTarget = null;
    let capturedMoveToPosition = null;
    let opacitySetZero = false;
    let copySpriteCalled = false;

    const origSequence = globalThis.Sequence;

    class MockThornSequence {
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
                            if (val === 0) {
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

    globalThis.Sequence = MockThornSequence;

    try {
        const mockToken = {
            id: 'tok-caster-1',
            name: 'Caster',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 500, y: 100 }
        };
        const mockTarget = {
            id: 'tok-target-1',
            name: 'Target',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 }
        };

        const seq = await thornWhip.create(mockToken, mockTarget);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockTarget, 'Motion target must be the target token');
        assert.ok(capturedMoveToPosition, 'moveTo position must be set');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(copySpriteCalled, false, 'copySprite must NOT be called');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('thornWhip.create skips motion when pull is false or target width > 2', async () => {
    let motionCalled = false;
    const origSequence = globalThis.Sequence;

    class MockSequence {
        constructor() {
            const handler = {
                get(_t, prop) {
                    if (prop === 'motion') {
                        motionCalled = true;
                        return () => proxy;
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
            id: 'tok-caster-1',
            name: 'Caster',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 500, y: 100 }
        };
        const mockTarget = {
            id: 'tok-target-1',
            name: 'Target',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 }
        };

        await thornWhip.create(mockToken, mockTarget, { pull: false });
        assert.equal(motionCalled, false, 'Motion must be skipped when pull: false');

        const mockLargeTarget = {
            id: 'tok-target-large',
            name: 'Huge Target',
            document: { width: 3, height: 3, rotation: 0 },
            center: { x: 100, y: 100 }
        };
        await thornWhip.create(mockToken, mockLargeTarget);
        assert.equal(motionCalled, false, 'Motion must be skipped when target width > 2');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
