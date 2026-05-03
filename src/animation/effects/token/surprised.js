/* **
   Original Author: EskieMoh#2969
   Update Author: bakanabaka
** */

// No local imports needed as images are external Imgur links

const DEFAULT_CONFIG = {
    id: 'surprised',
};

/**
 * Creates a Sequencer effect for a "Surprised" status on a token.
 * This effect is persistent.
 *
 * @param {Token} token The token to apply the effect to.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function createSurprised(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;

    const sequence = new Sequence();

    sequence
        .effect()
        .name(`Surprised - Exclamation - ${id} - ${token.uuid}`) // Unique name for stopping
        .file("https://i.imgur.com/8Yr9fMC.png")
        .atLocation(token)
        .anchor({ x: 0.5, y: 1.55 })
        .scaleIn(0, 500, { ease: "easeOutElastic" })
        .scaleOut(0, 500, { ease: "easeOutExpo" })
        .loopProperty("sprite", "position.y", { from: 0, to: -15, duration: 750, pingPong: true })
        .persist()
        .scaleToObject(0.6)
        .attachTo(token, { bindAlpha: false })
        .private()

        .effect()
        .name(`Surprised - Question - ${id} - ${token.uuid}`) // Unique name for stopping
        .file("https://i.imgur.com/myWyksT.png")
        .atLocation(token)
        .anchor({ x: -0.3, y: 1.25 })
        .scaleIn(0, 500, { ease: "easeOutElastic" })
        .scaleOut(0, 500, { ease: "easeOutExpo" })
        .loopProperty("sprite", "position.y", { from: 0, to: -15, duration: 750, pingPong: true })
        .persist()
        .scaleToObject(0.45)
        .attachTo(token, { bindAlpha: false })
        .private()
    ;

    return sequence;
}

/**
 * Plays or stops the "Surprised" effect on a token.
 * Toggles the effect based on the "Surprised" tag.
 *
 * @param {Token} token The token to apply/remove the effect from.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<void>} A promise that resolves when the effect is played or stopped.
 */
async function playSurprised(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;

    if (Tagger.hasTags(token, "Surprised")) {
        await stopSurprised(token, mConfig);
    } else {
        Tagger.addTags(token, "Surprised");
        const sequence = await createSurprised(token, mConfig);
        if (sequence) {
            sequence.play();
        }
    }
}

/**
 * Stops the persistent "Surprised" effects and removes the "Surprised" tag.
 *
 * @param {Token} token The token to remove the effects from.
 * @param {object} config Configuration options.
 */
async function stopSurprised(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;

    if (Tagger.hasTags(token, "Surprised")) {
        await Tagger.removeTags(token, "Surprised");
    }
    Sequencer.EffectManager.endEffects({ name: `Surprised - Exclamation - ${id} - ${token.uuid}` });
    Sequencer.EffectManager.endEffects({ name: `Surprised - Question - ${id} - ${token.uuid}` });
}

export const surprised = {
    create: createSurprised,
    play: playSurprised,
    stop: stopSurprised,
    default_config: DEFAULT_CONFIG,
};
