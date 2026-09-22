import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { hitTheDirt } from '../../src/animation/effects/template/hit-the-dirt.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });

test('hitTheDirt effect API contracts and exports', () => {
    assert.ok(hitTheDirt, 'hitTheDirt module must exist');
    assert.equal(typeof hitTheDirt.create, 'function', 'hitTheDirt.create must be a function');
    assert.equal(typeof hitTheDirt.play, 'function', 'hitTheDirt.play must be a function');
    assert.equal(typeof hitTheDirt.stop, 'function', 'hitTheDirt.stop must be a function');

    assert.ok(hitTheDirt.default_config, 'default_config must exist');
    assert.equal(hitTheDirt.default_config.id, 'hitTheDirt');
    assert.ok(hitTheDirt.default_config.sound, 'sound config must exist');
    assert.equal(typeof hitTheDirt.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.hitTheDirt, 'animation.effect.hitTheDirt must be registered');
    assert.equal(animation.effect.hitTheDirt, hitTheDirt);
});

test('hitTheDirt.create builds sequence with sequence.motion(token).rotateTo(90).moveBy() without hiding token', async () => {
    let capturedMotionToken = null;
    let capturedRotateAngle = null;
    let capturedMoveByPos = null;
    let opacitySetZero = false;
    let copySpriteCount = 0;

    const origSequence = globalThis.Sequence;

    class MockHitTheDirtSequence {
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
                        return (motionToken) => {
                            currentSection = 'motion';
                            capturedMotionToken = motionToken;
                            return proxy;
                        };
                    }
                    if (prop === 'rotateTo') {
                        return (angle) => {
                            capturedRotateAngle = angle;
                            return proxy;
                        };
                    }
                    if (prop === 'moveBy') {
                        return (pos) => {
                            capturedMoveByPos = pos;
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

    globalThis.Sequence = MockHitTheDirtSequence;

    try {
        const mockToken = {
            id: 'tok-dirt-1',
            name: 'Hero Token',
            document: { width: 1, height: 1, rotation: 0 },
            center: { x: 100, y: 100 }
        };
        const mockTemplate = {
            x: 200,
            y: 200,
            documentName: 'MeasuredTemplate',
            object: { ray: { B: { x: 200, y: 200 } } }
        };

        const seq = await hitTheDirt.create(mockToken, { template: mockTemplate });
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionToken, mockToken, 'Motion token must be the controlled token');
        assert.equal(capturedRotateAngle, 90, 'rotateTo angle must be 90');
        assert.ok(capturedMoveByPos, 'moveBy position must be supplied');
        assert.equal(capturedMoveByPos.x, 200);
        assert.equal(capturedMoveByPos.y, 200);
        assert.equal(opacitySetZero, false, 'Token opacity must NOT be set to 0');
        assert.equal(copySpriteCount, 1, 'Only 1 copySprite effect should be present for the motion shadow');
    } finally {
        globalThis.Sequence = origSequence;
    }
});
