// Standalone Macro: Goodberry (Cast)
// Author: .eskie
const closest = (path) => {
    if (typeof eskie !== 'undefined' && eskie.util?.file?.closest) return eskie.util.file.closest(path);
    const apiClosest = game.modules?.get('eskie-macros')?.api?.util?.closest;
    if (typeof apiClosest === 'function') return apiClosest(path);
    return path;
};

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn('Please select a token!');

new Sequence()
    .effect()
    .file(closest('eskie.casting.nature.01.center.one_shot.green'))
    .attachTo(token)
    .scaleToObject(0.8, { considerTokenScale: true })
    .effect()
    .file(closest('blfx.misc.nature.goodberry.1.color1'))
    .attachTo(token)
    .scaleToObject(1.2, { considerTokenScale: true })
    .zIndex(1)
    .duration(1500)
    .scaleOut(0, 250, { ease: 'easeOutCubic' })
    .waitUntilFinished(-250)
    .effect()
    .file(closest('jb2a.impact.002.green'))
    .attachTo(token)
    .scaleToObject(0.65, { considerTokenScale: true })
    .zIndex(2)
    .play();
