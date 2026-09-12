import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import { effect } from '../../src/animation/effects/index.js';
import { adapter } from '../../src/adapters/index.js';
import { KNOWN_STANDALONE_MACROS } from '../../src/lib/standalone-macros.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

test('arcaneShot collection is properly exported on effect object', () => {
    assert.ok(effect.arcaneShot, 'eskie.effect.arcaneShot must exist');
    const expectedArrows = [
        'banishingArrow',
        'beguilingArrow',
        'burstingArrow',
        'enfeeblingArrow',
        'graspingArrow',
        'piercingArrow',
        'shadowArrow'
    ];

    for (const arrowName of expectedArrows) {
        const item = effect.arcaneShot[arrowName];
        assert.ok(item, `arcaneShot.${arrowName} must exist`);
        assert.equal(typeof item.create, 'function', `arcaneShot.${arrowName}.create must be a function`);
        assert.equal(typeof item.play, 'function', `arcaneShot.${arrowName}.play must be a function`);
        assert.equal(typeof item.stop, 'function', `arcaneShot.${arrowName}.stop must be a function`);
        assert.ok(item.default_config, `arcaneShot.${arrowName}.default_config must exist`);
        assert.ok(item.default_config.sound, `arcaneShot.${arrowName}.default_config.sound must exist`);
        assert.equal(typeof item.default_config.sound.enable, 'boolean', `arcaneShot.${arrowName}.default_config.sound.enable must be boolean`);
    }
});

test('battlemaster collection is properly exported on effect object under battlemaster and battleMaster alias', () => {
    assert.ok(effect.battlemaster, 'eskie.effect.battlemaster must exist');
    assert.equal(effect.battlemaster, effect.battleMaster, 'battleMaster alias must point to battlemaster');

    const expectedManeuvers = [
        'baitAndSwitch',
        'feintingAttack',
        'lungingAttack',
        'parry',
        'pushingAttack',
        'sweepingAttack',
        'tripAttack'
    ];

    for (const maneuverName of expectedManeuvers) {
        const item = effect.battlemaster[maneuverName];
        assert.ok(item, `battlemaster.${maneuverName} must exist`);
        assert.equal(typeof item.create, 'function', `battlemaster.${maneuverName}.create must be a function`);
        assert.equal(typeof item.play, 'function', `battlemaster.${maneuverName}.play must be a function`);
        assert.equal(typeof item.stop, 'function', `battlemaster.${maneuverName}.stop must be a function`);
        assert.ok(item.default_config, `battlemaster.${maneuverName}.default_config must exist`);
        assert.ok(item.default_config.sound, `battlemaster.${maneuverName}.default_config.sound must exist`);
        assert.equal(typeof item.default_config.sound.enable, 'boolean', `battlemaster.${maneuverName}.default_config.sound.enable must be boolean`);
    }
});

test('all imported spells exist on effect object with create, play, stop, and default_config', () => {
    const expectedSpells = [
        'burningHands',
        'cloudkill',
        'contagion',
        'fireball',
        'mirrorImage',
        'rayOfSickness',
        'scorchingRay',
        'shockingGrasp',
        'wallOfFire',
        'web'
    ];

    for (const spellName of expectedSpells) {
        const item = effect[spellName];
        assert.ok(item, `effect.${spellName} must exist`);
        assert.equal(typeof item.create, 'function', `effect.${spellName}.create must be a function`);
        assert.equal(typeof item.play, 'function', `effect.${spellName}.play must be a function`);
        assert.equal(typeof item.stop, 'function', `effect.${spellName}.stop must be a function`);
        assert.ok(item.default_config, `effect.${spellName}.default_config must exist`);
    }
});

