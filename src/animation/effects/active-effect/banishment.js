/* **
   Original Author: derkreigs
   Update Author: bakanabaka
** */

import { closest } from "../../../lib/filemanager.js";
import { settingsOverride } from "../../../lib/settings.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'banish',
    color: 'yellow',
    sound: {
        enabled: true,
        volume: 0.5,
    }
};

async function createBanish(target, config = {}) {
    config = settingsOverride(config);
    const { color, sound } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    const RUNE_DATA = {
        animDuration: 300,
        rotationDuration: 200,
        merge: { x: 0, y: -75 },
        runes: [
            { offset: { x: -45, y: -61 }, rotation: 3 * 360 / 5 },
            { offset: { x: 0,   y:  75 }, rotation: 5 * 360 / 5 },
            { offset: { x: 45,  y: -61 }, rotation: 2 * 360 / 5 },
            { offset: { x: -70, y:  22 }, rotation: 4 * 360 / 5 },
            { offset: { x: 70,  y:  22 }, rotation: 1 * 360 / 5 },
        ]
    }

    const sequence = new Sequence();
    if (sound.enabled) {
        sequence.sound()
            .file(closest('psfx.magic-signs.circle.v1.abjuration.complete'))
            .volume(sound.volume)
    }
    sequence.effect()
        .file(closest(`jb2a.magic_signs.circle.02.conjuration.intro.${color}`))
        .atLocation(target)
        .scaleToObject(2)
        .belowTokens();
    
    sequence.wait(3000);
    sequence.effect()
        .file(closest(`jb2a.magic_signs.circle.02.conjuration.loop.${color}`))
        .atLocation(target)
        .scaleToObject(2)
        .belowTokens()
        .duration(13000)
        .fadeOut(1000);

    sequence.wait(3750);
    let runeDelay = 0;
    let animationDelay = 4000;
    const runeSoundFile = snd('psfx.casting.generic.001');
    const runeImageFile = img(`jb2a.magic_signs.rune.conjuration.complete.${color}`);
    for (const rune of RUNE_DATA.runes) {
        if (sound.enabled) {
            sequence.sound()
                .file(runeSoundFile)
                .volume(sound.volume)
                .delay(runeDelay + 750);
        }
        sequence.effect()
            .file(runeImageFile)
            .atLocation(target, { offset: rune.offset })
            .scaleToObject(0.5)
            .delay(runeDelay)
            .playbackRate(0.65)
            .rotate(rune.rotation)
            .animateProperty("spriteContainer", "rotation", { from: rune.rotation, to: 720 + rune.rotation, duration: RUNE_DATA.rotationDuration, delay: animationDelay, ease: "easeInBack" })
            .animateProperty("spriteContainer", "position.x", { from: 0, to: RUNE_DATA.merge.x - rune.offset.x, duration: RUNE_DATA.animDuration, delay: animationDelay + RUNE_DATA.rotationDuration, ease: "easeInBack" })
            .animateProperty("spriteContainer", "position.y", { from: 0, to: RUNE_DATA.merge.y - rune.offset.y, duration: RUNE_DATA.animDuration, delay: animationDelay + RUNE_DATA.rotationDuration, ease: "easeInBack" })
            .duration(RUNE_DATA.animDuration + animationDelay - 800)
            .zIndex(0.1);
        runeDelay += RUNE_DATA.animDuration;
        animationDelay -= RUNE_DATA.animDuration;
    }
    
    sequence.wait(3000);
    if (sound.enabled) {
        sequence.sound()
            .file(closest('psfx.2nd-level-spells.moonbeam.intro'))
            .volume(sound.volume);
    }

    sequence.wait(1500);
    sequence.effect()
        .file(closest(`jb2a.explosion.01.${color}`))
        .atLocation(target, { offset: { x: 5, y: -75 } })
        .delay(500)
        .scaleToObject(1.5)
        .zIndex(1);

    sequence.effect()
        .file(closest(`jb2a.portals.vertical.vortex.${color}`))
        .atLocation(target, { offset: { x: 0, y: -75 } })
        .scaleToObject(2)
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
        .file(closest(`jb2a.energy_beam.normal.${color}`))
        .atLocation(target, { offset: { x: 0, y: 50 } })
        .rotate(90)
        .size({ width: 400, height: 350 })
        .opacity(0.2)
        .duration(6000)
        .playbackRate(1.6)
        .fadeIn(250)
        .fadeOut(750);

    sequence.animation()
        .on(target)
        .opacity(0)
        .show(false)
        .waitUntilFinished(-500);

    sequence.effect()
        .copySprite(target)
        .atLocation(target)
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -15, duration: 250, ease: "easeInOutBack" })
        .waitUntilFinished(-100);

    sequence.effect()
        .copySprite(target)
        .atLocation(target)
        .animateProperty("spriteContainer", "position.y", { from: -15, to: 0, duration: 2000, ease: "easeInOutBack" })
        .animateProperty("sprite", "rotation", { from: 0, to: 8, duration: 500, ease: "easeOutCubic" })
        .animateProperty("sprite", "rotation", { from: 0, to: -16, duration: 500, delay: 500, ease: "easeOutCubic" })
        .animateProperty("sprite", "rotation", { from: 0, to: 16, duration: 500, delay: 1000, ease: "easeOutCubic" })
        .animateProperty("sprite", "rotation", { from: 0, to: -16, duration: 500, delay: 1500, ease: "easeInCubic" })
        .waitUntilFinished(-100);

    sequence.effect()
        .copySprite(target)
        .atLocation(target)
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -40, duration: 500, ease: "easeInOutBack" })
        .waitUntilFinished(-100);

    sequence.effect()
        .copySprite(target)
        .atLocation(target)
        .animateProperty("spriteContainer", "position.y", { from: -40, to: -15, duration: 2000, ease: "easeInOutBack" })
        .animateProperty("sprite", "rotation", { from: 0, to: 8, duration: 500, ease: "easeOutCubic" })
        .animateProperty("sprite", "rotation", { from: 0, to: -16, duration: 500, delay: 500, ease: "easeOutCubic" })
        .animateProperty("sprite", "rotation", { from: 0, to: 16, duration: 500, delay: 1000, ease: "easeOutCubic" })
        .animateProperty("sprite", "rotation", { from: 0, to: -16, duration: 500, delay: 1500, ease: "easeInCubic" })
        .waitUntilFinished(-100);

    sequence.effect()
        .copySprite(target)
        .atLocation(target)
        .animateProperty("spriteContainer", "position.y", { from: -15, to: -200, duration: 750, ease: "easeInOutBack" })
        .scaleOut(0, 750)
        .duration(375)
        .waitUntilFinished(-150);

    sequence.effect()
        .file(closest(`jb2a.explosion.02.${color}`))
        .atLocation(target, { offset: { x: 0, y: -85 } })
        .scaleToObject(0.5)
        .filter("ColorMatrix", { hue: 15 })
        .zIndex(0.9);

    sequence.effect()
        .file(closest(`jb2a.detect_magic.cone.${color}`))
        .rotateTowards(target)
        .atLocation(target, { offset: { x: 0, y: -110 } })
        .scaleToObject(1)
        .playbackRate(1.5)
        .zIndex(1);

    sequence.effect()
        .file(closest(`jb2a.template_circle.out_pulse.02.loop.${color}`))
        .atLocation(target, { offset: { x: 0, y: -75 } })
        .scaleToObject(1.75)
        .delay(1000)
        .fadeOut(1000)
        .waitUntilFinished(-1500);

    sequence.effect()
        .file(closest(`jb2a.fireflies.many.02.${color}`))
        .atLocation(target, { offset: { x: 0, y: -75 } })
        .scaleToObject(0.75)
        .duration(2000)
        .fadeIn(500)
        .fadeOut(750)
        .animateProperty("spriteContainer", "position.y", { from: 0, to: 75, duration: 3000 });

    return sequence;
}

