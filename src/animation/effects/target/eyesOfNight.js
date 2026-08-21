// Original Author: .eskie / EskieMoh#2969
// Updater: @bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'eyesOfNight',
    darkMap: true
};

async function create(token, targets = [], config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, darkMap } = mConfig;

    const targetList = Array.isArray(targets) ? [...targets] : (targets ? [targets] : []);

    const allPoints = [
        token.center,
        ...targetList.map(t => t.center)
    ];

    const minX = Math.min(...allPoints.map(p => p.x));
    const maxX = Math.max(...allPoints.map(p => p.x));
    const minY = Math.min(...allPoints.map(p => p.y));
    const maxY = Math.max(...allPoints.map(p => p.y));

    const centerPoint = {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2
    };

    const sequence = new Sequence();

    if (darkMap && canvas?.scene?.background?.src) {
        sequence.effect()
            .name(`${id} - ${token.id}`)
            .file(closest(canvas.scene.background.src))
            .filter('ColorMatrix', { brightness: 0 })
            .atLocation({ x: canvas.dimensions.width / 2, y: canvas.dimensions.height / 2 })
            .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
            .spriteOffset({ x: -canvas.scene.background.offsetX, y: -canvas.scene.background.offsetY })
            .duration(4000)
            .fadeIn(750)
            .fadeOut(750)
            .belowTokens()
            .opacity(0.5);
    }

    sequence.effect()
        .file(closest('jb2a.healing_generic.03.burst.bluepurple'))
        .attachTo(token)
        .scaleToObject(2.2, { considerTokenScale: true })
        .fadeIn(500)
        .fadeOut(1000)
        .opacity(1)
        .belowTokens()
        .startTime(1000)
        .filter('ColorMatrix', { saturate: -0.5, hue: -50 })
        .zIndex(1);

    sequence.effect()
        .file(closest('eskie.symbol.eye.01.blue'))
        .attachTo(token)
        .scaleToObject(0.65, { considerTokenScale: true })
        .filter('ColorMatrix', { saturate: -1 });

    sequence.effect()
        .file(closest('eskie.symbol.constellation.symbol_only.01.moon.white'))
        .atLocation(centerPoint)
        .scaleToObject(6)
        .fadeIn(1000)
        .filter('ColorMatrix', { brightness: 0 })
        .opacity(0.5)
        .duration(4500)
        .fadeOut(1000)
        .belowTokens()
        .zIndex(0);

    let source = token;
    const remaining = [...targetList];

    while (remaining.length > 0) {
        let closestIndex = 0;
        let closestDistance = Infinity;

        for (let i = 0; i < remaining.length; i++) {
            const t = remaining[i];
            const dist = Math.hypot(t.center.x - source.center.x, t.center.y - source.center.y);
            if (dist < closestDistance) {
                closestDistance = dist;
                closestIndex = i;
            }
        }

        const target = remaining.splice(closestIndex, 1)[0];
        const scale = closestDistance <= canvas.grid.size ? 1 : 0.5;

        const chainSeq = new Sequence()
            .effect()
            .file(closest('eskie.star.constellation.line.01.white'))
            .attachTo(source)
            .stretchTo(target, { onlyX: false, attachTo: true })
            .scale(scale)
            .template({ gridSize: 200, startPoint: -100, endPoint: 100 })
            .randomizeMirrorY()
            .effect()
            .delay(250)
            .file(closest('jb2a.healing_generic.03.burst.bluepurple'))
            .attachTo(target)
            .scaleToObject(2.2, { considerTokenScale: true })
            .fadeIn(500)
            .fadeOut(1000)
            .opacity(1)
            .belowTokens()
            .startTime(1000)
            .filter('ColorMatrix', { saturate: -0.5, hue: -50 })
            .zIndex(1)
            .wait(250);

        sequence.addSequence(chainSeq);
        source = target;
    }

    return sequence;
}

async function play(token, targets = [], config = {}) {
    const seq = await create(token, targets, config);
    if (seq) return seq.play();
}

async function createEffect(token, config = {}) {
    return create(token, [], config);
}

async function playEffect(token, config = {}) {
    const seq = await createEffect(token, config);
    if (seq) return seq.play();
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    if (token) Sequencer.EffectManager.endEffects({ name: `${id} - ${token.id}` });
}

export const eyesOfNight = {
    create,
    play,
    stop,
    target: {
        create,
        play,
        default_config: DEFAULT_CONFIG
    },
    effect: {
        create: createEffect,
        play: playEffect,
        default_config: DEFAULT_CONFIG
    },
    default_config: DEFAULT_CONFIG
};

autoanimations.register('eyesOfNight', 'ranged-target', 'eskie.effect.eyesOfNight.target', DEFAULT_CONFIG, '0.0.0', 'Eyes of Night');
autoanimations.register('eyesOfNight', 'effect', 'eskie.effect.eyesOfNight.effect', DEFAULT_CONFIG, '0.0.0', 'Eyes of Night');



