// Original Author: EskieMoh#2969
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

import { closest } from '../../../lib/filemanager.js';

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
const FLYING_TAG = 'Flying';
const EFFECT_NAME = 'Fly';

export const DEFAULT_CONFIG = {
    id: 'AerodyneVehicle',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, sound } = mConfig;

    const tokenRotation = adapter.getTokenRotation(token);
    const { widthPx: w, heightPx: h } = adapter.getTokenDimensions(token);

    const seq = new Sequence();
    applySound(seq, sound);
    seq
        .effect()
        .file(closest('eskie.smoke.07.white'))
        .atLocation(token)
        .randomRotation()
        .scale(1.2)
        .opacity(0.25)
        .loopProperty('sprite', 'scale.x', { from: 1, to: 1.5, duration: 900 })
        .loopProperty('sprite', 'scale.y', { from: 1, to: 1.5, duration: 900 })
        .belowTokens()

        .motion(token)
        .name(EFFECT_NAME)
        .moveBy({ y: -0.2 }, { duration: 1000, gridUnits: true })
        .oscillate({ period: 2000, amplitude: 0.05 })

        .effect()
        .copySprite(token)
        .spriteRotation(-tokenRotation)
        .name(EFFECT_NAME)
        .atLocation(token, { ignoreMotion: true })
        .size({ width: w, height: h })
        .duration(1000)
        .opacity(0.5)
        .filter('ColorMatrix', { brightness: -1 })
        .filter('Blur', { blurX: 5, blurY: 10 })
        .attachTo(token, { offset: { x: 0, y: 0.25 }, gridUnits: true, bindRotation: true, bindAlpha: false, ignoreMotion: true })
        .zIndex(0)
        .persist()

        // Thrusters, adjust thruster offset to match the token image
        .effect()
        .file(closest('jb2a.dancing_lights.01.blueteal'))
        .scaleToObject(0.25)
        .name(EFFECT_NAME)
        .atLocation(token, { offset: { x: 1.2, y: 1.2 }, gridUnits: true, local: true })
        .attachTo(token, { bindAlpha: false })
        .filter('ColorMatrix', { saturate: 1 })
        .filter('Blur', { blurX: 10, blurY: 10 })
        .persist()
        .playbackRate(5)
        .spriteRotation(tokenRotation)
        .zIndex(0)

        .effect()
        .file(closest('jb2a.dancing_lights.01.blueteal'))
        .scaleToObject(0.25)
        .name(EFFECT_NAME)
        .atLocation(token, { offset: { x: -1.2, y: 1.2 }, gridUnits: true, local: true })
        .attachTo(token, { bindAlpha: false })
        .filter('ColorMatrix', { saturate: 1 })
        .filter('Blur', { blurX: 10, blurY: 10 })
        .persist()
        .playbackRate(5)
        .spriteRotation(tokenRotation)
        .zIndex(0)

        .effect()
        .file(closest('jb2a.dancing_lights.01.blueteal'))
        .scaleToObject(0.25)
        .name(EFFECT_NAME)
        .atLocation(token, { offset: { x: 1.2, y: -1.2 }, gridUnits: true, local: true })
        .attachTo(token, { bindAlpha: false })
        .filter('ColorMatrix', { saturate: 1 })
        .filter('Blur', { blurX: 10, blurY: 10 })
        .persist()
        .playbackRate(5)
        .spriteRotation(tokenRotation)
        .zIndex(0)

        .effect()
        .file(closest('jb2a.dancing_lights.01.blueteal'))
        .scaleToObject(0.25)
        .name(EFFECT_NAME)
        .atLocation(token, { offset: { x: -1.2, y: -1.2 }, gridUnits: true, local: true })
        .attachTo(token, { bindAlpha: false })
        .filter('ColorMatrix', { saturate: 1 })
        .filter('Blur', { blurX: 10, blurY: 10 })
        .persist()
        .playbackRate(5)
        .spriteRotation(tokenRotation)
        .zIndex(0);

    return seq;
}

async function play(token: Token, config: any = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

async function stop(token: Token, config: any = {}) {
    if (game.modules.get('tagger')?.active) {
        await Tagger.removeTags(token, FLYING_TAG);
    }
    await Sequencer.EffectManager.endEffects({ name: EFFECT_NAME, object: token });
    return new Sequence()
        .effect()
        .file(closest('eskie.smoke.07.white'))
        .atLocation(token)
        .randomRotation()
        .scale(1.2)
        .belowTokens()
        .opacity(0.25)
        .loopProperty('sprite', 'scale.x', { from: 1, to: 1.5, duration: 900 })
        .loopProperty('sprite', 'scale.y', { from: 1, to: 1.5, duration: 900 })
        .belowTokens()
        .play();
}

export const aerodyneVehicle = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

