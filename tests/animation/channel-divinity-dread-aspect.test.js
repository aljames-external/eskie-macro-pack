import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { channelDivinityDreadAspect } from '../../src/animation/effects/token/channelDivinityDreadAspect.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('channelDivinityDreadAspect effect API contracts and exports', () => {
    assert.ok(channelDivinityDreadAspect, 'channelDivinityDreadAspect module must exist');
    assert.equal(typeof channelDivinityDreadAspect.create, 'function', 'channelDivinityDreadAspect.create must be a function');
    assert.equal(typeof channelDivinityDreadAspect.play, 'function', 'channelDivinityDreadAspect.play must be a function');

    assert.ok(channelDivinityDreadAspect.default_config, 'default_config must exist');
    assert.equal(channelDivinityDreadAspect.default_config.id, 'ChannelDivinityDreadAspect');
    assert.ok(channelDivinityDreadAspect.default_config.sound, 'sound config must exist');
    assert.equal(typeof channelDivinityDreadAspect.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.channelDivinityDreadAspect, 'animation.effect.channelDivinityDreadAspect must be registered');
    assert.equal(animation.effect.channelDivinityDreadAspect, channelDivinityDreadAspect);
});

test('channelDivinityDreadAspect.create builds sequence with sequence.motion(target).noise() without copySprite or opacity(0) hiding', async () => {
    const capturedMotionTargets = [];
    let opacitySetZero = false;
    let copySpriteCount = 0;
    let noiseCalled = false;

    const origSequence = globalThis.Sequence;

    class MockDreadAspectSequence {
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

    globalThis.Sequence = MockDreadAspectSequence;

    try {
        const mockToken = {
            id: 'tok-paladin-1',
            name: 'Paladin Token',
            document: {
                width: 1,
                height: 1,
                rotation: 0,
                texture: { scaleX: 1, scaleY: 1 },
                update: async () => {}
            },
            center: { x: 100, y: 100 }
        };

        const mockTarget = {
            id: 'tok-target-1',
            name: 'Target Token',
            document: {
                width: 1,
                height: 1,
                rotation: 0,
                texture: { scaleX: 1, scaleY: 1 },
                update: async () => {}
            },
            center: { x: 200, y: 200 }
        };

        const seq = await channelDivinityDreadAspect.create(mockToken, [mockTarget]);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTargets.length, 1, 'Motion target count should be 1');
        assert.equal(capturedMotionTargets[0], mockTarget, 'Motion target must be the target token');
        assert.equal(noiseCalled, true, 'noise must be called on motion');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(copySpriteCount, 0, 'No copySprite should be present in channelDivinityDreadAspect.create');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('channelDivinityDreadAspect.play creates and plays sequence', async () => {
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
            id: 'tok-paladin-2',
            name: 'Paladin Token 2',
            document: {
                width: 1,
                height: 1,
                rotation: 0,
                texture: { scaleX: 1, scaleY: 1 }
            }
        };

        const mockTarget = {
            id: 'tok-target-2',
            name: 'Target Token 2',
            document: {
                width: 1,
                height: 1,
                rotation: 0,
                texture: { scaleX: 1, scaleY: 1 }
            }
        };

        const playResult = await channelDivinityDreadAspect.play(mockToken, [mockTarget]);
        assert.ok(playResult, 'channelDivinityDreadAspect.play should return sequence play result');
        assert.equal(playCalled, true, 'sequence.play must be executed');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
