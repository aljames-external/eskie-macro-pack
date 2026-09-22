import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { burstingArrow } from '../../src/animation/effects/arcane-shot/bursting-arrow.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('burstingArrow effect API contracts and exports', () => {
    assert.ok(burstingArrow, 'burstingArrow module must exist');
    assert.equal(typeof burstingArrow.create, 'function', 'burstingArrow.create must be a function');
    assert.equal(typeof burstingArrow.play, 'function', 'burstingArrow.play must be a function');
    assert.equal(typeof burstingArrow.stop, 'function', 'burstingArrow.stop must be a function');

    assert.ok(burstingArrow.default_config, 'default_config must exist');
    assert.ok(burstingArrow.default_config.sound, 'sound config must exist');
    assert.equal(typeof burstingArrow.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.arcaneShot.burstingArrow, 'animation.effect.arcaneShot.burstingArrow must be registered');
    assert.equal(animation.effect.arcaneShot.burstingArrow, burstingArrow);
});

test('burstingArrow.create builds sequence with sequence.motion(t).noise() without copySprite', async () => {
    const capturedMotionTargets = [];
    let copySpriteCount = 0;
    let noiseCalled = false;

    const origSequence = globalThis.Sequence;

    class MockBurstingArrowSequence {
        constructor() {
            let currentSection = null;
            const handler = {
                get(_t, prop) {
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
                    if (prop === 'copySprite') {
                        return () => {
                            copySpriteCount++;
                            return proxy;
                        };
                    }
                    if (prop === 'addSequence') {
                        return (childSeq) => {
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

    globalThis.Sequence = MockBurstingArrowSequence;

    try {
        const mockToken = {
            id: 'tok-caster-1',
            name: 'Caster Token',
            document: {
                width: 1,
                height: 1,
                rotation: 0,
                texture: { scaleX: 1, scaleY: 1 }
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
                texture: { scaleX: 1, scaleY: 1 }
            },
            center: { x: 200, y: 200 }
        };

        const seq = await burstingArrow.create(mockToken, mockTarget);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTargets.length, 1, 'Motion target count should be 1');
        assert.equal(capturedMotionTargets[0], mockTarget, 'Motion target must be the target token');
        assert.equal(noiseCalled, true, 'noise must be called on motion');
        assert.equal(copySpriteCount, 0, 'No copySprite should be present in burstingArrow.create');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('burstingArrow.play creates and plays sequence', async () => {
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
            id: 'tok-caster-2',
            name: 'Caster Token 2',
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

        const playResult = await burstingArrow.play(mockToken, mockTarget);
        assert.ok(playResult, 'burstingArrow.play should return sequence play result');
        assert.equal(playCalled, true, 'sequence.play must be executed');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
