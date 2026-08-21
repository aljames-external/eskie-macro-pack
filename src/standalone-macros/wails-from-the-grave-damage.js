// Standalone Macro: Wails from the Grave (Damage Only)
// Author: .eskie
const closest = (path) => {
    if (typeof eskie !== 'undefined' && eskie.util?.file?.closest) return eskie.util.file.closest(path);
    const apiClosest = game.modules?.get('eskie-macros')?.api?.util?.closest;
    if (typeof apiClosest === 'function') return apiClosest(path);
    return path;
};

const target = Array.from(game.user.targets)[0];
if (!target) return ui.notifications.warn('Please target a token!');

const randomOffset = [];
for (let i = 0; i < 3; i++) {
    randomOffset[i] = {
        x: (Math.random() * 0.6 - 0.3) * target.document.width,
        y: (Math.random() * 0.6 - 0.3) * target.document.width
    };
}

new Sequence()
    .effect()
    .file(closest('eskie.damage.necrotic.01.teal'))
    .atLocation(target, { offset: randomOffset[0], gridUnits: true })
    .scaleToObject(0.6, { considerTokenScale: true })
    .zIndex(2)
    .effect()
    .delay(100)
    .file(closest('eskie.damage.necrotic.01.teal'))
    .atLocation(target, { offset: randomOffset[1], gridUnits: true })
    .scaleToObject(0.6, { considerTokenScale: true })
    .zIndex(2)
    .effect()
    .delay(200)
    .file(closest('eskie.damage.necrotic.01.teal'))
    .atLocation(target, { offset: randomOffset[2], gridUnits: true })
    .scaleToObject(0.6, { considerTokenScale: true })
    .zIndex(2)
    .effect()
    .delay(150)
    .copySprite(target)
    .spriteRotation(-target.document.rotation)
    .attachTo(target)
    .scaleToObject(1, { considerTokenScale: true })
    .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
    .opacity(0.25)
    .duration(1000)
    .fadeOut(750)
    .tint('#58feb0')
    .effect()
    .file(closest('eskie.sound.roar.02'))
    .atLocation(target, { offset: randomOffset[0], gridUnits: true })
    .scaleToObject(0.9, { considerTokenScale: true })
    .zIndex(1)
    .duration(1000)
    .fadeOut(400)
    .tint('#111111')
    .opacity(0.9)
    .effect()
    .delay(100)
    .file(closest('eskie.sound.roar.02'))
    .atLocation(target, { offset: randomOffset[1], gridUnits: true })
    .scaleToObject(0.9, { considerTokenScale: true })
    .zIndex(1)
    .duration(1000)
    .fadeOut(400)
    .tint('#111111')
    .opacity(0.9)
    .effect()
    .delay(200)
    .file(closest('eskie.sound.roar.02'))
    .atLocation(target, { offset: randomOffset[2], gridUnits: true })
    .scaleToObject(0.9, { considerTokenScale: true })
    .zIndex(1)
    .duration(1000)
    .fadeOut(400)
    .tint('#111111')
    .opacity(0.9)
    .play();
