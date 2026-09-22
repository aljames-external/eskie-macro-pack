import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { graspingArrow } from '../../src/animation/effects/arcane-shot/grasping-arrow.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('graspingArrow effect API contracts and exports', () => {
    assert.ok(graspingArrow, 'graspingArrow module must exist');
    assert.equal(typeof graspingArrow.create, 'function', 'graspingArrow.create must be a function');
    assert.equal(typeof graspingArrow.play, 'function', 'graspingArrow.play must be a function');
    assert.equal(typeof graspingArrow.stop, 'function', 'graspingArrow.stop must be a function');

    assert.ok(graspingArrow.default_config, 'default_config must exist');
    assert.ok(graspingArrow.default_config.sound, 'sound config must exist');
    assert.equal(typeof graspingArrow.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.arcaneShot.graspingArrow, 'animation.effect.arcaneShot.graspingArrow must be registered');
    assert.equal(animation.effect.arcaneShot.graspingArrow, graspingArrow);
});

test('graspingArrow.create builds sequence with sequence.motion(target).noise() without copySprite or loopProperty', async () => {
    const capturedMotionTargets = [];
    let copySpriteCount = 0;
    let noiseCalled = false;
    let loopPropertyCalled = false;

    const origSequence = globalThis.Sequence;

    class MockGraspingArrowSequence {
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
                        return (tok) => {
                            capturedMotionTargets.push(tok);
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
                    if (prop === 'loopProperty') {
                        return () => {
                            loopPropertyCalled = true;
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

    globalThis.Sequence = MockGraspingArrowSequence;

    try {
        const mockToken = {
            id: 'tok-caster-1',
            name: 'Caster Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 }
        };

        const mockTarget = {
            id: 'tok-target-1',
            name: 'Target Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 200, y: 200 }
        };

        const seq = await graspingArrow.create(mockToken, mockTarget);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTargets.length, 1, 'Motion target count must be 1');
        assert.equal(capturedMotionTargets[0], mockTarget, 'Motion target must be the target token');
        assert.equal(noiseCalled, true, 'noise must be called on motion');
        assert.equal(copySpriteCount, 0, 'No copySprite should be present in graspingArrow.create');
        assert.equal(loopPropertyCalled, false, 'No loopProperty should be called on copySprite overlay');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
