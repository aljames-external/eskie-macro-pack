import { closest } from '../../lib/filemanager.js';
import { deathEffect } from './sun-halo-dragon/death-effect.js';

async function getPositions(token) {
    const pos1 = {x: token.x, y: token.y };
    const pos2 = adjustTeleport(await Sequencer.Crosshair.show());
    return { pos1, pos2 };
}

// (HACKY) This is annoying... Crosshair.show returns .center(.x, .y)
// But all other Sequencer effects seem to use the token(.x, .y) not token.center(.x, .y)
function adjustTeleport(coorinates) {
    return {
        x: coorinates.x - canvas.grid.size / 2,
        y: coorinates.y - canvas.grid.size / 2
    };
}

const DEFAULT_CONFIG = {
    impact: false,
    screen: true,
    sound: {
        enabled: true,
        volume: 0.5,
    }
};

function xdelta(p1, p2) {
    return (p2.x - p1.x) / canvas.grid.size;
}

function ydelta(p1, p2) {
    return (p2.y - p1.y) / canvas.grid.size;
}

async function create(token, targets = [], config = {}) {
    const { impact, screen, sound } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { pos1, pos2 } = await getPositions(token);
    const mirrorY = pos1.x > pos2.x;

    const seq = new Sequence()
        .animation()
            .on(token)
            .opacity(0)

        .effect()
            .copySprite(token)
            .scaleToObject(1.0, {considerTokenScale:true})
            .atLocation(token)
            .animateProperty("spriteContainer", "position.x", { from: 0, to: xdelta(pos1, pos2), duration: 500, gridUnits: true, ease: "easeOutQuint",delay: 2000+150 })
            .animateProperty("spriteContainer", "position.y", { from: 0, to: ydelta(pos1, pos2), duration: 500, gridUnits: true, ease: "easeOutQuint",delay: 2000+150 })
            .duration(3500)

        .effect()
            .copySprite(token)
            .scaleToObject(1.0, {considerTokenScale:true})
            .atLocation(token)
            .animateProperty("spriteContainer", "position.x", { from: 0, to: xdelta(pos1, pos2), duration: 500, gridUnits: true, ease: "easeOutQuint",delay: 2000+150 })
            .animateProperty("spriteContainer", "position.y", { from: 0, to: ydelta(pos1, pos2), duration: 500, gridUnits: true, ease: "easeOutQuint",delay: 2000+150 })
            .duration(2000+150+500)
            .fadeIn(100,{delay: 2500+150})
            .fadeOut(250)
            .filter("Blur", { blurX: 15, blurY: 0 });
        
        if (sound.enabled) {
            seq.sound()
                .file("psfx.2nd-level-spells.misty-step.v1.intro.fire")
                .volume(sound.volume);
        }

        seq.effect()
            .file(closest("eskie.screen_overlay.speed_lines.horizontal.02.redyellow"))
            .screenSpace()
            .screenSpaceScale({fitX:true,fitY:true})
            .mirrorX()
            .fadeOut(500)
            .duration(2500)
            .delay(200)
            .playIf(screen)

        .effect()
            .file(closest("jb2a.wind_stream.white"))
            .name("Rage")
            .attachTo(token, {bindAlpha: false})
            .scaleToObject()
            .rotate(90)
            .opacity(1)
            .filter("ColorMatrix", {saturate: 1})
            .tint("#FF5733")
            .private()
            //.mask()
            .duration(2000)
            .delay(200)
            .fadeOut(250)
            .zIndex(5)

        // Fire Aura
        .effect()
            .file(closest("eskie.aura.token.generic.01.redorange"))
            .atLocation(token)
            .scaleToObject(2.1)
            .zIndex(0.1)
            .belowTokens()
            .animateProperty("spriteContainer", "position.x", { from: 0, to: xdelta(pos1, pos2), duration: 500, gridUnits: true, ease: "easeOutQuint",delay: 2000+150 })
            .animateProperty("spriteContainer", "position.y", { from: 0, to: ydelta(pos1, pos2), duration: 500, gridUnits: true, ease: "easeOutQuint",delay: 2000+150 })
            .animateProperty("spriteContainer", "rotation", { from: 0, to: 90, duration: 50, ease: "easeOutQuint",delay: 2000+50 })


        // Dragon Eyes
        .effect()
            .file(closest("eskie.fire.03.redorange"))
            .atLocation(token, {offset:{x:-0.3, y:-0.15}, gridUnits:true})
            .scaleToObject(0.5)
            .playbackRate(1.2)
            .mirrorX()
            .zIndex(1)
        .effect()
            .file(closest("eskie.fire.03.redorange"))
            .atLocation(token, {offset:{x:0.3, y:-0.2}, gridUnits:true})
            .scaleToObject(0.5)
            .playbackRate(1.2)
            .zIndex(1)

        .thenDo(() => {
                for (const target of targets) {
                    deathEffect.play(target);
                }
            });
            
        if (canvas.scene.background.src) {
            seq.effect()
                .delay(2100)
                .name(`Casting ${token.name}`)
                .file(closest(canvas.scene.background.src))
                .filter("ColorMatrix", {saturate: 1, brightness: 0.6})
                .atLocation({x:(canvas.dimensions.width)/2,y:(canvas.dimensions.height)/2})
                .size({width:canvas.scene.width/canvas.grid.size, height:canvas.scene.height/canvas.grid.size}, {gridUnits: true})
                .duration(250)
                .filter("ColorMatrix", { brightness:0 })
                .belowTiles()
                .fadeOut(125)
                .fadeIn(125)
                .opacity(1)
                .spriteOffset({x:-canvas.scene.background.offsetX,y:-canvas.scene.background.offsetY})
                .playIf(impact);
        }

        seq.effect()
            .delay(2100)
            .file(closest("eskie.environment.lighting.shine.01.rainbow"))
            .atLocation(token)
            .scaleToObject(4)
            .scaleIn(0, 250, {ease: "easeOutCubic"})
            .duration(250)
            .fadeOut(150)
            .playIf(impact)

        .effect()
            .delay(2100)
            .file(closest("eskie.particle.04.orange"))
            .atLocation(token)
            .scaleToObject(5)
            .animateProperty("spriteContainer", "position.x", { from: 0, to: -7.5, duration: 500, gridUnits: true, ease: "easeOutQuint" })
            .belowTokens()
            .playIf(!impact)

        .effect()
            .delay(2000)
            .file(closest("eskie.velocity.01.white"))
            .atLocation(token)
            .mirrorX()
            .scaleToObject(7.5)
            .opacity(0.5)
            .zIndex(10)
            .playbackRate(1.5)

        .canvasPan()
            .delay(2000)
            .shake({ duration: 250, strength: 1.5, rotation: false, fadeOut: 250 })

        .wait(1000);
        if (sound.enabled) {
            seq.sound()
                .file("psfx.casting.fire-side.001")
                .volume(sound.volume);
        }
        seq.wait(1000);

        seq.effect()
            .file(closest("eskie.fire.fire_dragon.01"))
            .atLocation(pos1)
            .stretchTo(pos2)
            .scale(0.75)
            .belowTokens()
            .playbackRate(1.25)
            .mirrorX(true)
            .mirrorY(mirrorY)

        seq.effect()
            .delay(150)
            .file(closest("eskie.slice.01_ranged.color.rainbow"))
            .atLocation(pos1)
            .stretchTo(pos2)
            .scale(1.5)
            .playbackRate(0.75)
            .zIndex(5)
            .waitUntilFinished()

        .canvasPan()
            .shake({ duration: 500, strength: 1.5, rotation: false, fadeOut: 250 })

        .animation()
            .on(token)
            .teleportTo(pos2)
            .opacity(1);
        
    return seq;
}

async function play(token, targets, config = {}) {
    const seq = await create(token, targets, config);
    if (seq) { return seq.play(); }
}

async function clean(token, targets, config = {}){
    targets.forEach(target => {
        deathEffect.clean(target, config);
    });
}

const sunHaloDragon = {
    create,
    play,
    clean,
    deathEffect,
}

export { sunHaloDragon };