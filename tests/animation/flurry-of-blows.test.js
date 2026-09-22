import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { flurryOfBlows } from '../../src/animation/effects/on-target/flurry-of-blows.js';
import { animation } from '../../src/animation/index.js';
import { adapter } from '../../src/adapters/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });
game.modules.set('psfx', { id: 'psfx', active: true, version: '1.0.0' });

await adapter.init();

test('flurryOfBlows effect API contracts and exports', () => {
    assert.ok(flurryOfBlows, 'flurryOfBlows module must exist');
    assert.equal(typeof flurryOfBlows.create, 'function', 'flurryOfBlows.create must be a function');
    assert.equal(typeof flurryOfBlows.play, 'function', 'flurryOfBlows.play must be a function');

    assert.ok(flurryOfBlows.default_config, 'default_config must exist');
    assert.equal(flurryOfBlows.default_config.id, 'Flurry Of Blows');
    assert.ok(flurryOfBlows.default_config.sound, 'sound config must exist');
    assert.equal(typeof flurryOfBlows.default_config.sound.punch1.enable, 'boolean', 'sound.punch1.enable must be boolean');
    assert.equal(typeof flurryOfBlows.default_config.sound.punch2.enable, 'boolean', 'sound.punch2.enable must be boolean');

    assert.ok(animation.effect.flurryOfBlows, 'animation.effect.flurryOfBlows must be registered');
    assert.equal(animation.effect.flurryOfBlows, flurryOfBlows);
});

test('flurryOfBlows.create builds sequence with sequence.motion(token).moveBy() without copySprite or opacity(0)', async () => {
    let capturedMotionTarget = null;
    let moveByCalled = false;
    let copySpriteCalled = false;
    let opacitySetZero = false;

    const origSequence = globalThis.Sequence;

    class MockFlurrySequence {
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
                    if (prop === 'copySprite') {
                        copySpriteCalled = true;
                        return () => proxy;
                    }
                    if (prop === 'motion') {
                        currentSection = 'motion';
                        return (target) => {
                            capturedMotionTarget = target;
                            return proxy;
                        };
                    }
                    if (prop === 'moveBy') {
                        moveByCalled = true;
                        return () => proxy;
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

    globalThis.Sequence = MockFlurrySequence;

    try {
        const mockToken = {
            id: 'tok-monk-1',
            name: 'Monk Token',
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

        const seq = await flurryOfBlows.create(mockToken, mockTarget);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockToken, 'Motion target must be the monk token');
        assert.equal(moveByCalled, true, 'moveBy must be called on motion(token)');
        assert.equal(copySpriteCalled, false, 'copySprite must NOT be called');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('flurryOfBlows.play executes sequence.play', async () => {
    let playCalled = false;

    const origSequence = globalThis.Sequence;
    globalThis.Sequence = class MockPlaySequence {
        constructor() {
            const handler = {
                get(_t, prop) {
                    if (prop === 'play') {
                        return async () => {
                            playCalled = true;
                            return true;
                        };
                    }
                    if (prop === 'then') return undefined;
                    return (..._args) => proxy;
                }
            };
            const proxy = new Proxy(this, handler);
            return proxy;
        }
    };

    try {
        const mockToken = {
            id: 'tok-monk-1',
            name: 'Monk Token',
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

        await flurryOfBlows.play(mockToken, mockTarget);
        assert.equal(playCalled, true, 'flurryOfBlows.play must execute sequence.play');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
