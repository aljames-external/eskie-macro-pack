import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeSystemAdapter, BaseSystemAdapter } from '../../src/adapters/system/index.js';
import { Dnd5eSystemAdapter } from '../../src/adapters/system/dnd5e-system-adapter.js';
import { Pf2eSystemAdapter } from '../../src/adapters/system/pf2e-system-adapter.js';
import { GenericSystemAdapter } from '../../src/adapters/system/generic-system-adapter.js';
import { BaseFoundryAdapter } from '../../src/adapters/foundry/index.js';
import { FoundryV12Adapter } from '../../src/adapters/foundry/foundry-v12-adapter.js';
import { FoundryV13Adapter } from '../../src/adapters/foundry/foundry-v13-adapter.js';
import { FoundryV14Adapter } from '../../src/adapters/foundry/foundry-v14-adapter.js';

test('initializeSystemAdapter and BaseSystemAdapter enforce instanceof BaseFoundryAdapter contract across all versions', async () => {
    // Non-BaseFoundryAdapter inputs are rejected
    assert.throws(() => new BaseSystemAdapter('dnd5e', true, {}), /BaseSystemAdapter requires a valid BaseFoundryAdapter instance/);
    assert.throws(() => new BaseSystemAdapter('dnd5e', true, 'invalid'), /BaseSystemAdapter requires a valid BaseFoundryAdapter instance/);
    await assert.rejects(async () => initializeSystemAdapter('dnd5e', {}), /initializeSystemAdapter requires a valid BaseFoundryAdapter instance/);

    // All version subclasses (V12, V13, V14) satisfy instanceof BaseFoundryAdapter
    const v12 = new FoundryV12Adapter();
    const v13 = new FoundryV13Adapter();
    const v14 = new FoundryV14Adapter();

    assert.ok(v12 instanceof BaseFoundryAdapter);
    assert.ok(v13 instanceof BaseFoundryAdapter);
    assert.ok(v14 instanceof BaseFoundryAdapter);

    // System adapters accept any Foundry adapter version polymorphically
    const sysV12 = await initializeSystemAdapter('dnd5e', v12);
    assert.ok(sysV12 instanceof Dnd5eSystemAdapter);
    assert.equal(sysV12.foundry, v12);

    const sysV13 = await initializeSystemAdapter('pf2e', v13);
    assert.ok(sysV13 instanceof Pf2eSystemAdapter);
    assert.equal(sysV13.foundry, v13);

    const sysV14 = await initializeSystemAdapter('generic', v14);
    assert.ok(sysV14 instanceof GenericSystemAdapter);
    assert.equal(sysV14.foundry, v14);
});

test('initializeSystemAdapter instantiates matching system adapter or generic fallback', async () => {
    const dnd5e = await initializeSystemAdapter('dnd5e');
    assert.ok(dnd5e instanceof Dnd5eSystemAdapter);
    assert.equal(dnd5e.isSupported, true);

    const pf2e = await initializeSystemAdapter('pf2e');
    assert.ok(pf2e instanceof Pf2eSystemAdapter);
    assert.equal(pf2e.isSupported, true);

    const generic = await initializeSystemAdapter('generic');
    assert.ok(generic instanceof GenericSystemAdapter);
    assert.equal(generic.isSupported, false);

    const unsupported = await initializeSystemAdapter('shadowdark');
    assert.ok(unsupported instanceof GenericSystemAdapter);
    assert.equal(unsupported.isSupported, false);
});

