import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { teleportIn } from '../../src/animation/effects/template/teleport/teleportIn.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('teleportIn effect API contracts and exports', () => {
    assert.ok(teleportIn, 'teleportIn module must exist');
    assert.equal(typeof teleportIn.create, 'function', 'teleportIn.create must be a function');
    assert.equal(typeof teleportIn.play, 'function', 'teleportIn.play must be a function');
    assert.equal(typeof teleportIn.stop, 'function', 'teleportIn.stop must be a function');

    assert.ok(teleportIn.default_config, 'default_config must exist');
    assert.equal(teleportIn.default_config.id, 'TeleportIn');
    assert.ok(teleportIn.default_config.sound, 'sound config must exist');
    assert.ok(teleportIn.default_config.sound.teleportIn, 'sound.teleportIn config must exist');
    assert.equal(typeof teleportIn.default_config.sound.teleportIn.enable, 'boolean', 'sound.teleportIn.enable must be boolean');
});

test('teleportIn.create builds sequence with sequence.motion(token).moveTo() and sequence.motion(target).moveTo() without copySprite or opacity(0)', async () => {
    const capturedMotionTargets = [];
    const capturedMoveToPositions = [];
    let opacitySetZero = false;
    let copySpriteCalled = false;
    let teleportToCalled = false;

    const origSequence = globalThis.Sequence;

    class MockTeleportInSequence {
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
                            capturedMotionTargets.push(motionTarget);
                            return proxy;
                        };
                    }
                    if (prop === 'moveTo') {
                        return (pos) => {
                            capturedMoveToPositions.push(pos);
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
                    if (prop === 'teleportTo') {
                        return () => {
                            teleportToCalled = true;
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

    globalThis.Sequence = MockTeleportInSequence;

    try {
        const mockToken = {
            id: 'tok-in-1',
            name: 'Caster Token',
            x: 100,
            y: 100,
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 }
        };
        const mockTarget = {
            id: 'tok-in-2',
            name: 'Target Token',
            x: 200,
            y: 200,
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 200, y: 200 }
        };
        const targetPos = { x: 500, y: 500 };

        const seq = await teleportIn.create(mockToken, [mockTarget], { position: targetPos });
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTargets.length, 2, 'Must captured 2 motion targets (token and target)');
        assert.equal(capturedMotionTargets[0], mockToken, 'First motion target must be caster token');
        assert.equal(capturedMotionTargets[1], mockTarget, 'Second motion target must be party target token');
        assert.deepEqual(capturedMoveToPositions[0], targetPos, 'First moveTo position must match configured position');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(copySpriteCalled, false, 'copySprite must NOT be called');
        assert.equal(teleportToCalled, false, 'teleportTo must NOT be called');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
