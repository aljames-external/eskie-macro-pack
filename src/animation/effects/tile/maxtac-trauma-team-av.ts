// Original Author: EskieMoh#2969
// Modular Conversion: Antigravity

import { closest } from '../../../lib/filemanager.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

import { adapter } from "../../../adapters/index.js";
export const DEFAULT_CONFIG = {
    id: 'MaxTacTraumaTeamAV',
    flyingTag: 'Flying',
    effectNameFly: 'Fly',
    effectNameLanding: 'landing',
    sound: { ...DEFAULT_SOUND_CONFIG }
};

async function create(tile: Tile, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { effectNameFly, effectNameLanding, sound } = mConfig;

    const tileRotation = adapter.getTileRotation(tile);
    const { width: w, height: h } = adapter.getTileBounds(tile);

    const cautionstyle = {
        'fill': '#fffed6',
        'fontFamily': 'Arial',
        'fontSize': 7,
    };

    const style = {
        'fill': '#fffed6',
        'fontFamily': 'Impact, Charcoal, sans-serif',
        'fontSize': 7,
    };

    const sequence = new Sequence();
    applySound(sequence, sound);

    // 1. Landing sequence
    sequence
        .effect()
            .name(effectNameLanding)
            .attachTo(tile)
            .file(closest('jb2a.token_stage.square.red.02.03'))
            .scaleToObject(1.09)
            .persist()
            .playbackRate(2)
            .belowTokens()
            .elevation(0)

        .effect()
            .name(effectNameLanding)
            .attachTo(tile)
            .file(closest('jb2a.token_stage.square.red.02.02'))
            .scaleToObject(1)
            .persist()
            .playbackRate(2)
            .belowTokens()
            .elevation(0)

        .wait(250)

        .effect()
            .name(effectNameLanding)
            .text('注意', cautionstyle)
            .filter('Glow', { color: 0xF96244, innerStrength: 1 })
            .attachTo(tile)
            .anchor({ y: -30 * Math.max(1, (((tileRotation / 90) % 2) * 2.1025)) })
            .loopProperty('alphaFilter', 'alpha', { values: [-1, 0], duration: 500, pingPong: true, delay: 500 })
            .animateProperty('spriteContainer', 'rotation', { from: 0, to: tileRotation, duration: 0 })
            .scaleToObject(0.01, { uniform: false })
            .persist()
            .belowTokens()
            .elevation(0)

        .effect()
            .name(effectNameLanding)
            .text('CAUTION', cautionstyle)
            .filter('Glow', { color: 0xF96244, innerStrength: 1 })
            .attachTo(tile)
            .anchor({ y: -21 * Math.max(1, (((tileRotation / 90) % 2) * 2.5)) })
            .loopProperty('alphaFilter', 'alpha', { values: [-1, 0], duration: 500, pingPong: true, delay: 500 })
            .animateProperty('spriteContainer', 'rotation', { from: 0, to: tileRotation, duration: 0 })
            .scaleToObject(0.01, { uniform: false })
            .persist()
            .belowTokens()
            .elevation(0)

        .effect()
            .name(effectNameLanding)
            .text('STAY AWAY', style)
            .filter('Glow', { color: 0xF96244, innerStrength: 1 })
            .attachTo(tile)
            .anchor({ x: -5 * Math.max(1, Math.abs(((tileRotation / 90) % 2) - 0.5) * 4), y: -12.5 * Math.max(1, (((tileRotation / 90) % 2) * 2.5)) })
            .loopProperty('alphaFilter', 'alpha', { values: [-1, 0], duration: 500, pingPong: true, delay: 500 })
            .animateProperty('spriteContainer', 'rotation', { from: 0, to: tileRotation - 90, duration: 0 })
            .scaleToObject(0.01, { uniform: false })
            .persist()
            .belowTokens()
            .elevation(0)
            .mirrorY()
            .mirrorX()

        .effect()
            .name(effectNameLanding)
            .text('STAY AWAY', style)
            .filter('Glow', { color: 0xF96244, innerStrength: 1 })
            .attachTo(tile)
            .anchor({ x: 5 * Math.max(1, Math.abs(((tileRotation / 90) % 2) - 0.5) * 4), y: -12.5 * Math.max(1, (((tileRotation / 90) % 2) * 2.5)) })
            .loopProperty('alphaFilter', 'alpha', { values: [-1, 0], duration: 500, pingPong: true, delay: 500 })
            .animateProperty('spriteContainer', 'rotation', { from: 0, to: tileRotation + 90, duration: 0 })
            .scaleToObject(0.01, { uniform: false })
            .persist()
            .belowTokens()
            .elevation(0)
            .mirrorY()
            .mirrorX()

        .effect()
            .name(effectNameLanding)
            .file(closest('icons/svg/hazard.svg'))
            .filter('Glow', { color: 0xF96244, knockout: true, innerStrength: 1 })
            .attachTo(tile)
            .anchor({ x: 0 })
            .loopProperty('alphaFilter', 'alpha', { values: [-1, 0], duration: 500, pingPong: true, delay: 500 })
            .animateProperty('spriteContainer', 'rotation', { from: 0, to: tileRotation + 90, duration: 0 })
            .scaleToObject(0.15, { uniform: true })
            .persist()
            .belowTokens()
            .elevation(0)
            .mirrorY()
            .mirrorX()

        .effect()
            .name(effectNameLanding)
            .file(closest('icons/svg/hazard.svg'))
            .filter('Glow', { color: 0xF96244, knockout: true, innerStrength: 1 })
            .attachTo(tile)
            .anchor({ x: 2.25 })
            .loopProperty('alphaFilter', 'alpha', { values: [-1, 0], duration: 500, pingPong: true, delay: 500 })
            .animateProperty('spriteContainer', 'rotation', { from: 0, to: tileRotation + 90, duration: 0 })
            .scaleToObject(0.15, { uniform: true })
            .persist()
            .belowTokens()
            .elevation(0)

        .wait(2000)

        // 2. Fly / Thrusters / Vehicle tile motion
        .effect()
            .file(closest('jb2a.dancing_light.red'))
            .scaleToObject(0.25)
            .name(effectNameFly)
            .attachTo(tile, { offset: { x: 1.5, y: -11.5 }, gridUnits: true, local: true, bindAlpha: false })
            .filter('ColorMatrix', { saturate: 1 })
            .filter('Blur', { blurX: 10, blurY: 10 })
            .persist()
            .playbackRate(5)
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: 8, gridUnits: true, duration: 5000, ease: 'easeOutBack' })
            .animateProperty('spriteContainer', 'rotation', { from: 0, to: tileRotation + 90, duration: 0 })
            .loopProperty('sprite', 'position.y', { from: 0, to: -20, duration: 2500, pingPong: true, delay: 500 })
            .zIndex(0)

        .effect()
            .file(closest('jb2a.dancing_light.red'))
            .scaleToObject(0.25)
            .name(effectNameFly)
            .attachTo(tile, { offset: { x: -1.5, y: -11.5 }, gridUnits: true, local: true, bindAlpha: false })
            .filter('ColorMatrix', { saturate: 1 })
            .filter('Blur', { blurX: 10, blurY: 10 })
            .persist()
            .playbackRate(5)
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: 8, gridUnits: true, duration: 5000, ease: 'easeOutBack' })
            .animateProperty('spriteContainer', 'rotation', { from: 0, to: tileRotation + 90, duration: 0 })
            .loopProperty('sprite', 'position.y', { from: 0, to: -20, duration: 2500, pingPong: true, delay: 500 })
            .zIndex(0)

        .effect()
            .file(closest('jb2a.dancing_light.red'))
            .scaleToObject(0.25)
            .name(effectNameFly)
            .attachTo(tile, { offset: { x: 1.5, y: -8.5 }, gridUnits: true, local: true, bindAlpha: false })
            .filter('ColorMatrix', { saturate: 1 })
            .filter('Blur', { blurX: 10, blurY: 10 })
            .persist()
            .playbackRate(5)
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: 8, gridUnits: true, duration: 5000, ease: 'easeOutBack' })
            .animateProperty('spriteContainer', 'rotation', { from: 0, to: tileRotation + 90, duration: 0 })
            .loopProperty('sprite', 'position.y', { from: 0, to: -20, duration: 2500, pingPong: true, delay: 500 })
            .zIndex(0)

        .effect()
            .file(closest('jb2a.dancing_light.red'))
            .scaleToObject(0.25)
            .name(effectNameFly)
            .attachTo(tile, { offset: { x: -1.5, y: -8.5 }, gridUnits: true, local: true, bindAlpha: false })
            .filter('ColorMatrix', { saturate: 1 })
            .filter('Blur', { blurX: 10, blurY: 10 })
            .persist()
            .playbackRate(5)
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: 8, gridUnits: true, duration: 5000, ease: 'easeOutBack' })
            .animateProperty('spriteContainer', 'rotation', { from: 0, to: tileRotation + 90, duration: 0 })
            .loopProperty('sprite', 'position.y', { from: 0, to: -20, duration: 2500, pingPong: true, delay: 500 })
            .zIndex(0)

        // Sequencer 4.3.0+ Vehicle tile flying hover motion
        .motion(tile)
            .name(effectNameFly)
            .moveBy({ y: -0.5 }, { duration: 1000, gridUnits: true })
            .oscillate({ period: 2000, amplitude: 0.05 })

        // Ground drop shadow effect
        .effect()
            .copySprite(tile)
            .spriteRotation(-tileRotation)
            .name(effectNameFly)
            .atLocation(tile, { ignoreMotion: true })
            .size({ width: w, height: h })
            .opacity(0.35)
            .filter('ColorMatrix', { brightness: -1 })
            .filter('Blur', { blurX: 5, blurY: 10 })
            .attachTo(tile, { bindAlpha: false, ignoreMotion: true })
            .belowTokens()
            .zIndex(0)
            .persist()

        .effect()
            .name(effectNameFly)
            .file(closest('eskie.smoke.07.white'))
            .scale(1.2)
            .delay(4000)
            .attachTo(tile, { offset: { y: -1.5 }, gridUnits: true, bindAlpha: false })
            .belowTokens()
            .tint('#F96244')
            .opacity(0.25)
            .loopProperty('sprite', 'scale.x', { from: 1, to: 1.5, duration: 900 })
            .loopProperty('sprite', 'scale.y', { from: 1, to: 1.5, duration: 900 })
            .persist();

    return sequence;
}

