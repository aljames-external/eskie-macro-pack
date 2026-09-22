import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

import { adapter } from '../../src/adapters/index.js';
import { matt } from '../../src/animation/utils/matt-tiles.js';
import { grapple } from '../../src/animation/effects/on-target/grapple.js';
import { animation } from '../../src/animation/index.js';

test('grapple effect API contracts and exports', () => {
    assert.ok(grapple, 'grapple module must exist');
    assert.equal(typeof grapple.create, 'function', 'grapple.create must be a function');
    assert.equal(typeof grapple.play, 'function', 'grapple.play must be a function');
    assert.equal(typeof grapple.stop, 'function', 'grapple.stop must be a function');
    assert.equal(typeof grapple.macro.movement, 'function', 'grapple.macro.movement must be a function');

    assert.ok(grapple.default_config, 'default_config must exist');
    assert.equal(grapple.default_config.id, 'Grapple Latch');
    assert.equal(grapple.default_config.follow, true);
    assert.ok(grapple.default_config.sound, 'sound config must exist');
    assert.equal(typeof grapple.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.grapple, 'animation.effect.grapple must be registered');
    assert.equal(animation.effect.grapple, grapple);
});

test('grapple.macro.movement builds sequence with sequence.motion(target).moveTo()', async () => {
    let capturedMotionTarget = null;
    let capturedMoveToPos = null;
    let capturedDuration = null;

    const origSequence = globalThis.Sequence;

    class MockGrappleSequence {
        constructor() {
            const handler = {
                get(_t, prop) {
                    if (prop === 'motion') {
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
                    if (prop === 'duration') {
                        return (dur) => {
                            capturedDuration = dur;
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

    globalThis.Sequence = MockGrappleSequence;

    const { matt } = await import('../../src/animation/utils/matt-tiles.js');
    const origFromUuid = adapter.fromUuid;
    const origMattConfigure = matt.movement.configure;

    try {
        const mockTargetToken = {
            id: 'tok-target-1',
            name: 'Target Token',
            x: 300,
            y: 300
        };
        const mockToken = {
            id: 'tok-source-1',
            name: 'Grappler Token'
        };

        adapter.fromUuid = async (uuid) => {
            if (uuid === 'target-uuid-1') {
                return { object: mockTargetToken };
            }
            return null;
        };

        matt.movement.configure = async (_tok, _tile, _cfg) => {
            return {
                rotation: 0,
                travelTime: 800,
                label: 'Grapple Latch - tok-source-1',
                delta: { x: 50, y: 30 }
            };
        };

        await grapple.macro.movement(mockToken, 'target-uuid-1', {});

        assert.equal(capturedMotionTarget, mockTargetToken, 'Motion target must be the target token');
        assert.ok(capturedMoveToPos, 'moveTo destination must be set');
        assert.equal(capturedMoveToPos.x, 250, 'target.x (300) - dx (50) should be 250');
        assert.equal(capturedMoveToPos.y, 270, 'target.y (300) - dy (30) should be 270');
        assert.equal(capturedDuration, 800, 'duration should match travelTime');
    } finally {
        globalThis.Sequence = origSequence;
        adapter.fromUuid = origFromUuid;
        matt.movement.configure = origMattConfigure;
    }
});
