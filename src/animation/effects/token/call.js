// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

const CALL_TAG = 'Calling';
const EFFECT_NAME = 'Call';
const EFFECT_NAME_TEXT = 'CallText';

const STYLE_LABEL = {
    fill: 'white',
    fontFamily: 'Impact',
    fontSize: 10,
    dropShadow: true,
    dropShadowAlpha: 0.5,
    dropShadowBlur: 5,
    dropShadowDistance: 3,
};

const STYLE_TEXT = {
    fill: '#00FCD0',
    fontFamily: 'Impact',
    fontSize: 6,
    dropShadow: true,
    dropShadowAlpha: 0.5,
    dropShadowBlur: 5,
    dropShadowDistance: 3,
};

const UNICODE_CHARS = [
    '⍰', '⍱', '⍲', '⍽', '⍾', '⍿', '░', '▒', '▓', '≡', '║', '⎀',
    '⎃', '⎅', '⎆', '⎉', '⌷', '⌸', '⌹', '⌻', '⌼', '⌽', '☰', '☱',
    '☲', '☳', '☴', '☵', '☶', '☷', '⣹', '⣺', '⣻', '⣼', '⣽', '⣾', '⣿',
];

export const DEFAULT_CONFIG = {
    id: 'Call',
};

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;

    if (Tagger.hasTags(token, CALL_TAG)) {
        // Toggle off: remove tag, end effects, restore token opacity
        await Tagger.removeTags(token, CALL_TAG);
        await Sequencer.EffectManager.endEffects({ name: EFFECT_NAME, object: token });
        await Sequencer.EffectManager.endEffects({ name: EFFECT_NAME_TEXT, object: token });

        const seq = new Sequence();
        seq.animation()
            .on(token)
            .opacity(1)
            .tint();
        return seq;
    }

    // Toggle on: add tag and play persistent effects
    await Tagger.addTags(token, CALL_TAG);

    const seq = new Sequence();

    // Phone icon badge attached to the top-right corner of the token
    seq.effect()
        .file('https://i.imgur.com/Vif3lSd.png')
        .name(EFFECT_NAME)
        .atLocation(token)
        .scaleIn({ x: 0.75, y: 0 }, 50)
        .scaleOut({ x: 0.75, y: 0 }, 50)
        .attachTo(token, { align: 'top-right', edge: 'outer', bindVisibility: false, offset: { x: -0.18, y: 0.18 }, gridUnits: true, followRotation: false })
        .size(0.47, { gridUnits: true })
        .aboveLighting()
        .persist()
        .zIndex(0);

    // JB2A red token stage ring behind the icon
    seq.effect()
        .file('jb2a.token_stage.round.red.01.05')
        .name(EFFECT_NAME)
        .atLocation(token)
        .attachTo(token, { align: 'top-right', edge: 'outer', bindVisibility: false, offset: { x: -0.2, y: 0.2 }, gridUnits: true, followRotation: false })
        .size(0.5, { gridUnits: true })
        .aboveLighting()
        .persist()
        .zIndex(1);

    // "CALL" label text above the icon
    seq.effect()
        .text('CALL', STYLE_LABEL)
        .name(EFFECT_NAME)
        .atLocation(token)
        .attachTo(token, { align: 'top-right', edge: 'outer', bindVisibility: false, offset: { x: 0.057, y: -0.025 }, gridUnits: true, followRotation: false })
        .size(0.015, { gridUnits: true })
        .aboveLighting()
        .persist()
        .zIndex(2);

    // Left eye glow sparkle effect
    seq.effect()
        .file('jb2a.twinkling_stars.points04.orange')
        .name(EFFECT_NAME)
        .atLocation(token, { offset: { x: -0.2, y: -0.16 }, gridUnits: true, local: true })
        .size({ width: 0.4, height: 0.1 }, { gridUnits: true })
        .aboveLighting()
        .persist()
        .zIndex(0)
        .filter('ColorMatrix', { hue: 25 })
        .filter('Blur', { blurX: 30, blurY: 0 })
        .playbackRate(5)
        .attachTo(token);

    // Right eye glow sparkle effect
    seq.effect()
        .file('jb2a.twinkling_stars.points04.orange')
        .name(EFFECT_NAME)
        .atLocation(token, { offset: { x: 0.12, y: -0.225 }, gridUnits: true, local: true })
        .size({ width: 0.4, height: 0.1 }, { gridUnits: true })
        .aboveLighting()
        .persist()
        .zIndex(0)
        .filter('ColorMatrix', { hue: 25 })
        .filter('Blur', { blurX: 30, blurY: 0 })
        .playbackRate(5)
        .attachTo(token);

    // After initial effects settle, loop scrolling unicode "call data" characters
    seq.thenDo(async () => {
        await Sequencer.Helpers.wait(750);

        let i = 1;
        let e = 1;

        while (Tagger.hasTags(token, CALL_TAG)) {
            // Reset column position every 12 characters (3 rows of 12)
            if (i === 12 || i === 24) e = 1;

            // After 36 characters, wrap back to the start and clear existing text effects
            if (i > 36) {
                i = 1;
                e = 1;
                Sequencer.EffectManager.endEffects({ name: EFFECT_NAME_TEXT, object: token });
            }

            const word = Sequencer.Helpers.random_array_element(UNICODE_CHARS, false);
            const colOffset = 0.3 + (e * 0.075);
            const rowOffset = -0.21 + (Math.floor(i / 12) * 0.13);

            await new Sequence()
                .wait(10)
                .effect()
                .text(`${word}`, STYLE_TEXT)
                .name(EFFECT_NAME_TEXT)
                .atLocation(token)
                .attachTo(token, { align: 'top-right', edge: 'outer', bindVisibility: false, offset: { x: colOffset, y: rowOffset }, gridUnits: true, followRotation: false })
                .size(0.015, { gridUnits: true })
                .aboveLighting()
                .duration(10000)
                .zIndex(2)
                .play();

            i++;
            e++;
        }
    });

    return seq;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

async function stop(token, config = {}) {
    await Tagger.removeTags(token, CALL_TAG);
    await Sequencer.EffectManager.endEffects({ name: EFFECT_NAME, object: token });
    await Sequencer.EffectManager.endEffects({ name: EFFECT_NAME_TEXT, object: token });

    return new Sequence()
        .animation()
        .on(token)
        .opacity(1)
        .play();
}

export const call = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
