import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { rollTracker } from '../../src/world-scripts/rollAnimation.js';

test('rollTracker.getMessageVisibilityUsers correctly delegates to adapter for all roll modes', () => {
    const gm = { id: 'gm-user', isGM: true };
    const p1 = { id: 'player-1', isGM: false };
    const p2 = { id: 'player-2', isGM: false };

    globalThis.game = {
        ...globalThis.game,
        users: [gm, p1, p2]
    };

    // Public roll (Public as User / Public as Character)
    const publicMsg = { whisper: [], author: { id: 'player-1' } };
    assert.deepEqual(rollTracker.getMessageVisibilityUsers(publicMsg), ['gm-user', 'player-1', 'player-2']);

    // Private to Gamemasters
    const gmWhisperMsg = { whisper: ['gm-user'], blind: false, author: { id: 'player-1' } };
    const gmWhisperUsers = rollTracker.getMessageVisibilityUsers(gmWhisperMsg);
    assert.ok(gmWhisperUsers.includes('player-1'), 'Author sees roll');
    assert.ok(gmWhisperUsers.includes('gm-user'), 'GM sees roll');
    assert.equal(gmWhisperUsers.includes('player-2'), false, 'Other player does not see roll');

    // Blind to Gamemasters
    const blindMsg = { whisper: ['gm-user'], blind: true, author: { id: 'player-1' } };
    const blindUsers = rollTracker.getMessageVisibilityUsers(blindMsg);
    assert.ok(blindUsers.includes('gm-user'), 'GM sees blind roll');
    assert.equal(blindUsers.includes('player-1'), false, 'Rolling player does not see blind roll');
    assert.equal(blindUsers.includes('player-2'), false, 'Other player does not see blind roll');

    // Self Only
    const selfMsg = { whisper: ['player-1'], blind: false, author: { id: 'player-1' } };
    const selfUsers = rollTracker.getMessageVisibilityUsers(selfMsg);
    assert.ok(selfUsers.includes('player-1'), 'Author sees self roll');
    assert.equal(selfUsers.includes('gm-user'), false, 'GM does not see self roll');
    assert.equal(selfUsers.includes('player-2'), false, 'Other player does not see self roll');
});

