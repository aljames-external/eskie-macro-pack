import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { shadowArrow } from '../../src/animation/effects/arcane-shot/shadow-arrow.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('shadowArrow effect API contracts and exports', () => {
    assert.ok(shadowArrow, 'shadowArrow module must exist');
    assert.equal(typeof shadowArrow.create, 'function', 'shadowArrow.create must be a function');
    assert.equal(typeof shadowArrow.play, 'function', 'shadowArrow.play must be a function');
    assert.equal(typeof shadowArrow.stop, 'function', 'shadowArrow.stop must be a function');

    assert.ok(shadowArrow.default_config, 'default_config must exist');
    assert.ok(shadowArrow.default_config.sound, 'sound config must exist');
    assert.equal(typeof shadowArrow.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.arcaneShot.shadowArrow, 'animation.effect.arcaneShot.shadowArrow must be registered');
    assert.equal(animation.effect.arcaneShot.shadowArrow, shadowArrow);
});

test('shadowArrow.create builds sequence with sequence.motion(target).noise() for target hit shudder', async () => {
    const capturedMotionTargets = [];
    let noiseCalled = false;

    const origSequence = globalThis.Sequence;

    class MockShadowArrowSequence {
        constructor() {
            const handler = {
                get(_t, prop) {
                    if (prop === 'motion') {
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
                    if (prop === 'play') return async () => proxy;
                    if (prop === 'then') return undefined;
                    return (..._args) => proxy;
                }
            };
            const proxy = new Proxy(this, handler);
            return proxy;
        }
    }

    globalThis.Sequence = MockShadowArrowSequence;

    try {
        const mockToken = {
            id: 'tok-caster-1',
            name: 'Caster Token',
            document: { width: 1, height: 1, rotation: 0, texture: { scaleX: 1, scaleY: 1 } },
            center: { x: 100, y: 100 }
        };

        const mockTarget = {
            id: 'tok-target-1',
            name: 'Target Token',
            document: { width: 1, height: 1, rotation: 0, texture: { scaleX: 1, scaleY: 1 } },
            center: { x: 200, y: 200 }
        };

        const seq = await shadowArrow.create(mockToken, mockTarget);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTargets.length, 1, 'Motion target count should be 1');
        assert.equal(capturedMotionTargets[0], mockTarget, 'Motion target must be the target token');
        assert.equal(noiseCalled, true, 'noise must be called on motion');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('shadowArrow.play creates and plays sequence', async () => {
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
            document: { width: 1, height: 1, rotation: 0, texture: { scaleX: 1, scaleY: 1 } }
        };

        const mockTarget = {
            id: 'tok-target-2',
            name: 'Target Token 2',
            document: { width: 1, height: 1, rotation: 0, texture: { scaleX: 1, scaleY: 1 } }
        };

        const playResult = await shadowArrow.play(mockToken, mockTarget);
        assert.ok(playResult, 'shadowArrow.play should return sequence play result');
        assert.equal(playCalled, true, 'sequence.play must be executed');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
