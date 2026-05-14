/**
 * vn-dialog.js
 * Original Author: EskieMoh#2969
 * Modular Conversion of "VN test macro"
 */

import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';

const DEFAULT_CONFIG = {
    duration: 10000,
    side: 'left',
    text: 'poo poo pee pee ass, me mad!',
    style: {
        fill: 'white',
        fontFamily: 'Arial Black',
        fontSize: 108,
        strokeThickness: 10
    },
    charSpacing: 50,
    portrait: undefined,
    emote: 'eskie.emote.angry.02',
};

async function create(token, config = {}) {
    config = settingsOverride(config);
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    let {
        duration,
        side,
        text,
        style,
        charSpacing,
        portrait,
        emote
    } = mConfig;

    if (portrait === undefined) portrait = token.actor.img;

    const sequence = new Sequence();

    const isLeft = side === 'left';
    const actorAnchor = isLeft ? { x: 0.15, y: 0.75 } : { x: 0.85, y: 0.75 };
    const emoteAnchor = isLeft ? { x: 0.25, y: 0.65 } : { x: 0.75, y: 0.65 };
    const textAnchor = isLeft ? { x: 0.45, y: 0.8 } : { x: 0.55, y: 0.8 };
    const slideFrom = isLeft ? -200 : 200;

    // --- Actor Image ---
    if (portrait) {
        sequence.effect()
            .file(closest(portrait))
            .screenSpace()
            .screenSpaceScale({ x: 1.0, y: 1.0 })
            .screenSpaceAnchor(actorAnchor)
            .animateProperty('sprite', 'position.x', {
                from: slideFrom,
                to: 0,
                duration: 500,
                ease: 'easeOutCubic'
            })
            .fadeIn(500)
            .duration(duration);
    }

    // --- Emote ---
    if (emote) {
        sequence.effect()
            .delay(500)
            .file(closest(emote))
            .screenSpace()
            .screenSpaceScale({ x: 0.75, y: 0.75 })
            .screenSpaceAnchor(emoteAnchor)
            .scaleIn(0, 500, { ease: 'easeOutBack' })
            .duration(duration - 500)
            .rotate(isLeft ? -45 : 45);
    }

    // --- Typing Text ---
    if (text) {
        const typeDuration = duration / 10;
        const letterDelay = typeDuration / text.length;
        const totalWidth = text.length * charSpacing;
        const startX = -(totalWidth / 2);

        for (let i = 0; i < text.length; i++) {
            sequence.effect()
                .delay(500 + i * letterDelay)
                .screenSpace()
                .screenSpaceScale({ x: 1.0, y: 1.0 })
                .screenSpaceAnchor(textAnchor)
                .screenSpacePosition({
                    x: startX + (i * charSpacing),
                    y: 0
                })
                .text(text[i], style)
                .zIndex(1)
                .duration(duration - (i * letterDelay));
        }
    }

    return sequence;
}

async function play(token, config = {}) {
    const sequence = await create(token, config);
    if (sequence) return sequence.play();
}

function stop(token, config = {}) {
    // This animation is a fixed duration showcase
}

export const vnDialog = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