test('mirrorImage maintains both v1 and v2 versions like rage', () => {
    const { mirrorImage } = effect;
    assert.ok(mirrorImage.v1, 'mirrorImage.v1 must exist');
    assert.equal(typeof mirrorImage.v1.create, 'function');
    assert.equal(typeof mirrorImage.v1.play, 'function');
    assert.equal(typeof mirrorImage.v1.stop, 'function');

    assert.ok(mirrorImage.v2, 'mirrorImage.v2 must exist');
    assert.equal(typeof mirrorImage.v2.create, 'function');
    assert.equal(typeof mirrorImage.v2.play, 'function');
    assert.equal(typeof mirrorImage.v2.stop, 'function');

    assert.ok(mirrorImage.default_config.config_v1, 'mirrorImage must have config_v1');
    assert.ok(mirrorImage.default_config.config_v2, 'mirrorImage must have config_v2');
});

test('standalone macros exist, have valid syntax, and are registered in KNOWN_STANDALONE_MACROS', () => {
    const macroFiles = [
        'bait-and-switch.js',
        'banishing-arrow.js',
        'beguiling-arrow.js',
        'burning-hands.js',
        'bursting-arrow.js',
        'cloudkill.js',
        'contagion.js',
        'enfeebling-arrow.js',
        'feinting-attack.js',
        'fireball.js',
        'grasping-arrow.js',
        'lunging-attack.js',
        'mirror-image.js',
        'parry.js',
        'piercing-arrow.js',
        'pushing-attack.js',
        'ray-of-sickness.js',
        'scorching-ray.js',
        'shadow-arrow.js',
        'shocking-grasp.js',
        'sweeping-attack.js',
        'trip-attack.js',
        'wall-of-fire.js',
        'web.js'
    ];

    const standaloneDir = path.join(rootDir, 'src/standalone-macros');

    for (const file of macroFiles) {
        const filePath = path.join(standaloneDir, file);
        assert.ok(fs.existsSync(filePath), `Standalone macro ${file} must exist`);
        const content = fs.readFileSync(filePath, 'utf8');
        assert.ok(content.length > 50, `Standalone macro ${file} must not be empty`);

        // Check syntax validity using vm.Script compilation
        // Wrapped in async function to support top-level await in Foundry macros
        assert.doesNotThrow(() => {
            new vm.Script(`(async () => {\n${content}\n})()`, { filename: file });
        }, `Syntax error in ${file}`);

        // Check inclusion in KNOWN_STANDALONE_MACROS
        assert.ok(KNOWN_STANDALONE_MACROS.includes(file), `${file} must be included in KNOWN_STANDALONE_MACROS`);
    }

    // Check that KNOWN_STANDALONE_MACROS is sorted alphabetically
    const sorted = [...KNOWN_STANDALONE_MACROS].sort((a, b) => a.localeCompare(b));
    assert.deepEqual(KNOWN_STANDALONE_MACROS, sorted, 'KNOWN_STANDALONE_MACROS must be in alphabetical order');
});

