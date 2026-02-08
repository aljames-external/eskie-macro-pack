//Original Author: .eskie
//Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";
import { autoanimations } from "../../../integration/autoanimations.js";
import { system } from "../../../integration/system.js";

const DEFAULT_CONFIG = {
    id: "magicMissile",
    missileCount: 3,
};

async function create(token, target, config = {}) {
    const { id, missileCount, info } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    let mCount = missileCount;
    const spellLevel = system.getSpellLevel({aaHandler: info});
    if (spellLevel) mCount = spellLevel + 2;

    const seq = new Sequence();

    // Orbit tuning (grid units)
    const orbitRadius = 0.55;
    const orbitDirection = 1;

    // Dynamic orbit mapping (1 → 9)
    const clamped = Math.clamp(mCount, 1, 9);
    const t = (clamped - 1) / 8;

    const orbitStartAngle = 0 + (-90 - 0) * t;   // 0 → -90
    const orbitSpread     = 0 + (180 - 0) * t;   // 0 → 180

    const steps = Math.max(mCount - 1, 1);
    const stepAngle = orbitSpread / steps;

    // Precompute per-missile data
    const missiles = [];
    const colors = ["blue", "purple", "grey"];

    for (let m = 0; m < mCount; m++) {
        const color = colors[Math.floor(Math.random() * colors.length)];

        let starColor = color;
        if (color === "grey") starColor = "white";

        const angleDeg = orbitStartAngle + orbitDirection * (m * stepAngle);
        const angleRad = angleDeg * (Math.PI / 180);

        const offsetArc = {
            x: Math.cos(angleRad) * orbitRadius,
            y: Math.sin(angleRad) * orbitRadius
        };

        missiles.push({ m, color, starColor, offsetArc });
    }

    // -------------------------
    // PASS 1: Stars
    // -------------------------
    for (const missile of missiles) {
        seq.effect()
            .file(closest(`eskie.star.02.${missile.starColor}`))
            .attachTo(token, {
                offset: { x: missile.offsetArc.x, y: missile.offsetArc.y },
                gridUnits: true,
                local: true
            })
            .size(0.5, { gridUnits: true })
            .rotateTowards(target)
            .spriteOffset({ x: -0.25 }, { gridUnits: true })
            .playbackRate(1.25)
            .zIndex(2)
            .rotateIn(180, 500, { ease: "easeOutCubic" })
            .opacity(0.8)
            .waitUntilFinished(-1550);
    }

    seq.wait(250);

    // ------------------------------
    // PASS 2: Missiles
    // ------------------------------
    for (const missile of missiles) {
        const missileDelay = 100 + (missile.m * 250);

        seq.effect()
            .delay(missileDelay)
            .file(closest(`jb2a.magic_missile.${missile.color}`))
            .attachTo(token, {
                offset: { x: missile.offsetArc.x, y: missile.offsetArc.y },
                gridUnits: true,
                local: true
            })
            .scale(0.6)
            .stretchTo(target, { randomOffset: 0.5 })
            .randomizeMirrorY()
            .playbackRate(1.25)
            .zIndex(1);
    }

    return seq;
}

async function play(token, target, config = {}) {
    const seq = await create(token, target, config);
    if (seq) { return seq.play(); }
}

export const magicMissile = {
    create,
    play,
};

autoanimations.register("Magic Missile", "ranged-target", "eskie.effect.magicMissile", DEFAULT_CONFIG);
