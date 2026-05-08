// Standalone Macro
// Original Author: EskieMoh#2969

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn('Please select a token!');

const HACK_TAG = 'Hacking';
const EFFECT_NAME = 'Hack';

const UI_IMAGES = ['D2ROdgN', 'IMr77nW', 'LRr5crs'];

function _randomUiImage() {
    return UI_IMAGES[Math.floor(Math.random() * UI_IMAGES.length)];
}

if (Tagger.hasTags(token, HACK_TAG)) {
    // Toggle off: remove tag, end effects, restore token opacity
    await Tagger.removeTags(token, HACK_TAG);
    await Sequencer.EffectManager.endEffects({ name: EFFECT_NAME, object: token });

    new Sequence()
        .animation()
        .on(token)
        .opacity(1)
        .play();
} else {
    // Toggle on: add tag and play persistent effects
    await Tagger.addTags(token, HACK_TAG);

    const seq = new Sequence();

    // Left eye red glow (adjust offset to match token's eye position)
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
        .attachTo(token)
        .tint('#FF0000');

    // Right eye red glow (adjust offset to match token's eye position)
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
        .attachTo(token)
        .tint('#FF0000');

    // Main hacker terminal/laptop icon attached to the lower-left of the token
    seq.effect()
        .file('https://i.imgur.com/xLJ9SPY.png')
        .name(EFFECT_NAME)
        .atLocation(token)
        .scaleIn({ x: 0.75, y: 0 }, 50)
        .scaleOut({ x: 0.75, y: 0 }, 50)
        .attachTo(token, { align: 'center', edge: 'outer', bindVisibility: false, offset: { x: -0.4, y: 0.35 }, gridUnits: true, followRotation: false })
        .size(0.47, { gridUnits: true })
        .aboveLighting()
        .persist()
        .zIndex(1);

    // Scrolling code lines on the terminal screen (vertical scroll)
    seq.effect()
        .file('https://i.imgur.com/oOqrAsc.png')
        .name(EFFECT_NAME)
        .atLocation(token)
        .attachTo(token, { align: 'center', edge: 'outer', bindVisibility: false, offset: { x: -0.39, y: 0.24 }, gridUnits: true, followRotation: false })
        .size({ width: 0.4, height: 0.1 }, { gridUnits: true })
        .aboveLighting()
        .loopProperty('sprite', 'position.y', { values: [0, 13.5, 27, 13.5, 40.5, 0, 27, 0, 40.5], duration: 60, pingPong: false })
        .persist()
        .zIndex(1);

    // Rotated scrolling code lines (horizontal strip scrolled 90°)
    seq.effect()
        .file('https://i.imgur.com/oOqrAsc.png')
        .name(EFFECT_NAME)
        .atLocation(token)
        .attachTo(token, { align: 'center', edge: 'outer', bindVisibility: false, offset: { x: -0.54, y: 0.385 }, gridUnits: true, followRotation: false })
        .size({ width: 0.38, height: 0.09 }, { gridUnits: true })
        .aboveLighting()
        .loopProperty('sprite', 'position.y', { values: [13.5, 0, 40.5, 27, 0, 40.5, 13.5, 0], duration: 60, pingPong: false })
        .persist()
        .rotate(90)
        .zIndex(1);

    // Loop: randomly spawn holographic UI panels around the token while hacking is active
    seq.thenDo(async () => {
        while (Tagger.hasTags(token, HACK_TAG)) {
            const ui1 = _randomUiImage();
            const ui2 = _randomUiImage();

            await new Sequence()
                .wait(200)

                // Primary floating UI panel - randomized position with mirror
                .effect()
                .file(`https://i.imgur.com/${ui1}.png`)
                .name(EFFECT_NAME)
                .scaleIn({ x: 0.75, y: 0 }, 50)
                .scaleOut({ x: 0.75, y: 0 }, 50)
                .scaleToObject(0.3, { uniform: false })
                .atLocation(token, { bindVisibility: false, followRotation: false, offset: { x: 0.2, y: 0.4 }, randomOffset: 0.6, gridUnits: true, local: true })
                .aboveLighting()
                .duration(800)
                .zIndex(3)
                .randomizeMirrorX()

                // Secondary floating UI panel - offset to the left of the token
                .effect()
                .file(`https://i.imgur.com/${ui2}.png`)
                .delay(200)
                .name(EFFECT_NAME)
                .scaleIn({ x: 0.75, y: 0 }, 50)
                .scaleOut({ x: 0.75, y: 0 }, 50)
                .scaleToObject(0.3, { uniform: false })
                .atLocation(token, { bindVisibility: false, followRotation: false, offset: { x: -0.65, y: 0 }, randomOffset: 0.25, gridUnits: true })
                .aboveLighting()
                .duration(800)
                .zIndex(0)

                .play();
        }
    });

    seq.play();
}
