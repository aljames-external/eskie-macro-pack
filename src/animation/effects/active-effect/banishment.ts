/* **
   Original Author: derkreigs
   Update Author: bakanabaka
** */

import { closest } from "../../../lib/filemanager.js";
import { settingsOverride } from "../../../lib/settings.js";
import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";

const DEFAULT_CONFIG = {
    id: 'banish',
    sound: {
        intro: {
            ...DEFAULT_SOUND_CONFIG,
            enable: true,
            volume: 0.5,
            file: 'psfx.magic-signs.circle.v1.abjuration.complete',
        },
        rune: {
            ...DEFAULT_SOUND_CONFIG,
            enable: true,
            volume: 0.5,
            file: 'psfx.casting.generic.001',
        },
        moonbeam: {
            ...DEFAULT_SOUND_CONFIG,
            enable: true,
            volume: 0.5,
            file: 'psfx.2nd-level-spells.moonbeam.intro',
        },
        return: {
            ...DEFAULT_SOUND_CONFIG,
            enable: true,
            volume: 0.5,
            file: 'psfx.2nd-level-spells.moonbeam.intro',
        }
    },
    portal: {
        file: undefined,
        color: 'yellow',
        scale: 2,
        offset: { x: 0, y: -75 }
    }
};

function modifyPortal(portal: any, target: Token) {
    if (portal?.file) return;
    
    let color = portal.color;
    const creatureType = adapter.getCreatureType(target.actor);

    // Colors -- Red, White, Purple, Blue, Green, Yellow, Orange
        if (creatureType) {
            switch (creatureType.toLowerCase()) {
                // Red
                case "fiend":
                case "ooze":
                    color = "red";
                    break;
                // White
                case "construct":
                    color = "white";
                    break;
                // Purple
                case "aberration":
                case "undead":
                case "humanoid":
                    color = "purple";
                    break;                
                // Blue
                case "dragon":     
                case "monstrosity":
                    color = "blue";
                    break;
                // Green
                case "beast":
                case "elemental":
                case "plant":
                    color = "green";
                    break;
                // Yellow
                case "celestial":
                case "giant":
                    color = "yellow";
                    break;
                // Orange
                case "fey":
                    color = "orange";
                    break;
            }
        }

        if (creatureType) {
            switch (creatureType.toLowerCase()) {
                // Oval Portal
                case "dragon":
                case "fiend":
                case "monstrosity":
                    portal.file = closest(`eskie.environment.portal.generic.01.center.one_shot.full.${color}`);
                    return;
                // MTG Warp
                case "aberration":
                    portal.scale = 3;
                    portal.offset.y = -150;
                    portal.file = closest(`eskie.environment.portal.warp.01.center.one_shot.full.${color}`);
                    return;
                // Door Front
                case "beast":
                case "elemental":
                case "plant":
                case "celestial":
                case "giant":
                case "humanoid":
                case "undead":
                    portal.file = closest(`eskie.environment.portal.doorway.01.center.one_shot.full.${color}`);
                    return;
                // Vertical MTG Warp
                case "construct":
                    portal.file = closest(`eskie.environment.portal.warp.01.side.loop.full.${color}`);
                // Vertical Tear
                case "fey":
                    portal.file = closest(`eskie.environment.portal.tear.01.center.one_shot.full.${color}`);
                    return;
                // Small Oval
                case "ooze":
                    portal.file = closest(`eskie.environment.portal.generic.01.side.one_shot.full.${color}`);
                    return;
            }
        }

    // Pure default
    return closest(`jb2a.portals.vertical.vortex.${color}`);
}

