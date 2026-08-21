// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../../lib/filemanager.js';
import { autoanimations } from '../../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'eyesOfTheGrave',
    radius: 60,
    path: 'actor.system.details.type.value',
    color: 'green'
};

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, radius, path } = mConfig;

    const grid = canvas.scene.grid.distance ?? 5;
    const radiusGU = radius / grid;

    const collectedTargets = canvas.tokens.placeables.filter(t => {
        if (!t?.actor) return false;
        if (t.id === token.id) return false;

        const distPx = Math.hypot(t.center.x - token.center.x, t.center.y - token.center.y);
        const distGU = distPx / canvas.grid.size;
        return distGU <= radiusGU;
    });

    const seq = new Sequence();

    // Eye symbol above caster
    seq.effect()
        .name(`${id} - ${token.id}`)
        .file(closest('eskie.symbol.eye.01.green'))
        .attachTo(token, { offset: { y: -0.5 * token.document.width }, gridUnits: true, bindRotation: false })
        .scaleToObject(0.65, { considerTokenScale: true })
        .filter('ColorMatrix', { hue: 50 });

    // Detect magic pulse expanding out
    seq.effect()
        .name(`${id} - ${token.id}`)
        .file(closest('jb2a.detect_magic.circle.blue'))
        .atLocation(token)
        .size((radius * 2) / 5, { gridUnits: true })
        .filter('ColorMatrix', { hue: -50 })
        .fadeOut(4000)
        .opacity(0.75)
        .belowTokens();

    for (const target of collectedTargets) {
        const value = foundry.utils.getProperty(target, path);
        const isUndead = Array.isArray(value)
            ? value.map(v => String(v).toLowerCase()).includes('undead')
            : String(value ?? '').toLowerCase().includes('undead');

        const distance = Math.hypot(target.x - token.x, target.y - token.y);
        const gridDistance = distance / canvas.grid.size;
        const delayMs = gridDistance * 125;

        const targetSeq = new Sequence()
            .effect()
            .delay(delayMs)
            .file(closest('jb2a.detect_magic.circle.blue'))
            .atLocation(target)
            .scaleToObject(2.5, { considerTokenScale: true })
            .filter('ColorMatrix', { hue: -50 })
            .mask(target);

        if (isUndead) {
            targetSeq.effect()
                .delay(delayMs)
                .copySprite(target)
                .belowTokens()
                .attachTo(target)
                .scaleToObject(1, { considerTokenScale: true })
                .spriteRotation(-target.document.rotation)
                .filter('Glow', { color: 0x58feb0, distance: 15 })
                .duration(15000)
                .fadeIn(2000, { delay: 1000 })
                .fadeOut(3500, { ease: 'easeInSine' })
                .opacity(0.8)
                .zIndex(0.1);

            targetSeq.effect()
                .delay(delayMs)
                .file(closest('jb2a.extras.tmfx.outflow.circle.01'))
                .attachTo(target)
                .scaleToObject(1.5, { considerTokenScale: true })
                .randomRotation()
                .duration(15000)
                .fadeIn(5000)
                .fadeOut(3500, { ease: 'easeInSine' })
                .scaleIn(0, 3500, { ease: 'easeInOutCubic' })
                .tint('#58feb0')
                .opacity(0.5)
                .belowTokens();
        }

        seq.addSequence(targetSeq);
    }

    return seq;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    Sequencer.EffectManager.endEffects({ name: `${id} - ${token.id}` });
}

export const eyesOfTheGrave = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

autoanimations.register('eyesOfTheGrave', 'token', 'eskie.effect.detect.eyesOfTheGrave', DEFAULT_CONFIG, '0.0.0', 'Eyes of the Grave');

