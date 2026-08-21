// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'wailsFromTheGrave',
    type: 'slashing', // 'slashing', 'piercing', 'bludgeoning'
    weight: 'medium', // 'light', 'medium', 'heavy'
    sound: {
        enabled: true,
        volume: 0.5
    }
};

function getNearestSquareCenter(token, target1) {
    const gs = canvas.grid.size;
    const srcCenter = token.center;
    const w = target1.document.width;
    const h = target1.document.height;

    let bestPoint = null;
    let bestDist2 = Infinity;

    for (let gx = 0; gx < w; gx++) {
        for (let gy = 0; gy < h; gy++) {
            const cx = target1.document.x + (gx + 0.5) * gs;
            const cy = target1.document.y + (gy + 0.5) * gs;
            const dx = cx - srcCenter.x;
            const dy = cy - srcCenter.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestDist2) {
                bestDist2 = d2;
                bestPoint = { x: cx, y: cy };
            }
        }
    }
    return bestPoint ?? target1.center;
}

function generateOffsets(target, count = 3) {
    const randomOffset = [];
    const minDistance = 0.1 * target.document.width;
    for (let i = 0; i < count; i++) {
        let valid = false;
        let offset;
        let attempts = 0;
        while (!valid && attempts < 20) {
            attempts++;
            offset = {
                x: (Math.random() * 0.5 - 0.25) * target.document.width,
                y: (Math.random() * 0.5 - 0.25) * target.document.width
            };
            valid = randomOffset.every(existing => {
                const dx = offset.x - existing.x;
                const dy = offset.y - existing.y;
                return Math.hypot(dx, dy) >= minDistance;
            });
        }
        randomOffset.push(offset ?? { x: 0, y: 0 });
    }
    return randomOffset;
}

async function createDamageOnly(target, config = {}) {
    let mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    mConfig = settingsOverride(mConfig);
    const { id, sound } = mConfig;

    if (!target) return;

    const randomOffset = generateOffsets(target, 3);
    const seq = new Sequence();

    randomOffset.forEach((offset, idx) => {
        seq.effect()
            .name(`${id} - ${target.id}`)
            .delay(idx * 100)
            .file(closest('eskie.damage.necrotic.01.teal'))
            .atLocation(target, { offset, gridUnits: true })
            .scaleToObject(0.6, { considerTokenScale: true })
            .zIndex(2);

        if (sound?.enabled) {
            seq.sound()
                .delay(idx * 100)
                .file(closest('eskie.sound.roar.02'))
                .volume(sound.volume ?? 0.5);
        }
    });

    seq.effect()
        .delay(150)
        .copySprite(target)
        .spriteRotation(-target.document.rotation)
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
        .opacity(0.25)
        .duration(1000)
        .fadeOut(750)
        .tint('#58feb0');

    return seq;
}

async function playDamageOnly(target, config = {}) {
    const seq = await createDamageOnly(target, config);
    if (seq) return seq.play();
}

