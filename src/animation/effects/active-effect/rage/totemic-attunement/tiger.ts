//Last Updated: 1/27/2025
//Author: .eskie

import { closest } from "../../../../../lib/filemanager.js";

import { adapter } from "../../../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../../../utils/sound.js";
const DEFAULT_CONFIG = {
    id: 'Tiger Totemic Attunement',
    attack: {
        count: 2,
    },
    color: 'red',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function play(token: Token, target?: Token, config: any = {}) {
    const seq = await create(token, target, config);
    if (seq) { await seq.play(); }
}

async function create(token: Token, target?: Token, config: any = {}) {
    const trg = target ?? Array.from(game.user?.targets ?? [])[0];
    if (!token || !trg) return;
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, color, attack, sound } = mConfig;
    const count = attack?.count ?? 2;
    const label = `${id} - ${token.id}`;

    const location = adapter.getNearestSquareCenter(token, trg);
    if (!location) return;
    const tokenWidth = adapter.getTokenDimensions(token).widthUnits;

    let seq = new Sequence();
    applySound(seq, sound);

    seq.motion(token)
        .moveTo(location, {
            arc: 0.7,
            duration: 900,
            delay: 250,
            ease: "easeOutQuint",
            rotate: false
        })
        .snapToGrid();

    seq.effect()
        .file(closest(`eskie.aura.token.generic.02.${color}`))
        .name(label)
        .atLocation(token)
        .scaleToObject(2.1)
        .startTime(550)
        .duration(1450)
        .moveTowards(location, { relativeToCenter: true, ease: "easeOutQuint", rotate: false, delay: 240, snapToGrid: true })
        .zIndex(1);

    seq.effect()
        .delay(250)
        .file(closest("jb2a.teleport.01.white"))
        .atLocation(token)
        .rotateTowards(trg)
        .scaleToObject(4)
        .spriteScale({ x: 1.25, y: 1 }, { gridUnits: true })
        .spriteOffset({ x: -3 * tokenWidth }, { gridUnits: true })
        .duration(900)
        .tint("#ff0000")
        .moveTowards(location, { relativeToCenter: true, ease: "easeOutQuint", rotate: false, snapToGrid: true });

    seq.effect()
        .delay(100)
        .file(closest("eskie.velocity.01.white"))
        .atLocation(token)
        .rotateTowards(trg)
        .scaleToObject(4)
        .opacity(0.5)
        .spriteOffset({ x: -2 * tokenWidth }, { gridUnits: true })
        .zIndex(3);

    seq.canvasPan()
        .shake({ duration: 500, strength: 1, rotation: false, fadeOut: 500, delay: 200 });

    seq.effect()
        .delay(400)
        .file(closest(`jb2a.melee_generic.creature_attack.claw.001.${color}`))
        .atLocation(location)
        .rotateTowards(trg)
        .filter("ColorMatrix", { saturate: 0.5 })
        .spriteOffset({ x: -0.9, y: 0 }, { gridUnits: true })
        .rotate(-60)
        .zIndex(1)
        .rotateIn(-270, 400, { ease: "easeOutCubic" })
        .size(2 + tokenWidth, { gridUnits: true })
        .playIf(count >= 1);

    seq.effect()
        .delay(450)
        .file(closest(`jb2a.melee_generic.creature_attack.claw.001.${color}`))
        .atLocation(location)
        .rotateTowards(trg)
        .filter("ColorMatrix", { saturate: 0.5 })
        .spriteOffset({ x: -0.9, y: 0 }, { gridUnits: true })
        .rotate(60)
        .zIndex(1)
        .rotateIn(270, 400, { ease: "easeOutCubic" })
        .size(2 + tokenWidth, { gridUnits: true })
        .mirrorY()
        .playIf(count >= 2);

    seq.wait(850);

    return seq;
}

export const tigerAttunement = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};