// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { templates } from '../../../lib/templates.js'
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'Faerie Fire',
    color: 'green',
    aoeDistance: 10,
};

function getTintAndHue(color) {
    switch (color) {
        case 'blue':
            return { tintColor: '0x91c5d2', hue: '160' };
        case 'green':
            return { tintColor: '0xd3eb6a', hue: '45' };
        case 'purple':
            return { tintColor: '0xdcace3', hue: '250' };
        default:
            return { tintColor: '0xd3eb6a', hue: '45' };
    }
}

async function create(token, config = {}) {
    const seq = await createCloud(token, config);
    const { targets } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false })

    if (targets) {
        for (const target of targets) {
            seq.addSequence(await createEffect(target, config));
        }
    }
    return seq;
}

async function createCloud(token, config = {}) {
    const { id, template, color } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { tintColor, hue } = getTintAndHue(color);

    const cfg = {
        radius: 20,
        max: 60,
        icon: 'modules/jb2a_patreon/Library/Generic/Portals/Portal_Bright_Purple_V_400x250.webm',
        label: 'Faerie Fire'
    };
    let [position, _] = await templates.getPosition(template, cfg);
    if (!position) { return; }

    const sequence = new Sequence();
    sequence.effect()
        .file(closest(`jb2a.fairies.loop.01.greenyellow`))
        .atLocation(position)
        .scale(0.05)
        .playbackRate(1)
        .duration(1500)
        .opacity(0.75)
        .scaleIn(0, 1000, { ease: "easeOutCubic" })
        .filter("ColorMatrix", { brightness: 0, hue: hue })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .animateProperty("sprite", "width", { from: 0, to: -0.25, duration: 2500, gridUnits: true, ease: "easeInOutBack" })
        .animateProperty("sprite", "height", { from: 0, to: -0.25, duration: 2500, gridUnits: true, ease: "easeInOutBack" })
        .belowTokens();

    sequence.effect()
        .file(closest(`jb2a.particles.outward.white.01.03`))
        .atLocation(position)
        .scale(0.025)
        .playbackRate(1)
        .duration(1500)
        .fadeIn(1500)
        .scaleIn(0, 1500, { ease: "easeOutCubic" })
        .filter("ColorMatrix", { hue: hue })
        .animateProperty("sprite", "width", { from: 0, to: 0.5, duration: 2500, gridUnits: true, ease: "easeOutBack" })
        .animateProperty("sprite", "height", { from: 0, to: 1, duration: 2500, gridUnits: true, ease: "easeOutBack" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.45, duration: 2500, gridUnits: true });

    sequence.effect()
        .file(closest(`jb2a.sacred_flame.target.${color}`))
        .atLocation(position)
        .scale(0.05)
        .playbackRate(1)
        .duration(1500)
        .scaleIn(0, 1500, { ease: "easeOutCubic" })
        .animateProperty("sprite", "width", { from: 0, to: 0.5, duration: 2500, gridUnits: true, ease: "easeOutBack" })
        .animateProperty("sprite", "height", { from: 0, to: 0.5, duration: 2500, gridUnits: true, ease: "easeOutBack" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.25, duration: 2500, gridUnits: true, ease: "easeOutBack" })
        .waitUntilFinished(-200);

    sequence.effect()
        .file(closest(`jb2a.impact.010.${color}`))
        .atLocation(position, { offset: { y: -0.25 }, gridUnits: true })
        .scale(0.45)
        .randomRotation()
        .zIndex(1);

    sequence.effect()
        .file(closest("jb2a.particles.outward.white.01.03"))
        .scaleIn(0, 500, { ease: "easeOutQuint" })
        .fadeOut(1000)
        .atLocation(position, { offset: { y: -0.25 }, gridUnits: true })
        .randomRotation()
        .duration(2500)
        .size(3, { gridUnits: true })
        .filter("Glow", { color: tintColor, distance: 10 })
        .zIndex(2);

    sequence.effect()
        .file(closest(`jb2a.fireflies.{{Pfew}}.02.${color}`))
        .atLocation({ x: position.x, y: position.y }, { randomOffset: 3.5 })
        .scaleToObject(1.8)
        .randomRotation()
        .duration(750)
        .fadeOut(500)
        .setMustache({
            "Pfew": () => {
                const Pfews = [`few`, `many`];
                return Pfews[Math.floor(Math.random() * Pfews.length)];
            }
        })
        .repeats(10, 75, 75)
        .zIndex(1);

    sequence.effect()
        .file(closest(`eskie.pulse.energy.01.yellow.yellow`))
        .atLocation(position, { offset: { y: -0.25 }, gridUnits: true })
        .size(5, { gridUnits: true })
        .filter("ColorMatrix", { saturate: -1, brightness: 2, hue: hue })
        .fadeOut(250)
        .filter("Blur", { blurX: 10, blurY: 10 })
        .zIndex(0.5);

    sequence.effect()
        .delay(50)
        .file(closest(`eskie.pulse.energy.01.yellow.yellow`))
        .atLocation(position, { offset: { y: -0.25 }, gridUnits: true })
        .size(5, { gridUnits: true })
        .filter("ColorMatrix", { hue: hue })
        .zIndex(0.5);

    return sequence;
}

function createEffect(token, config = {}) {
    const { id, color } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { tintColor, hue } = getTintAndHue(color);

    const sequence = new Sequence();
    sequence.wait(1000);

    sequence.effect()
        .name(`${id} - ${token.name}`)
        .file(closest(`jb2a.fireflies.many.01.${color}`))
        .attachTo(token)
        .scaleToObject(1.4)
        .randomRotation()
        .fadeIn(500, { delay: 500 })
        .fadeOut(1500, { ease: "easeInSine" })
        .persist()
        .private();

    sequence.effect()
        .name(`${id} - ${token.name}`)
        .copySprite(token)
        .belowTokens()
        .attachTo(token, { locale: true })
        .scaleToObject(1, { considerTokenScale: true })
        .spriteRotation(-token.document.rotation)
        .filter("Glow", { color: tintColor, distance: 20 })
        .fadeIn(1500, { delay: 500 })
        .fadeOut(1500, { ease: "easeInSine" })
        .zIndex(0.1)
        .persist();

    return sequence;
}

async function play(token, config = {}) {
    const sequence = await create(token, config);
    if (sequence) { return sequence.play(); }
}

async function playCloud(token, config = {}) {
    const sequence = await createCloud(token, config);
    if (sequence) { return sequence.play(); }
}

async function playEffect(token, config = {}) {
    const sequence = await createEffect(token, config);
    if (sequence) { return sequence.play(); }
}

async function stop(token, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    Sequencer.EffectManager.endEffects({ name: `${id} - ${token.name}`, object: token });
}

async function clean(config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    Sequencer.EffectManager.endEffects({ name: `${id}` });
}

export const faerieFire = {
    create,
    play,
    stop,
    clean,
    template: {
        create: createCloud,
        play: playCloud,
        default_config: DEFAULT_CONFIG,
    },
    effect: {
        create: createEffect,
        play: playEffect,
        default_config: DEFAULT_CONFIG,
    },
    default_config: DEFAULT_CONFIG,
};

autoanimations.register("Faerie Fire", "template", "eskie.effect.faerieFire.template", DEFAULT_CONFIG);
autoanimations.register("Faerie Fire", "effect", "eskie.effect.faerieFire.effect", DEFAULT_CONFIG);