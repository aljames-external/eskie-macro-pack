import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { curseOfTheWerewolf } from '../../src/animation/effects/token/curse-of-the-werewolf.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('curseOfTheWerewolf effect API contracts and exports', () => {
    assert.ok(curseOfTheWerewolf, 'curseOfTheWerewolf module must exist');
    assert.equal(typeof curseOfTheWerewolf.create, 'function', 'curseOfTheWerewolf.create must be a function');
    assert.equal(typeof curseOfTheWerewolf.play, 'function', 'curseOfTheWerewolf.play must be a function');

    assert.ok(curseOfTheWerewolf.default_config, 'default_config must exist');
    assert.equal(curseOfTheWerewolf.default_config.id, 'curse-of-the-werewolf');
    assert.ok(curseOfTheWerewolf.default_config.sound, 'sound config must exist');
    assert.equal(typeof curseOfTheWerewolf.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.curseOfTheWerewolf, 'animation.effect.curseOfTheWerewolf must be registered');
    assert.equal(animation.effect.curseOfTheWerewolf, curseOfTheWerewolf);
});

test('curseOfTheWerewolf.create builds sequence with sequence.motion(target).scaleTo().noise() without copySprite or opacity(0)', async () => {
    let capturedMotionTarget = null;
    let capturedScaleToValue = null;
    let noiseCalled = false;
    let opacitySetZero = false;
    let copySpriteCount = 0;

    const origSequence = globalThis.Sequence;

    class MockSequence {
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
                    if (prop === 'scaleTo') {
                        return (val) => {
                            capturedScaleToValue = val;
                            return proxy;
                        };
                    }
                    if (prop === 'noise') {
                        return () => {
                            noiseCalled = true;
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

    globalThis.Sequence = MockSequence;

    try {
        const mockToken = {
            id: 'tok-werewolf-1',
            name: 'Werewolf Target',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 }
        };

        const seq = await curseOfTheWerewolf.create(mockToken);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockToken, 'Motion target must be the token');
        assert.equal(capturedScaleToValue, 1.06, 'scaleTo target scale must be 1.06');
        assert.equal(noiseCalled, true, 'noise() must be called on motion');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(copySpriteCount, 0, 'No copySprite should be present in curseOfTheWerewolf.create');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
