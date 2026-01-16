import { closest } from '../../../lib/filemanager.js';
import { templates } from '../../../lib/templates.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'Psychic Teleportation',
};

async function create(token, config = {}) {
    const { id, template } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    
    const cfg = { 
        radius: 1,
        max: 500,
        icon: 'modules/jb2a_patreon/Library/Generic/Portals/Portal_Bright_Purple_V_400x250.webm', 
        label: id
    };
    let position = await templates.getPosition(template, cfg);
    if (!position) { return; }

    let seq = new Sequence()
        .animation()
            .on(token)
            .opacity(0)

        .effect()
            .name(id)
            .file(closest("jb2a.dagger.throw.01.white"))
            .atLocation(token)
            .stretchTo(position)
            .filter("ColorMatrix", {saturate:-1, brightness:5})
            .filter("Glow", { color: 0x2EB8C1, distance: 3, innerStrength: 2 })
            .opacity(0.9)
            .duration(1000)

        .effect()
            .file(closest("jb2a.impact.010.blue"))
            .atLocation(token)
            .scaleToObject(2)
            .scaleOut(0, 250)
            .randomRotation()

        .effect()
            .file(closest("jb2a.particles.outward.blue.01.03"))
            .filter("ColorMatrix", {saturate: 1, brightness:5})
            .filter("Glow", { color: 0x2EB8C1, distance: 3, innerStrength: 2 })
            .atLocation(token)
            .scaleToObject(2)
            .randomRotation()
            .scaleIn(0.25, 250)
            .fadeOut(2500)
            .duration(3000)

        .effect()
            .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
            .atLocation(token)
            .scaleToObject(1.25)
            .opacity(0.25)

        .effect()
            .file(closest("jb2a.particles.outward.blue.01.03"))
            .atLocation(token)
            .scaleToObject(1.25)
            .filter("ColorMatrix", {saturate: -1, brightness:10})
            .opacity(0.25)
            .fadeOut(500)

        .effect()
            .copySprite(token)
            .atLocation(token)
            .filter("ColorMatrix", {saturate: -1, brightness:10})
            .scaleToObject(1)
            .filter("Blur", { blurX: 5, blurY: 10 })
            .duration(500)
            .scaleOut(0, 500, {ease: "easeOutCubic"})
            .fadeOut(500)

        .animation()
            .on(token)
            .teleportTo(position)
            .snapToGrid()
            .offset({ x: -1, y: -1 })
            .waitUntilFinished()

        .wait(1000)

        .thenDo(function(){
                Sequencer.EffectManager.endEffects({name: id})  
            })

        .effect()
            .file(closest("jb2a.impact.010.blue"))
            .atLocation(token)
            .scaleToObject(2)
            .scaleIn(0, 250)
            .randomRotation()

        .effect()
            .file(closest("jb2a.particles.outward.blue.01.03"))
            .filter("ColorMatrix", {saturate: 1, brightness:5})
            .filter("Glow", { color: 0x2EB8C1, distance: 3, innerStrength: 2 })
            .atLocation(token)
            .scaleToObject(2)
            .randomRotation()
            .scaleIn(0.25, 250)
            .fadeOut(2500)
            .duration(3000)

        .effect()
            .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
            .atLocation(token)
            .scaleToObject(1.25)
            .opacity(0.25)

        .effect()
            .file(closest("jb2a.particles.outward.blue.01.03"))
            .atLocation(token)
            .scaleToObject(1.25)
            .filter("ColorMatrix", {saturate: -1, brightness:10})
            .opacity(0.25)
            .fadeOut(500)

        .effect()
            .copySprite(token)
            .atLocation(token)
            .filter("ColorMatrix", {saturate: -1, brightness:10})
            .scaleToObject(1)
            .filter("Blur", { blurX: 5, blurY: 10 })
            .duration(500)
            .scaleIn(0, 500, {ease: "easeOutCubic"})
            .fadeOut(500)

        .waitUntilFinished(-400)

        .animation()
            .on(token)
            .opacity(1)

    return seq;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) { return seq.play(); }
}

async function stop(token, config = {}) {
    await new Sequence()
        .animation()
            .on(token)
            .opacity(1)
            .play();
}

export const psychicTeleportation = {
    create,
    play,
    stop
}

autoanimations.register("Psychic Teleportation", "template", "eskie.effect.psychicTeleportation", DEFAULT_CONFIG);