test('banishingArrow and enfeeblingArrow do not restore visibility or end effects inside create()', () => {
    const banishingModule = fs.readFileSync(path.join(rootDir, 'src/animation/effects/arcane-shot/banishing-arrow.ts'), 'utf8');
    const banishingMacro = fs.readFileSync(path.join(rootDir, 'src/standalone-macros/banishing-arrow.js'), 'utf8');
    assert.doesNotMatch(banishingModule, /\.thenDo\s*\(\s*function\s*\(\s*\)\s*\{[\s\S]*?\.show\(\)/, 'banishingArrow module create() must not unhide target in thenDo');
    assert.doesNotMatch(banishingMacro, /\.thenDo\s*\(\s*function\s*\(\s*\)\s*\{[\s\S]*?\.show\(\)/, 'banishing-arrow macro must not unhide target in thenDo');

    const enfeeblingModule = fs.readFileSync(path.join(rootDir, 'src/animation/effects/arcane-shot/enfeebling-arrow.ts'), 'utf8');
    const enfeeblingMacro = fs.readFileSync(path.join(rootDir, 'src/standalone-macros/enfeebling-arrow.js'), 'utf8');
    assert.doesNotMatch(enfeeblingModule, /\.thenDo\s*\(\s*function\s*\(\s*\)\s*\{[\s\S]*?endEffects/, 'enfeeblingArrow module create() must not prematurely end effects in thenDo');
    assert.doesNotMatch(enfeeblingMacro, /\.thenDo\s*\(\s*function\s*\(\s*\)\s*\{[\s\S]*?endEffects/, 'enfeebling-arrow macro must not prematurely end effects in thenDo');
});

test('all KNOWN_STANDALONE_MACROS match disk files 1:1', () => {
    const standaloneDir = path.join(rootDir, 'src/standalone-macros');
    const diskFiles = fs.readdirSync(standaloneDir).filter(f => f.endsWith('.js'));
    const knownSet = new Set(KNOWN_STANDALONE_MACROS);

    for (const diskFile of diskFiles) {
        assert.ok(knownSet.has(diskFile), `${diskFile} on disk must be in KNOWN_STANDALONE_MACROS`);
    }

    for (const knownFile of KNOWN_STANDALONE_MACROS) {
        const filePath = path.join(standaloneDir, knownFile);
        assert.ok(fs.existsSync(filePath), `Known macro ${knownFile} must exist on disk`);
    }
});

test('no animation effect module or standalone macro embeds Sequencer crosshairs or callbacks', () => {
    function getJsFiles(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const files = [];
        for (const entry of entries) {
            const res = path.resolve(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...getJsFiles(res));
            } else if (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) {
                files.push(res);
            }
        }
        return files;
    }

    const effectFiles = getJsFiles(path.join(rootDir, 'src/animation/effects'));
    const macroFiles = getJsFiles(path.join(rootDir, 'src/standalone-macros'));
    const allFiles = [...effectFiles, ...macroFiles];

    for (const filePath of allFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relPath = path.relative(rootDir, filePath);
        assert.doesNotMatch(
            content,
            /\.crosshair\s*\(/,
            `${relPath} must not use .crosshair(); targeting reticles are handled exclusively by Bakana's Better Crosshairs`
        );
        assert.doesNotMatch(
            content,
            /Sequencer\.Crosshair\.CALLBACKS/,
            `${relPath} must not use Sequencer.Crosshair.CALLBACKS; targeting reticles are handled exclusively by Bakana's Better Crosshairs`
        );
    }
});

test('no animation effect module or standalone macro animates position on sprite instead of spriteContainer', () => {
    function getJsFiles(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const files = [];
        for (const entry of entries) {
            const res = path.resolve(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...getJsFiles(res));
            } else if (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) {
                files.push(res);
            }
        }
        return files;
    }

    const effectFiles = getJsFiles(path.join(rootDir, 'src/animation/effects'));
    const macroFiles = getJsFiles(path.join(rootDir, 'src/standalone-macros'));
    const allFiles = [...effectFiles, ...macroFiles];

    for (const filePath of allFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relPath = path.relative(rootDir, filePath);
        assert.doesNotMatch(
            content,
            /\.animateProperty\s*\(\s*(['"])sprite\1\s*,\s*(['"])position\./,
            `${relPath} must animate position on 'spriteContainer' instead of 'sprite'`
        );
    }
});

test('no animation effect module or standalone macro uses globalThis', () => {
    function getJsFiles(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const files = [];
        for (const entry of entries) {
            const res = path.resolve(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...getJsFiles(res));
            } else if (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) {
                files.push(res);
            }
        }
        return files;
    }

    const effectFiles = getJsFiles(path.join(rootDir, 'src/animation/effects'));
    const macroFiles = getJsFiles(path.join(rootDir, 'src/standalone-macros'));
    const allFiles = [...effectFiles, ...macroFiles];

    for (const filePath of allFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relPath = path.relative(rootDir, filePath);
        assert.doesNotMatch(
            content,
            /\bglobalThis\b/,
            `${relPath} must not use globalThis`
        );
    }
});

test('all active-effect modules export standard interfaces and sound configurations', async () => {
    const { banishment } = await import('../../src/animation/effects/active-effect/banishment.js');
    const { bless } = await import('../../src/animation/effects/active-effect/bless.js');
    const { blurredVision } = await import('../../src/animation/effects/active-effect/blurred-vision.js');
    const { charmed } = await import('../../src/animation/effects/active-effect/charmed.js');
    const { dash } = await import('../../src/animation/effects/active-effect/dash.js');
    const { drunk } = await import('../../src/animation/effects/active-effect/drunk.js');
    const { enlargeReduce } = await import('../../src/animation/effects/active-effect/enlarge-reduce.js');
    const { entangled } = await import('../../src/animation/effects/active-effect/entangled.js');
    const { fightingSpirit } = await import('../../src/animation/effects/active-effect/fighting-spirit.js');
    const { fireShield } = await import('../../src/animation/effects/active-effect/fire-shield.js');
    const { hide } = await import('../../src/animation/effects/active-effect/hide.js');
    const { levitation } = await import('../../src/animation/effects/active-effect/levitation.js');
    const { mirrorImage } = await import('../../src/animation/effects/active-effect/mirror-image.js');
    const { petrified } = await import('../../src/animation/effects/active-effect/petrified.js');
    const { rage } = await import('../../src/animation/effects/active-effect/rage/index.js');
    const { totemicAttunement } = await import('../../src/animation/effects/active-effect/rage/totemic-attunement/index.js');
    const { sandevistan } = await import('../../src/animation/effects/active-effect/sandevistan.js');
    const { shapechange } = await import('../../src/animation/effects/active-effect/shapechange.js');
    const { speakWithDead } = await import('../../src/animation/effects/active-effect/speakWithDead.js');
    const { stepOfTheWindMove } = await import('../../src/animation/effects/active-effect/step-of-the-wind.js');
    const { strengthBeforeDeath } = await import('../../src/animation/effects/active-effect/strength-before-death.js');

    // Banishment
    assert.ok(banishment.banish, 'banishment.banish must exist');
    assert.equal(typeof banishment.banish.create, 'function');
    assert.equal(typeof banishment.banish.play, 'function');
    assert.equal(typeof banishment.banish.stop, 'function');
    assert.ok(banishment.default_config.sound, 'banishment sound must exist');

    // Bless
    assert.ok(bless.cast, 'bless.cast must exist');
    assert.ok(bless.effect, 'bless.effect must exist');
    assert.equal(typeof bless.create, 'function');
    assert.equal(typeof bless.play, 'function');
    assert.ok(bless.default_config.sound.cast, 'bless cast sound must exist');
    assert.ok(bless.default_config.sound.target, 'bless target sound must exist');

    // Blurred Vision
    assert.equal(typeof blurredVision.create, 'function');
    assert.equal(typeof blurredVision.play, 'function');
    assert.equal(typeof blurredVision.stop, 'function');
    assert.ok(blurredVision.default_config.sound, 'blurredVision DEFAULT_CONFIG must have sound');

    // Charmed
    assert.equal(typeof charmed.create, 'function');
    assert.equal(typeof charmed.play, 'function');
    assert.equal(typeof charmed.stop, 'function');
    assert.ok(charmed.default_config.sound, 'charmed DEFAULT_CONFIG must have sound');

    // Dash
    assert.equal(typeof dash.create, 'function');
    assert.equal(typeof dash.play, 'function');
    assert.equal(typeof dash.stop, 'function');
    assert.ok(dash.default_config.sound, 'dash DEFAULT_CONFIG must have sound');

    // Drunk
    assert.equal(typeof drunk.create, 'function');
    assert.equal(typeof drunk.play, 'function');
    assert.equal(typeof drunk.stop, 'function');
    assert.ok(drunk.default_config.sound, 'drunk DEFAULT_CONFIG must have sound');

    // Enlarge Reduce
    assert.ok(enlargeReduce.enlarge, 'enlargeReduce.enlarge must exist');
    assert.ok(enlargeReduce.reduce, 'enlargeReduce.reduce must exist');
    assert.ok(enlargeReduce.default_config.sound.enlarge, 'enlargeReduce enlarge sound must exist');
    assert.ok(enlargeReduce.default_config.sound.reduce, 'enlargeReduce reduce sound must exist');

    // Entangled
    assert.equal(typeof entangled.create, 'function');
    assert.equal(typeof entangled.play, 'function');
    assert.equal(typeof entangled.stop, 'function');
    assert.ok(entangled.default_config.sound, 'entangled DEFAULT_CONFIG must have sound');

    // Fighting Spirit
    assert.equal(typeof fightingSpirit.create, 'function');
    assert.equal(typeof fightingSpirit.play, 'function');
    assert.equal(typeof fightingSpirit.stop, 'function');
    assert.ok(fightingSpirit.default_config.sound, 'fightingSpirit DEFAULT_CONFIG must have sound');

    // Fire Shield
    assert.equal(typeof fireShield.create, 'function');
    assert.equal(typeof fireShield.play, 'function');
    assert.equal(typeof fireShield.stop, 'function');
    assert.ok(fireShield.default_config.sound, 'fireShield DEFAULT_CONFIG must have sound');

    // Hide
    assert.equal(typeof hide.create, 'function');
    assert.equal(typeof hide.play, 'function');
    assert.equal(typeof hide.stop, 'function');
    assert.ok(hide.default_config.sound, 'hide DEFAULT_CONFIG must have sound');

    // Levitation
    assert.equal(typeof levitation.create, 'function');
    assert.equal(typeof levitation.play, 'function');
    assert.equal(typeof levitation.stop, 'function');
    assert.ok(levitation.default_config.sound, 'levitation DEFAULT_CONFIG must have sound');

    // Mirror Image
    assert.ok(mirrorImage.v1, 'mirrorImage.v1 must exist');
    assert.ok(mirrorImage.v2, 'mirrorImage.v2 must exist');
    assert.ok(mirrorImage.default_config.config_v1.sound, 'mirrorImage v1 sound must exist');
    assert.ok(mirrorImage.default_config.config_v2.sound, 'mirrorImage v2 sound must exist');

    // Petrified
    assert.equal(typeof petrified.create, 'function');
    assert.equal(typeof petrified.play, 'function');
    assert.equal(typeof petrified.stop, 'function');
    assert.ok(petrified.default_config.sound, 'petrified DEFAULT_CONFIG must have sound');

    // Rage & Totemic Attunement
    assert.ok(rage.v1 && rage.v2 && rage.v3 && rage.v4 && rage.v5, 'rage versions 1-5 must exist');
    assert.ok(totemicAttunement.bear, 'totemicAttunement.bear must exist');
    assert.ok(totemicAttunement.eagle, 'totemicAttunement.eagle must exist');
    assert.ok(totemicAttunement.elk, 'totemicAttunement.elk must exist');
    assert.ok(totemicAttunement.tiger, 'totemicAttunement.tiger must exist');
    assert.ok(totemicAttunement.wolf, 'totemicAttunement.wolf must exist');
    assert.ok(totemicAttunement.bear.default_config.sound, 'bear sound must exist');
    assert.ok(totemicAttunement.eagle.default_config.sound, 'eagle sound must exist');
    assert.ok(totemicAttunement.elk.default_config.sound, 'elk sound must exist');
    assert.ok(totemicAttunement.tiger.default_config.sound, 'tiger sound must exist');
    assert.ok(totemicAttunement.wolf.default_config.sound, 'wolf sound must exist');

    // Sandevistan
    assert.equal(typeof sandevistan.create, 'function');
    assert.equal(typeof sandevistan.play, 'function');
    assert.equal(typeof sandevistan.stop, 'function');
    assert.ok(sandevistan.default_config.sound, 'sandevistan DEFAULT_CONFIG must have sound');

    // Shapechange
    assert.ok(shapechange.shapechange, 'shapechange.shapechange must exist');
    assert.ok(shapechange.revert, 'shapechange.revert must exist');
    assert.ok(shapechange.default_config.sound, 'shapechange DEFAULT_CONFIG must have sound');

    // Speak with Dead
    assert.equal(typeof speakWithDead.create, 'function');
    assert.equal(typeof speakWithDead.play, 'function');
    assert.equal(typeof speakWithDead.stop, 'function');
    assert.ok(speakWithDead.default_config.sound, 'speakWithDead DEFAULT_CONFIG must have sound');

    // Step of the Wind
    assert.equal(typeof stepOfTheWindMove.create, 'function');
    assert.equal(typeof stepOfTheWindMove.play, 'function');
    assert.equal(typeof stepOfTheWindMove.stop, 'function');
    assert.ok(stepOfTheWindMove.default_config.sound, 'stepOfTheWindMove DEFAULT_CONFIG must have sound');

    // Strength Before Death
    assert.equal(typeof strengthBeforeDeath.create, 'function');
    assert.equal(typeof strengthBeforeDeath.play, 'function');
    assert.equal(typeof strengthBeforeDeath.stop, 'function');
    assert.ok(strengthBeforeDeath.default_config.sound, 'strengthBeforeDeath DEFAULT_CONFIG must have sound');
});

test('tashasCausticBrew uses copySprite and applies counter token rotation', async () => {
    let copySpriteCalledWith = null;
    let capturedSpriteRotation = null;
    let fromCalled = false;
    const origSequence = globalThis.Sequence;
    globalThis.Sequence = class MockCausticSequence {
        constructor() {
            const handler = {
                get(_t, prop) {
                    if (prop === 'copySprite') {
                        return (tok) => {
                            copySpriteCalledWith = tok;
                            return proxy;
                        };
                    }
                    if (prop === 'spriteRotation') {
                        return (rot) => {
                            capturedSpriteRotation = rot;
                            return proxy;
                        };
                    }
                    if (prop === 'from') {
                        return () => {
                            fromCalled = true;
                            throw new Error('Sequence.effect().from is not a function');
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
    };

    game.modules.set('jb2a_patreon', { id: 'jb2a_patreon', active: true });
    game.modules.set('eskie-effects', { id: 'eskie-effects', active: true });
    try {
        const mockCaster = { id: 'c1', name: 'Wizard', document: { rotation: 0, width: 1 }, center: { x: 100, y: 100 } };
        const mockTarget = {
            id: 't1',
            name: 'Goblin',
            document: { width: 1, rotation: 45, texture: { scaleX: 1 } },
            center: { x: 200, y: 200 }
        };

        const seq = await effect.tashasCausticBrew.target.create(mockCaster, { targets: [mockTarget] });
        assert.ok(seq, 'tashasCausticBrew.create must return a Sequence');
        assert.equal(fromCalled, false, '.from must not be called');
        assert.equal(copySpriteCalledWith, mockTarget, '.copySprite must be called with target');
        assert.equal(capturedSpriteRotation, -45, '.spriteRotation must be -45 for a 45 degree rotated target');
    } finally {
        globalThis.Sequence = origSequence;
        game.modules.delete('jb2a_patreon');
        game.modules.delete('eskie-effects');
    }
});

test('tashasCausticBrew DEFAULT_CONFIG defines phased sound sections and registers at 0.1.2', async () => {
    const config = effect.tashasCausticBrew.default_config;
    assert.ok(config.sound, 'sound config must exist');
    assert.ok(config.sound.cast, 'cast sound must exist');
    assert.equal(typeof config.sound.cast.enable, 'boolean');
    assert.ok(config.sound.stream, 'stream sound must exist');
    assert.equal(typeof config.sound.stream.enable, 'boolean');
    assert.equal(config.sound.stream.delay, 1700);
    assert.ok(config.sound.burn, 'burn sound must exist');
    assert.equal(typeof config.sound.burn.enable, 'boolean');
    assert.equal(config.sound.burn.delay, 2400);

    const aaMenu = adapter.autorec.aa.menu;
    const entry = aaMenu.templatefx.find(e => e.label === "Tasha's Caustic Brew");
    assert.ok(entry, "Tasha's Caustic Brew must be in template menu");
    assert.equal(entry.metaData.version, '0.1.2', 'autorec version must be 0.1.2');
});