async function createAttack(token, target1, target2, config = {}) {
    let mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    mConfig = settingsOverride(mConfig);
    const { id, type, weight, sound } = mConfig;

    if (!token || !target1) return;

    const weightIndex = { light: 0, medium: 1, heavy: 2 }[weight] ?? 1;
    const effectSize = 2 + (0.25 * weightIndex);
    const effectOffset = -0.75 - (0.25 * weightIndex);

    const targetSquare = getNearestSquareCenter(token, target1);
    const dx = targetSquare.x - token.center.x;
    const dy = targetSquare.y - token.center.y;
    const sx = Math.sign(dx);
    const sy = Math.sign(dy);
    const targetOffset = { x: sx * 0.5, y: sy * 0.5 };

    const randomOffset = target2 ? generateOffsets(target2, 3) : generateOffsets(target1, 3);
    const seq = new Sequence();

    // Primary strike on target 1
    seq.effect()
        .name(`${id} - ${token.id}`)
        .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.purpleblack.slow`))
        .atLocation(token)
        .rotateTowards(targetSquare)
        .scaleToObject(effectSize, { considerTokenScale: true })
        .spriteOffset({ x: effectOffset * token.document.width }, { gridUnits: true })
        .randomizeMirrorY()
        .zIndex(1)
        .filter('ColorMatrix', { hue: -130 });

    seq.effect()
        .delay(150)
        .file(closest(`eskie.damage.${type}.01.yellow`))
        .size(1.25 * token.document.width, { gridUnits: true })
        .atLocation(targetSquare)
        .randomRotation()
        .playbackRate(0.9)
        .zIndex(0.1)
        .filter('ColorMatrix', { hue: 120 });

    seq.effect()
        .delay(150)
        .file(closest('jb2a.smoke.puff.side.dark_black.4'))
        .atLocation(targetSquare)
        .size(1.5 * token.document.width, { gridUnits: true })
        .rotateTowards(token)
        .spriteOffset({ x: -1.15 * token.document.width }, { gridUnits: true })
        .spriteRotation(180)
        .fadeOut(1500)
        .zIndex(0);

    seq.effect()
        .delay(150)
        .copySprite(target1)
        .spriteRotation(-target1.document.rotation)
        .attachTo(target1)
        .scaleToObject(1, { considerTokenScale: true })
        .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
        .opacity(0.25)
        .duration(1000)
        .fadeOut(750)
        .tint('#58feb0');

    seq.wait(150);

    // Wisps rising and arcing towards secondary target
    randomOffset.forEach((offset, idx) => {
        seq.effect()
            .file(closest('eskie.environment.wisp.01.teal'))
            .atLocation(targetSquare, { offset, gridUnits: true })
            .size(0.5, { gridUnits: true })
            .spriteOffset({ x: targetOffset.x / 2, y: targetOffset.y / 2 }, { gridUnits: true })
            .fadeIn(1500, { ease: 'easeOutCubic' })
            .scaleIn(0, 1500, { ease: 'easeOutCubic' })
            .animateProperty('sprite', 'position.x', { from: -targetOffset.x / 2, to: 0, duration: 2000, gridUnits: true, ease: 'easeOutCubic' })
            .animateProperty('sprite', 'position.y', { from: -targetOffset.y / 2, to: 0, duration: 2000, gridUnits: true, ease: 'easeOutCubic' })
            .zIndex(2);

        seq.effect()
            .delay(1800)
            .file(closest('jb2a.impact.010.blue'))
            .atLocation(targetSquare, { offset, gridUnits: true })
            .size(0.5, { gridUnits: true })
            .spriteOffset({ x: targetOffset.x / 2, y: targetOffset.y / 2 }, { gridUnits: true })
            .filter('ColorMatrix', { hue: -50 })
            .zIndex(3);
    });

    // Secondary damage on target 2
    if (target2) {
        const damageSeq = new Sequence().wait(2500);

        randomOffset.forEach((offset, idx) => {
            damageSeq.effect()
                .delay(idx * 100)
                .file(closest('eskie.damage.necrotic.01.teal'))
                .atLocation(target2, { offset, gridUnits: true })
                .scaleToObject(0.6, { considerTokenScale: true })
                .zIndex(2);

            if (sound?.enabled) {
                damageSeq.sound()
                    .delay(idx * 100)
                    .file(closest('eskie.sound.roar.02'))
                    .volume(sound.volume ?? 0.5);
            }
        });

        damageSeq.effect()
            .delay(150)
            .copySprite(target2)
            .spriteRotation(-target2.document.rotation)
            .attachTo(target2)
            .scaleToObject(1, { considerTokenScale: true })
            .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
            .opacity(0.25)
            .duration(1000)
            .fadeOut(750)
            .tint('#58feb0');

        seq.addSequence(damageSeq);
    }

    return seq;
}

async function playAttack(token, target1, target2, config = {}) {
    const seq = await createAttack(token, target1, target2, config);
    if (seq) return seq.play();
}

async function stop(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    if (token) Sequencer.EffectManager.endEffects({ name: `${id} - ${token.id}` });
}

export const wailsFromTheGrave = {
    create: createAttack,
    play: playAttack,
    attack: {
        create: createAttack,
        play: playAttack,
        default_config: DEFAULT_CONFIG
    },
    damage: {
        create: createDamageOnly,
        play: playDamageOnly,
        default_config: DEFAULT_CONFIG
    },
    stop,
    default_config: DEFAULT_CONFIG
};

autoanimations.register('wailsFromTheGrave', 'melee-target', 'eskie.effect.wailsFromTheGrave.attack', DEFAULT_CONFIG, '0.0.0', 'Wails from the Grave');
autoanimations.register('wailsFromTheGraveDamage', 'ranged-target', 'eskie.effect.wailsFromTheGrave.damage', DEFAULT_CONFIG, '0.0.0', 'Wails from the Grave (Damage)');

