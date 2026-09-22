import { log } from './logger.js';
import { MODULE_ID } from './constants.js';

/**
 * Known standalone macro filenames in src/standalone-macros/
 * Used as a base list and fallback if directory browsing is unavailable.
 */
export const KNOWN_STANDALONE_MACROS = [
    'aerodyne-vehicle.js',
    'angry.js',
    'animate-dead.js',
    'armor-of-agathys.js',
    'arms-of-hadar.js',
    'attack-attack.js',
    'bait-and-switch.js',
    'banishing-arrow.js',
    'banishment.js',
    'beam.js',
    'beguiling-arrow.js',
    'benign-transportation.js',
    'black-powder-boost.js',
    'blast-lock.js',
    'bless.js',
    'blurred-vision.js',
    'burning-hands.js',
    'bursting-arrow.js',
    'call-lightning.js',
    'call.js',
    'chain-lightning.js',
    'charmed.js',
    'chromatic-orb.js',
    'cloud-of-sand.js',
    'cloudkill.js',
    'color-spray.js',
    'contagion.js',
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
    'divine-strike-twilight-melee.js',
    'divine-strike-twilight-ranged.js',
    'divine-strike.js',
    'draining-kiss.js',
    'draining-touch.js',
    'dread-aspect.js',
    'dread-lord-attack.js',
    'dread-lord-fear.js',
    'dread-lord.js',
    'drunk.js',
    'enfeebling-arrow.js',
    'enlarge-reduce.js',
    'entangle.js',
    'entangled.js',
    'eyes-of-night.js',
    'eyes-of-the-grave.js',
    'faerie-fire.js',
    'far-step.js',
    'feinting-attack.js',
    'fighting-spirit.js',
    'final-shot.js',
    'finger-of-death.js',
    'fire-blast.js',
    'fire-shield.js',
    'fireball.js',
    'firecracker.js',
    'flurry-of-blows.js',
    'fly.js',
    'frightful-moan.js',
    'gate.js',
    'ghost-walk.js',
    'goodberry-use.js',
    'goodberry.js',
    'grapple.js',
    'grasping-arrow.js',
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
    'keeper-of-souls.js',
    'laugh.js',
    'leap.js',
    'levitation.js',
    'lightning-bolt.js',
    'lunging-attack.js',
    'magic-missile.js',
    'maxtac.js',
    'meteor-strike.js',
    'mirror-image.js',
    'misty-step.js',
    'mob-psycho.js',
    'parry.js',
    'path-of-the-grave.js',
    'petrified.js',
    'petrifying-gaze.js',
    'piercing-arrow.js',
    'possession.js',
    'psychic-teleportation.js',
    'pushing-attack.js',
    'rage.js',
    'rapid-strike.js',
    'ray-of-sickness.js',
    'revivify.js',
    'ricochet-shot.js',
    'roman-candle.js',
    'sanctuary.js',
    'sandevistan.js',
    'sao-death.js',
    'scorching-ray.js',
    'shadow-arrow.js',
    'shapechange.js',
    'shattering-shot.js',
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
    'sweeping-attack.js',
    'sword-art-online.js',
    'tashas-caustic-brew.js',
    'teleport.js',
    'thorn-whip.js',
    'tokens-of-the-departed-use.js',
    'tokens-of-the-departed.js',
    'totemic-attunement-bear.js',
    'totemic-attunement-eagle.js',
    'totemic-attunement-elk.js',
    'totemic-attunement-tiger.js',
    'totemic-attunement-wolf.js',
    'trip-attack.js',
    'true-strike.js',
    'twilight-sanctuary.js',
    'vicious-mockery.js',
    'vigilant-blessing.js',
    'vn-dialog.js',
    'vortex-warp.js',
    'wails-from-the-grave-damage.js',
    'wails-from-the-grave.js',
    'wall-of-fire.js',
    'web.js',
    'wings.js'
];

/**
 * Known Automated Animations bootstrap macro filenames and their compendium titles.
 */
export const KNOWN_AA_BOOTSTRAP_MACROS = [
    { file: 'aa-effect.js', name: 'AA | Effect', img: 'icons/svg/aura.svg' },
    { file: 'aa-target.js', name: 'AA | Target', img: 'icons/svg/target.svg' },
    { file: 'aa-template.js', name: 'AA | Template', img: 'icons/svg/circle.svg' },
    { file: 'aa-token.js', name: 'AA | Token', img: 'icons/svg/cowled.svg' }
];

const AA_MACRO_NAME_MAP = {
    'aa-effect.js': 'AA | Effect',
    'aa-target.js': 'AA | Target',
    'aa-template.js': 'AA | Template',
    'aa-token.js': 'AA | Token'
};

const AA_MACRO_ICON_MAP = {
    'aa-effect.js': 'icons/svg/aura.svg',
    'aa-target.js': 'icons/svg/target.svg',
    'aa-template.js': 'icons/svg/circle.svg',
    'aa-token.js': 'icons/svg/cowled.svg'
};

/**
 * Formats a kebab-case or snake-case filename into a clean Title Case macro name.
 * @param {string} filename - The script filename (e.g. "speak-with-dead.js").
 * @returns {string} The formatted Title Case name ("Speak With Dead").
 */
