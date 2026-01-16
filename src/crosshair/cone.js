import { closest } from "../lib/filemanager.js";

async function create(token, {id = `Cone Crosshair`, angle = 53.13, coneSize = "thin", distance = 30} = {}) {
    let targets;
    let coneImage = img(`eskie.crosshair.cone.${coneSize}.fantasy_01.white.full`);
    async function coneGraphic(crosshair) { 
        new Sequence()
                    .wait(50)
                    .effect()
                    .name(id)
                    .file(coneImage)
                    .attachTo(crosshair)
                    .stretchTo(crosshair, {attachTo:true})
                    .opacity(0.8)
                    .belowTokens()
                    .locally()
                    .persist()
                .play();
    }

    let cone = new Sequence()
        .crosshair("position")
            .type("cone")
            .location(token, { lockToEdge: true, lockToEdgeDirection: false })
            .distance(distance)
            .angle(angle)
            .borderColor("#ffffff",{alpha:0})
            .fillColor("#000000",{alpha:0.1})

            .callback(Sequencer.Crosshair.CALLBACKS.SHOW, async function(crosshair) {
                await coneGraphic(crosshair);
            })
            .callback(Sequencer.Crosshair.CALLBACKS.PLACED, async (crosshair) => {
                Sequencer.EffectManager.endEffects({ name: id });
            })
            .callback(Sequencer.Crosshair.CALLBACKS.CANCEL, () => {
                Sequencer.EffectManager.endEffects({ name: id });
            });

    return [cone, targets];
}

async function play(token, config = {}) {
    let cone = await create(token, config);
    return cone.play();
}

async function stop(token, {id = `Cone Crosshair`} = {}) {
    return Sequencer.EffectManager.endEffects({ name: id, object: token });
}

export const cone = {
    create,
    play,
    stop,
};