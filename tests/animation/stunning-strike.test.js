import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { stunningStrike } from '../../src/animation/effects/target/stunning-strike.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('stunningStrike effect API contracts and exports', () => {
    assert.ok(stunningStrike, 'stunningStrike module must exist');
    assert.equal(typeof stunningStrike.create, 'function', 'stunningStrike.create must be a function');
    assert.equal(typeof stunningStrike.play, 'function', 'stunningStrike.play must be a function');
    assert.equal(typeof stunningStrike.stop, 'function', 'stunningStrike.stop must be a function');

    assert.ok(stunningStrike.default_config, 'default_config must exist');
    assert.equal(stunningStrike.default_config.id, 'stunningStrike');
    assert.ok(stunningStrike.default_config.sound, 'sound config must exist');
    assert.equal(typeof stunningStrike.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.stunningStrike, 'animation.effect.stunningStrike must be registered');
    assert.equal(animation.effect.stunningStrike, stunningStrike);
});

test('stunningStrike.create builds sequence with sequence.motion(token) and sequence.motion(target).oscillate() without copySprite or opacity(0)', async () => {
    const motionTargets = [];
    let oscillateCalled = false;
    let copySpriteCalled = false;
    let opacitySetZero = false;

    const origSequence = globalThis.Sequence;

    class MockStunningStrikeSequence {
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
                        return (motionTarget) => {
                            currentSection = 'motion';
                            motionTargets.push(motionTarget);
                            return proxy;
                        };
                    }
                    if (prop === 'oscillate') {
                        oscillateCalled = true;
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

    globalThis.Sequence = MockStunningStrikeSequence;

    try {
        const mockToken = {
            id: 'tok-monk-1',
            name: 'Monk Striker',
            document: { width: 1, height: 1, rotation: 0, texture: { scaleX: 1, scaleY: 1 } },
            center: { x: 100, y: 100 },
            x: 100,
            y: 100
        };
        const mockTarget = {
            id: 'tok-target-1',
            name: 'Enemy Target',
            document: { width: 1, height: 1, rotation: 0, texture: { scaleX: 1, scaleY: 1 }, uuid: 'Scene.1.Token.2' },
            center: { x: 200, y: 100 },
            x: 200,
            y: 100
        };

        const seq = await stunningStrike.create(mockToken, mockTarget);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(motionTargets.length, 2, 'Two motion calls expected (token strike and target wobble)');
        assert.equal(motionTargets[0], mockToken, 'First motion target must be monk token');
        assert.equal(motionTargets[1], mockTarget, 'Second motion target must be enemy target token');
        assert.equal(oscillateCalled, true, 'oscillate() must be called for target wobble');
        assert.equal(copySpriteCalled, false, 'copySprite must NOT be called');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
