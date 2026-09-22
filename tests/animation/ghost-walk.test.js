import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { ghostWalk } from '../../src/animation/effects/token/ghost-walk.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('ghostWalk effect API contracts and exports', () => {
    assert.ok(ghostWalk, 'ghostWalk module must exist');
    assert.equal(typeof ghostWalk.create, 'function', 'ghostWalk.create must be a function');
    assert.equal(typeof ghostWalk.play, 'function', 'ghostWalk.play must be a function');
    assert.equal(typeof ghostWalk.stop, 'function', 'ghostWalk.stop must be a function');

    assert.ok(ghostWalk.default_config, 'default_config must exist');
    assert.equal(ghostWalk.default_config.id, 'ghostWalk');
    assert.ok(ghostWalk.default_config.sound, 'sound config must exist');
    assert.equal(typeof ghostWalk.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.ghostWalk, 'animation.effect.ghostWalk must be registered');
    assert.equal(animation.effect.ghostWalk, ghostWalk);
});

test('ghostWalk.create builds sequence with sequence.motion(token).oscillate() without copySprite or opacity(0) hiding', async () => {
    let capturedMotionTarget = null;
    let opacitySetZero = false;
    let copySpriteCount = 0;
    let oscillateCalled = false;
    let fadeToValue = null;
    let tintToValue = null;

    const origSequence = globalThis.Sequence;

    class MockGhostWalkSequence {
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
                    if (prop === 'fadeTo') {
                        return (val) => {
                            fadeToValue = val;
                            return proxy;
                        };
                    }
                    if (prop === 'tintTo') {
                        return (val) => {
                            tintToValue = val;
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

    globalThis.Sequence = MockGhostWalkSequence;

    try {
        const mockToken = {
            id: 'tok-gw-1',
            name: 'Ghost Walk Token',
            document: {
                width: 1,
                height: 1,
                rotation: 0,
                update: async () => {}
            },
            center: { x: 100, y: 100 }
        };

        const seq = await ghostWalk.create(mockToken);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockToken, 'Motion target must be the token');
        assert.equal(oscillateCalled, true, 'oscillate must be called');
        assert.equal(fadeToValue, 0.65, 'fadeTo(0.65) must be called');
        assert.equal(tintToValue, '#58feb0', 'tintTo(#58feb0) must be called');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(copySpriteCount, 0, 'No copySprite should be present in ghostWalk.create');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('ghostWalk.play creates and plays sequence, and stop cleans up effects', async () => {
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
            id: 'tok-gw-2',
            name: 'Ghost Walk Token 2',
            document: {
                width: 1,
                height: 1,
                rotation: 0,
                update: async () => {}
            }
        };

        const playResult = await ghostWalk.play(mockToken);
        assert.ok(playResult, 'ghostWalk.play should return sequence play result');
        assert.equal(playCalled, true, 'sequence.play must be executed');

        await ghostWalk.stop(mockToken);
        assert.equal(endedEffectName, 'ghostWalk - tok-gw-2', 'stop must end effects with label');
    } finally {
        globalThis.Sequence = origSequence;
        Sequencer.EffectManager.endEffects = origEndEffects;
    }
});
