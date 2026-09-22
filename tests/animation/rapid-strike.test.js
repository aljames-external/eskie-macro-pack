import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { rapidStrike } from '../../src/animation/effects/on-target/rapid-strike.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });
game.modules.set('psfx', { id: 'psfx', active: true, version: '1.0.0' });

test('rapidStrike effect API contracts and exports', () => {
    assert.ok(rapidStrike, 'rapidStrike module must exist');
    assert.equal(typeof rapidStrike.create, 'function', 'rapidStrike.create must be a function');
    assert.equal(typeof rapidStrike.play, 'function', 'rapidStrike.play must be a function');
    assert.equal(typeof rapidStrike.stop, 'function', 'rapidStrike.stop must be a function');

    assert.ok(rapidStrike.default_config, 'default_config must exist');
    assert.equal(rapidStrike.default_config.id, 'Rapid Strike');
    assert.ok(rapidStrike.default_config.sound, 'sound config must exist');
    assert.equal(typeof rapidStrike.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.rapidStrike, 'animation.effect.rapidStrike must be registered');
    assert.equal(animation.effect.rapidStrike, rapidStrike);
});

test('rapidStrike.create builds sequence with sequence.motion(token).moveBy() without copySprite or opacity(0) hiding', async () => {
    let capturedMotionTarget = null;
    let moveByCalled = false;
    let copySpriteCalled = false;
    let opacitySetZero = false;

    const origSequence = globalThis.Sequence;

    class MockRapidStrikeSequence {
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
                    if (prop === 'moveBy') {
                        moveByCalled = true;
                        return () => proxy;
                    }
                    if (prop === 'copySprite') {
                        copySpriteCalled = true;
                        return () => proxy;
                    }
                    if (prop === 'opacity') {
                        return (val) => {
                            if (val === 0) {
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

    globalThis.Sequence = MockRapidStrikeSequence;

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

        const seq = await rapidStrike.create(mockToken, mockTarget, { attacks: 1 });
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockToken, 'Motion target must be the attacking token');
        assert.equal(moveByCalled, true, 'moveBy must be called for motion step');
        assert.equal(copySpriteCalled, false, 'copySprite must NOT be called');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
