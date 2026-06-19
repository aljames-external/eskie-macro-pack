// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { autoanimations } from '../../../integration/autoanimations.js';

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
};

async function createCast(source, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG_CAST, config, { inplace: false });
    const { id, size, icon, label, tag, drawIcon, drawOutline, interval, rememberControlled } = mConfig;

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

    let position;
    if (mConfig.template) {
        let farpoint = mConfig.template._object?.ray?.B || mConfig.template.ray?.B;
        if (farpoint) {
            position = { x: farpoint.x, y: farpoint.y };
        } else {
            position = await Sequencer.Crosshair.show(crosshairConfig);
            if (position.cancelled) return;
        }
    } else {
        position = await Sequencer.Crosshair.show(crosshairConfig);
        if (position.cancelled) return;
    }
    let sequence = new Sequence()
        .effect()
        .file(closest('jb2a.markers.bubble.02.complete.green.0'))
        .atLocation(source)
        .scale(0.1)
        .rotateTowards(position)
        .rotate(90)
        .playbackRate(1)
        .duration(5100)
        .fadeOut(1000)
        .spriteOffset({ x: -0.2, y: 0.1 + (source.document.width - 1) / 2 }, { gridUnits: true })
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
        .spriteOffset({ x: -0.1 + (source.document.width - 1) / 2 }, { gridUnits: true })
        .filter('ColorMatrix', { saturate: 0.5, hue: -30 })
        .zIndex(2)

        .effect()
        .file(closest('jb2a.smoke.puff.side.grey'))
        .delay(1700)
        .atLocation(source)
        .scale(0.1)
        .rotateTowards(position)
        .playbackRate(0.25)
        .spriteOffset({ x: -0.4, y: 0 + (source.document.width - 1) / 2 }, { gridUnits: true })
        .opacity(0.75)
        .tint('#BEE43E')
        .zIndex(2)

        .effect()
        .file(closest('jb2a.breath_weapons.acid.line.green'))
        .atLocation(source)
        .scale(0.5)
        .rotateTowards(position)
        .playbackRate(1.5)
        .spriteOffset({ x: 0.35 + (source.document.width - 1) / 2 }, { gridUnits: true })
        .zIndex(1);

    return sequence;
}

async function playCast(source, config = {}) {
    const sequence = await createCast(source, config);
    if (sequence) return sequence.play();
}

async function createTarget(source, config = {}) {
    let sequence = new Sequence();

    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG_CAST, config, { inplace: false });
    let targets = mConfig.targets?.length ? mConfig.targets : Array.from(game.user.targets);

    for (let target of targets) {
        let targetSeq = new Sequence()
            .wait(2200)

            .effect()
            .delay(200)
            .from(target)
            .attachTo(target)
            .fadeIn(200)
            .fadeOut(500)
            .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
            .scaleToObject(target.document.texture.scaleX)
            .duration(1800)
            .opacity(0.25)
            .tint('#BEE43E')
            .filter('ColorMatrix', { saturate: 1 })

            .effect()
            .file(closest('jb2a.grease.dark_grey.loop'))
            .attachTo(target, { offset: { x: 0.25 * target.document.width, y: 0.3 * target.document.width }, gridUnits: true, bindRotation: false })
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
            .name(`${target.document.name}CausticBrew`)
            .persist()
            .private()

            .effect()
            .delay(100, 1000)
            .file(closest('eskie.smoke.05.purple'))
            .attachTo(target, { offset: { x: 0.25 * target.document.width, y: 0.1 * target.document.width }, gridUnits: true, bindRotation: false })
            .scaleToObject(0.4)
            .opacity(0.4)
            .tint('#BEE43E')
            .randomizeMirrorX()
            .fadeIn(500)
            .fadeOut(500)
            .zIndex(0.2)
            .name(`${target.document.name}CausticBrew`)
            .persist()
            .private()

            .effect()
            .file(closest('jb2a.grease.dark_grey.loop'))
            .attachTo(target, { offset: { x: -0.4 * target.document.width, y: 0 * target.document.width }, gridUnits: true, bindRotation: false })
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
            .name(`${target.document.name}CausticBrew`)
            .persist()
            .private()

            .effect()
            .delay(100, 1000)
            .file(closest('eskie.smoke.05.purple'))
            .attachTo(target, { offset: { x: -0.4 * target.document.width, y: -0.2 * target.document.width }, gridUnits: true, bindRotation: false })
            .scaleToObject(0.4)
            .opacity(0.4)
            .tint('#BEE43E')
            .randomizeMirrorX()
            .fadeIn(500)
            .fadeOut(500)
            .zIndex(0.2)
            .name(`${target.document.name}CausticBrew`)
            .persist()
            .private()

            .effect()
            .file(closest('jb2a.grease.dark_grey.loop'))
            .attachTo(target, { offset: { x: 0.15 * target.document.width, y: -0.5 * target.document.width }, gridUnits: true, bindRotation: false })
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
            .name(`${target.document.name}CausticBrew`)
            .persist()
            .private()

            .effect()
            .delay(100, 1000)
            .file(closest('eskie.smoke.05.purple'))
            .attachTo(target, { offset: { x: 0.15 * target.document.width, y: -0.55 * target.document.width }, gridUnits: true, bindRotation: false })
            .scaleToObject(0.3)
            .opacity(0.4)
            .tint('#BEE43E')
            .randomizeMirrorX()
            .fadeIn(500)
            .fadeOut(500)
            .zIndex(0.2)
            .name(`${target.document.name}CausticBrew`)
            .persist();

        sequence.addSequence(targetSeq);
    }

    return sequence;
}

async function playTarget(source, config = {}) {
    const sequence = await createTarget(source, config);
    if (sequence) return sequence.play();
}

async function stopTarget(source, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG_CAST, config, { inplace: false });
    let targets = mConfig.targets?.length ? mConfig.targets : Array.from(game.user.targets);
    for (let target of targets) {
        Sequencer.EffectManager.endEffects({ name: `${target.document.name}CausticBrew`, object: target });
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
    create: async function (source, config = {}) {
        const sequence = new Sequence();
        const castSeq = await createCast(source, config);
        if (!castSeq) return;
        sequence.addSequence(castSeq);

        const targetSeq = await createTarget(source, config);
        if (targetSeq) {
            sequence.addSequence(targetSeq);
        }
        return sequence;
    },
    play: async function (source, config = {}) {
        const sequence = await this.create(source, config);
        if (sequence) return sequence.play();
    },
    stop: stopTarget,
    default_config: DEFAULT_CONFIG_CAST,
};

autoanimations.register("Tasha's Caustic Brew", "template", "eskie.effect.tashasCausticBrew", DEFAULT_CONFIG_CAST, '0.1.0');