test('Dnd5eSystemAdapter qualifies messages and extracts rolls from flags', () => {
    const adapter = new Dnd5eSystemAdapter();

    // Core D&D 5e save message
    const saveMsg = {
        id: 'msg-save',
        flags: {
            dnd5e: {
                roll: {
                    type: 'save',
                    ability: 'dex'
                }
            }
        }
    };
    assert.equal(adapter.qualifyMessage(saveMsg), 'saving throw');
    const saveRolls = adapter.extractRolls(saveMsg);
    assert.equal(saveRolls.length, 1);
    assert.equal(saveRolls[0].rawAbility, 'dex');
    assert.equal(adapter.normalizeAbility(saveRolls[0].rawAbility), 'dexterity');

    // Ability check
    const checkMsg = {
        id: 'msg-check',
        flags: {
            dnd5e: {
                roll: {
                    type: 'skill',
                    ability: 'ath'
                }
            }
        }
    };
    assert.equal(adapter.qualifyMessage(checkMsg), 'ability check');
    const checkRolls = adapter.extractRolls(checkMsg);
    assert.equal(adapter.normalizeAbility(checkRolls[0].rawAbility), 'strength');

    // Attack
    const atkMsg = { id: 'msg-atk', flags: { dnd5e: { roll: { type: 'attack' } } } };
    assert.equal(adapter.qualifyMessage(atkMsg), 'attack');

    // Damage
    const dmgMsg = { id: 'msg-dmg', flags: { dnd5e: { roll: { type: 'damage' } } } };
    assert.equal(adapter.qualifyMessage(dmgMsg), 'damage');

    // Item usage
    const useMsg = { id: 'msg-use', flags: { dnd5e: { messageType: 'usage' } } };
    assert.equal(adapter.qualifyMessage(useMsg), 'item description');

    // Modern D&D 5e flavor text check without roll flags (e.g. Acrobatics)
    const acrobaticsMsg = {
        id: 'msg-acrobatics',
        flavor: 'Dexterity (Acrobatics) Check',
        rolls: [{ total: 18, options: {} }]
    };
    assert.equal(adapter.qualifyMessage(acrobaticsMsg), 'ability check');
    const acrobaticsRolls = adapter.extractRolls(acrobaticsMsg);
    assert.equal(acrobaticsRolls.length, 1);
    assert.equal(adapter.normalizeAbility(acrobaticsRolls[0].rawAbility, acrobaticsMsg.flavor), 'dexterity');

    // Modern D&D 5e saving throw via roll options
    const saveOptionsMsg = {
        id: 'msg-str-save',
        flavor: 'Strength Saving Throw',
        rolls: [{ total: 14, options: { type: 'save', ability: 'str' } }]
    };
    assert.equal(adapter.qualifyMessage(saveOptionsMsg), 'saving throw');
    const saveOptionsRolls = adapter.extractRolls(saveOptionsMsg);
    assert.equal(saveOptionsRolls.length, 1);
    assert.equal(saveOptionsRolls[0].rawAbility, 'str');
    assert.equal(adapter.normalizeAbility(saveOptionsRolls[0].rawAbility), 'strength');
});

test('Dnd5eSystemAdapter getSpellLevel and getCreatureType contracts', () => {
    const adapter = new Dnd5eSystemAdapter();

    // Spell Level from aaHandler
    assert.equal(adapter.getSpellLevel({ aaHandler: { systemData: { spellLevel: 3 } } }), 3);
    // Spell Level from item
    assert.equal(adapter.getSpellLevel({ item: { system: { level: 2 } } }), 2);

    // Creature Type
    const actor = {
        system: {
            details: {
                type: {
                    value: 'Fiend'
                }
            }
        }
    };
    assert.equal(adapter.getCreatureType(actor), 'fiend');
});

test('Pf2eSystemAdapter qualifies messages, extracts rolls, and normalizes skills', () => {
    const adapter = new Pf2eSystemAdapter();

    const saveMsg = {
        id: 'pf2e-save',
        speaker: { token: 'tok1' },
        flags: {
            pf2e: {
                context: {
                    type: 'saving-throw',
                    outcome: 'criticalSuccess',
                    ability: 'fortitude'
                }
            }
        }
    };
    assert.equal(adapter.qualifyMessage(saveMsg), 'saving throw');
    const rolls = adapter.extractRolls(saveMsg);
    assert.equal(rolls.length, 1);
    assert.equal(rolls[0].outcome, 'success');
    assert.equal(rolls[0].tokenId, 'tok1');
    assert.equal(adapter.normalizeAbility(rolls[0].rawAbility), 'constitution');

    const checkMsg = {
        id: 'pf2e-check',
        flags: {
            pf2e: {
                context: {
                    type: 'perception-check',
                    outcome: 'failure',
                    ability: 'perception'
                }
            }
        }
    };
    assert.equal(adapter.qualifyMessage(checkMsg), 'ability check');
    const checkRolls = adapter.extractRolls(checkMsg);
    assert.equal(checkRolls[0].outcome, 'failure');
    assert.equal(adapter.normalizeAbility(checkRolls[0].rawAbility), 'wisdom');
});

