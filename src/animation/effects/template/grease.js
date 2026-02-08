//Last Updated: 1/22/2026
//Author: .eskie
//Modular by: bakanabaka

import { closest } from "../../../lib/filemanager.js";
import { templates } from "../../../lib/templates.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: "grease",
};

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { template } = mConfig;

    const radius = 5 / canvas.grid.distance;
    const cfg = { 
        radius: 1,
        max: 500,
        icon: 'modules/jb2a_patreon/Library/Generic/Portals/Portal_Bright_Purple_V_400x250.webm', 
        label: 'Grease'
    };
    let [primary, secondary] = await templates.getPosition(template, cfg);
    if (!primary) { return; }

    let position = primary;
    if (secondary) { position = {x:(secondary.x + primary.x)/2, y:(secondary.y + primary.y)/2}; }
    

    const seq = new Sequence();

    seq.effect()
        .name(`Casting ${token.document.name}`)
        .attachTo(token)
        .file(closest(`jb2a.magic_signs.circle.02.conjuration.loop.yellow`))
        .scaleToObject(1.25)
        .rotateIn(180, 600, {ease: "easeOutCubic"})
        .scaleIn(0, 600, {ease: "easeOutCubic"})
        .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000})
        .belowTokens()
        .persist()
        .fadeOut(2000)
        .zIndex(0);

    seq.effect()
        .attachTo(token)
        .file(closest(`jb2a.magic_signs.circle.02.conjuration.complete.dark_yellow`))
        .scaleToObject(1.25)
        .rotateIn(180, 600, {ease: "easeOutCubic"})
        .scaleIn(0, 600, {ease: "easeOutCubic"})
        .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000})
        .belowTokens(true)
        .filter("ColorMatrix", {saturate:-1, brightness:2})
        .filter("Blur", { blurX: 5, blurY: 10 })
        .zIndex(1)
        .duration(1200)
        .fadeIn(200, {ease: "easeOutCirc", delay: 500})
        .fadeOut(300, {ease: "linear"});

    seq.effect()
        .atLocation(token)
        .file(closest("jb2a.particles.outward.white.01.02"))
        .scaleIn(0, 500, {ease: "easeOutQuint"})
        .delay(500)
        .fadeOut(1000)
        .duration(1000)
        .size(1.75, {gridUnits: true})
        .animateProperty("spriteContainer", "position.y", {  from:0 , to: -0.5, gridUnits:true, duration: 1000})
        .zIndex(1);
    
    seq.thenDo(function(){
        Sequencer.EffectManager.endEffects({ name: `Casting ${token.document.name}`, object: token });
    });

    seq.effect()
        .atLocation(position)
        .file(closest(`jb2a.magic_signs.circle.02.conjuration.complete.dark_yellow`))
        .size(radius * 2, {gridUnits: true})
        .fadeIn(600)
        .fadeOut(1000)
        .duration(7200)
        .opacity(1)
        .rotateIn(180, 600, {ease: "easeOutCubic"})
        .scaleIn(0, 600, {ease: "easeOutCubic"})
        .belowTokens();

    seq.wait(1000);

    seq.effect()
        .file(closest("jb2a.water_splash.circle.01.black"))
        .atLocation(position)
        .scaleIn(0, 1500, {ease: "easeOutCubic"})
        .scaleOut(0, 1500, {ease: "linear"})
        .fadeIn(500)
        .fadeOut(1000)
        .belowTokens()
        .zIndex(2)
        .size(radius * 1.5, {gridUnits: true});

    seq.effect()
        .delay(100)
        .file(closest('jb2a.grease.dark_brown'))
        .atLocation(position)
        .belowTokens()
        .fadeIn(5000)
        .zIndex(1)
        .randomRotation()
        .scaleOut(0, 1500, {ease: "linear"})
        .fadeOut(1000)
        .scaleIn(0, 5000, {ease: "easeOutCubic"})
        .size(radius * 2.2, {gridUnits: true})
        .persist() 
        .name('Grease');

    return seq;
}

async function play(token, config = {}, options = {}) {
    const seq = await create(token, config);
    if (seq) { return seq.play(); }
}

export const grease = {
    create,
    play,
};

autoanimations.register("Grease", "template", "eskie.effect.grease", DEFAULT_CONFIG);