test('rollTracker.processMessageAndPlay only executes on rolling user machine and passes visibility-restricted users to sequence effects', async () => {
    const gm = { id: 'gm-user', isGM: true };
    const p1 = { id: 'player-1', isGM: false };
    const p2 = { id: 'player-2', isGM: false };

    globalThis.game = {
        ...globalThis.game,
        user: p1,
        users: [gm, p1, p2]
    };
    globalThis.game.modules.set('eskie-effects', { id: 'eskie-effects', active: true });

    // Track Sequence method calls
    const sequenceCalls = [];
    const effectCalls = [];

    const mockEffectProxy = new Proxy({}, {
        get(_t, prop) {
            return (...args) => {
                effectCalls.push({ method: prop, args });
                return mockEffectProxy;
            };
        }
    });

    const mockSequenceProxy = new Proxy({}, {
        get(_t, prop) {
            if (prop === 'effect') {
                return (...args) => {
                    sequenceCalls.push({ method: 'effect', args });
                    return mockEffectProxy;
                };
            }
            if (prop === 'play') {
                return (...args) => {
                    sequenceCalls.push({ method: 'play', args });
                    return Promise.resolve();
                };
            }
            return (...args) => {
                sequenceCalls.push({ method: prop, args });
                return mockSequenceProxy;
            };
        }
    });

    const originalSequence = globalThis.Sequence;
    globalThis.Sequence = function() {
        return mockSequenceProxy;
    };

    try {
        const mockToken = {
            id: 'tok-1',
            name: 'Hero',
            h: 100,
            document: { id: 'tok-1', name: 'Hero' }
        };

        globalThis.canvas = {
            ready: true,
            tokens: {
                get: (id) => id === 'tok-1' ? mockToken : null,
                controlled: [mockToken]
            }
        };

        const flags = {};
        const mockMessage = {
            id: 'msg-123',
            whisper: ['gm-user'],
            author: { id: 'player-1' },
            flavor: 'Strength Saving Throw',
            content: 'Roll: 18 (Success)',
            flags: {
                world: flags,
                dnd5e: {
                    roll: {
                        type: 'save',
                        ability: 'str'
                    }
                }
            },
            speaker: { token: 'tok-1' },
            setFlag: async (_scope, key, value) => {
                flags[key] = value;
            }
        };

        // 1. If another user (not the message creator) runs the hook, do not start sequence
        await rollTracker.processMessageAndPlay(mockMessage, 'some-other-user');
        assert.equal(sequenceCalls.length, 0, 'Must ignore non-rolling user execution');

        // 2. Rolling user runs the hook (Private to Gamemasters)
        await rollTracker.processMessageAndPlay(mockMessage, 'player-1');

        // Verify sequence and effect calls
        assert.ok(sequenceCalls.some(c => c.method === 'effect'), 'Sequence.effect() must be invoked');
        assert.ok(sequenceCalls.some(c => c.method === 'play'), 'Sequence.play() must be called');

        // Verify forUsers was called with visibility-restricted users (author, GM)
        const forUsersCalls = effectCalls.filter(c => c.method === 'forUsers');
        assert.ok(forUsersCalls.length >= 2, 'forUsers must be called on both rollEffect and smokeEffect');
        const passedUsers = forUsersCalls[0].args[0];
        assert.ok(passedUsers.includes('player-1'), 'Author must be in forUsers');
        assert.ok(passedUsers.includes('gm-user'), 'GM must be in forUsers');
        assert.equal(passedUsers.includes('player-2'), false, 'Uninvolved player must NOT be in forUsers');

        // Verify message flag was saved to prevent duplicate execution
        assert.deepEqual(flags.rollAnimatedTokens, ['tok-1']);

        // 3. Second call with same message & token does not re-trigger
        const callsBefore = sequenceCalls.length;
        await rollTracker.processMessageAndPlay(mockMessage, 'player-1');
        assert.equal(sequenceCalls.length, callsBefore, 'Duplicate execution on same token must be ignored');

        // 4. Public roll test: passes all game.users to forUsers
        effectCalls.length = 0;
        sequenceCalls.length = 0;
        const publicFlags = {};
        const publicMessage = {
            id: 'msg-456',
            whisper: [],
            author: { id: 'player-1' },
            flavor: 'Strength Saving Throw',
            content: 'Roll: 20 (Success)',
            flags: {
                world: publicFlags,
                dnd5e: {
                    roll: {
                        type: 'save',
                        ability: 'str'
                    }
                }
            },
            speaker: { token: 'tok-1' },
            setFlag: async (_scope, key, value) => {
                publicFlags[key] = value;
            }
        };

        await rollTracker.processMessageAndPlay(publicMessage, 'player-1');
        const publicForUsersCalls = effectCalls.filter(c => c.method === 'forUsers');
        assert.ok(publicForUsersCalls.length >= 2, 'forUsers must be called on public roll effects');
        const publicUsers = publicForUsersCalls[0].args[0];
        assert.deepEqual(publicUsers.sort(), ['gm-user', 'player-1', 'player-2'].sort(), 'All world users must be permitted on public roll');

        // 5. Blind to Gamemasters test: restricts forUsers strictly to GMs (excluding rolling player)
        effectCalls.length = 0;
        sequenceCalls.length = 0;
        const blindFlags = {};
        const blindMessage = {
            id: 'msg-blind-789',
            whisper: ['gm-user'],
            blind: true,
            author: { id: 'player-1' },
            flavor: 'Wisdom Saving Throw',
            content: 'Roll: 14 (Success)',
            flags: {
                world: blindFlags,
                dnd5e: {
                    roll: {
                        type: 'save',
                        ability: 'wis'
                    }
                }
            },
            speaker: { token: 'tok-1' },
            setFlag: async (_scope, key, value) => {
                blindFlags[key] = value;
            }
        };

        await rollTracker.processMessageAndPlay(blindMessage, 'player-1');
        const blindForUsersCalls = effectCalls.filter(c => c.method === 'forUsers');
        assert.ok(blindForUsersCalls.length >= 2, 'forUsers must be called on blind roll effects');
        const blindUsers = blindForUsersCalls[0].args[0];
        assert.ok(blindUsers.includes('gm-user'), 'GM must be in forUsers on blind roll');
        assert.equal(blindUsers.includes('player-1'), false, 'Rolling player must NOT be in forUsers on blind roll');
        assert.equal(blindUsers.includes('player-2'), false, 'Other player must NOT be in forUsers on blind roll');

        // 6. Self Only test: restricts forUsers strictly to author (excluding GM)
        effectCalls.length = 0;
        sequenceCalls.length = 0;
        const selfFlags = {};
        const selfMessage = {
            id: 'msg-self-999',
            whisper: ['player-1'],
            blind: false,
            author: { id: 'player-1' },
            flavor: 'Dexterity Saving Throw',
            content: 'Roll: 17 (Success)',
            flags: {
                world: selfFlags,
                dnd5e: {
                    roll: {
                        type: 'save',
                        ability: 'dex'
                    }
                }
            },
            speaker: { token: 'tok-1' },
            setFlag: async (_scope, key, value) => {
                selfFlags[key] = value;
            }
        };

        await rollTracker.processMessageAndPlay(selfMessage, 'player-1');
        const selfForUsersCalls = effectCalls.filter(c => c.method === 'forUsers');
        assert.ok(selfForUsersCalls.length >= 2, 'forUsers must be called on self roll effects');
        const selfUsers = selfForUsersCalls[0].args[0];
        assert.ok(selfUsers.includes('player-1'), 'Author must be in forUsers on self roll');
        assert.equal(selfUsers.includes('gm-user'), false, 'GM must NOT be in forUsers on self roll');
        assert.equal(selfUsers.includes('player-2'), false, 'Other player must NOT be in forUsers on self roll');
    } finally {
        globalThis.game.modules.delete('eskie-effects');
        globalThis.Sequence = originalSequence;
    }
});