async function playBanish(target, config = {}) {
    const sequence = await createBanish(target, config);
    sequence?.play();
}

async function createReturn(target, config = {}) {
    config = settingsOverride(config);
    const { color, sound } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    const sequence = new Sequence();
    if (sound.enabled) {
        sequence.sound()
            .file(closest('psfx.2nd-level-spells.moonbeam.intro'))
            .volume(sound.volume);
    }
    sequence.effect()
        .file(closest(`jb2a.explosion.01.${color}`))
        .atLocation(target, { offset: { x: 5, y: -75 } })
        .scaleToObject(1.5)
        .delay(1500)
        .zIndex(1);
    sequence.effect()
        .file(closest(`jb2a.portals.vertical.vortex.${color}`))
        .atLocation(target, { offset: { x: 0, y: -75 } })
        .scaleToObject(2)
        .duration(6000)
        .scaleIn({ x: 0, y: 0.8 }, 500)
        .scaleOut({ x: 0, y: 0.4 }, 500, { ease: "easeInBack" })
        .fadeOut(250)
        .zIndex(0.7)
        .belowTokens()
        .delay(1500)
        .waitUntilFinished(-4000);
    sequence.effect()
        .copySprite(target)
        .atLocation(target)
        .animateProperty("spriteContainer", "position.y", { from: -75, to: 0, duration: 500, ease: "easeOutBounce" })
        .scaleIn(0.25, 500)
        .fadeIn(250)
        .delay(1500)
        .waitUntilFinished(-150);
    sequence.animation()
        .on(target)
        .show(true)
        .opacity(1);
    return sequence;
}

async function playReturn(target, config = {}) {
    const sequence = await createReturn(target, config);
    return sequence?.play();
}

async function clean(target, config = {}) {
    new Sequence()
        .animation()
        .on(target)
        .opacity(1)
        .show(true)
        .play();
}

export const banishment = {
    banish: {
        create: createBanish,
        play: playBanish,
        stop: playReturn,
        clean: clean,
    },
    return: {
        create: createReturn,
        play: playReturn,
    },
    play: playBanish,
    stop: playReturn,
};

autoanimations.register("Banishment", "effect", "eskie.effect.banishment", DEFAULT_CONFIG, '0.1.0');