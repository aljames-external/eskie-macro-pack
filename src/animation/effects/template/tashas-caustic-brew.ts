// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { template as templatelib } from '../../../lib/templates.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

import { adapter } from "../../../adapters/index.js";
const DEFAULT_CONFIG_CAST = {
    id: 'tashasCausticBrewCast',
    size: 1,
    icon: 'icons/magic/acid/dissolve-drip-droplet-smoke.webp',
    label: 'Tashas Caustic Brew',
    tag: 'Caustic Brew',
    drawIcon: true,
    drawOutline: true,
    interval: 2,
    rememberControlled: true,
    targets: [],
    sound: {
        cast: { ...DEFAULT_SOUND_CONFIG },
        stream: { ...DEFAULT_SOUND_CONFIG, delay: 1700 },
        burn: { ...DEFAULT_SOUND_CONFIG, delay: 2400 }
    }
};

async function createCast(source: Token, config: any = {}, options: any = {}) {
    if (options?.type === "aefx") return;
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG_CAST, config);
    const { id, size, icon, label, tag, drawIcon, drawOutline, interval, rememberControlled, sound } = mConfig;

    const crosshairConfig = {
        size: size,
        icon: icon,
        label: label,
        tag: tag,
        drawIcon: drawIcon,
        drawOutline: drawOutline,
        interval: interval,
        rememberControlled: rememberControlled,
    };

    const [primary, secondary] = await templatelib.getPosition(mConfig.template, crosshairConfig);
    const position = secondary ?? primary;
    if (!position || position.cancelled) return;

    const sourceWidth = adapter.getTokenDimensions(source).widthUnits;
    let sequence = new Sequence();
    applySound(sequence, sound?.cast);
    applySound(sequence, sound?.stream, 1700);
    sequence = sequence
        .effect()
        .file(closest('jb2a.markers.bubble.02.complete.green'))
        .atLocation(source)
        .scale(0.1)
        .rotateTowards(position)
        .rotate(90)
        .playbackRate(1)
        .duration(5100)
        .fadeOut(1000)
        .spriteOffset({ x: -0.2, y: 0.1 + (sourceWidth - 1) / 2 }, { gridUnits: true })
        .filter('ColorMatrix', { saturate: 1, hue: 0 })
        .zIndex(3)

        .effect()
        .file(closest('jb2a.markers.light_orb.complete.green'))
        .atLocation(source)
        .scale(0.25)
        .rotateTowards(position)
        .playbackRate(1.5)
        .duration(5100)
        .scaleOut(0, 2000, { ease: 'easeOutCubic' })
        .spriteOffset({ x: -0.1 + (sourceWidth - 1) / 2 }, { gridUnits: true })
        .filter('ColorMatrix', { saturate: 0.5, hue: -30 })
        .zIndex(2)

        .effect()
        .file(closest('jb2a.smoke.puff.side.grey'))
        .delay(1700)
        .atLocation(source)
        .scale(0.1)
        .rotateTowards(position)
        .playbackRate(0.25)
        .spriteOffset({ x: -0.4, y: (sourceWidth - 1) / 2 }, { gridUnits: true })
        .opacity(0.75)
        .tint('#BEE43E')
        .zIndex(2)

        .effect()
        .file(closest('jb2a.breath_weapons.acid.line.green'))
        .atLocation(source)
        .scale(0.5)
        .rotateTowards(position)
        .playbackRate(1.5)
        .spriteOffset({ x: 0.35 + (sourceWidth - 1) / 2 }, { gridUnits: true })
        .zIndex(1);

    return sequence;
}

async function playCast(source: Token, config: any = {}, options: any = {}) {
    if (options?.type === "aefx") return;
    const sequence = await createCast(source, config, options);
    if (sequence) return sequence.play();
}

