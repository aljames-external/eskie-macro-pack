// Original Author: EskieMoh#2969
// Updater: @bakanabaka

import { closest } from "../../../lib/filemanager.js";

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
const DEFAULT_CONFIG = {
    color: "teal",
    changeLight: true,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, target: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { color, changeLight, sound } = mConfig;
    const tintColorMap: Record<string, { tintColor: string; hue: number }> = {
        teal: { tintColor: '#6ff087', hue: 35 },
        green: { tintColor: '#6cde3b', hue: 0 },
        blue: { tintColor: '#74e2cf', hue: 75 },
        red: { tintColor: '#e22c47', hue: -95 }
    };
    const { tintColor, hue } = tintColorMap[color] ?? tintColorMap.teal;

    const tokenCenter = adapter.getCenter(token);
    const targetCenter = adapter.getCenter(target);
    const middleposition = {
        x: (targetCenter.x - tokenCenter.x) * 0.25,
        y: (targetCenter.y - tokenCenter.y) * 0.25,
    };
    const { widthUnits: tokenWidth } = adapter.getTokenDimensions(token);

    let sequence = new Sequence();
    applySound(sequence, sound);
    sequence = sequence
        .wait(100)
        .thenDo(function () {
            if (Tagger.hasTags(token, "Incorporeal")) {
                // End current poltergeist image
                Sequencer.EffectManager.endEffects({ name: `Incorporeal ${token.document.name}`, object: token });
            }
        })

        // Poltergeist attack
        .effect()
        .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
        .atLocation(token)
        .mirrorX(token.document.texture.scaleX < 0)
        .animateProperty('spriteContainer', 'position.x', { from: 0, to: middleposition.x, duration: 250, ease: "easeOutCubic" })
        .animateProperty('spriteContainer', 'position.y', { from: 0, to: middleposition.y, duration: 250, ease: "easeOutCubic" })
        .scaleToObject(1.45, { considerTokenScale: true })
        .duration(500)
        .fadeOut(500)
        .opacity(0.45)
        .tint(tintColor)
        .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
        .filter("Glow", { color: tintColor, distance: 5, outerStrength: 4, innerStrength: 0 })
        .filter("ColorMatrix", { saturate: -0.2, brightness: 1.2 })
        .filter("Blur", { blurX: 0, blurY: 0.8 })
        .playIf(() => {
            return Tagger.hasTags(token, "Incorporeal");
        })

        .motion(token)
        .moveBy(middleposition, { duration: 250, ease: "easeOutCubic" })
        .tintTo(tintColor)
        .playIf(() => {
            return Tagger.hasTags(token, "Incorporeal");
        })

        // Target hit point
        .effect()
        .delay(150)
        .file(closest("jb2a.impact.004.green"))
        .atLocation(target)
        .rotateTowards(token)
        .scaleToObject(1.45)
        .spriteScale({ x: 0.75, y: 1.0 })
        .filter("ColorMatrix", { saturate: -0.75, brightness: 1.5, hue: hue })
        .spriteOffset({ x: -0.15 }, { gridUnits: true })
        .zIndex(2)

        // Drain Touch Cracks
        .effect()
        .file(closest("jb2a.impact.ground_crack.02.white"))
        .atLocation(target)
        .rotateTowards(token)
        .spriteOffset({ x: -0.4 }, { gridUnits: true })
        .filter("ColorMatrix", { saturate: 0, brightness: 1.5 })
        .size(tokenWidth * 1.5, { gridUnits: true })
        .tint(tintColor)
        .mask(target)
        .zIndex(1)

        // Target draining touch shudder motion
        .motion(target)
        .noise()
        .duration(5000)

        // Animate hit dust
        .effect()
        .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
        .attachTo(target)
        .filter("ColorMatrix", { brightness: 0, saturate: -1 })
        .scaleToObject(1.45, { considerTokenScale: true })
        .fadeIn(3000)
        .fadeOut(1000)
        .belowTokens()
        .duration(5000)

        // Cracks on target
        .effect()
        .file(closest("jb2a.impact.ground_crack.still_frame.02"))
        .atLocation(target)
        .rotateTowards(token)
        .spriteOffset({ x: -0.4 }, { gridUnits: true })
        .filter("ColorMatrix", { saturate: 0, brightness: 0 })
        .filter("Glow", { outerStrength: 6, distance: 10, color: 0x000000 })
        .size(tokenWidth * 1.5, { gridUnits: true })
        .fadeIn(2000)
        .fadeOut(1000)
        .duration(5000)
        .tint(tintColor)
        .mask(target)
        .zIndex(0)
        .wait(750);
        
    return sequence;
}

async function play(token: Token, target: Token, config: any = {}) {
    await Tagger.addTags(token, "DrainingTouch");
    const sequence = await create(token, target, config);
    await sequence.play();
    await Tagger.removeTags(token, "DrainingTouch");

    if (Tagger.hasTags(token, "Incorporeal")) {
        const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
        const { color, changeLight, sound } = mConfig;
        const tintColors: Record<string, string> = {
            teal: '#6ff087',
            green: '#6cde3b',
            blue: '#74e2cf',
            red: '#e22c47'
        };
        const tintColor = tintColors[color] ?? '#6ff087';

        // Make attacker into a poltergeist via .motion()
        new Sequence()
            .thenDo(function () {
                if (changeLight) {
                    var light = { dim: 0, bright: 1, alpha: 0.25, luminosity: 0.55, color: tintColor, animation: { type: "torch", speed: 4, intensity: 5 }, attenuation: 0.85, contrast: 0, shadows: 0 };
                    token.document.update({ light })
                }
            })

            .effect()
            .name(`Incorporeal ${token.document.name}`)
            .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
            .attachTo(token, { cacheLocation: true, offset: { y: 0 }, gridUnits: true, bindAlpha: false })
            .scaleToObject(1.45, { considerTokenScale: true })
            .randomRotation()
            .belowTokens()
            .opacity(0.45)
            .tint(tintColor)
            .fadeIn(500)
            .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
            .filter("ColorMatrix", { saturate: -0.2, brightness: 1.2 })
            .persist()

            .motion(token)
            .name(`Incorporeal ${token.document.name}`)
            .oscillate()
            .fadeTo(0.65)
            .tintTo(tintColor)
            .persist()
            .waitUntilFinished()

            .effect()
            .file(closest("jb2a.smoke.puff.centered.grey"))
            .atLocation(token)
            .scaleToObject(2, { considerTokenScale: true })
            .opacity(0.5)
            .filter("ColorMatrix", { saturate: 0, brightness: 1.5 })
            .tint(tintColor)
            .playIf(() => {
                return !Tagger.hasTags(token, "DrainingTouch");
            })
            .thenDo(function () {
                if (!Tagger.hasTags(token, "DrainingTouch")) {
                    if (!Tagger.hasTags(token, "Possession")) {
                        Tagger.removeTags(token, "Incorporeal");
                        if (changeLight) {
                            var light = { dim: 0, bright: 0 };
                            token.document.update({ light });
                        }
                        Sequencer.EffectManager.endEffects({ name: `Incorporeal ${token.document.name}`, object: token });
                    }
                }
            })
            .play()
    }
}

async function stop(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mConfig;
    return Sequencer.EffectManager.endEffects({ name: id, object: token });
}

export const drainingTouch = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
