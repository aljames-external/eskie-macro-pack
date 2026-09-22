import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { tripAttack } from '../../src/animation/effects/battlemaster/trip-attack.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('tripAttack effect API contracts and exports', () => {
    assert.ok(tripAttack, 'tripAttack module must exist');
    assert.equal(typeof tripAttack.create, 'function', 'tripAttack.create must be a function');
    assert.equal(typeof tripAttack.play, 'function', 'tripAttack.play must be a function');
    assert.equal(typeof tripAttack.stop, 'function', 'tripAttack.stop must be a function');

    assert.ok(tripAttack.default_config, 'default_config must exist');
    assert.equal(tripAttack.default_config.id, 'tripAttack');
    assert.ok(tripAttack.default_config.sound, 'sound config must exist');
    assert.equal(typeof tripAttack.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.battlemaster.tripAttack, 'animation.effect.battlemaster.tripAttack must be registered');
    assert.equal(animation.effect.battlemaster.tripAttack, tripAttack);
});

test('tripAttack.create builds sequence with sequence.motion(target).rotateTo(90) without hiding token', async () => {
    let capturedMotionTarget = null;
    let capturedRotateToAngle = null;
    let opacitySetZero = false;

    const origSequence = globalThis.Sequence;

    class MockTripAttackSequence {
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
                    if (prop === 'rotateTo') {
                        return (angle) => {
                            capturedRotateToAngle = angle;
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
                    if (prop === 'play') return async () => proxy;
                    if (prop === 'then') return undefined;
                    return (..._args) => proxy;
                }
            };
            const proxy = new Proxy(this, handler);
            return proxy;
        }
    }

    globalThis.Sequence = MockTripAttackSequence;

    try {
        const mockToken = {
            id: 'tok-attacker-1',
            name: 'Hero Attacker',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 },
            x: 100,
            y: 100
        };
        const mockTarget = {
            id: 'tok-target-1',
            name: 'Enemy Target',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 200, y: 100 },
            x: 200,
            y: 100
        };

        const seq = await tripAttack.create(mockToken, mockTarget);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockTarget, 'Motion target must be the target token');
        assert.equal(capturedRotateToAngle, 90, 'rotateTo angle must be 90');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