async function createTarget(source: Token, config: any = {}, options: any = {}) {
    if (options?.type === "aefx") return;
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG_CAST, config);
    let sequence = new Sequence();
    applySound(sequence, mConfig.sound?.burn, 2400);

    let targets = mConfig.targets?.length ? mConfig.targets : Array.from(game.user?.targets ?? []);

    for (let target of targets) {
        const targetWidth = adapter.getTokenDimensions(target).widthUnits;
        const targetName = target.name;
        const targetScaleX = target.document.texture.scaleX ?? 1;
        const targetRotation = adapter.getTokenRotation(target);

        let targetSeq = new Sequence()
            .wait(2200)

            .effect()
            .delay(200)
            .copySprite(target)
            .spriteRotation(-targetRotation)
            .attachTo(target)
            .fadeIn(200)
            .fadeOut(500)
            .loopProperty('spriteContainer', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
            .scaleToObject(targetScaleX)
            .duration(1800)
            .opacity(0.25)
            .tint('#BEE43E')
            .filter('ColorMatrix', { saturate: 1 })

            .effect()
            .file(closest('jb2a.grease.dark_grey.loop'))
            .attachTo(target, { offset: { x: 0.25 * targetWidth, y: 0.3 * targetWidth }, gridUnits: true, bindRotation: false })
            .randomRotation()
            .scaleToObject(0.4)
            .opacity(0.8)
            .tint('#BEE43E')
            .filter('ColorMatrix', { saturate: 1, hue: 0, brightness: 2 })
            .fadeIn(2000)
            .fadeOut(2000)
            .scaleIn(0, 1500, { ease: 'easeOutCubic' })
            .scaleOut(0, 1500, { ease: 'easeOutCubic' })
            .mask(target)
            .zIndex(0.1)
            .name(`${targetName}CausticBrew`)
            .persist()
            .private()

            .effect()
            .delay(100, 1000)
            .file(closest('eskie.smoke.05.purple'))
            .attachTo(target, { offset: { x: 0.25 * targetWidth, y: 0.1 * targetWidth }, gridUnits: true, bindRotation: false })
            .scaleToObject(0.4)
            .opacity(0.4)
            .tint('#BEE43E')
            .randomizeMirrorX()
            .fadeIn(500)
            .fadeOut(500)
            .zIndex(0.2)
            .name(`${targetName}CausticBrew`)
            .persist()
            .private()

            .effect()
            .file(closest('jb2a.grease.dark_grey.loop'))
            .attachTo(target, { offset: { x: -0.4 * targetWidth, y: 0 }, gridUnits: true, bindRotation: false })
            .randomRotation()
            .scaleToObject(0.4)
            .opacity(0.8)
            .tint('#BEE43E')
            .filter('ColorMatrix', { saturate: 1, hue: 0, brightness: 2 })
            .fadeIn(2000)
            .fadeOut(2000)
            .scaleIn(0, 1500, { ease: 'easeOutCubic' })
            .scaleOut(0, 1500, { ease: 'easeOutCubic' })
            .mask(target)
            .zIndex(0.1)
            .name(`${targetName}CausticBrew`)
            .persist()
            .private()

            .effect()
            .delay(100, 1000)
            .file(closest('eskie.smoke.05.purple'))
            .attachTo(target, { offset: { x: -0.4 * targetWidth, y: -0.2 * targetWidth }, gridUnits: true, bindRotation: false })
            .scaleToObject(0.4)
            .opacity(0.4)
            .tint('#BEE43E')
            .randomizeMirrorX()
            .fadeIn(500)
            .fadeOut(500)
            .zIndex(0.2)
            .name(`${targetName}CausticBrew`)
            .persist()
            .private()

            .effect()
            .file(closest('jb2a.grease.dark_grey.loop'))
            .attachTo(target, { offset: { x: 0.15 * targetWidth, y: -0.5 * targetWidth }, gridUnits: true, bindRotation: false })
            .randomRotation()
            .scaleToObject(0.4)
            .opacity(0.8)
            .tint('#BEE43E')
            .filter('ColorMatrix', { saturate: 1, hue: 0, brightness: 2 })
            .fadeIn(2000)
            .fadeOut(2000)
            .scaleIn(0, 1500, { ease: 'easeOutCubic' })
            .scaleOut(0, 1500, { ease: 'easeOutCubic' })
            .mask(target)
            .zIndex(0.1)
            .name(`${targetName}CausticBrew`)
            .persist()
            .private()

            .effect()
            .delay(100, 1000)
            .file(closest('eskie.smoke.05.purple'))
            .attachTo(target, { offset: { x: 0.15 * targetWidth, y: -0.55 * targetWidth }, gridUnits: true, bindRotation: false })
            .scaleToObject(0.3)
            .opacity(0.4)
            .tint('#BEE43E')
            .randomizeMirrorX()
            .fadeIn(500)
            .fadeOut(500)
            .zIndex(0.2)
            .name(`${targetName}CausticBrew`)
            .persist();

        sequence.addSequence(targetSeq);
    }

    return sequence;
}

async function playTarget(source: Token, config: any = {}, options: any = {}) {
    if (options?.type === "aefx") return;
    const sequence = await createTarget(source, config, options);
    if (sequence) return sequence.play();
}

async function stopTarget(source: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG_CAST, config);
    let targets = mConfig.targets?.length ? mConfig.targets : Array.from(game.user?.targets ?? []);
    for (let target of targets) {
        Sequencer.EffectManager.endEffects({ name: `${target.name}CausticBrew`, object: target });
    }
}

export const tashasCausticBrew = {
    cast: {
        create: createCast,
        play: playCast,
        default_config: DEFAULT_CONFIG_CAST,
    },
    target: {
        create: createTarget,
        play: playTarget,
        stop: stopTarget,
        default_config: DEFAULT_CONFIG_CAST,
    },
    create: async function (source: Token, config: any = {}, options: any = {}) {
        if (options?.type === "aefx") return;
        const sequence = new Sequence();
        const castSeq = await createCast(source, config, options);
        if (!castSeq) return;
        sequence.addSequence(castSeq);

        const targetSeq = await createTarget(source, config, options);
        if (targetSeq) {
            sequence.addSequence(targetSeq);
        }
        return sequence;
    },
    play: async function (source: Token, config: any = {}, options: any = {}) {
        if (options?.type === "aefx") return;
        const sequence = await this.create(source, config, options);
        if (sequence) return sequence.play();
    },
    stop: stopTarget,
    default_config: DEFAULT_CONFIG_CAST,
};

adapter.autorec.register("tashasCausticBrew", "template", "eskie.effect.tashasCausticBrew", DEFAULT_CONFIG_CAST, '0.1.2', "Tasha's Caustic Brew");
