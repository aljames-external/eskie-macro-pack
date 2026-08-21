// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'thornWhip',
    color: 'green',
    timingAdjust: -100,
    pull: true
};

async function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, color, timingAdjust, pull } = mConfig;

    if (!token || !target) return;

    const dx = token.center.x - target.center.x;
    const dy = token.center.y - target.center.y;
    const distance = Math.hypot(dx, dy);

    const pullDistance = canvas.grid.size * 2; // 10ft
    const adjacentDistance = canvas.grid.size; // 5ft
    const maxAllowedPull = Math.max(0, distance - adjacentDistance);
    const moveDistance = Math.min(pullDistance, maxAllowedPull);

    const rawLocation = {
        x: target.center.x + (distance > 0 ? (dx / distance) * moveDistance : 0),
        y: target.center.y + (distance > 0 ? (dy / distance) * moveDistance : 0)
    };

    const location = canvas.grid.getCenterPoint ? canvas.grid.getCenterPoint(rawLocation) : rawLocation;
    const offsetX = (location.x - target.center.x) / canvas.grid.size;
    const offsetY = (location.y - target.center.y) / canvas.grid.size;
    const canPull = pull && (target.document.width <= 2);

    const seq = new Sequence();

    // Nature casting on source token
    seq.effect()
        .name(`${id} - ${token.id}`)
        .file(closest(`eskie.casting.nature.01.side.one_shot.${color}`))
        .attachTo(token)
        .rotateTowards(target)
        .playbackRate(1.25)
        .scaleToObject(1, { considerTokenScale: true });

    // Thorny vine stretching from token to target
    seq.effect()
        .name(`${id} - ${token.id}`)
        .file(closest('eskie.nature.vine.thorny.ranged.01.physical.normal.green'))
        .attachTo(token)
        .stretchTo(target)
        .zIndex(2)
        .waitUntilFinished(-1000);

    // Damage Effect
    seq.effect()
        .file(closest('eskie.damage.piercing.01.yellow'))
        .atLocation(target)
        .scaleToObject(1, { considerTokenScale: true })
        .zIndex(1)
        .randomRotation();

    seq.effect()
        .copySprite(target)
        .spriteRotation(-target.document.rotation)
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
        .opacity(0.5)
        .duration(1000)
        .fadeOut(250);

    if (canPull) {
        // Turn token invisible during slide
        seq.animation()
            .delay(100)
            .on(target)
            .opacity(0);

        // Copy sprite slides towards destination
        seq.effect()
            .copySprite(target)
            .spriteRotation(-target.document.rotation)
            .zIndex(0)
            .animateProperty('sprite', 'position.x', { from: 0, to: offsetX, duration: 500, delay: 101 + timingAdjust, gridUnits: true, ease: 'easeInCubic' })
            .animateProperty('sprite', 'position.y', { from: 0, to: offsetY, duration: 500, delay: 101 + timingAdjust, gridUnits: true, ease: 'easeInCubic' })
            .duration(700 + timingAdjust)
            .waitUntilFinished(-100);

        // Teleport target token to final snapped location and restore visibility
        seq.animation()
            .on(target)
            .teleportTo(location, { relativeToCenter: true })
            .opacity(1);
    }

    return seq;
}

async function play(token, target, config = {}) {
    const seq = await create(token, target, config);
    if (seq) return seq.play();
}

async function stop(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    Sequencer.EffectManager.endEffects({ name: `${id} - ${token.id}` });
}

export const thornWhip = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

autoanimations.register('thornWhip', 'ranged-target', 'eskie.effect.thornWhip', DEFAULT_CONFIG, '0.0.0', 'Thorn Whip');

