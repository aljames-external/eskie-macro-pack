// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka
// Sequencer 4.3.0+ .motion() Update

import { closest } from '../../../lib/filemanager.js';
import { text as textUtil } from '../../utils/text.js';
import { cinemaBars } from '../../scene-overlays/cinema-bars.js';
import { settingsOverride } from '../../../lib/settings.js';

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";

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
    },
    sound: { ...DEFAULT_SOUND_CONFIG },
};

function dashEffect(source: Token, target: Token, sound: any) {
    const srcCenter = adapter.getCenter(source);
    const tgtCenter = adapter.getCenter(target);
    const deltaX = tgtCenter.x - srcCenter.x;
    const deltaY = srcCenter.y - tgtCenter.y;
    const angleRad = Math.atan2(deltaY, deltaX);
    const angleDeg = (angleRad * 180) / Math.PI;

    const sequence = new Sequence();
    if (sound) applySound(sequence, sound);
    sequence.effect()
        .file(closest("eskie.attack.ranged.arrow.01.physical.heavy.redblack"))
        .atLocation(target)
        .rotate(angleDeg)
        .filter("ColorMatrix", { saturate: -1, brightness: 1 })
        .size({ width: 8, height: 1 }, { gridUnits: true })
        .scaleOut(0, 600, { ease: "easeOutCubic" })
        .aboveLighting();
    return sequence;
}

function deathAnimation(target: Token, sound: any) {
    const sequence = new Sequence();
    if (sound) applySound(sequence, sound);

    const { widthUnits: targetWidth } = adapter.getTokenDimensions(target);
    const gridSize = adapter.getGridSize();
    const targetPos = adapter.getCenter(target);
    const targetName = target.name;
    const targetRot = adapter.getTokenRotation(target);

    sequence.effect()
        .name(`IaijutsuStrike ${targetName} Top`)
        .copySprite(target)
        .spriteRotation(-targetRot)
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
        .moveTowards({ x: targetPos.x + gridSize * targetWidth + 0.1, y: targetPos.y + gridSize * targetWidth + 0.1 }, { rotate: false })
        .moveSpeed(100)
        .persist()
        .extraEndDuration(1000)
        .fadeOut(1000);

    sequence.effect()
        .name(`IaijutsuStrike ${targetName} Bottom`)
        .copySprite(target)
        .spriteRotation(-targetRot)
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
        .fadeOut(500);

    sequence.effect()
        .file(closest("jb2a.water_splash.cone.01.red"))
        .atLocation(target, { offset: { x: 0.1, y: -0.1 }, gridUnits: true })
        .delay(250)
        .fadeIn(200)
        .scaleToObject()
        .zIndex(0)
        .fadeOut(500)
        .rotate(45);

    sequence.wait(5500);
    return sequence;
}

async function create(source: Token, target: Token, config: AnimationEffectConfig = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { targetDeath, teleport, cameraFocus, text } = mConfig;

    let position = mConfig.position;

    if (teleport && !position) {
        const crosshairsConfig = {
            size: 1,
            icon: 'icons/skills/melee/blade-tip-orange.webp',
            label: 'Iaijutsu Strike',
            tag: 'katana lol',
            t: 'ray',
            drawIcon: true,
            drawOutline: true,
            interval: -1,
            rememberControlled: true,
        };
        position = await Sequencer.Crosshair.show(crosshairsConfig);
        if (!position || position.cancelled) return;
    }

    const sequence = new Sequence();
    applySound(sequence, mConfig.sound);

    if (cameraFocus?.enable) {
        const targetCenter = adapter.getCenter(target);
        sequence.addSequence(cinemaBars.create({ dim: true }));
        sequence.canvasPan({ duration: 250, x: targetCenter.x, y: targetCenter.y, scale: cameraFocus.scale });
    }

    sequence.effect()
        .file(closest("eskie.star.02.blue"))
        .scaleToObject(0.75)
        .atLocation(source, { offset: { x: 0.25, y: 0.25 }, gridUnits: true })
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .rotateIn(-180, 500, { ease: "easeOutCubic" })
        .filter("ColorMatrix", { saturate: -1, brightness: 1.2 })
        .aboveLighting()
        .waitUntilFinished();

    sequence.wait(500);

    sequence.addSequence(dashEffect(source, target, mConfig.sound));

    const dashDestination = position ?? adapter.getCenter(target);

    // Slash dash token movement via Sequencer 4.3.0+ sequence.motion() API
    sequence.motion(source)
        .moveTo(dashDestination, { duration: 400, rotate: false, ease: 'easeOutCubic' });

    sequence.wait(500);

    sequence.addSequence(await textUtil.create(target, "居合術", text));

    if (targetDeath) {
        sequence.addSequence(deathAnimation(target, mConfig.sound));
    }

    sequence.wait(500);

    if (cameraFocus?.enable) {
        sequence.thenDo(() => cinemaBars.stop());
    }

    return sequence;
}

async function play(source: Token, target: Token, config: AnimationEffectConfig = {}) {
    config = settingsOverride(config);
    const seq = await create(source, target, config);
    if (seq) { await seq.play(); }
}

async function clean(target: Token, _config: AnimationEffectConfig = {}) {
    return Promise.all([
        Sequencer.EffectManager.endEffects({ name: `IaijutsuStrike` }),
        Sequencer.EffectManager.endEffects({ name: `IaijutsuText` }),
        cinemaBars.stop(),
        Sequencer.EffectManager.endEffects({ name: `IaijutsuStrike ${target.name} *` })
    ]);
}

export const iaijutsuStrike = {
    create,
    play,
    stop: clean,
    clean,
    default_config: DEFAULT_CONFIG,
};

