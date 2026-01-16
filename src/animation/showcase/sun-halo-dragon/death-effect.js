import { closest } from '../../../lib/filemanager.js';

const DEFAULT_CONFIG = {
    delay: 2250
}

function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { delay } = mConfig;

    const gs = canvas.grid.size;
    const cx = token.center.x;
    const cy = token.center.y;

    const seq = new Sequence()
        .effect()
            .delay(delay-1000)
            .file(closest("eskie.particle.03.orange"))
            .atLocation(token, {randomOffset:0.5, gridUnits:true})
            .scaleToObject(2)
            .randomRotation()
            .zIndex(3)

        .effect()
            .delay(delay-1000)
            .copySprite(token)
            .atLocation(token)
            .scaleToObject(1)
            .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
            .duration(250)
            .opacity(0.5)
            .zIndex(3)

        .effect()
            .delay(delay)
            .file(closest("eskie.slice.01.white.rainbow"))
            .atLocation(token)
            .scaleToObject(4)
            .rotate(-45)
            .zIndex(5)

            .effect()
            .delay(delay)
            .file(closest("eskie.particle.03.orange"))
            .atLocation(token)
            .scaleToObject(2)
            .randomRotation()
            .zIndex(4)

        .wait(500)
        
        .animation()
            .on(token)
            .opacity(0)

        // Top half mask copy
        .effect()
            .copySprite(token)
            .name(`${token.document.name}Top`)
            .scaleToObject()
            .atLocation(token)
            .shape("polygon", {
            lineSize: 1,
            lineColor: "#FF0000",
            fillColor: "#FF0000",
            points: [{ x: -1, y: -1 }, { x: 1, y: 1 }, { x: 1, y: -1 }],
            fillAlpha: 1,
            gridUnits: true,
            isMask: true,
            name: "test"
            })
            .moveTowards(
            { x: cx + gs * 0.25, y: cy - gs * 0.25 },
            { rotate: false, ease: "easeOutCubic", delay: delay }
            )
            .duration(3000)
            .persist()
            .fadeOut(1000)

        // Bottom half mask copy
        .effect()
            .copySprite(token)
            .name(`${token.document.name}Bottom`)
            .scaleToObject()
            .atLocation(token)
            .shape("polygon", {
            lineSize: 1,
            lineColor: "#FF0000",
            fillColor: "#FF0000",
            points: [{ x: -1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }],
            fillAlpha: 1,
            gridUnits: true,
            isMask: true,
            name: "test"
            })
            .duration(2500)
            .persist()
            .fadeOut(1000)

        // Burn mask top (moves with top slice)
        .effect()
            .delay(delay + 250)
            .file(closest("eskie.burn.token_mask.orange.fast"))
            .name(`${token.document.name}Top`)
            .scaleToObject(1.1)
            .atLocation({ x: cx + gs * 0.25, y: cy - gs * 0.25 })
            .shape("polygon", {
            lineSize: 1,
            lineColor: "#FF0000",
            fillColor: "#FF0000",
            points: [{ x: -1, y: -1 }, { x: 1, y: 1 }, { x: 1, y: -1 }],
            fillAlpha: 1,
            gridUnits: true,
            isMask: true,
            name: "test"
            })
            .moveTowards(
            { x: cx + gs * 0.25, y: cy - gs * 0.25 },
            { rotate: false, ease: "easeOutCubic", delay: 2000 }
            )

        // Burn mask bottom
        .effect()
            .delay(delay + 250)
            .file(closest("eskie.burn.token_mask.orange.fast"))
            .name(`${token.document.name}Bottom`)
            .scaleToObject(1.1)
            .atLocation(token)
            .shape("polygon", {
            lineSize: 1,
            lineColor: "#FF0000",
            fillColor: "#FF0000",
            points: [{ x: -1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }],
            fillAlpha: 1,
            gridUnits: true,
            isMask: true,
            name: "test"
            })
            .zIndex(1)

        // Embers top
        .effect()
            .delay(delay + 250)
            .file(closest("eskie.burn.embers.orange"))
            .name(`${token.document.name}Top`)
            .scaleToObject(1.5)
            .atLocation({ x: cx + gs * 0.25, y: cy - gs * 0.25 })
            .mirrorX()
            .fadeIn(500)
            .spriteOffset({ x: 0.3, y: -0.3 }, { gridUnits: true })

        // Embers bottom
        .effect()
            .delay(delay + 250)
            .file(closest("eskie.burn.embers.orange"))
            .name(`${token.document.name}Bottom`)
            .scaleToObject(1.5)
            .atLocation(token)
            .mirrorX()
            .fadeIn(500)
            .spriteOffset({ x: 0, y: 0 }, { gridUnits: true })
            .spriteRotation(-45)
            .zIndex(2)

    return seq;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) { return seq.play(); }
}

async function stop(token, config = {}) {
    Sequencer.EffectManager.endEffects({ name: `${token.document.name}Top` });
    Sequencer.EffectManager.endEffects({ name: `${token.document.name}Bottom` });
}

async function clean(token, config = {}) {
    return Promise.all([
        new Sequence().animation().on(token).opacity(1).play(),
        stop(token, config),
    ]);
}

export const deathEffect = {
    create,
    play,
    stop,
    clean,
}