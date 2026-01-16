import { file } from "../../../lib/filemanager.js";
import { tokens } from "../../../lib/tokens.js";
import { blur } from "../../scene-overlays/status-blur.js";
import { autoanimations } from "../../../integration/autoanimations.js";

/* **
   Originally Published: 4/14/2023
   Author: EskieMoh#2969 
   Update Author: bakanabaka
** */

const DEFAULT_CONFIG = {
    id: 'drunk',
    duration: -1,
    overlay: {
        applyPC: true,
        applyGM: false,
    }
}

async function create(token, config = {}) {
    const { id, duration } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace: false});
    const tokenWidth = token.document.width;
    const label = `${id} - ${token.id}`;

    let drunkEffect = new Sequence()
        // Drunk bubbles effect
        .effect()
        .file(file('eskie.emote.drunk_bubbles.01'))
        .zIndex(0)
        .name(label)
        .delay(0, 500)
        .atLocation(token, { offset: { x: -0.2 * tokenWidth, y: -0.3 * tokenWidth }, gridUnits: true });
    drunkEffect = (duration > 0) ? drunkEffect.duration(duration) : drunkEffect.persist();
    drunkEffect = drunkEffect
        .scaleToObject(0.7)
        .zeroSpriteRotation()
        .loopProperty("sprite", "position.x", { from: 0, to: -0.02, duration: 2000, pingPong: true, gridUnits: true, ease: "linear" })
        .loopProperty("sprite", "position.y", { from: 0.15, to: -0.15, duration: 6000, pingPong: false, gridUnits: true, ease: "easeOutSine" })
        .loopProperty("sprite", "width", { from: 0, to: 0.1, duration: 6000, pingPong: false, gridUnits: true, ease: "easeOutCubic" })
        .loopProperty("sprite", "height", { from: 0, to: 0.1, duration: 6000, pingPong: false, gridUnits: true, ease: "easeOutCubic" })
        .loopProperty("alphaFilter", "alpha", { values: [-1, 1, 1, 1, 1, -1], duration: 1000, pingPong: true, ease: "easeOutCubic" })
        .attachTo(token, { bindAlpha: false, bindRotation: false })
        .private()

        .animation()
        .on(token)
        .opacity(0)

        // Blush effect attached to token with bobbing motion
        .effect()
        .file(file('eskie.emote.blush.01'))
        .zIndex(0)
        .name(label)
        .opacity(0.85)
        .scaleToObject(0.5)
        .loopProperty("spriteContainer", "position.x", { from: -20, to: 20, duration: 2500, pingPong: true, ease: "easeInOutSine" })
        .loopProperty("sprite", "position.y", { values: [0, 20, 0, 20], duration: 2500, pingPong: true })
        .loopProperty("sprite", "rotation", { from: -10, to: 10, duration: 2500, pingPong: true, ease: "easeInOutSine" });
    drunkEffect = (duration > 0) ? drunkEffect.duration(duration) : drunkEffect.persist();
    drunkEffect = drunkEffect
        .atLocation(token)
        .spriteOffset({ x: -0.15 * tokenWidth, y: 0.15 * tokenWidth }, { gridUnits: true, local: true })
        .attachTo(token, { bindAlpha: false, bindRotation: true })
        .private()

        // Sway effect attached to token
        .effect()
        .copySprite(token)
        .name(label)
        .atLocation(token)
        .loopProperty("spriteContainer", "position.x", { from: -20, to: 20, duration: 2500, pingPong: true, ease: "easeInOutSine" })
        .loopProperty("sprite", "position.y", { values: [0, 20, 0, 20], duration: 2500, pingPong: true })
        .loopProperty("sprite", "rotation", { from: -10, to: 10, duration: 2500, pingPong: true, ease: "easeInOutSine" });
    drunkEffect = (duration > 0) ? drunkEffect.duration(duration) : drunkEffect.persist();
    drunkEffect = drunkEffect
        .attachTo(token, { bindAlpha: false })

    return drunkEffect;
}

async function play(token, config = {}) {
    const { overlay } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace: false});

    const seq = await create(token, config);
    if (seq) { await seq.play(); }

    if (overlay.applyPC || overlay.applyGM) {
        const SEQUENCER_DEFAULT_OPACITY = 50;
        if (!overlay.applyGM && game.settings.get('sequencer', 'user-effect-opacity') === SEQUENCER_DEFAULT_OPACITY) {
            console.warn('EMP | Sequencer user-effect-opacity is set to default (50). This may cause the blurred vision effect to appear for GMs as well. Consider lowering this if this is not intended.');
        }

        const owners = tokens.owners(token, { applyPC: overlay.applyPC, applyGM: overlay.applyGM });
        blur.drunk.play(owners);
    }
}

async function stop(token, config = {}) {
    const { id, overlay } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace: false})
    if (overlay.applyPC || overlay.applyGM) {
        const owners = tokens.owners(token, { applyPC: overlay.applyPC, applyGM: overlay.applyGM });
        blur.drunk.stop(owners)
    }
    
    const label = `${id} - ${token.id}`;
    Sequencer.EffectManager.endEffects({ name: label, object: token });

    new Sequence()
        .animation()
        .on(token)
        .opacity(1)
        .play();
}

export const drunk = {
    create,
    play,
    stop,
};

autoanimations.register("Drunk", "effect", "eskie.effect.emote.drunk", DEFAULT_CONFIG);