test('rollTracker ignores attack rolls and multi-target spells only animate targets and not the caster', async () => {
    const gm = { id: 'gm-user', isGM: true };
    const p1 = { id: 'player-1', isGM: false };
    const p2 = { id: 'player-2', isGM: false };

    globalThis.game = {
        ...globalThis.game,
        user: p1,
        users: [gm, p1, p2],
        modules: new Map([
            ['eskie-effects', { id: 'eskie-effects', active: true }],
            ['midi-qol', { id: 'midi-qol', active: true }]
        ])
    };

    const sequenceCalls = [];
    const effectCalls = [];
    const atLocationTokens = [];

    const mockEffectProxy = new Proxy({}, {
        get(_t, prop) {
            if (prop === 'atLocation') {
                return (target, ...args) => {
                    atLocationTokens.push(target);
                    effectCalls.push({ method: 'atLocation', args: [target, ...args] });
                    return mockEffectProxy;
                };
            }
            return (...args) => {
                effectCalls.push({ method: prop, args });
                return mockEffectProxy;
            };
        }
    });

    const mockSequenceProxy = new Proxy({}, {
        get(_t, prop) {
            if (prop === 'effect') {
                return (...args) => {
                    sequenceCalls.push({ method: 'effect', args });
                    return mockEffectProxy;
                };
            }
            if (prop === 'play') {
                return (...args) => {
                    sequenceCalls.push({ method: 'play', args });
                    return Promise.resolve();
                };
            }
            return (...args) => {
                sequenceCalls.push({ method: prop, args });
                return mockSequenceProxy;
            };
        }
    });

    const originalSequence = globalThis.Sequence;
    globalThis.Sequence = function() {
        return mockSequenceProxy;
    };

    try {
        const casterToken = { id: 'tok-caster', name: 'Mage', h: 100, document: { id: 'tok-caster', name: 'Mage' } };
        const targetToken1 = { id: 'tok-target-1', name: 'Goblin 1', h: 100, document: { id: 'tok-target-1', name: 'Goblin 1' } };
        const targetToken2 = { id: 'tok-target-2', name: 'Goblin 2', h: 100, document: { id: 'tok-target-2', name: 'Goblin 2' } };
        const zannaToken = { id: 'tok-zanna', name: 'Zanna', h: 100, document: { id: 'tok-zanna', name: 'Zanna' } };

        const tokenMap = new Map([
            ['tok-caster', casterToken],
            ['tok-target-1', targetToken1],
            ['tok-target-2', targetToken2],
            ['tok-zanna', zannaToken]
        ]);

        globalThis.canvas = {
            ready: true,
            tokens: {
                get: (id) => tokenMap.get(id) ?? null,
                controlled: [casterToken]
            }
        };

        // 1. Attack roll: Mage casts Fire Bolt / attack roll
        const attackFlags = {};
        const attackMsg = {
            id: 'msg-attack-firebolt',
            whisper: [],
            author: { id: 'player-1' },
            flavor: 'Fire Bolt - Attack Roll',
            content: '<p>Make a ranged spell attack against the target.</p>',
            rolls: [{ total: 19, options: { type: 'attack' } }],
            flags: {
                world: attackFlags,
                dnd5e: { roll: { type: 'attack' } }
            },
            speaker: { token: 'tok-caster' },
            setFlag: async (_scope, key, value) => { attackFlags[key] = value; }
        };

        await rollTracker.processMessageAndPlay(attackMsg, 'player-1');
        assert.equal(sequenceCalls.length, 0, 'Attack rolls must not trigger sequence animations');
        assert.equal(attackFlags.rollAnimatedTokens, undefined, 'No tokens should be recorded as animated for attack roll');

        // 1b. Midi-QOL Attack Roll containing empty saves-display template: Must NOT animate attacking token
        const midiAttackFlags = {};
        const midiAttackMsg = {
            id: 'msg-midi-attack-card',
            whisper: [],
            author: { id: 'player-1' },
            flavor: 'Attack Roll',
            content: `
                <div class="midi-qol">
                    <p>Attack Roll: 22 vs AC</p>
                    <div class="midi-qol-saves-display"></div>
                </div>
            `,
            rolls: [{ total: 22, options: { type: 'attack' } }],
            flags: {
                world: midiAttackFlags,
                'midi-qol': { messageType: 'attack' }
            },
            speaker: { token: 'tok-caster' },
            setFlag: async (_scope, key, value) => { midiAttackFlags[key] = value; }
        };
        await rollTracker.processMessageAndPlay(midiAttackMsg, 'player-1');
        assert.equal(sequenceCalls.length, 0, 'Midi-QOL attack rolls must never trigger sequence animations');
        assert.equal(midiAttackFlags.rollAnimatedTokens, undefined, 'Attacker must never be recorded as animated');

        // 2. Early Multi-target spell: Mage casts Cone of Cold BEFORE targets resolve saves
        // Chat card has damage roll and saves display, but no resolved targets yet
        const earlyConeFlags = {};
        const earlyConeMsg = {
            id: 'msg-cone-of-cold',
            whisper: [],
            author: { id: 'player-1' },
            speaker: { token: 'tok-caster', alias: 'Mage' },
            rolls: [{ total: 36, options: { type: 'damage' } }],
            content: `
                <div class="midi-qol">
                    <p>8d8 Cold Damage</p>
                    <div class="midi-qol-saves-display">
                        DC 16 Constitution Saving Throw
                    </div>
                </div>
            `,
            flags: {
                world: earlyConeFlags,
                'midi-qol': { messageType: 'item' }
            },
            setFlag: async (_scope, key, value) => { earlyConeFlags[key] = value; }
        };
        await rollTracker.processMessageAndPlay(earlyConeMsg, 'player-1');
        assert.equal(sequenceCalls.length, 0, 'Early spell cards before saves resolve must not trigger animations');
        assert.equal(earlyConeFlags.rollAnimatedTokens, undefined, 'Caster must NOT be recorded as animated');

        // 3. Multi-target spell resolution: Targets roll Con saves (updateChatMessage)
        sequenceCalls.length = 0;
        atLocationTokens.length = 0;
        const coneFlags = {};
        const coneMsg = {
            id: 'msg-cone-of-cold',
            whisper: [],
            author: { id: 'player-1' },
            speaker: { token: 'tok-caster', alias: 'Mage' },
            rolls: [{ total: 36, options: { type: 'damage' } }],
            content: `
                <div class="midi-qol-saves-display">
                    DC 16 Constitution Saving Throw
                    <ul>
                        <li class="midi-qol-target-select success" data-id="tok-target-1">Goblin 1 <i class="fa-check"></i></li>
                        <li class="midi-qol-target-select failure" data-id="tok-target-2">Goblin 2 <i class="fa-times"></i></li>
                    </ul>
                </div>
            `,
            flags: {
                world: coneFlags
            },
            setFlag: async (_scope, key, value) => { coneFlags[key] = value; }
        };

        await rollTracker.processMessageAndPlay(coneMsg, 'player-1');

        // Verify animations triggered for target tokens only
        assert.ok(sequenceCalls.length > 0, 'Sequence animations must trigger for target saving throws');
        assert.deepEqual(coneFlags.rollAnimatedTokens?.sort(), ['tok-target-1', 'tok-target-2'].sort(), 'Only target tokens must be recorded as animated');

        // Verify sequence effect atLocation targets only target tokens, NOT the caster
        const targetIdsAnimated = atLocationTokens.map(t => t.id);
        assert.ok(targetIdsAnimated.includes('tok-target-1'), 'Target 1 must receive die animation');
        assert.ok(targetIdsAnimated.includes('tok-target-2'), 'Target 2 must receive die animation');
        assert.equal(targetIdsAnimated.includes('tok-caster'), false, 'Caster must NOT receive die animation on target saves');

        // 4. Midi-QOL workflow card with messageType 'attack' updated with type: 2 (MESSAGE_TYPES.SAVES) and fa-xmark failure
        sequenceCalls.length = 0;
        atLocationTokens.length = 0;
        const zannaFlags = {};
        const zannaMsg = {
            id: 'msg-zanna-save-workflow',
            whisper: [],
            author: { id: 'player-1' },
            speaker: { token: 'tok-caster', alias: 'Mage' },
            content: `
                <div class="midi-qol">
                    <div class="midi-qol-saves-display">
                        DC 17 Constitution Saving Throw
                        <ul>
                            <li class="midi-qol midi-qol-save-class target midi-qol-target-select midi-qol-player-target failure" data-id="tok-zanna">
                                <i class="fas fa-xmark"></i>
                                Zanna
                            </li>
                        </ul>
                    </div>
                </div>
            `,
            flags: {
                world: zannaFlags,
                'midi-qol': { messageType: 'attack', type: 2 }
            },
            setFlag: async (_scope, key, value) => { zannaFlags[key] = value; }
        };

        await rollTracker.processMessageAndPlay(zannaMsg, 'player-1');

        assert.ok(sequenceCalls.length > 0, 'Sequence must animate for Zanna save failure');
        assert.deepEqual(zannaFlags.rollAnimatedTokens, ['tok-zanna'], 'Only Zanna must be recorded as animated');
        assert.ok(atLocationTokens.some(t => t.id === 'tok-zanna'), 'Zanna must receive die animation');
        assert.equal(atLocationTokens.some(t => t.id === 'tok-caster'), false, 'Caster must NOT receive die animation');
    } finally {
        globalThis.game.modules.delete('eskie-effects');
        globalThis.game.modules.delete('midi-qol');
        globalThis.Sequence = originalSequence;
    }
});

