import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { armsOfHadar } from '../../src/animation/effects/template/arms-of-hadar.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('armsOfHadar effect API contracts and exports', () => {
    assert.ok(armsOfHadar, 'armsOfHadar module must exist');
    assert.equal(typeof armsOfHadar.create, 'function', 'armsOfHadar.create must be a function');
    assert.equal(typeof armsOfHadar.play, 'function', 'armsOfHadar.play must be a function');
    assert.equal(typeof armsOfHadar.stop, 'function', 'armsOfHadar.stop must be a function');

    assert.ok(armsOfHadar.default_config, 'default_config must exist');
    assert.ok(armsOfHadar.default_config.sound, 'sound config must exist');
    assert.equal(typeof armsOfHadar.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.armsOfHadar, 'animation.effect.armsOfHadar must be registered');
    assert.equal(animation.effect.armsOfHadar, armsOfHadar);
});

test('armsOfHadar.create builds sequence with sequence.motion(target).moveBy() without copySprite or opacity(0) hiding', async () => {
    let capturedMotionTargets = [];
    let moveByCount = 0;
    let opacitySetZero = false;
    let copySpriteCalled = false;

    const origSequence = globalThis.Sequence;

    class MockArmsSequence {
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
                            capturedMotionTargets.push(target);
                            return proxy;
                        };
                    }
                    if (prop === 'moveBy') {
                        return () => {
                            moveByCount++;
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

    globalThis.Sequence = MockArmsSequence;

    try {
        const mockToken = {
            id: 'tok-caster-1',
            name: 'Caster Token',
            document: { id: 'tok-caster-1', width: 1, height: 1, rotation: 0, x: 100, y: 100 },
            center: { x: 150, y: 150 },
            x: 100,
            y: 100,
        };
        const mockTarget1 = {
            id: 'tok-target-1',
            name: 'Target Token 1',
            document: { id: 'tok-target-1', width: 1, height: 1, rotation: 0, x: 300, y: 300 },
            center: { x: 350, y: 350 },
            x: 300,
            y: 300,
        };
        const mockTarget2 = {
            id: 'tok-target-2',
            name: 'Target Token 2',
            document: { id: 'tok-target-2', width: 1, height: 1, rotation: 0, x: 100, y: 300 },
            center: { x: 150, y: 350 },
            x: 100,
            y: 300,
        };

        const seq = await armsOfHadar.create(mockToken, { targets: [mockTarget1, mockTarget2] });
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTargets.length, 2, 'Motion must be called for both target tokens');
        assert.ok(capturedMotionTargets.includes(mockTarget1), 'mockTarget1 must be in motion targets');
        assert.ok(capturedMotionTargets.includes(mockTarget2), 'mockTarget2 must be in motion targets');
        assert.equal(moveByCount, 4, 'moveBy must be called 4 times total (2 times per target: pull and return)');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(copySpriteCalled, false, 'copySprite must NOT be called');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
