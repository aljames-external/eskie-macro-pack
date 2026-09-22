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

test('tashasCausticBrew uses Sequencer 4.3.0+ sequence.motion(target).noise() for caustic brew acid burn shudder instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/template/tashas-caustic-brew.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/tashas-caustic-brew.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'tashas-caustic-brew.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'tashas-caustic-brew.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'tashas-caustic-brew.ts must use .motion()');
    assert.match(tsContent, /\.motion\(target\)/, 'tashas-caustic-brew.ts must use .motion(target)');
    assert.match(tsContent, /\.noise\(/, 'tashas-caustic-brew.ts must use .noise(');

    assert.doesNotMatch(jsContent, /copySprite/, 'tashas-caustic-brew.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'tashas-caustic-brew.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'tashas-caustic-brew.js must use .motion()');
    assert.match(jsContent, /\.motion\(target\)/, 'tashas-caustic-brew.js must use .motion(target)');
    assert.match(jsContent, /\.noise\(/, 'tashas-caustic-brew.js must use .noise(');
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

test('pushingAttack uses Sequencer 4.3.0+ .motion() animation instead of copySprite or opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/battlemaster/pushing-attack.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/pushing-attack.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'pushing-attack.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'pushing-attack.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'pushing-attack.ts must use .motion()');
    assert.match(tsContent, /sequence\.motion\(target/, 'pushing-attack.ts must use sequence.motion()');
    assert.match(tsContent, /\.(moveBy|moveTo)\(/, 'pushing-attack.ts must move target');

    assert.doesNotMatch(jsContent, /copySprite/, 'pushing-attack.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'pushing-attack.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'pushing-attack.js must use .motion()');
    assert.match(jsContent, /sequence\.motion\(target/, 'pushing-attack.js must use sequence.motion()');
    assert.match(jsContent, /\.(moveBy|moveTo)\(/, 'pushing-attack.js must move target');
});

test('lungingAttack uses Sequencer 4.3.0+ sequence.motion(token).moveTo() API', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/battlemaster/lunging-attack.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/lunging-attack.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'lunging-attack.ts must not hide token with opacity(0)');
    assert.match(tsContent, /sequence\.motion\(token\)/, 'lunging-attack.ts must use sequence.motion(token)');
    assert.match(tsContent, /\.moveTo\(/, 'lunging-attack.ts must use .moveTo()');

    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'lunging-attack.js must not hide token with opacity(0)');
    assert.match(jsContent, /sequence\.motion\(token\)/, 'lunging-attack.js must use sequence.motion(token)');
    assert.match(jsContent, /\.moveTo\(/, 'lunging-attack.js must use .moveTo()');
});

test('stormingDashStrikes uses Sequencer 4.3.0+ sequence.motion(token).moveTo() API for dash strikes movement', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/token/storming-dash-strikes.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/storming-dash-strikes.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'storming-dash-strikes.ts must not hide token with opacity(0)');
    assert.match(tsContent, /stepSeq\.motion\(source\)/, 'storming-dash-strikes.ts must use stepSeq.motion(source)');
    assert.match(tsContent, /\.moveTo\(endPos/, 'storming-dash-strikes.ts must use .moveTo(endPos)');

    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'storming-dash-strikes.js must not hide token with opacity(0)');
    assert.match(jsContent, /stepSeq\.motion\(source\)/, 'storming-dash-strikes.js must use stepSeq.motion(source)');
    assert.match(jsContent, /\.moveTo\(endPos/, 'storming-dash-strikes.js must use .moveTo(endPos)');
});

test('psychicTeleportation uses Sequencer 4.3.0+ sequence.motion(token).moveTo() API', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/template/psychic-teleportation.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/psychic-teleportation.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'psychic-teleportation.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'psychic-teleportation.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(token\)/, 'psychic-teleportation.ts must use .motion(token)');
    assert.match(tsContent, /\.moveTo\(position/, 'psychic-teleportation.ts must use .moveTo(position)');

    assert.doesNotMatch(jsContent, /copySprite/, 'psychic-teleportation.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'psychic-teleportation.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(token\)/, 'psychic-teleportation.js must use .motion(token)');
    assert.match(jsContent, /\.moveTo\(position/, 'psychic-teleportation.js must use .moveTo(position)');
});


test('vortexWarp uses Sequencer 4.3.0+ sequence.motion(target).moveTo() API for teleport movement', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/target/vortex-warp.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/vortex-warp.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'vortex-warp.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'vortex-warp.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'vortex-warp.ts must use .motion()');
    assert.match(tsContent, /sequence\.motion\(target\)/, 'vortex-warp.ts must use sequence.motion(target)');
    assert.match(tsContent, /\.moveTo\(/, 'vortex-warp.ts must use .moveTo()');

    assert.doesNotMatch(jsContent, /copySprite/, 'vortex-warp.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'vortex-warp.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'vortex-warp.js must use .motion()');
    assert.match(jsContent, /sequence\.motion\(target\)/, 'vortex-warp.js must use sequence.motion(target)');
    assert.match(jsContent, /\.moveTo\(/, 'vortex-warp.js must use .moveTo()');
});

test('baitAndSwitch uses Sequencer 4.3.0+ sequence.motion(token).moveTo() and sequence.motion(target).moveTo() API for position swap', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/battlemaster/bait-and-switch.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/bait-and-switch.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'bait-and-switch.ts must not hide token with opacity(0)');
    assert.match(tsContent, /sequence\.motion\(token\)/, 'bait-and-switch.ts must use sequence.motion(token)');
    assert.match(tsContent, /sequence\.motion\((target|trg)\)/, 'bait-and-switch.ts must use sequence.motion(target)');
    assert.match(tsContent, /\.moveTo\(/, 'bait-and-switch.ts must use .moveTo()');

    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'bait-and-switch.js must not hide token with opacity(0)');
    assert.match(jsContent, /sequence\.motion\(token\)/, 'bait-and-switch.js must use sequence.motion(token)');
    assert.match(jsContent, /sequence\.motion\(target\)/, 'bait-and-switch.js must use sequence.motion(target)');
    assert.match(jsContent, /\.moveTo\(/, 'bait-and-switch.js must use .moveTo()');
});

test('teleportIn and teleport macro use Sequencer 4.3.0+ sequence.motion(token).moveTo() and sequence.motion(target).moveTo() instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/template/teleport/teleportIn.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/teleport.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'teleportIn.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'teleportIn.ts must not hide token with opacity(0)');
    assert.doesNotMatch(tsContent, /teleportTo/, 'teleportIn.ts must not use teleportTo');
    assert.match(tsContent, /sequence\.motion\(token\)/, 'teleportIn.ts must use sequence.motion(token)');
    assert.match(tsContent, /sequence\.motion\(target\)/, 'teleportIn.ts must use sequence.motion(target)');
    assert.match(tsContent, /\.moveTo\(/, 'teleportIn.ts must use .moveTo()');

    assert.doesNotMatch(jsContent, /copySprite/, 'teleport.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'teleport.js must not hide token with opacity(0)');
    assert.doesNotMatch(jsContent, /teleportTo/, 'teleport.js must not use teleportTo');
    assert.match(jsContent, /sequence\.motion\(token\)/, 'teleport.js must use sequence.motion(token)');
    assert.match(jsContent, /sequence\.motion\(target\)/, 'teleport.js must use sequence.motion(target)');
    assert.match(jsContent, /\.moveTo\(/, 'teleport.js must use .moveTo()');
});

test('stepOfTheWindJump uses Sequencer 4.3.0+ sequence.motion(token).moveTo() with arc: 0.8 for jump trajectory', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/template/step-of-the-wind-jump.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/step-of-the-wind-jump.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'step-of-the-wind-jump.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(token\)/, 'step-of-the-wind-jump.ts must use .motion(token)');
    assert.match(tsContent, /\.moveTo\(position,\s*\{[\s\S]*arc:\s*0\.8/, 'step-of-the-wind-jump.ts must use .moveTo() with arc: 0.8');

    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'step-of-the-wind-jump.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(token\)/, 'step-of-the-wind-jump.js must use .motion(token)');
    assert.match(jsContent, /\.moveTo\(position,\s*\{[\s\S]*arc:\s*0\.8/, 'step-of-the-wind-jump.js must use .moveTo() with arc: 0.8');
});

test('enlargeReduce uses Sequencer 4.3.0+ sequence.motion(token).scaleTo() API for scale animation', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/active-effect/enlarge-reduce.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/enlarge-reduce.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'enlarge-reduce.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'enlarge-reduce.ts must not hide token with opacity(0)');
    assert.doesNotMatch(tsContent, /teleportTo/, 'enlarge-reduce.ts must not use teleportTo');
    assert.match(tsContent, /\.motion\(token\)/, 'enlarge-reduce.ts must use .motion(token)');
    assert.match(tsContent, /\.scaleTo\(/, 'enlarge-reduce.ts must use .scaleTo()');

    assert.doesNotMatch(jsContent, /copySprite/, 'enlarge-reduce.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'enlarge-reduce.js must not hide token with opacity(0)');
    assert.doesNotMatch(jsContent, /teleportTo/, 'enlarge-reduce.js must not use teleportTo');
    assert.match(jsContent, /\.motion\(token\)/, 'enlarge-reduce.js must use .motion(token)');
    assert.match(jsContent, /\.scaleTo\(/, 'enlarge-reduce.js must use .scaleTo()');
});

test('iaijutsuStrike uses Sequencer 4.3.0+ sequence.motion().moveTo() API for slash dash movement', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/token/iaijutsu-strike.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/iaijutsu-strike.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'iaijutsu-strike.ts must not hide token with opacity(0)');
    assert.doesNotMatch(tsContent, /teleportTo/, 'iaijutsu-strike.ts must not use teleportTo');
    assert.match(tsContent, /sequence\.motion\(source\)/, 'iaijutsu-strike.ts must use sequence.motion(source)');
    assert.match(tsContent, /\.moveTo\(dashDestination/, 'iaijutsu-strike.ts must use .moveTo(dashDestination)');

    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'iaijutsu-strike.js must not hide token with opacity(0)');
    assert.doesNotMatch(jsContent, /teleportTo/, 'iaijutsu-strike.js must not use teleportTo');
    assert.match(jsContent, /sequence\.motion\(token\)/, 'iaijutsu-strike.js must use sequence.motion(token)');
    assert.match(jsContent, /\.moveTo\(dashDestination/, 'iaijutsu-strike.js must use .moveTo(dashDestination)');
});


test('levitation uses Sequencer 4.3.0+ sequence.motion(token).oscillate() / .moveBy() hover motion', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/active-effect/levitation.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/levitation.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'levitation.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'levitation.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(token\)/, 'levitation.ts must use .motion(token)');
    assert.match(tsContent, /\.(moveBy|moveTo)\(/, 'levitation.ts must move token');
    assert.match(tsContent, /\.oscillate\(/, 'levitation.ts must use .oscillate()');

    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'levitation.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(token\)/, 'levitation.js must use .motion(token)');
    assert.match(jsContent, /\.(moveBy|moveTo)\(/, 'levitation.js must move token');
    assert.match(jsContent, /\.oscillate\(/, 'levitation.js must use .oscillate()');
});

test('fly uses Sequencer 4.3.0+ sequence.motion(token).moveBy({ y: -0.5 }, { gridUnits: true }).oscillate().persist() hover motion', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/token/fly.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/fly.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'fly.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(token\)/, 'fly.ts must use .motion(token)');
    assert.match(tsContent, /\.(moveBy|moveTo)\(/, 'fly.ts must move token');
    assert.match(tsContent, /\.oscillate\(/, 'fly.ts must use .oscillate()');

    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'fly.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(token\)/, 'fly.js must use .motion(token)');
    assert.match(jsContent, /\.(moveBy|moveTo)\(/, 'fly.js must move token');
    assert.match(jsContent, /\.oscillate\(/, 'fly.js must use .oscillate()');
});

test('wings uses Sequencer 4.3.0+ sequence.motion(token).moveBy({ y: -0.5 }, { gridUnits: true }).oscillate().persist() hover motion', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/token/wings.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/wings.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'wings.ts must not hide token with opacity(0)');
    assert.doesNotMatch(tsContent, /copySprite.*scaleToObject\(1/, 'wings.ts must not use copySprite body');
    assert.match(tsContent, /\.motion\(token\)/, 'wings.ts must use .motion(token)');
    assert.match(tsContent, /\.(moveBy|moveTo)\(/, 'wings.ts must move token');
    assert.match(tsContent, /\.oscillate\(/, 'wings.ts must use .oscillate()');

    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'wings.js must not hide token with opacity(0)');
    assert.doesNotMatch(jsContent, /copySprite.*scaleToObject\(1/, 'wings.js must not use copySprite body');
    assert.match(jsContent, /\.motion\(token\)/, 'wings.js must use .motion(token)');
    assert.match(jsContent, /\.(moveBy|moveTo)\(/, 'wings.js must move token');
    assert.match(jsContent, /\.oscillate\(/, 'wings.js must use .oscillate()');
});

test('banishment uses Sequencer 4.3.0+ sequence.motion(target).scaleTo(0).rotateBy(360) for target scaling/rotation instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/active-effect/banishment.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/banishment.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'banishment.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.animation\(\)/, 'banishment.ts must not hide token with animation()');
    assert.match(tsContent, /\.motion\(/, 'banishment.ts must use .motion()');
    assert.match(tsContent, /sequence\.motion\(target\)/, 'banishment.ts must use sequence.motion(target)');
    assert.match(tsContent, /\.scaleTo\(0\.01/, 'banishment.ts must use .scaleTo(0.01)');
    assert.match(tsContent, /\.rotateBy\(360/, 'banishment.ts must use .rotateBy(360)');

    assert.doesNotMatch(jsContent, /copySprite/, 'banishment.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.animation\(\)/, 'banishment.js must not hide token with animation()');
    assert.match(jsContent, /\.motion\(/, 'banishment.js must use .motion()');
    assert.match(jsContent, /sequence\.motion\(target\)/, 'banishment.js must use sequence.motion(target)');
    assert.match(jsContent, /\.scaleTo\(0\.01/, 'banishment.js must use .scaleTo(0.01)');
    assert.match(jsContent, /\.rotateBy\(360/, 'banishment.js must use .rotateBy(360)');
});

test('banishingArrow uses Sequencer 4.3.0+ sequence.motion(target).scaleTo(0.01).rotateBy(360) for target scaling/rotation instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/arcane-shot/banishing-arrow.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/banishing-arrow.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'banishing-arrow.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.animation\(\)/, 'banishing-arrow.ts must not hide token with animation()');
    assert.match(tsContent, /\.motion\(/, 'banishing-arrow.ts must use .motion()');
    assert.match(tsContent, /\.motion\(target\)/, 'banishing-arrow.ts must use .motion(target)');
    assert.match(tsContent, /\.scaleTo\(0\.01/, 'banishing-arrow.ts must use .scaleTo(0.01)');
    assert.match(tsContent, /\.rotateBy\(360/, 'banishing-arrow.ts must use .rotateBy(360)');

    assert.doesNotMatch(jsContent, /copySprite/, 'banishing-arrow.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.animation\(\)/, 'banishing-arrow.js must not hide token with animation()');
    assert.match(jsContent, /\.motion\(/, 'banishing-arrow.js must use .motion()');
    assert.match(jsContent, /\.motion\(target\)/, 'banishing-arrow.js must use .motion(target)');
    assert.match(jsContent, /\.scaleTo\(0\.01/, 'banishing-arrow.js must use .scaleTo(0.01)');
    assert.match(jsContent, /\.rotateBy\(360/, 'banishing-arrow.js must use .rotateBy(360)');
});

test('graspingArrow uses Sequencer 4.3.0+ sequence.motion(target).noise( for target vine grapple shudder instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/arcane-shot/grasping-arrow.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/grasping-arrow.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'grasping-arrow.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /loopProperty/, 'grasping-arrow.ts must not use loopProperty on copySprite');
    assert.match(tsContent, /\.motion\(/, 'grasping-arrow.ts must use .motion()');
    assert.match(tsContent, /\.motion\((target|trg)\)/, 'grasping-arrow.ts must use .motion(target)');
    assert.match(tsContent, /\.noise\(/, 'grasping-arrow.ts must use .noise(');

    assert.doesNotMatch(jsContent, /copySprite/, 'grasping-arrow.js must not use copySprite');
    assert.doesNotMatch(jsContent, /loopProperty/, 'grasping-arrow.js must not use loopProperty on copySprite');
    assert.match(jsContent, /\.motion\(/, 'grasping-arrow.js must use .motion()');
    assert.match(jsContent, /\.motion\(target\)/, 'grasping-arrow.js must use .motion(target)');
    assert.match(jsContent, /\.noise\(/, 'grasping-arrow.js must use .noise(');
});

test('thornWhip uses Sequencer 4.3.0+ sequence.motion(target).moveTo() for pulling target token instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/target/thorn-whip.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/thorn-whip.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'thorn-whip.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'thorn-whip.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'thorn-whip.ts must use .motion()');
    assert.match(tsContent, /seq\.motion\(target\)/, 'thorn-whip.ts must use seq.motion(target)');
    assert.match(tsContent, /\.moveTo\(/, 'thorn-whip.ts must use .moveTo()');

    assert.doesNotMatch(jsContent, /copySprite/, 'thorn-whip.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'thorn-whip.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'thorn-whip.js must use .motion()');
    assert.match(jsContent, /sequence\.motion\(target\)/, 'thorn-whip.js must use sequence.motion(target)');
    assert.match(jsContent, /\.moveTo\(/, 'thorn-whip.js must use .moveTo()');
});

test('hide uses Sequencer 4.3.0+ sequence.motion(token).fadeTo(0.25) for stealth fade instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/active-effect/hide.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/hide.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'hide.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'hide.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'hide.ts must use .motion()');
    assert.match(tsContent, /seq\.motion\(token\)/, 'hide.ts must use seq.motion(token)');
    assert.match(tsContent, /\.fadeTo\(0\.25/, 'hide.ts must use .fadeTo(0.25)');

    assert.doesNotMatch(jsContent, /copySprite/, 'hide.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'hide.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'hide.js must use .motion()');
    assert.match(jsContent, /sequence\.motion\(token\)/, 'hide.js must use sequence.motion(token)');
    assert.match(jsContent, /\.fadeTo\(0\.25/, 'hide.js must use .fadeTo(0.25)');
});

test('incorporeal uses Sequencer 4.3.0+ sequence.motion(token).oscillate().fadeTo(0.5) for incorporeal spirit phase instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/token/incorporeal/incorporeal.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/incorporeal.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'incorporeal.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'incorporeal.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'incorporeal.ts must use .motion()');
    assert.match(tsContent, /seq\.motion\(token\)/, 'incorporeal.ts must use seq.motion(token)');
    assert.match(tsContent, /\.oscillate\(/, 'incorporeal.ts must use .oscillate()');
    assert.match(tsContent, /\.fadeTo\(0\.5/, 'incorporeal.ts must use .fadeTo(0.5)');

    assert.doesNotMatch(jsContent, /copySprite/, 'incorporeal.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'incorporeal.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'incorporeal.js must use .motion()');
    assert.match(jsContent, /seq\.motion\(token\)/, 'incorporeal.js must use seq.motion(token)');
    assert.match(jsContent, /\.oscillate\(/, 'incorporeal.js must use .oscillate()');
    assert.match(jsContent, /\.fadeTo\(0\.5/, 'incorporeal.js must use .fadeTo(0.5)');
});

test('ghostWalk uses Sequencer 4.3.0+ sequence.motion(token).oscillate().fadeTo(0.65) for incorporeal spirit hover instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/token/ghost-walk.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/ghost-walk.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'ghost-walk.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'ghost-walk.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'ghost-walk.ts must use .motion()');
    assert.match(tsContent, /seq\.motion\(token\)/, 'ghost-walk.ts must use seq.motion(token)');
    assert.match(tsContent, /\.oscillate\(/, 'ghost-walk.ts must use .oscillate()');
    assert.match(tsContent, /\.fadeTo\(0\.65/, 'ghost-walk.ts must use .fadeTo(0.65)');

    assert.doesNotMatch(jsContent, /copySprite/, 'ghost-walk.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'ghost-walk.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'ghost-walk.js must use .motion()');
    assert.match(jsContent, /\.motion\(token\)/, 'ghost-walk.js must use .motion(token)');
    assert.match(jsContent, /\.oscillate\(/, 'ghost-walk.js must use .oscillate()');
    assert.match(jsContent, /\.fadeTo\(0\.65/, 'ghost-walk.js must use .fadeTo(0.65)');
});

test('drainingTouch uses Sequencer 4.3.0+ sequence.motion(target).noise( for draining touch shudder instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/target/drainingTouch.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/draining-touch.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'drainingTouch.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'drainingTouch.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'drainingTouch.ts must use .motion()');
    assert.match(tsContent, /\.motion\(target\)/, 'drainingTouch.ts must use .motion(target)');
    assert.match(tsContent, /\.noise\(/, 'drainingTouch.ts must use .noise(');

    assert.doesNotMatch(jsContent, /copySprite/, 'draining-touch.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'draining-touch.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'draining-touch.js must use .motion()');
    assert.match(jsContent, /sequence\.motion\(target\)/, 'draining-touch.js must use sequence.motion(target)');
    assert.match(jsContent, /\.noise\(/, 'draining-touch.js must use .noise(');
});

test('stunningStrike uses Sequencer 4.3.0+ sequence.motion(target).oscillate() for stunning strike stunned wobble instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/target/stunning-strike.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/stunning-strike.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'stunning-strike.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'stunning-strike.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'stunning-strike.ts must use .motion()');
    assert.match(tsContent, /\.motion\((target|trg)\)/, 'stunning-strike.ts must use .motion(target) or .motion(trg)');
    assert.match(tsContent, /\.oscillate\(/, 'stunning-strike.ts must use .oscillate()');

    assert.doesNotMatch(jsContent, /copySprite/, 'stunning-strike.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'stunning-strike.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'stunning-strike.js must use .motion()');
    assert.match(jsContent, /\.motion\(target\)/, 'stunning-strike.js must use .motion(target)');
    assert.match(jsContent, /\.oscillate\(/, 'stunning-strike.js must use .oscillate()');
});

test('channelDivinityDreadAspect uses Sequencer 4.3.0+ sequence.motion(target).noise( for dread aspect fear shudder instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/token/channelDivinityDreadAspect.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/dread-aspect.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'channelDivinityDreadAspect.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'channelDivinityDreadAspect.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'channelDivinityDreadAspect.ts must use .motion()');
    assert.match(tsContent, /sequence\.motion\(target\)/, 'channelDivinityDreadAspect.ts must use sequence.motion(target)');
    assert.match(tsContent, /\.noise\(/, 'channelDivinityDreadAspect.ts must use .noise(');

    assert.doesNotMatch(jsContent, /copySprite/, 'dread-aspect.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'dread-aspect.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'dread-aspect.js must use .motion()');
    assert.match(jsContent, /sequence\.motion\(target\)/, 'dread-aspect.js must use sequence.motion(target)');
    assert.match(jsContent, /\.noise\(/, 'dread-aspect.js must use .noise(');
});

test('fingerOfDeath uses Sequencer 4.3.0+ sequence.motion(target).noise( for finger of death target death shudder instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/target/fingerOfDeath.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/finger-of-death.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'fingerOfDeath.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'fingerOfDeath.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'fingerOfDeath.ts must use .motion()');
    assert.match(tsContent, /\.motion\((target|trg)\)/, 'fingerOfDeath.ts must use .motion(target) or .motion(trg)');
    assert.match(tsContent, /\.noise\(/, 'fingerOfDeath.ts must use .noise(');

    assert.doesNotMatch(jsContent, /copySprite/, 'finger-of-death.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'finger-of-death.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'finger-of-death.js must use .motion()');
    assert.match(jsContent, /\.motion\(target\)/, 'finger-of-death.js must use .motion(target)');
    assert.match(jsContent, /\.noise\(/, 'finger-of-death.js must use .noise(');
});

test('rayOfSickness uses Sequencer 4.3.0+ sequence.motion(target).noise( for ray of sickness poison shudder instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/target/ray-of-sickness.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/ray-of-sickness.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'ray-of-sickness.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'ray-of-sickness.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'ray-of-sickness.ts must use .motion()');
    assert.match(tsContent, /\.motion\((target|trg)\)/, 'ray-of-sickness.ts must use .motion(target) or .motion(trg)');
    assert.match(tsContent, /\.noise\(/, 'ray-of-sickness.ts must use .noise(');

    assert.doesNotMatch(jsContent, /copySprite/, 'ray-of-sickness.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'ray-of-sickness.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'ray-of-sickness.js must use .motion()');
    assert.match(jsContent, /\.motion\(target\)/, 'ray-of-sickness.js must use .motion(target)');
    assert.match(jsContent, /\.noise\(/, 'ray-of-sickness.js must use .noise(');
});

test('rapidStrike uses Sequencer 4.3.0+ sequence.motion(token).moveBy() for rapid strike slash step instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/on-target/rapid-strike.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/rapid-strike.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'rapid-strike.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'rapid-strike.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'rapid-strike.ts must use .motion()');
    assert.match(tsContent, /\.motion\(token\)/, 'rapid-strike.ts must use .motion(token)');
    assert.match(tsContent, /\.moveBy\(/, 'rapid-strike.ts must use .moveBy()');

    assert.doesNotMatch(jsContent, /copySprite/, 'rapid-strike.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'rapid-strike.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'rapid-strike.js must use .motion()');
    assert.match(jsContent, /\.motion\(token\)/, 'rapid-strike.js must use .motion(token)');
    assert.match(jsContent, /\.moveBy\(/, 'rapid-strike.js must use .moveBy()');
});

test('flurryOfBlows uses Sequencer 4.3.0+ sequence.motion(token).moveBy() for flurry strike step instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/on-target/flurry-of-blows.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/flurry-of-blows.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'flurry-of-blows.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'flurry-of-blows.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'flurry-of-blows.ts must use .motion()');
    assert.match(tsContent, /\.motion\(token\)/, 'flurry-of-blows.ts must use .motion(token)');
    assert.match(tsContent, /\.moveBy\(/, 'flurry-of-blows.ts must use .moveBy()');

    assert.doesNotMatch(jsContent, /copySprite/, 'flurry-of-blows.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'flurry-of-blows.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'flurry-of-blows.js must use .motion()');
    assert.match(jsContent, /\.motion\(token\)/, 'flurry-of-blows.js must use .motion(token)');
    assert.match(jsContent, /\.moveBy\(/, 'flurry-of-blows.js must use .moveBy()');
});

test('laugh uses Sequencer 4.3.0+ sequence.motion(token).noise( for laughing wobble/shake motion instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/emote/laugh.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/laugh.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'laugh.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'laugh.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'laugh.ts must use .motion()');
    assert.match(tsContent, /\.motion\(token\)/, 'laugh.ts must use .motion(token)');
    assert.match(tsContent, /\.noise\(/, 'laugh.ts must use .noise(');

    assert.doesNotMatch(jsContent, /copySprite/, 'laugh.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'laugh.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'laugh.js must use .motion()');
    assert.match(jsContent, /\.motion\(token\)/, 'laugh.js must use .motion(token)');
    assert.match(jsContent, /\.noise\(/, 'laugh.js must use .noise(');
});

test('shockingGrasp uses Sequencer 4.3.0+ sequence.motion(target).noise( for shocking grasp spasm shudder instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/target/shocking-grasp.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/shocking-grasp.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'shocking-grasp.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'shocking-grasp.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'shocking-grasp.ts must use .motion()');
    assert.match(tsContent, /\.motion\((target|trg)\)/, 'shocking-grasp.ts must use .motion(target) or .motion(trg)');
    assert.match(tsContent, /\.noise\(/, 'shocking-grasp.ts must use .noise(');

    assert.doesNotMatch(jsContent, /copySprite/, 'shocking-grasp.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'shocking-grasp.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'shocking-grasp.js must use .motion()');
    assert.match(jsContent, /\.motion\(target\)/, 'shocking-grasp.js must use .motion(target)');
    assert.match(jsContent, /\.noise\(/, 'shocking-grasp.js must use .noise(');
});

test('sneakAttack uses Sequencer 4.3.0+ sequence.motion(token).moveBy() for sneak attack lunging step instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/on-target/sneak-attack.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/sneak-attack.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'sneak-attack.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'sneak-attack.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'sneak-attack.ts must use .motion()');
    assert.match(tsContent, /\.motion\(token\)/, 'sneak-attack.ts must use .motion(token)');
    assert.match(tsContent, /\.moveBy\(/, 'sneak-attack.ts must use .moveBy()');

    assert.doesNotMatch(jsContent, /copySprite/, 'sneak-attack.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'sneak-attack.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'sneak-attack.js must use .motion()');
    assert.match(jsContent, /\.motion\(token\)/, 'sneak-attack.js must use .motion(token)');
    assert.match(jsContent, /\.moveBy\(/, 'sneak-attack.js must use .moveBy()');
});

test('disintegrate uses Sequencer 4.3.0+ sequence.motion(target).scaleTo(0).fadeTo(0) for target dissolution shrink instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/target/disintegrate.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/disintegrate.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'disintegrate.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'disintegrate.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'disintegrate.ts must use .motion()');
    assert.match(tsContent, /\.motion\(target\)/, 'disintegrate.ts must use sequence.motion(target)');
    assert.match(tsContent, /\.scaleTo\(0\.01/, 'disintegrate.ts must use .scaleTo(0.01)');
    assert.match(tsContent, /\.fadeTo\(0\)/, 'disintegrate.ts must use .fadeTo(0)');

    assert.doesNotMatch(jsContent, /copySprite/, 'disintegrate.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'disintegrate.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'disintegrate.js must use .motion()');
    assert.match(jsContent, /\.motion\(target\)/, 'disintegrate.js must use sequence.motion(target)');
    assert.match(jsContent, /\.scaleTo\(0\.01/, 'disintegrate.js must use .scaleTo(0.01)');
    assert.match(jsContent, /\.fadeTo\(0\)/, 'disintegrate.js must use .fadeTo(0)');
});

test('hitTheDirt uses Sequencer 4.3.0+ sequence.motion(token).rotateTo(90).moveBy() for dive prone tilt instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/template/hit-the-dirt.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/hit-the-dirt.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'hit-the-dirt.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'hit-the-dirt.ts must use .motion()');
    assert.match(tsContent, /sequence\.motion\(token/, 'hit-the-dirt.ts must use sequence.motion()');
    assert.match(tsContent, /\.rotateTo\(90/, 'hit-the-dirt.ts must use .rotateTo(90)');
    assert.match(tsContent, /\.(moveBy|moveTo)\(/, 'hit-the-dirt.ts must move token');

    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'hit-the-dirt.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'hit-the-dirt.js must use .motion()');
    assert.match(jsContent, /sequence\.motion\(token/, 'hit-the-dirt.js must use sequence.motion()');
    assert.match(jsContent, /\.rotateTo\(90/, 'hit-the-dirt.js must use .rotateTo(90)');
    assert.match(jsContent, /\.(moveBy|moveTo)\(/, 'hit-the-dirt.js must move token');
});

test('petrifyingGaze uses Sequencer 4.3.0+ sequence.motion().noise( for petrification stone shudder instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/multi-token/petrifying-gaze.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/petrifying-gaze.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'petrifying-gaze.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'petrifying-gaze.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'petrifying-gaze.ts must use .motion()');
    assert.match(tsContent, /\.motion\(token\)/, 'petrifying-gaze.ts must use .motion(token)');
    assert.match(tsContent, /\.motion\(target\)/, 'petrifying-gaze.ts must use .motion(target)');
    assert.match(tsContent, /\.noise\(/, 'petrifying-gaze.ts must use .noise(');

    assert.doesNotMatch(jsContent, /copySprite/, 'petrifying-gaze.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'petrifying-gaze.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'petrifying-gaze.js must use .motion()');
    assert.match(jsContent, /\.motion\(token\)/, 'petrifying-gaze.js must use .motion(token)');
    assert.match(jsContent, /\.motion\(target\)/, 'petrifying-gaze.js must use .motion(target)');
    assert.match(jsContent, /\.noise\(/, 'petrifying-gaze.js must use .noise(');
});

test('petrified uses Sequencer 4.3.0+ sequence.motion(token).noise( for petrification stone shudder instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/active-effect/petrified.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/petrified.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'petrified.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'petrified.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'petrified.ts must use .motion()');
    assert.match(tsContent, /\.motion\(token\)/, 'petrified.ts must use .motion(token)');
    assert.match(tsContent, /\.noise\(/, 'petrified.ts must use .noise(');

    assert.doesNotMatch(jsContent, /copySprite/, 'petrified.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'petrified.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'petrified.js must use .motion()');
    assert.match(jsContent, /\.motion\(token\)/, 'petrified.js must use .motion(token)');
    assert.match(jsContent, /\.noise\(/, 'petrified.js must use .noise(');
});

test('totemicAttunementElk uses Sequencer 4.3.0+ sequence.motion(target).moveBy() for elk charge knockback push instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/active-effect/rage/totemic-attunement/elk.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/totemic-attunement-elk.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'elk.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'elk.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'elk.ts must use .motion()');
    assert.match(tsContent, /\.motion\(target\)/, 'elk.ts must use motion(target)');
    assert.match(tsContent, /\.moveBy\(/, 'elk.ts must use .moveBy()');

    assert.doesNotMatch(jsContent, /copySprite/, 'totemic-attunement-elk.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'totemic-attunement-elk.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'totemic-attunement-elk.js must use .motion()');
    assert.match(jsContent, /seq\.motion\(target\)/, 'totemic-attunement-elk.js must use seq.motion(target)');
    assert.match(jsContent, /\.moveBy\(/, 'totemic-attunement-elk.js must use .moveBy()');
});

test('armsOfHadar uses Sequencer 4.3.0+ sequence.motion(target).moveBy() for arms of hadar tentacle target pull/shake instead of copySprite and opacity(0) hiding', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/template/arms-of-hadar.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/arms-of-hadar.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'arms-of-hadar.ts must not use copySprite');
    assert.doesNotMatch(tsContent, /\.opacity\(0\)/, 'arms-of-hadar.ts must not hide token with opacity(0)');
    assert.match(tsContent, /\.motion\(/, 'arms-of-hadar.ts must use .motion()');
    assert.match(tsContent, /sequence\.motion\(target\)/, 'arms-of-hadar.ts must use sequence.motion(target)');
    assert.match(tsContent, /\.moveBy\(/, 'arms-of-hadar.ts must use .moveBy()');

    assert.doesNotMatch(jsContent, /copySprite/, 'arms-of-hadar.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'arms-of-hadar.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(/, 'arms-of-hadar.js must use .motion()');
    assert.match(jsContent, /sequence\.motion\(target\)/, 'arms-of-hadar.js must use sequence.motion(target)');
    assert.match(jsContent, /\.moveBy\(/, 'arms-of-hadar.js must use .moveBy()');
});

test('maxtacTraumaTeamAV uses Sequencer 4.3.0+ sequence.motion(tile) and motion(target) for AV vehicle tile flying movement', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/tile/maxtac-trauma-team-av.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/maxtac.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.match(tsContent, /\.motion\(tile\)/, 'maxtac-trauma-team-av.ts must use .motion(tile)');
    assert.match(tsContent, /\.(moveBy|moveTo)\(/, 'maxtac-trauma-team-av.ts must move tile');
    assert.match(tsContent, /\.oscillate\(/, 'maxtac-trauma-team-av.ts must use .oscillate()');

    assert.match(jsContent, /\.motion\(tile\)/, 'maxtac.js must use .motion(tile)');
    assert.match(jsContent, /\.(moveBy|moveTo)\(/, 'maxtac.js must move target');
    assert.match(jsContent, /\.oscillate\(/, 'maxtac.js must use .oscillate()');
});

test('shuffle uses Sequencer 4.3.0+ sequence.motion(target).moveTo() API for position swaps instead of legacy moveTowards', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/multi-token/shuffle.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/shuffle.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /\.moveTowards\(/, 'shuffle.ts must not use legacy moveTowards()');
    assert.match(tsContent, /\.motion\(/, 'shuffle.ts must use .motion()');
    assert.match(tsContent, /\.moveTo\(/, 'shuffle.ts must use .moveTo()');

    assert.doesNotMatch(jsContent, /\.moveTowards\(/, 'shuffle.js must not use legacy moveTowards()');
    assert.match(jsContent, /\.motion\(/, 'shuffle.js must use .motion()');
    assert.match(jsContent, /\.moveTo\(/, 'shuffle.js must use .moveTo()');
});

test('attackAttack macro uses Sequencer 4.3.0+ sequence.motion().moveTo() API for clashing token dash movement instead of copySprite and opacity(0) hiding', () => {
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/attack-attack.js');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(jsContent, /copySprite/, 'attack-attack.js must not use copySprite');
    assert.doesNotMatch(jsContent, /\.opacity\(0\)/, 'attack-attack.js must not hide token with opacity(0)');
    assert.match(jsContent, /\.motion\(blue\)/, 'attack-attack.js must use sequence.motion(blue)');
    assert.match(jsContent, /\.motion\(red\)/, 'attack-attack.js must use sequence.motion(red)');
    assert.match(jsContent, /\.moveTo\(/, 'attack-attack.js must use .moveTo()');
});

test('enfeeblingArrow uses Sequencer 4.3.0+ sequence.motion(target).noise( for target hit shudder instead of copySprite', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/arcane-shot/enfeebling-arrow.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/enfeebling-arrow.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'enfeebling-arrow.ts must not use copySprite');
    assert.match(tsContent, /\.motion\((target|trg)\)/, 'enfeebling-arrow.ts must use .motion(target)');
    assert.match(tsContent, /\.noise\(/, 'enfeebling-arrow.ts must use .noise(');

    assert.doesNotMatch(jsContent, /copySprite/, 'enfeebling-arrow.js must not use copySprite');
    assert.match(jsContent, /\.motion\(target\)/, 'enfeebling-arrow.js must use .motion(target)');
    assert.match(jsContent, /\.noise\(/, 'enfeebling-arrow.js must use .noise(');
});

test('piercingArrow uses Sequencer 4.3.0+ sequence.motion(t).noise( for target hit shudder instead of copySprite', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/arcane-shot/piercing-arrow.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/piercing-arrow.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'piercing-arrow.ts must not use copySprite');
    assert.match(tsContent, /\.motion\(t\)/, 'piercing-arrow.ts must use .motion(t)');
    assert.match(tsContent, /\.noise\(/, 'piercing-arrow.ts must use .noise(');

    assert.doesNotMatch(jsContent, /copySprite/, 'piercing-arrow.js must not use copySprite');
    assert.match(jsContent, /\.motion\(t\)/, 'piercing-arrow.js must use .motion(t)');
    assert.match(jsContent, /\.noise\(/, 'piercing-arrow.js must use .noise(');
});

test('burstingArrow uses Sequencer 4.3.0+ sequence.motion(t).noise( for target hit shudder instead of copySprite', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/arcane-shot/bursting-arrow.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/bursting-arrow.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'bursting-arrow.ts must not use copySprite');
    assert.match(tsContent, /\.motion\(t\)/, 'bursting-arrow.ts must use .motion(t)');
    assert.match(tsContent, /\.noise\(/, 'bursting-arrow.ts must use .noise(');

    assert.doesNotMatch(jsContent, /copySprite/, 'bursting-arrow.js must not use copySprite');
    assert.match(jsContent, /\.motion\(t\)/, 'bursting-arrow.js must use .motion(t)');
    assert.match(jsContent, /\.noise\(/, 'bursting-arrow.js must use .noise(');
});

test('shadowArrow uses Sequencer 4.3.0+ sequence.motion(target).noise( for target hit shudder instead of copySprite loopProperty', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/arcane-shot/shadow-arrow.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/shadow-arrow.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /loopProperty.*position\.x/, 'shadow-arrow.ts must not use loopProperty position.x shudder');
    assert.match(tsContent, /\.motion\((target|trg)\)/, 'shadow-arrow.ts must use .motion(target)');
    assert.match(tsContent, /\.noise\(/, 'shadow-arrow.ts must use .noise(');

    assert.doesNotMatch(jsContent, /loopProperty.*position\.x/, 'shadow-arrow.js must not use loopProperty position.x shudder');
    assert.match(jsContent, /\.motion\(target\)/, 'shadow-arrow.js must use .motion(target)');
    assert.match(jsContent, /\.noise\(/, 'shadow-arrow.js must use .noise(');
});

test('beguilingArrow uses Sequencer 4.3.0+ sequence.motion(target).noise( for target hit shudder instead of copySprite loopProperty', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/arcane-shot/beguiling-arrow.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/beguiling-arrow.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /loopProperty.*position\.x/, 'beguiling-arrow.ts must not use loopProperty position.x shudder');
    assert.match(tsContent, /\.motion\((target|trg)\)/, 'beguiling-arrow.ts must use .motion(target)');
    assert.match(tsContent, /\.noise\(/, 'beguiling-arrow.ts must use .noise(');

    assert.doesNotMatch(jsContent, /loopProperty.*position\.x/, 'beguiling-arrow.js must not use loopProperty position.x shudder');
    assert.match(jsContent, /\.motion\(target\)/, 'beguiling-arrow.js must use .motion(target)');
    assert.match(jsContent, /\.noise\(/, 'beguiling-arrow.js must use .noise(');
});

test('rageV2 and rage macro use Sequencer 4.3.0+ sequence.motion(token).scaleTo(1.05).noise( for rage pulse and shudder instead of copySprite', () => {
    const tsModulePath = path.join(rootDir, 'src/animation/effects/active-effect/rage/rage_v2.ts');
    const jsMacroPath = path.join(rootDir, 'src/standalone-macros/rage.js');

    const tsContent = fs.readFileSync(tsModulePath, 'utf8');
    const jsContent = fs.readFileSync(jsMacroPath, 'utf8');

    assert.doesNotMatch(tsContent, /copySprite/, 'rage_v2.ts must not use copySprite');
    assert.match(tsContent, /\.motion\(/, 'rage_v2.ts must use .motion()');
    assert.match(tsContent, /\.motion\(token\)/, 'rage_v2.ts must use .motion(token)');
    assert.match(tsContent, /\.scaleTo\(1\.05/, 'rage_v2.ts must use .scaleTo(1.05)');
    assert.match(tsContent, /\.noise\(/, 'rage_v2.ts must use .noise(');

    assert.doesNotMatch(jsContent, /copySprite/, 'rage.js must not use copySprite');
    assert.match(jsContent, /\.motion\(/, 'rage.js must use .motion()');
    assert.match(jsContent, /\.motion\(token\)/, 'rage.js must use .motion(token)');
    assert.match(jsContent, /\.scaleTo\(1\.05/, 'rage.js must use .scaleTo(1.05)');
    assert.match(jsContent, /\.noise\(/, 'rage.js must use .noise(');
});














