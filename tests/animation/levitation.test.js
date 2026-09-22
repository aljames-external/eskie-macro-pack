import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { levitation } from '../../src/animation/effects/active-effect/levitation.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('levitation effect API contracts and exports', () => {
    assert.ok(levitation, 'levitation module must exist');
    assert.equal(typeof levitation.create, 'function', 'levitation.create must be a function');
    assert.equal(typeof levitation.play, 'function', 'levitation.play must be a function');
    assert.equal(typeof levitation.stop, 'function', 'levitation.stop must be a function');

    assert.ok(levitation.default_config, 'default_config must exist');
    assert.equal(levitation.default_config.id, 'levitation');
    assert.ok(levitation.default_config.sound, 'sound config must exist');
    assert.equal(typeof levitation.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.levitation, 'animation.effect.levitation must be registered');
    assert.equal(animation.effect.levitation, levitation);
});

test('levitation.create builds sequence with .motion() hover oscillation without copySprite or token opacity hiding', async () => {
    let capturedMotionTarget = null;
    let opacitySetZero = false;
    let copySpriteCount = 0;
    let oscillateCalled = false;
    let moveToCalled = false;

    const origSequence = globalThis.Sequence;

    class MockLevitationSequence {
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
                        return () => {
                            moveToCalled = true;
                            return proxy;
                        };
                    }
                    if (prop === 'oscillate') {
                        return () => {
                            oscillateCalled = true;
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

    globalThis.Sequence = MockLevitationSequence;

    try {
        const mockToken = {
            id: 'tok-lev-1',
            name: 'Levitating Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 }
        };

        const seq = await levitation.create(mockToken);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockToken, 'Motion target must be the token');
        assert.equal(moveToCalled, true, 'moveTo must be called');
        assert.equal(oscillateCalled, true, 'oscillate must be called');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(copySpriteCount, 0, 'No copySprite should be present in levitation.create');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('levitation.play creates and plays sequence, and stop cleans up effects', async () => {
    let playCalled = false;
    let endedEffectName = null;

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

    const origEndEffects = Sequencer.EffectManager.endEffects;
    Sequencer.EffectManager.endEffects = (filter) => {
        endedEffectName = filter.name;
    };

    try {
        const mockToken = {
            id: 'tok-lev-2',
            name: 'Floating Token',
            document: { width: 1, height: 1, rotation: 0 }
        };

        const playResult = await levitation.play(mockToken);
        assert.ok(playResult, 'levitation.play should return sequence play result');
        assert.equal(playCalled, true, 'sequence.play must be executed');

        levitation.stop(mockToken);
        assert.equal(endedEffectName, 'levitation - tok-lev-2', 'stop must end effects with label');
    } finally {
        globalThis.Sequence = origSequence;
        Sequencer.EffectManager.endEffects = origEndEffects;
    }
});