async function createBanish(target: Token, config: any = {}) {
    config = settingsOverride(config);
    const { sound, portal } = adapter.mergeObject(DEFAULT_CONFIG, config);
    modifyPortal(portal, target);

    const RUNE_DATA = {
        animDuration: 300,
        rotationDuration: 200,
        merge: { x: 0, y: -75 },
        runes: [
            { offset: { x: -45, y: -61 }, rotation: 3 * 360 / 5 },
            { offset: { x: 0, y: 75 }, rotation: 5 * 360 / 5 },
            { offset: { x: 45, y: -61 }, rotation: 2 * 360 / 5 },
            { offset: { x: -70, y: 22 }, rotation: 4 * 360 / 5 },
            { offset: { x: 70, y: 22 }, rotation: 1 * 360 / 5 },
        ]
    }

    const sequence = new Sequence();
    applySound(sequence, sound.intro);
    sequence.effect()
        .file(closest(`jb2a.magic_signs.circle.02.conjuration.intro.${portal.color}`))
        .atLocation(target)
        .scaleToObject(2)
        .belowTokens();

    sequence.wait(3000);
    sequence.effect()
        .file(closest(`jb2a.magic_signs.circle.02.conjuration.loop.${portal.color}`))
        .atLocation(target)
        .scaleToObject(2)
        .belowTokens()
        .duration(13000)
        .fadeOut(1000);

    sequence.wait(3750);
    let runeDelay = 0;
    let animationDelay = 4000;
    for (const rune of RUNE_DATA.runes) {
        applySound(sequence, { ...sound.rune, delay: runeDelay + 750 });
        sequence.effect()
            .file(closest(`jb2a.magic_signs.rune.conjuration.complete.${portal.color}`))
            .atLocation(target, { offset: rune.offset })
            .scaleToObject(0.5)
            .delay(runeDelay)
            .playbackRate(0.65)
            .rotate(rune.rotation)
            .animateProperty('sprite', 'rotation', { from: rune.rotation, to: 720 + rune.rotation, duration: RUNE_DATA.rotationDuration, delay: animationDelay, ease: "easeInBack" })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: RUNE_DATA.merge.x - rune.offset.x, duration: RUNE_DATA.animDuration, delay: animationDelay + RUNE_DATA.rotationDuration, ease: "easeInBack" })
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: RUNE_DATA.merge.y - rune.offset.y, duration: RUNE_DATA.animDuration, delay: animationDelay + RUNE_DATA.rotationDuration, ease: "easeInBack" })
            .duration(RUNE_DATA.animDuration + animationDelay - 800)
            .zIndex(0.1);
        runeDelay += RUNE_DATA.animDuration;
        animationDelay -= RUNE_DATA.animDuration;
    }

    sequence.wait(3000);
    applySound(sequence, sound.moonbeam);

    sequence.wait(1500);
    sequence.effect()
        .file(closest(`jb2a.explosion.01.${portal.color}`))
        .atLocation(target, { offset: { x: 5, y: -75 } })
        .delay(500)
        .scaleToObject(1.5)
        .zIndex(1);

    sequence.effect()
        .file(closest(portal.file))
        .atLocation(target, { offset: portal.offset })
        .scaleToObject(portal?.scale)
        .duration(6000)
        .scaleIn({ x: 0, y: 0.8 }, 500)
        .scaleOut({ x: 0, y: 0.4 }, 500, { ease: "easeInBack" })
        .fadeOut(250)
        .zIndex(0.7)
        .belowTokens()
        .delay(500)
        .waitUntilFinished(-5750);

    sequence.effect()
        .file(closest(`jb2a.wind_stream.1200.white`))
        .atLocation(target)
        .scaleToObject(1.03)
        .rotate(90)
        .duration(6000)
        .fadeIn(250)
        .fadeOut(750);

    sequence.effect()
        .file(closest(`jb2a.wind_stream.1200.white`))
        .atLocation(target, { offset: { x: 0, y: 100 } })
        .scaleToObject(1.03)
        .rotate(90)
        .duration(6000)
        .fadeIn(250)
        .fadeOut(750);

    sequence.effect()
        .file(closest(`jb2a.energy_beam.normal.${portal.color}`))
        .atLocation(target, { offset: { x: 0, y: 50 } })
        .rotate(90)
        .size({ width: 400, height: 350 })
        .opacity(0.2)
        .duration(6000)
        .playbackRate(1.6)
        .fadeIn(250)
        .fadeOut(750);

    sequence.motion(target)
        .scaleTo(0.01, { duration: 500 })
        .rotateBy(360, { duration: 500 });

    sequence.effect()
        .file(closest(`jb2a.explosion.02.${portal.color}`))
        .atLocation(target, { offset: { x: 0, y: -85 } })
        .scaleToObject(0.5)
        .filter("ColorMatrix", { hue: 15 })
        .zIndex(0.9);

    sequence.effect()
        .file(closest(`jb2a.detect_magic.cone.${portal.color}`))
        .rotateTowards(target)
        .atLocation(target, { offset: { x: 0, y: -110 } })
        .scaleToObject(1)
        .playbackRate(1.5)
        .zIndex(1);

    sequence.effect()
        .file(closest(`jb2a.template_circle.out_pulse.02.loop.${portal.color}`))
        .atLocation(target, { offset: { x: 0, y: -75 } })
        .scaleToObject(1.75)
        .delay(1000)
        .fadeOut(1000)
        .waitUntilFinished(-1500);

    sequence.effect()
        .file(closest(`jb2a.fireflies.many.02.${portal.color}`))
        .atLocation(target, { offset: { x: 0, y: -75 } })
        .scaleToObject(0.75)
        .duration(2000)
        .fadeIn(500)
        .fadeOut(750)
        .animateProperty('spriteContainer', 'position.y', { from: 0, to: 75, duration: 3000 });

    return sequence;
}

async function playBanish(target: Token, config: any = {}) {
    const sequence = await createBanish(target, config);
    if (sequence) return sequence.play();
}

async function createReturn(target: Token, config: any = {}) {
    config = settingsOverride(config);
    const { color, sound, portal } = adapter.mergeObject(DEFAULT_CONFIG, config);
    modifyPortal(portal, target);

    const sequence = new Sequence();
    applySound(sequence, sound.return);
    sequence.effect()
        .file(closest(`jb2a.explosion.01.${portal.color}`))
        .atLocation(target, { offset: { x: 5, y: -75 } })
        .scaleToObject(1.5)
        .delay(1500)
        .zIndex(1);
    sequence.effect()
        .file(closest(portal.file))
        .atLocation(target, { offset: portal.offset })
        .scaleToObject(portal.scale)
        .duration(6000)
        .scaleIn({ x: 0, y: 0.8 }, 500)
        .scaleOut({ x: 0, y: 0.4 }, 500, { ease: "easeInBack" })
        .fadeOut(250)
        .zIndex(0.7)
        .belowTokens()
        .delay(1500)
        .waitUntilFinished(-4000);
    sequence.motion(target)
        .scaleTo(1, { duration: 500 });
    return sequence;
}

async function playReturn(target: Token, config: any = {}) {
    const sequence = await createReturn(target, config);
    if (sequence) return sequence.play();
}

async function clean(target: Token, config: any = {}) {
    new Sequence()
        .motion(target)
        .scaleTo(1, { duration: 500 })
        .play();
}

export const banishment = {
    banish: {
        create: createBanish,
        play: playBanish,
        stop: playReturn,
        clean: clean,
        default_config: DEFAULT_CONFIG,
    },
    return: {
        create: createReturn,
        play: playReturn,
        default_config: DEFAULT_CONFIG,
    },
    play: playBanish,
    stop: playReturn,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register("banishment", "effect", "eskie.effect.banishment", DEFAULT_CONFIG, '2.0.2', "Banishment");