async function play(tile: Tile, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { flyingTag } = mConfig;

    if (game.modules.get('tagger')?.active && Tagger.hasTags(tile, flyingTag)) {
        await stop(tile, config);
        return;
    }

    if (game.modules.get('tagger')?.active) {
        await Tagger.addTags(tile, flyingTag);
    }
    const seq = await create(tile, config);
    if (seq) return seq.play();
}

async function stop(tile: Tile, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { flyingTag, effectNameFly, effectNameLanding } = mConfig;

    const tileRotation = adapter.getTileRotation(tile);
    const { width: w, height: h } = adapter.getTileBounds(tile);

    // End landing indicators immediately
    await Sequencer.EffectManager.endEffects({ name: effectNameLanding, object: tile });

    // End persistent hovering fly effects
    await Sequencer.EffectManager.endEffects({ name: effectNameFly, object: tile });

    if (game.modules.get('tagger')?.active) {
        await Tagger.removeTags(tile, flyingTag);
    }

    // Play fly-off animation sequence
    return new Sequence()
        // Thrusters firing / moving off
        .effect()
            .file(closest('jb2a.dancing_light.red'))
            .scaleToObject(0.25)
            .attachTo(tile, { offset: { x: 1.5, y: -11.5 }, gridUnits: true, local: true, bindAlpha: false })
            .filter('ColorMatrix', { saturate: 1 })
            .filter('Blur', { blurX: 10, blurY: 10 })
            .playbackRate(5)
            .animateProperty('spriteContainer', 'position.y', { from: 8, to: -40, gridUnits: true, duration: 1500, ease: 'easeInCubic' })
            .animateProperty('spriteContainer', 'rotation', { from: 0, to: tileRotation + 90, duration: 0 })
            .zIndex(0)

        .effect()
            .file(closest('jb2a.dancing_light.red'))
            .scaleToObject(0.25)
            .attachTo(tile, { offset: { x: -1.5, y: -11.5 }, gridUnits: true, local: true, bindAlpha: false })
            .filter('ColorMatrix', { saturate: 1 })
            .filter('Blur', { blurX: 10, blurY: 10 })
            .playbackRate(5)
            .animateProperty('spriteContainer', 'position.y', { from: 8, to: -40, gridUnits: true, duration: 1500, ease: 'easeInCubic' })
            .animateProperty('spriteContainer', 'rotation', { from: 0, to: tileRotation + 90, duration: 0 })
            .zIndex(0)

        .effect()
            .file(closest('jb2a.dancing_light.red'))
            .scaleToObject(0.25)
            .attachTo(tile, { offset: { x: 1.5, y: -8.5 }, gridUnits: true, local: true, bindAlpha: false })
            .filter('ColorMatrix', { saturate: 1 })
            .filter('Blur', { blurX: 10, blurY: 10 })
            .playbackRate(5)
            .animateProperty('spriteContainer', 'position.y', { from: 8, to: -40, gridUnits: true, duration: 1500, ease: 'easeInCubic' })
            .animateProperty('spriteContainer', 'rotation', { from: 0, to: tileRotation + 90, duration: 0 })
            .zIndex(0)

        .effect()
            .file(closest('jb2a.dancing_light.red'))
            .scaleToObject(0.25)
            .attachTo(tile, { offset: { x: -1.5, y: -8.5 }, gridUnits: true, local: true, bindAlpha: false })
            .filter('ColorMatrix', { saturate: 1 })
            .filter('Blur', { blurX: 10, blurY: 10 })
            .playbackRate(5)
            .animateProperty('spriteContainer', 'position.y', { from: 8, to: -40, gridUnits: true, duration: 1500, ease: 'easeInCubic' })
            .animateProperty('spriteContainer', 'rotation', { from: 0, to: tileRotation + 90, duration: 0 })
            .zIndex(0)

        // Vehicle tile fly-off motion via Sequencer 4.3.0+ .motion() API
        .motion(tile)
            .moveBy({ y: -40 }, { gridUnits: true, duration: 1500, ease: 'easeInCubic' })

        // Shadow moving and fading
        .effect()
            .copySprite(tile)
            .spriteRotation(-tileRotation)
            .attachTo(tile, { offset: { y: -8 }, gridUnits: true, bindAlpha: false })
            .size({ width: w, height: h })
            .animateProperty('spriteContainer', 'position.y', { from: 7, to: -20, gridUnits: true, duration: 1500, ease: 'easeInCubic' })
            .animateProperty('spriteContainer', 'scale.x', { from: 1, to: 0.2, duration: 1500, ease: 'easeInCubic' })
            .animateProperty('spriteContainer', 'scale.y', { from: 1, to: 0.2, duration: 1500, ease: 'easeInCubic' })
            .fadeOut(800, { delay: 500 })
            .opacity(0.35)
            .filter('ColorMatrix', { brightness: -1 })
            .filter('Blur', { blurX: 5, blurY: 10 })
            .belowTokens()
            .zIndex(2)
        .play();
}

export const maxtacTraumaTeamAV = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
