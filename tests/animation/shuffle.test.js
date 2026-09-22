import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { shuffle } from '../../src/animation/effects/multi-token/shuffle.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('shuffle effect API contracts and exports', () => {
    assert.ok(shuffle, 'shuffle module must exist');
    assert.equal(typeof shuffle.create, 'function', 'shuffle.create must be a function');
    assert.equal(typeof shuffle.play, 'function', 'shuffle.play must be a function');

    assert.ok(shuffle.default_config, 'default_config must exist');
    assert.equal(typeof shuffle.default_config.sendToCenter, 'boolean', 'sendToCenter must be boolean');
    assert.ok(shuffle.default_config.sound, 'sound config must exist');
    assert.equal(typeof shuffle.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.shuffle, 'animation.effect.shuffle must be registered');
    assert.equal(animation.effect.shuffle, shuffle);
});

test('shuffle.create builds sequence with sequence.motion(target).moveTo() without legacy animation().on().moveTowards()', async () => {
    const motionTargets = [];
    const motionDestinations = [];
    let moveTowardsCalled = false;

    const origSequence = globalThis.Sequence;

    class MockShuffleSequence {
        constructor() {
            let currentSection = null;
            const handler = {
                get(_t, prop) {
                    if (prop === 'animation') {
                        currentSection = 'animation';
                        return () => proxy;
                    }
                    if (prop === 'motion') {
                        currentSection = 'motion';
                        return (target) => {
                            motionTargets.push(target);
                            return proxy;
                        };
                    }
                    if (prop === 'moveTo') {
                        return (dest) => {
                            motionDestinations.push(dest);
                            return proxy;
                        };
                    }
                    if (prop === 'moveTowards') {
                        return () => {
                            moveTowardsCalled = true;
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

    globalThis.Sequence = MockShuffleSequence;

    try {
        const mockTargets = [
            { id: 'tok-1', name: 'Token 1', center: { x: 100, y: 100 } },
            { id: 'tok-2', name: 'Token 2', center: { x: 200, y: 200 } },
        ];

        const seq = await shuffle.create(mockTargets, { sendToCenter: true });
        assert.ok(seq, 'Sequence must be created');
        assert.equal(motionTargets.length, 4, 'Must call motion() for both center movements and shuffle movements');
        assert.equal(motionDestinations.length, 4, 'Must call moveTo() for center and shuffle movements');
        assert.equal(moveTowardsCalled, false, 'moveTowards must NOT be called');

        motionTargets.length = 0;
        motionDestinations.length = 0;
        const seq2 = await shuffle.create(mockTargets, { sendToCenter: false });
        assert.ok(seq2, 'Sequence must be created');
        assert.equal(motionTargets.length, 2, 'Must call motion() for each target shuffle position');
        assert.equal(motionDestinations.length, 2, 'Must call moveTo() for each target shuffle position');
        assert.equal(moveTowardsCalled, false, 'moveTowards must NOT be called');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
