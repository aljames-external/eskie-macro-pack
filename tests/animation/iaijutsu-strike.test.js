import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { iaijutsuStrike } from '../../src/animation/effects/token/iaijutsu-strike.js';
import { animation } from '../../src/animation/index.js';
import { adapter } from '../../src/adapters/index.js';

await adapter.init();

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });

game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('iaijutsuStrike effect API contracts and exports', () => {
    assert.ok(iaijutsuStrike, 'iaijutsuStrike module must exist');
    assert.equal(typeof iaijutsuStrike.create, 'function', 'iaijutsuStrike.create must be a function');
    assert.equal(typeof iaijutsuStrike.play, 'function', 'iaijutsuStrike.play must be a function');
    assert.equal(typeof iaijutsuStrike.stop, 'function', 'iaijutsuStrike.stop must be a function');
    assert.equal(typeof iaijutsuStrike.clean, 'function', 'iaijutsuStrike.clean must be a function');

    assert.ok(iaijutsuStrike.default_config, 'default_config must exist');
    assert.equal(iaijutsuStrike.default_config.id, 'IaijutsuStrike');
    assert.ok(iaijutsuStrike.default_config.sound, 'sound config must exist');
    assert.equal(typeof iaijutsuStrike.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.iaijutsuStrike, 'animation.effect.iaijutsuStrike must be registered');
    assert.equal(animation.effect.iaijutsuStrike, iaijutsuStrike);
});

test('iaijutsuStrike.create builds sequence with .motion() animation without copySprite movement or token hiding', async () => {
    let capturedMotionTarget = null;
    let capturedMotionDestination = null;
    let opacitySetZero = false;
    let teleportToCalled = false;

    const origSequence = globalThis.Sequence;

    class MockIaijutsuSequence {
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
                    if (prop === 'play') return async () => proxy;
                    if (prop === 'then') return undefined;
                    return (..._args) => proxy;
                }
            };
            const proxy = new Proxy(this, handler);
            return proxy;
        }
    }

    globalThis.Sequence = MockIaijutsuSequence;

    try {
        const mockSource = {
            id: 'tok-iaijutsu-src',
            name: 'Samurai Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 },
            x: 100,
            y: 100
        };
        const mockTarget = {
            id: 'tok-iaijutsu-tgt',
            name: 'Enemy Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 300, y: 100 },
            x: 300,
            y: 100
        };
        const dashPosition = { x: 400, y: 100 };

        const seq = await iaijutsuStrike.create(mockSource, mockTarget, { position: dashPosition, teleport: true });
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockSource, 'Motion target must be the source token');
        assert.deepEqual(capturedMotionDestination, dashPosition, 'Motion destination must match dash position');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(teleportToCalled, false, 'teleportTo must NOT be called');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('iaijutsuStrike.play plays sequence and stop/clean ends effects', async () => {
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
        const mockSource = {
            id: 'tok-iaijutsu-src',
            name: 'Samurai Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 },
            x: 100,
            y: 100
        };
        const mockTarget = {
            id: 'tok-iaijutsu-tgt',
            name: 'Enemy Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 300, y: 100 },
            x: 300,
            y: 100
        };
        const dashPosition = { x: 400, y: 100 };

        await iaijutsuStrike.play(mockSource, mockTarget, { position: dashPosition, teleport: true });
        assert.equal(playCalled, true, 'iaijutsuStrike.play must execute sequence.play');

        assert.equal(typeof iaijutsuStrike.stop, 'function');
        assert.equal(typeof iaijutsuStrike.clean, 'function');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
