import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import { maxtacTraumaTeamAV } from '../../src/animation/effects/tile/maxtac-trauma-team-av.js';
import { animation } from '../../src/animation/index.js';

game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true, version: '1.0.0' });
game.modules.set('eskie-effects', { id: 'eskie-effects', active: true, version: '1.0.0' });
game.modules.set('tagger', { id: 'tagger', active: true, version: '1.0.0' });

test('maxtacTraumaTeamAV effect API contracts and exports', () => {
    assert.ok(maxtacTraumaTeamAV, 'maxtacTraumaTeamAV module must exist');
    assert.equal(typeof maxtacTraumaTeamAV.create, 'function', 'maxtacTraumaTeamAV.create must be a function');
    assert.equal(typeof maxtacTraumaTeamAV.play, 'function', 'maxtacTraumaTeamAV.play must be a function');
    assert.equal(typeof maxtacTraumaTeamAV.stop, 'function', 'maxtacTraumaTeamAV.stop must be a function');

    assert.ok(maxtacTraumaTeamAV.default_config, 'default_config must exist');
    assert.equal(maxtacTraumaTeamAV.default_config.id, 'MaxTacTraumaTeamAV');
    assert.ok(maxtacTraumaTeamAV.default_config.sound, 'sound config must exist');
    assert.equal(typeof maxtacTraumaTeamAV.default_config.sound.enable, 'boolean', 'sound.enable must be boolean');

    assert.ok(animation.effect.maxtacTraumaTeamAV, 'animation.effect.maxtacTraumaTeamAV must be registered');
    assert.equal(animation.effect.maxtacTraumaTeamAV, maxtacTraumaTeamAV);
});

test('maxtacTraumaTeamAV.create builds sequence with sequence.motion(tile).moveTo({ y: -0.5 }, { gridUnits: true }).oscillate().persist()', async () => {
    let capturedMotionTarget = null;
    let oscillateCalled = false;
    let moveToCalled = false;
    let moveToArgs = null;

    const origSequence = globalThis.Sequence;

    class MockMaxTacSequence {
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
                        return (...args) => {
                            moveToCalled = true;
                            moveToArgs = args;
                            return proxy;
                        };
                    }
                    if (prop === 'oscillate') {
                        return () => {
                            oscillateCalled = true;
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

    globalThis.Sequence = MockMaxTacSequence;

    try {
        const mockTile = {
            id: 'tile-maxtac-1',
            document: { width: 300, height: 150, rotation: 0 },
            center: { x: 500, y: 500 },
            width: 300,
            height: 150
        };

        const seq = await maxtacTraumaTeamAV.create(mockTile);
        assert.ok(seq, 'Sequence must be created');
        assert.equal(capturedMotionTarget, mockTile, 'Motion target must be the tile');
        assert.equal(moveToCalled, true, 'moveTo must be called');
        assert.deepEqual(moveToArgs[0], { y: -0.5 }, 'moveTo target position must be { y: -0.5 }');
        assert.deepEqual(moveToArgs[1], { duration: 1000, gridUnits: true }, 'moveTo options must specify { duration: 1000, gridUnits: true }');
        assert.equal(oscillateCalled, true, 'oscillate must be called');
    } finally {
        globalThis.Sequence = origSequence;
    }
});

test('maxtacTraumaTeamAV.stop builds departure sequence with sequence.motion(tile).moveTo({ y: -40 }, ...)', async () => {
    let capturedMotionTarget = null;
    let moveToCalled = false;
    let moveToArgs = null;
    let endedEffectNames = [];

    const origSequence = globalThis.Sequence;
    globalThis.Sequence = class MockStopSequence {
        constructor() {
            const handler = {
                get(_t, prop) {
                    if (prop === 'motion') {
                        return (target) => {
                            capturedMotionTarget = target;
                            return proxy;
                        };
                    }
                    if (prop === 'moveTo') {
                        return (...args) => {
                            moveToCalled = true;
                            moveToArgs = args;
                            return proxy;
                        };
                    }
                    if (prop === 'play') return async () => true;
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
        endedEffectNames.push(filter.name);
    };

    try {
        const mockTile = {
            id: 'tile-maxtac-2',
            document: { width: 300, height: 150, rotation: 0 },
            width: 300,
            height: 150
        };

        const stopResult = await maxtacTraumaTeamAV.stop(mockTile);
        assert.ok(stopResult, 'maxtacTraumaTeamAV.stop should return departure sequence play promise');
        assert.equal(capturedMotionTarget, mockTile, 'Motion target must be the tile in departure sequence');
        assert.equal(moveToCalled, true, 'moveTo must be called for departure');
        assert.deepEqual(moveToArgs[0], { y: -40 }, 'moveTo departure position must be { y: -40 }');
        assert.equal(endedEffectNames.includes('landing'), true, 'stop must end landing effects');
        assert.equal(endedEffectNames.includes('Fly'), true, 'stop must end fly effects');
    } finally {
        globalThis.Sequence = origSequence;
        Sequencer.EffectManager.endEffects = origEndEffects;
    }
});