test('GenericSystemAdapter qualifies messages based on keyword text analysis', () => {
    const adapter = new GenericSystemAdapter();

    const saveMsg = {
        id: 'gen-save',
        content: 'Rolling a Dexterity Saving Throw!',
        rolls: [{ total: 18 }]
    };
    assert.equal(adapter.qualifyMessage(saveMsg), 'saving throw');

    const checkMsg = {
        id: 'gen-check',
        flavor: 'Athletics Skill Check',
        rolls: [{ total: 15 }]
    };
    assert.equal(adapter.qualifyMessage(checkMsg), 'ability check');

    const chatTextOnly = {
        id: 'gen-chat',
        content: 'Hello everyone!'
    };
    assert.equal(adapter.qualifyMessage(chatTextOnly), 'text');
});

test('parseAndNormalizeAbility enforces strict word boundaries and does not match substrings in common words', () => {
    const adapter = new Dnd5eSystemAdapter();

    // Plain English words that contain 3-letter substrings should NOT match
    assert.equal(adapter.normalizeAbility(null, "this strike into the cone"), null);
    assert.equal(adapter.normalizeAbility(null, "a person walked along the path"), null);
    assert.equal(adapter.normalizeAbility(null, "decrease the interval"), null);

    // Actual bounded abilities and skills should match
    assert.equal(adapter.normalizeAbility(null, "Make a Constitution saving throw"), "constitution");
    assert.equal(adapter.normalizeAbility(null, "Roll a Str check"), "strength");
    assert.equal(adapter.normalizeAbility(null, "Wis saving throw"), "wisdom");
    assert.equal(adapter.normalizeAbility("dex"), "dexterity");
});

test('Dnd5eSystemAdapter strictly classifies attack and damage messages and extracts zero save/check rolls', () => {
    const adapter = new Dnd5eSystemAdapter();

    // Core D&D 5e attack flag
    const atkMsg = { id: 'msg-atk-flag', flags: { dnd5e: { roll: { type: 'attack' } } } };
    assert.equal(adapter.qualifyMessage(atkMsg), 'attack');
    assert.deepEqual(adapter.extractRolls(atkMsg), []);

    // Core D&D 5e damage flag
    const dmgMsg = { id: 'msg-dmg-flag', flags: { dnd5e: { roll: { type: 'damage' } } } };
    assert.equal(adapter.qualifyMessage(dmgMsg), 'damage');
    assert.deepEqual(adapter.extractRolls(dmgMsg), []);

    // D&D 5e v4 Activity attack
    const actAtkMsg = { id: 'msg-act-atk', flags: { dnd5e: { activity: { type: 'attack' } } } };
    assert.equal(adapter.qualifyMessage(actAtkMsg), 'attack');
    assert.deepEqual(adapter.extractRolls(actAtkMsg), []);

    // D&D 5e v4 actionType (melee spell attack)
    const mwakMsg = { id: 'msg-mwak', flags: { dnd5e: { actionType: 'msak' } } };
    assert.equal(adapter.qualifyMessage(mwakMsg), 'attack');
    assert.deepEqual(adapter.extractRolls(mwakMsg), []);

    // Roll options type = attack
    const optAtkMsg = { id: 'msg-opt-atk', rolls: [{ options: { type: 'attack' } }] };
    assert.equal(adapter.qualifyMessage(optAtkMsg), 'attack');
    assert.deepEqual(adapter.extractRolls(optAtkMsg), []);

    // Flavor text attack
    const flavorAtkMsg = {
        id: 'msg-flavor-atk',
        flavor: 'Fire Bolt - Attack Roll',
        content: '<p>Make a ranged spell attack against the target.</p>',
        rolls: [{ total: 19, options: {} }]
    };
    assert.equal(adapter.qualifyMessage(flavorAtkMsg), 'attack');
    assert.deepEqual(adapter.extractRolls(flavorAtkMsg), []);
});

