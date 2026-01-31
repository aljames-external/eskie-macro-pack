//Last Updated: 1/27/2025
//Author: .eskie

import { closest } from "../../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'Tiger Totemic Attunement',
    attack: {
        count: 2,
    },
    color: 'red',
};

async function play(token, target, config = {}) {
    const seq = await create(token, target, config);
    if (seq) { await seq.play(); }
}

function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id, color, attack } = mConfig;
    const { count } = attack;
    const label = `${id} - ${token.id}`;

    const dx = target.center.x -  token.center.x;
    const dy = target.center.y -  token.center.y;
    const dist = Math.hypot(dx, dy);

    const sizeAdjust = (token.document.width - 1) / 2; 
    const totalSquares = 1 + sizeAdjust;
    const totalPixels  = totalSquares * canvas.grid.size;

    const ux = dx / dist;
    const uy = dy / dist;

    const rawCenter = {
        x: target.center.x - ux * totalPixels,
        y: target.center.y - uy * totalPixels
    };

    const tokenSpan = (token.document.width * canvas.grid.size) / 2; 
    const rawPosition = { x: rawCenter.x - tokenSpan, y: rawCenter.y - tokenSpan};
    const gridSnap = canvas.grid.getSnappedPosition(rawPosition.x, rawPosition.y, 1);
    const location = { x: gridSnap.x + tokenSpan, y: gridSnap.y + tokenSpan};

    let seq = new Sequence();

    seq = seq.animation()
        .delay(100)
        .on(token)
        .opacity(0)

    .effect()
        .file(closest(`eskie.aura.token.generic.02.${color}`))
        .name(label)
        .atLocation(token)
        .scaleToObject(2.1)
        .startTime(550)
        .duration(1450)
        .moveTowards(location, {relativeToCenter: true, ease:"easeOutQuint",rotate:false,delay:240, snapToGrid:true})
        .zIndex(1)
    
    .effect()
        .copySprite(token)
        .atLocation(token)
        .duration(900)
        .moveTowards(location, {relativeToCenter: true, ease:"easeOutQuint",rotate:false,delay:250, snapToGrid:true})

    .effect()
        .delay(250)
        .file(closest("jb2a.teleport.01.white"))
        .atLocation(token)
        .rotateTowards(target)
        .scaleToObject(4)
        .spriteScale({x:1.25,y:1},{gridUnits:true})
        .spriteOffset({x:-3*token.document.width},{gridUnits:true})
        .duration(900)
        .tint("#ff0000")
        .moveTowards(location, {relativeToCenter: true, ease:"easeOutQuint",rotate:false, snapToGrid:true})
                
    .effect()
        .delay(100)
        .file(closest("eskie.velocity.01"))
        .atLocation(token)
        .rotateTowards(target)
        .scaleToObject(4)
        .opacity(0.5)
        .spriteOffset({x:-2*token.document.width},{gridUnits:true})
        .zIndex(3)

    .canvasPan()
        .shake({ duration: 500, strength: 1, rotation: false, fadeOut: 500, delay:200 })

    .animation()
        .delay(250)
        .on(token)
        .teleportTo(location, {relativeToCenter:false})
        .snapToGrid()

    .effect()
        .delay(400)
        .file(closest(`jb2a.melee_generic.creature_attack.claw.001.${color}`))
        .atLocation(location)
        .rotateTowards(target)
        .filter("ColorMatrix", {saturate:0.5})
        .spriteOffset({x:-0.9, y:-0*token.document.width},{gridUnits:true})
        .rotate(-60)
        .zIndex(1)
        .rotateIn(-270, 400, {ease: "easeOutCubic"}) 
        .size(2+token.document.width,{gridUnits:true})
        .playIf(count >= 1)

    .effect()
        .delay(450)
        .file(closest(`jb2a.melee_generic.creature_attack.claw.001.${color}`))
        .atLocation(location)
        .rotateTowards(target)
        .filter("ColorMatrix", {saturate:0.5})
        .spriteOffset({x:-0.9, y:-0*token.document.width},{gridUnits:true})
        .rotate(60)
        .zIndex(1)
        .rotateIn(270, 400, {ease: "easeOutCubic"}) 
        .size(2+token.document.width,{gridUnits:true})
        .mirrorY()
        .playIf(count >= 2)
    
    .wait(850)

    .animation()
        .on(token)
        .opacity(1);

    return seq;
}

export const tigerAttunement = {
    create,
    play,
};