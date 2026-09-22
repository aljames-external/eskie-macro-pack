import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { stormingDashStrikes } from '../../src/animation/effects/token/storming-dash-strikes.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('stormingDashStrikes effect API contracts and exports', () => {
    assert.ok(stormingDashStrikes, 'stormingDashStrikes module must exist');
    assert.equal(typeof stormingDashStrikes.create, 'function', 'stormingDashStrikes.create must be a function');
    assert.equal(typeof stormingDashStrikes.play, 'function', 'stormingDashStrikes.play must be a function');
    assert.equal(typeof stormingDashStrikes.stop, 'function', 'stormingDashStrikes.stop must be a function');

    assert.ok(stormingDashStrikes.default_config, 'default_config must exist');
    assert.equal(stormingDashStrikes.default_config.id, 'stormingDashStrikes');
    assert.ok(stormingDashStrikes.default_config.sound, 'sound config must exist');
    assert.equal(typeof stormingDashStrikes.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.stormingDashStrikes, 'animation.effect.stormingDashStrikes must be registered');
    assert.equal(animation.effect.stormingDashStrikes, stormingDashStrikes);
});

test('stormingDashStrikes.create builds sequence with .motion() animation without copySprite movement or token hiding', async () => {
    let capturedMotionTarget = null;
    let capturedMotionDestination = null;
    let opacitySetZero = false;
    let teleportToCalled = false;
    let copySpriteCount = 0;

    const origSequence = globalThis.Sequence;

    class MockStormingDashSequence {
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
                            capturedMotionDestination = dest;
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

    globalThis.Sequence = MockStormingDashSequence;

    try {
        const mockToken = {
            id: 'tok-dash-1',
            name: 'Hero Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 }
        };
        const dashPositions = [{ x: 300, y: 300 }, { x: 500, y: 200 }];

        const seq = await stormingDashStrikes.create(mockToken, { positions: dashPositions });
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockToken, 'Motion target must be the token');
        assert.ok(capturedMotionDestination, 'Motion destination must be passed');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(teleportToCalled, false, 'teleportTo must NOT be called');
        assert.equal(copySpriteCount, 0, 'No copySprite should be present in create() movement');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
