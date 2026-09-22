import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { sneakAttack } from '../../src/animation/effects/on-target/sneak-attack.js';
import { animation } from '../../src/animation/index.js';
import { adapter } from '../../src/adapters/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });
game.modules.set('psfx', { id: 'psfx', active: true, version: '1.0.0' });

await adapter.init();

test('sneakAttack effect API contracts and exports', () => {
    assert.ok(sneakAttack, 'sneakAttack module must exist');
    assert.ok(sneakAttack.melee, 'sneakAttack.melee must exist');
    assert.equal(typeof sneakAttack.melee.create, 'function', 'sneakAttack.melee.create must be a function');
    assert.equal(typeof sneakAttack.melee.play, 'function', 'sneakAttack.melee.play must be a function');

    assert.ok(sneakAttack.ranged, 'sneakAttack.ranged must exist');
    assert.equal(typeof sneakAttack.ranged.create, 'function', 'sneakAttack.ranged.create must be a function');
    assert.equal(typeof sneakAttack.ranged.play, 'function', 'sneakAttack.ranged.play must be a function');

    assert.ok(sneakAttack.default_config, 'default_config must exist');

    assert.ok(animation.effect.sneakAttack, 'animation.effect.sneakAttack must be registered');
    assert.equal(animation.effect.sneakAttack, sneakAttack);
});

test('sneakAttack.melee.create builds sequence with sequence.motion(token).moveBy() without copySprite or opacity(0)', async () => {
    let capturedMotionTarget = null;
    let moveByCalled = false;
    let copySpriteCalled = false;
    let opacitySetZero = false;

    const origSequence = globalThis.Sequence;

    class MockSneakAttackSequence {
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
                        currentSection = 'motion';
                        return (target) => {
                            capturedMotionTarget = target;
                            return proxy;
                        };
                    }
                    if (prop === 'moveBy') {
                        moveByCalled = true;
                        return () => proxy;
                    }
                    if (prop === 'opacity') {
                        return (val) => {
                            if (val === 0) {
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

    globalThis.Sequence = MockSneakAttackSequence;

    try {
        const mockToken = {
            id: 'tok-rogue-1',
            name: 'Rogue Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 },
            x: 100,
            y: 100
        };
        const mockTarget = {
            id: 'tok-target-1',
            name: 'Enemy Target',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 200, y: 100 },
            x: 200,
            y: 100
        };

        const seq = await sneakAttack.melee.create(mockToken, mockTarget);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockToken, 'Motion target must be the attacking token');
        assert.equal(moveByCalled, true, 'moveBy must be called on motion(token)');
        assert.equal(copySpriteCalled, false, 'copySprite must NOT be called');
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
