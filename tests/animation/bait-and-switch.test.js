import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { baitAndSwitch } from '../../src/animation/effects/battlemaster/bait-and-switch.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('baitAndSwitch effect API contracts and exports', () => {
    assert.ok(baitAndSwitch, 'baitAndSwitch module must exist');
    assert.equal(typeof baitAndSwitch.create, 'function', 'baitAndSwitch.create must be a function');
    assert.equal(typeof baitAndSwitch.play, 'function', 'baitAndSwitch.play must be a function');
    assert.equal(typeof baitAndSwitch.stop, 'function', 'baitAndSwitch.stop must be a function');

    assert.ok(baitAndSwitch.default_config, 'default_config must exist');
    assert.equal(baitAndSwitch.default_config.id, 'baitAndSwitch');
    assert.ok(baitAndSwitch.default_config.sound, 'sound config must exist');
    assert.equal(typeof baitAndSwitch.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.battlemaster.baitAndSwitch, 'animation.effect.battlemaster.baitAndSwitch must be registered');
    assert.equal(animation.effect.battlemaster.baitAndSwitch, baitAndSwitch);
});

test('baitAndSwitch.create builds sequence with sequence.motion(target).moveTo() and sequence.motion(token).moveTo() without token hiding', async () => {
    const motionTargets = [];
    const motionDestinations = [];
    let opacitySetZero = false;
    let teleportToCalled = false;

    const origSequence = globalThis.Sequence;

    class MockBaitAndSwitchSequence {
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

    globalThis.Sequence = MockBaitAndSwitchSequence;

    try {
        const mockToken = {
            id: 'tok-source-1',
            name: 'Hero Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 },
            x: 100,
            y: 100,
        };
        const mockTarget = {
            id: 'tok-target-1',
            name: 'Ally Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 200, y: 200 },
            x: 200,
            y: 200,
        };

        const seq = await baitAndSwitch.create(mockToken, mockTarget);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(motionTargets.length, 2, 'Must call motion() for both target and token');
        assert.equal(motionTargets[0], mockTarget, 'First motion target must be the target token');
        assert.equal(motionTargets[1], mockToken, 'Second motion target must be the source token');
        assert.equal(motionDestinations.length, 2, 'Must call moveTo() for both target and token');
        assert.deepEqual(motionDestinations[0], { x: 100, y: 100 }, 'Target token should move to source tokenCenter');
        assert.deepEqual(motionDestinations[1], { x: 200, y: 200 }, 'Source token should move to target tokenCenter');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(teleportToCalled, false, 'teleportTo must NOT be called');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