export function formatMacroTitle(filename: any) {
    const baseName = filename.replace(/\.(js|ts)$/i, '');
    return baseName
        .split(/[-_]+/)
        .filter(Boolean)
        .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Discovers `.js` files in `src/standalone-macros/` using Foundry's FilePicker if possible,
 * falling back to the canonical known list.
 * @param {string} modulePath - The relative module root directory.
 * @returns {Promise<string[]>} List of JS filenames.
 */
async function discoverMacroFiles(modulePath: string): Promise<string[]> {
    const dirPath = `${modulePath}/src/standalone-macros`;
    try {
        const browseResult = await (FilePicker as any).browse('data', dirPath);
        const files = browseResult.files
            .filter((filePath: string) => filePath.endsWith('.js'))
            .map((filePath: string) => filePath.split('/').pop());
        if (files.length > 0) {
            return Array.from(new Set([...KNOWN_STANDALONE_MACROS, ...files]));
        }
    } catch (err) {
        log.debug(`FilePicker browsing not available for ${dirPath}, using known manifest`, err);
    }
    return KNOWN_STANDALONE_MACROS;
}

async function discoverAaMacroFiles(modulePath: string): Promise<string[]> {
    const dirPath = `${modulePath}/compendium-macros`;
    const knownFiles = KNOWN_AA_BOOTSTRAP_MACROS.map((m) => m.file);
    try {
        const browseResult = await (FilePicker as any).browse('data', dirPath);
        const files = browseResult.files
            .filter((filePath: string) => filePath.endsWith('.js'))
            .map((filePath: string) => filePath.split('/').pop());
        if (files.length > 0) {
            return Array.from(new Set([...knownFiles, ...files]));
        }
    } catch (err) {
        log.debug(`FilePicker browsing not available for ${dirPath}, using known manifest`, err);
    }
    return knownFiles;
}

export async function updateStandaloneMacroCompendium(options: any = {}) {
    const packName = options.packName ?? `${MODULE_ID}.eskie-standalone-macros`;
    const pack = (game.packs as any)?.get(packName);

    if (!pack) {
        log.error(`Standalone macro compendium '${packName}' not found`);
        return;
    }

    const moduleId = pack.metadata?.packageType === 'module'
        ? pack.metadata.packageName
        : MODULE_ID;
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
            const existingEntry = existingIndex.find((entry: any) => entry.name === macroTitle);

            const macroPayload = {
                name: macroTitle,
                type: 'script',
                command: commandContent,
                img: 'icons/svg/lightning.svg',
                flags: {
                    [MODULE_ID]: {
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
                await (Macro as any).create(macroPayload, { pack: pack.collection });
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

/**
 * Synchronizes `.js` files in `compendium-macros/` into the module's Automated Animations integration compendium.
 * For each bootstrap script, reads its content and creates or updates a corresponding Macro document.
 * @param {object} [options] - Optional sync parameters.
 * @param {string} [options.packName] - Full collection name of the target pack.
 * @returns {Promise<void>}
 */
export async function updateAaIntegrationCompendium(options: any = {}) {
    const packName = options.packName ?? `${MODULE_ID}.eskie-aa-integration`;
    const pack = (game.packs as any)?.get(packName);

    if (!pack) {
        log.error(`AA integration macro compendium '${packName}' not found`);
        return;
    }

    const moduleId = pack.metadata?.packageType === 'module'
        ? pack.metadata.packageName
        : MODULE_ID;
    const modulePath = `modules/${moduleId}`;

    const wasLocked = Boolean(pack.locked);
    if (wasLocked) {
        await pack.configure({ locked: false });
    }

    try {
        const aaMacroFiles = await discoverAaMacroFiles(modulePath);
        const existingIndex = await pack.getIndex({ fields: ['name', 'flags'] });

        for (const filename of aaMacroFiles) {
            const fileUrl = `${modulePath}/compendium-macros/${filename}`;
            const response = await fetch(fileUrl);

            if (!response.ok) {
                log.warn(`Failed to fetch script content from ${fileUrl} (status: ${response.status})`);
                continue;
            }

            const commandContent = await response.text();
            const macroTitle = (AA_MACRO_NAME_MAP as Record<string, string>)[filename] ?? formatMacroTitle(filename);
            const macroIcon = (AA_MACRO_ICON_MAP as Record<string, string>)[filename] ?? 'icons/svg/lightning.svg';
            const existingEntry = existingIndex.find((entry: any) => entry.name === macroTitle);

            const macroPayload = {
                name: macroTitle,
                type: 'script',
                command: commandContent,
                img: macroIcon,
                flags: {
                    [MODULE_ID]: {
                        aaIntegration: true,
                        sourceFile: filename
                    }
                }
            };

            if (existingEntry) {
                const doc = await pack.getDocument(existingEntry._id);
                if (doc) {
                    await doc.update({
                        command: commandContent,
                        img: macroPayload.img,
                        flags: macroPayload.flags
                    });
                    log.debug(`Updated AA bootstrap macro '${macroTitle}' in compendium '${packName}'`);
                }
            } else {
                await (Macro as any).create(macroPayload, { pack: pack.collection });
                log.debug(`Created AA bootstrap macro '${macroTitle}' in compendium '${packName}'`);
            }
        }

        log.info(`AA integration macros sync complete for compendium '${packName}'`);
    } catch (err) {
        log.error('Unexpected failure during AA integration macros compendium sync', err);
    } finally {
        if (wasLocked) {
            await pack.configure({ locked: true });
        }
    }
}

/**
 * Synchronizes all macro compendiums (both standalone macros and Automated Animations bootstrap integration macros).
 * @param {object} [options] - Optional sync parameters.
 * @returns {Promise<void>}
 */
export async function updateMacroCompendiums(options: any = {}) {
    await updateStandaloneMacroCompendium(options);
    await updateAaIntegrationCompendium(options);
}

export const standaloneMacros = {
    sync: updateMacroCompendiums,
    syncStandalone: updateStandaloneMacroCompendium,
    syncAa: updateAaIntegrationCompendium
};
