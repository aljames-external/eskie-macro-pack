// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../../lib/filemanager.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../../utils/sound.js";
import { adapter } from "../../../../adapters/index.js";

const DEFAULT_CONFIG = {
    id: 'TeleportIn',
    sound: {
        teleportIn: { ...DEFAULT_SOUND_CONFIG }
    }
};

function create(token: Token, targets: any[] = [], config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, position } = mConfig;
    if (!position) return;
    const gridSize = adapter.getSceneDimensions(canvas?.scene).size;
    const tokenCenter = adapter.getCenter(token);
    const tokenX = token.x;
    const tokenY = token.y;
    const maxDistance = targets.length > 0 
        ? Math.max(...targets.map(target => 3 * Math.max(Math.abs(target.x - tokenX), Math.abs(target.y - tokenY)) / gridSize + 1))
        : 1;

    let sequence = new Sequence();
    applySound(sequence, mConfig.sound.teleportIn);

    sequence = sequence.effect()
        .file(closest("jb2a.magic_signs.circle.02.conjuration.intro.blue"))
        .atLocation(position)
        .belowTokens()
        .scaleToObject(maxDistance)
        .filter("ColorMatrix", { saturate: -0.25, brightness: 1 })
        .opacity(0.8)
        .waitUntilFinished(-500);

    sequence = sequence.effect()
        .file(closest("jb2a.magic_signs.circle.02.conjuration.loop.blue"))
        .atLocation(position)
        .filter("ColorMatrix", { saturate: -0.5, brightness: 1.5 })
        .opacity(0.65)
        .belowTokens()
        .scaleToObject(maxDistance)
        .duration(2500)
        .waitUntilFinished(-1500);

    sequence = sequence.motion(token)
        .moveTo(position, { duration: 500, offset: { x: -1, y: -1 } });

    targets.forEach(target => {
        const targetCenter = adapter.getCenter(target);
        let targetX = position.x + (targetCenter.x - tokenCenter.x);
        let targetY = position.y + (targetCenter.y - tokenCenter.y);
        sequence = sequence.motion(target)
            .moveTo({ x: targetX, y: targetY }, { duration: 500, offset: { x: -1, y: -1 } });
    });
    
    return sequence;
}

async function play(token: Token, targets: any[] = [], config: any = {}) {
    const sequence = create(token, targets, config);
    if (sequence) { return sequence.play(); }
}

function stop(token: Token, { id = DEFAULT_CONFIG.id }: any = {}) {
    // Instantaneous effect
}

export const teleportIn = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
