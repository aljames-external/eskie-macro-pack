// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
export interface SanctuaryConfig {
    id?: string;
    sound?: SoundConfig;
    [key: string]: unknown;
}

const DEFAULT_CONFIG: SanctuaryConfig = {
    id: 'Sanctuary',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, targetToken?: Token, config: SanctuaryConfig = {}) {
    const trg = targetToken ?? Array.from(game.user?.targets ?? [])[0] ?? token;
    if (!token || !trg) return null;

    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { sound } = mConfig;
    let seq = new Sequence();
    applySound(seq, sound);
    seq = seq
        .effect()
            .atLocation(token)
            .file(closest(`jb2a.markers.light.complete.yellow`))
            .scaleToObject(2)
            .scaleIn(0, 600, {ease: "easeOutCubic"})
            .belowTokens()
            .fadeOut(2000)
            .duration(5000)
            .zIndex(1)
            .filter("ColorMatrix", {saturate:-1, brightness:1.5})

        .wait(250)

        .effect()
            .atLocation(token)
            .file(closest(`jb2a.magic_signs.circle.02.conjuration.loop.blue`))
            .scaleToObject(1.25)
            .rotateIn(180, 600, {ease: "easeOutCubic"})
            .scaleIn(0, 600, {ease: "easeOutCubic"})
            .loopProperty('sprite', "rotation", { from: 0, to: -360, duration: 10000})
            .belowTokens()
            .fadeOut(2000)
            .zIndex(0)
            .filter("ColorMatrix", {hue:-5, saturate:-0.5, brightness:1.25})

        .effect()
            .atLocation(token)
            .file(closest(`jb2a.magic_signs.circle.02.conjuration.loop.blue`))
            .scaleToObject(1.25)
            .rotateIn(180, 600, {ease: "easeOutCubic"})
            .scaleIn(0, 600, {ease: "easeOutCubic"})
            .loopProperty('sprite', "rotation", { from: 0, to: -360, duration: 10000})
            .belowTokens(true)
            .filter("ColorMatrix", {saturate:-1, brightness:2})
            .filter("Blur", { blurX: 5, blurY: 10 })
            .zIndex(0.1)
            .duration(1200)
            .fadeIn(200, {ease: "easeOutCirc", delay: 500})
            .fadeOut(300, {ease: "linear"})

        .wait(250)

        .motion(trg)
            .name(`${trg.name} Sanctuary`)
            .oscillate({ period: 2000, amplitude: 0.05 })

        .effect()
            .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.normal"))
            .atLocation(trg)
            .scaleToObject(3.25 * trg.document.texture.scaleX)
            .delay(1200)

        .effect()
            .file(closest("jb2a.fireflies.few.02.yellow"))
            .name(`${trg.name} Sanctuary`)
            .scaleToObject(2 * trg.document.texture.scaleX)
            .opacity(1)
            .fadeIn(2000)
            .filter("ColorMatrix", {saturate:-1, brightness:2})
            .persist()
            .private()
            .attachTo(trg, {bindRotation: false})
            .fadeOut(750)
            .zIndex(3)
            .delay(1200)

        .effect()
            .file(closest("jb2a.extras.tmfx.inflow.circle.03"))
            .name(`${trg.name} Sanctuary`)
            .atLocation(trg)
            .scaleToObject(trg.document.texture.scaleX)
            .opacity(0.75)
            .persist()
            .private()
            .attachTo(trg)
            .fadeIn(1000)
            .fadeOut(500)
            .zIndex(1)
            .delay(1200)

        .effect()
            .file(closest("jb2a.extras.tmfx.outflow.circle.02"))
            .atLocation(trg)
            .fadeIn(200)
            .opacity(0.25)
            .duration(10000)
            .scaleToObject(3 * trg.document.texture.scaleX)
            .fadeOut(500)
            .belowTokens()
            .delay(1200)

        .effect()
            .file(closest("jb2a.particles.outward.blue.01.03"))
            .atLocation(trg)
            .filter("ColorMatrix", {saturate:-1, brightness:2})
            .fadeIn(200, {ease: "easeInExpo"})
            .duration(10000)
            .opacity(0.25)
            .scaleToObject(3 * trg.document.texture.scaleX)
            .fadeOut(500)
            .belowTokens()
            .delay(1200)

        .effect()
            .name(`${trg.name} Sanctuary`)
            .file(closest("jb2a.bless.200px.intro.yellow"))
            .atLocation(trg)
            .scaleToObject(1.5 * trg.document.texture.scaleX)
            .fadeIn(2000)
            .opacity(1)
            .waitUntilFinished(-500)
            .zIndex(0)

        .effect()
            .name(`${trg.name} Sanctuary`)
            .file(closest("jb2a.bless.200px.loop.blue"))
            .scaleToObject(1.5 * trg.document.texture.scaleX)
            .opacity(0.75)
            .fadeOut(500)
            .persist()
            .attachTo(trg, {bindRotation: false})
            .zIndex(0)
            .waitUntilFinished();
            
    return seq;
}

async function play(token: Token, targetToken?: Token, config: SanctuaryConfig = {}) {
    const seq = await create(token, targetToken, config);
    if (seq) { return seq.play(); }
}

function stop(token: Token, config: SanctuaryConfig = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mConfig;
    return Sequencer.EffectManager.endEffects({ name: `${token.name} ${id}`, object: token });
}

export const sanctuary = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
