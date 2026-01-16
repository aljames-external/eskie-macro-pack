import { closest } from "../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'cinema-bars',
    dim: true,
}

function create(config = {}) {
    const { id, dim } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});

    let sequence = new Sequence();
    sequence.effect()
        .name(id)
        .screenSpace()
        .screenSpaceScale({fitX:true,fitY:true})
        .file(closest("eskie.screen_overlay.cinema_bars.02"))
        .persist()

    if (dim && canvas.scene.background.src) {
        sequence.effect()
            .file(canvas.scene.background.src)
            .name(id)
            .filter("ColorMatrix", { brightness: 0.3})
            .atLocation({x:(canvas.dimensions.width)/2,y:(canvas.dimensions.height)/2})
            .size({width:canvas.scene.width/canvas.grid.size, height:canvas.scene.height/canvas.grid.size}, {gridUnits: true})
            .duration(3000)
            .fadeIn(500)
            .fadeOut(500)
            .belowTokens()
    }

    return sequence;
}

async function play(config = {}) {
    let seq = create(config);
    await seq.play();
}

async function stop(config = {}) {
    const { id } = utils.mergeObject(DEFAULT_CONFIG, config);
    return Sequencer.EffectManager.endEffects({ name: id });
}

export const cinemaBars = {
    create,
    play,
    stop,
};