test('Dnd5eSystemAdapter extracts only target saving throws and excludes caster on multi-target spell cards', () => {
    const adapter = new Dnd5eSystemAdapter();

    // Enable Midi-QOL module for test
    globalThis.game = {
        ...globalThis.game,
        modules: new Map([['midi-qol', { id: 'midi-qol', active: true }]])
    };

    try {
        // Cone of Cold cast by Mage: includes damage roll and Midi-QOL target saves display
        const coneOfColdMsg = {
            id: 'msg-cone-of-cold',
            speaker: { token: 'tok-mage', alias: 'Mage' },
            rolls: [{ total: 36, options: { type: 'damage' } }],
            content: `
                <div class="midi-qol-saves-display">
                    DC 16 Constitution Saving Throw
                    <ul>
                        <li class="midi-qol-target-select success" data-id="tok-target-1">Target 1 <i class="fa-check"></i></li>
                        <li class="midi-qol-target-select failure" data-id="tok-target-2">Target 2 <i class="fa-times"></i></li>
                    </ul>
                </div>
            `
        };

        assert.equal(adapter.qualifyMessage(coneOfColdMsg), 'saving throw');
        const extractedRolls = adapter.extractRolls(coneOfColdMsg);

        // Must extract exactly the two target tokens
        assert.equal(extractedRolls.length, 2);
        assert.equal(extractedRolls[0].tokenId, 'tok-target-1');
        assert.equal(extractedRolls[0].outcome, 'success');
        assert.equal(extractedRolls[0].rawAbility, 'constitution');

        assert.equal(extractedRolls[1].tokenId, 'tok-target-2');
        assert.equal(extractedRolls[1].outcome, 'failure');
        assert.equal(extractedRolls[1].rawAbility, 'constitution');

        // Must NOT extract any roll for the caster (tok-mage or tokenId: null)
        assert.equal(extractedRolls.some(r => r.tokenId === 'tok-mage' || r.tokenId === null), false);

        // 2. Midi-QOL Attack Roll with saves-display template: Must classify as attack, not saving throw
        const midiAtkMsg = {
            id: 'msg-midi-attack',
            speaker: { token: 'tok-mage', alias: 'Mage' },
            rolls: [{ total: 21, options: { type: 'attack' } }],
            content: `
                <div class="midi-qol">
                    <p>Attack Roll: 21 vs AC</p>
                    <div class="midi-qol-saves-display"></div>
                </div>
            `,
            flags: {
                'midi-qol': { messageType: 'attack' }
            }
        };
        assert.equal(adapter.qualifyMessage(midiAtkMsg), 'attack');
        assert.deepEqual(adapter.extractRolls(midiAtkMsg), []);

        // 3. Early spell card before targets resolve saves: Must NOT qualify as save or fall back to caster
        const earlyConeMsg = {
            id: 'msg-early-cone',
            speaker: { token: 'tok-mage', alias: 'Mage' },
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
                'midi-qol': { messageType: 'item' }
            }
        };
        assert.notEqual(adapter.qualifyMessage(earlyConeMsg), 'saving throw');
        assert.deepEqual(adapter.extractRolls(earlyConeMsg), []);

        // 4. Midi-QOL workflow card with messageType 'attack' updated with type: 2 (MESSAGE_TYPES.SAVES) and fa-xmark
        const zannaSaveMsg = {
            id: 'msg-zanna-save',
            speaker: { token: 'tok-mage', alias: 'Mage' },
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
                'midi-qol': { messageType: 'attack', type: 2 }
            }
        };
        assert.equal(adapter.qualifyMessage(zannaSaveMsg), 'saving throw');
        const zannaRolls = adapter.extractRolls(zannaSaveMsg);
        assert.equal(zannaRolls.length, 1);
        assert.equal(zannaRolls[0].tokenId, 'tok-zanna');
        assert.equal(zannaRolls[0].outcome, 'failure');
        assert.equal(zannaRolls[0].rawAbility, 'constitution');
    } finally {
        globalThis.game.modules.delete('midi-qol');
    }
});

