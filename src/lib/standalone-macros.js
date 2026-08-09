import { log } from './logger.js';

/**
 * Known standalone macro filenames in src/standalone-macros/
 * Used as a base list and fallback if directory browsing is unavailable.
 */
const KNOWN_STANDALONE_MACROS = [
    'aerodyne-vehicle.js',
    'angry.js',
    'animate-dead.js',
    'armor-of-agathys.js',
    'arms-of-hadar.js',
    'attack-attack.js',
    'banishment.js',
    'beam.js',
    'benign-transportation.js',
    'blast-lock.js',
    'bless.js',
    'blurred-vision.js',
    'call-lightning.js',
    'call.js',
    'chain-lightning.js',
    'charmed.js',
    'chromatic-orb.js',
    'cloud-of-sand.js',
    'color-spray.js',
    'control-undead.js',
    'curse-of-the-werewolf.js',
    'dash.js',
    'detect-good-and-evil.js',
    'detect-magic.js',
    'detect-poison.js',
    'dimension-door.js',
    'disintegrate.js',
    'divine-sense.js',
    'divine-smite.js',
    'divine-strike.js',
    'draining-kiss.js',
    'draining-touch.js',
    'dread-aspect.js',
    'dread-lord-attack.js',
    'dread-lord-fear.js',
    'dread-lord.js',
    'drunk.js',
    'enlarge-reduce.js',
    'eyes-of-night.js',
    'faerie-fire.js',
    'far-step.js',
    'fighting-spirit.js',
    'finger-of-death.js',
    'fire-blast.js',
    'fire-shield.js',
    'firecracker.js',
    'flurry-of-blows.js',
    'fly.js',
    'frightful-moan.js',
    'gate.js',
    'grapple.js',
    'grease.js',
    'guiding-bolt.js',
    'hacking.js',
    'halo-of-spores.js',
    'healing-word.js',
    'hex.js',
    'hide.js',
    'hit-the-dirt.js',
    'hologram.js',
    'hook-and-pull.js',
    'iaijutsu-strike.js',
    'incorporeal.js',
    'laugh.js',
    'leap.js',
    'levitation.js',
    'lightning-bolt.js',
    'magic-missile.js',
    'maxtac.js',
    'meteor-strike.js',
    'mirror-image.js',
    'misty-step.js',
    'mob-psycho.js',
    'petrified.js',
    'petrifying-gaze.js',
    'possession.js',
    'psychic-teleportation.js',
    'rage.js',
    'rapid-strike.js',
    'revivify.js',
    'roman-candle.js',
    'sanctuary.js',
    'sandevistan.js',
    'sao-death.js',
    'shapechange.js',
    'shocking-grasp.js',
    'shout.js',
    'shuffle.js',
    'silence.js',
    'sky-rocket.js',
    'slap.js',
    'sleep.js',
    'sneak-attack.js',
    'soulsucked.js',
    'speak-with-dead.js',
    'spike-growth.js',
    'starward-sword.js',
    'step-of-the-wind-jump.js',
    'storming-dash-strikes.js',
    'strength-before-death.js',
    'stunning-fist.js',
    'stunning-strike.js',
    'suggestion.js',
    'sun-halo-dragon.js',
    'surprised.js',
    'sword-art-online.js',
    'tashas-caustic-brew.js',
    'teleport.js',
    'totemic-attunement-bear.js',
    'totemic-attunement-eagle.js',
    'totemic-attunement-elk.js',
    'totemic-attunement-tiger.js',
    'totemic-attunement-wolf.js',
    'true-strike.js',
    'vicious-mockery.js',
    'vn-dialog.js',
    'vortex-warp.js',
    'warp.js',
    'wings.js'
];

/**
 * Formats a kebab-case or snake-case filename into a clean Title Case macro name.
 * @param {string} filename - The script filename (e.g. "speak-with-dead.js").
 * @returns {string} The formatted Title Case name ("Speak With Dead").
 */
function formatMacroTitle(filename) {
    const baseName = filename.replace(/\.js$/i, '');
    return baseName
        .split(/[-_]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Discovers `.js` files in `src/standalone-macros/` using Foundry's FilePicker if possible,
 * falling back to the canonical known list.
 * @param {string} modulePath - The relative module root directory.
 * @returns {Promise<string[]>} List of JS filenames.
 */
async function discoverMacroFiles(modulePath) {
    const dirPath = `${modulePath}/src/standalone-macros`;
    try {
        const browseResult = await FilePicker.browse('data', dirPath);
        const files = browseResult.files
            .filter((filePath) => filePath.endsWith('.js'))
            .map((filePath) => filePath.split('/').pop());
        if (files.length > 0) {
            return Array.from(new Set([...KNOWN_STANDALONE_MACROS, ...files]));
        }
    } catch (err) {
        log.debug(`FilePicker browsing not available for ${dirPath}, using known manifest`, err);
    }
    return KNOWN_STANDALONE_MACROS;
}

/**
 * Synchronizes `.js` files in `src/standalone-macros/` into the module's macro compendium.
 * For each script, reads its content and creates or updates a corresponding Macro document.
 * @param {object} [options] - Optional sync parameters.
 * @param {string} [options.packName] - Full collection name of the target pack.
 * @returns {Promise<void>}
 */
export async function updateMacroCompendiums(options = {}) {
    const packName = options.packName ?? 'eskie-macros.eskie-standalone-macros';
    const pack = game.packs.get(packName);

    if (!pack) {
        log.error(`Standalone macro compendium '${packName}' not found`);
        return;
    }

    const moduleId = pack.metadata?.packageType === 'module'
        ? pack.metadata.packageName
        : 'eskie-macros';
    const modulePath = `modules/${moduleId}`;

    const wasLocked = Boolean(pack.locked);
    if (wasLocked) {
        await pack.configure({ locked: false });
    }

    try {
        const macroFiles = await discoverMacroFiles(modulePath);
        const existingIndex = await pack.getIndex({ fields: ['name', 'flags'] });

        for (const filename of macroFiles) {
            const fileUrl = `${modulePath}/src/standalone-macros/${filename}`;
            const response = await fetch(fileUrl);

            if (!response.ok) {
                log.warn(`Failed to fetch script content from ${fileUrl} (status: ${response.status})`);
                continue;
            }

            const commandContent = await response.text();
            const macroTitle = formatMacroTitle(filename);
            const existingEntry = existingIndex.find((entry) => entry.name === macroTitle);

            const macroPayload = {
                name: macroTitle,
                type: 'script',
                command: commandContent,
                img: 'icons/svg/lightning.svg',
                flags: {
                    'eskie-macros': {
                        standaloneMacro: true,
                        sourceFile: filename
                    }
                }
            };

            if (existingEntry) {
                const doc = await pack.getDocument(existingEntry._id);
                if (doc) {
                    await doc.update({
                        command: commandContent,
                        flags: macroPayload.flags
                    });
                    log.debug(`Updated standalone macro '${macroTitle}' in compendium '${packName}'`);
                }
            } else {
                await Macro.create(macroPayload, { pack: pack.collection });
                log.debug(`Created standalone macro '${macroTitle}' in compendium '${packName}'`);
            }
        }

        log.info(`Standalone macros sync complete for compendium '${packName}'`);
    } catch (err) {
        log.error('Unexpected failure during standalone macros compendium sync', err);
    } finally {
        if (wasLocked) {
            await pack.configure({ locked: true });
        }
    }
}

export const standaloneMacros = {
    sync: updateMacroCompendiums
};
