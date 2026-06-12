// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { text as textUtil } from '../../utils/text.js';
import { cinemaBars } from '../../scene-overlays/cinema-bars.js';

const DEFAULT_CONFIG = {
    id: 'IaijutsuStrike',
    targetDeath: true,
    teleport: true,
    cameraFocus: {
        enable: true,
        scale: 0.3
    },
    text: {
        id: 'IaijutsuStrike Text',
        duration: 2500,
        delay: 200,
        style: {
            "fill": "#da1b1bff",
            "fontFamily": "Helvetica",
            "fontSize": 106,
            "strokeThickness": 0,
            fontWeight: "bold",
        },
        kerning: 1.7,
        verticalOffset: 0.75,
    }
};

function dashEffect(source, target) {
    const deltaX = target.x - source.x;
    const deltaY = source.y - target.y;
    const angleRad = Math.atan2(deltaY, deltaX);
    const angleDeg = angleRad * 180 / Math.PI;

    let sequence = new Sequence();
    sequence.effect()
        .file(closest("eskie.attack.ranged.arrow.01.physical.heavy.redblack"))
        .atLocation(target)
        .rotate(angleDeg)
        .filter("ColorMatrix", { saturate: -1, brightness: 1 })
        .size({ width: 8, height: 1 }, { gridUnits: true })
        .scaleOut(0, 600, { ease: "easeOutCubic" })
        .aboveLighting()
    return sequence;
}

function deathAnimation(target) {
    let sequence = new Sequence();
    sequence.animation()
        .on(target)
        .opacity(0)

    sequence.effect()
        .name(`IaijutsuStrike ${target.name} Top`)
        .copySprite(target)
        .atLocation(target)
        .scaleToObject(1, { considerTokenScale: true })
        .shape("polygon", {
            lineSize: 1,
            lineColor: "#FF0000",
            fillColor: "#FF0000",
            points: [{ x: -1, y: -1 }, { x: 1, y: 1 }, { x: 1, y: -1 }],
            fillAlpha: 1,
            gridUnits: true,
            isMask: true,
            name: "test"
        })
        .moveTowards({ x: target.x + canvas.grid.size * target.document.width + 0.1, y: target.y + canvas.grid.size * target.document.width + 0.1 }, { rotate: false })
        .moveSpeed(100)
        .persist()
        .extraEndDuration(1000)
        .fadeOut(1000)

    sequence.effect()
        .name(`IaijutsuStrike ${target.name} Bottom`)
        .copySprite(target)
        .atLocation(target)
        .scaleToObject(1, { considerTokenScale: true })
        .shape("polygon", {
            lineSize: 1,
            lineColor: "#FF0000",
            fillColor: "#FF0000",
            points: [{ x: -1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }],
            fillAlpha: 1,
            gridUnits: true,
            isMask: true,
            name: "test"
        })
        .zIndex(0.1)
        .persist()
        .fadeOut(500)

    sequence.effect()
        .file(closest("jb2a.water_splash.cone.01.red"))
        .atLocation(target, { offset: { x: 0.1, y: -0.1 }, gridUnits: true })
        .delay(250)
        .fadeIn(200)
        .scaleToObject()
        .zIndex(0)
        .fadeOut(500)
        .rotate(45)

    sequence.wait(5500)
    return sequence;
}

async function create(source, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { targetDeath, teleport, cameraFocus, text } = mConfig;

    let position;

    if (teleport === true) {
        let crosshairsConfig = {
            size: 1,
            icon: 'icons/skills/melee/blade-tip-orange.webp',
            label: 'Iaijutsu Strike',
            tag: 'katana lol',
            t: 'ray',
            drawIcon: true,
            drawOutline: true,
            interval: -1,
            rememberControlled: true,
        }
        position = await Sequencer.Crosshair.show(crosshairsConfig);
    }

    let sequence = new Sequence();

    if (cameraFocus.enable) {
        sequence.addSequence(cinemaBars.create({ dim: true }));
        sequence.canvasPan({ duration: 250, x: target.center.x, y: target.center.y, scale: cameraFocus.scale })
    }

    sequence.effect()
        .file(closest("eskie.star.02.blue"))
        .scaleToObject(0.75)
        .atLocation(source, { offset: { x: 0.25, y: 0.25 }, gridUnits: true })
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .rotateIn(-180, 500, { ease: "easeOutCubic" })
        .filter("ColorMatrix", { saturate: -1, brightness: 1.2 })
        .aboveLighting()
        .waitUntilFinished()

    sequence.wait(500)

    sequence.addSequence(dashEffect(source, target));

    if (teleport == true) {
        sequence.animation()
            .on(source)
            .teleportTo(position)
            .snapToGrid()
            .offset({ x: -1, y: -1 })
    }

    sequence.wait(500)

    sequence.addSequence(await textUtil.create(target, "居合術", text));

    if (targetDeath === true) {
        sequence.addSequence(deathAnimation(target));
    }

    sequence.wait(500)

    if (cameraFocus.enable) {
        sequence.thenDo(() => cinemaBars.stop())
    }

    return sequence;
}

async function play(source, target, config = {}) {
    const seq = await create(source, target, config);
    if (seq) { await seq.play(); }
}

async function clean(target, config = {}) {
    return Promise.all([
        Sequencer.EffectManager.endEffects({ name: `IaijutsuStrike` }),
        Sequencer.EffectManager.endEffects({ name: `IaijutsuText` }),
        cinemaBars.stop(),
        Sequencer.EffectManager.endEffects({ name: `IaijutsuStrike ${target.name} *` }),
        new Sequence()
            .animation()
            .on(target)
            .opacity(1)
            .show(true)
            .play()
    ]);
}

export const iaijutsuStrike = {
    create,
    play,
    clean,
    default_config: DEFAULT_CONFIG,
};
