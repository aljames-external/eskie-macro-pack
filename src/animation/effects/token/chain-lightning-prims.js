// Original Author: .eskie
// Adjacency Matrix Refactoring: Antigravity

import { closest } from "../../../lib/filemanager.js";
import { primMST } from "../../../lib/algorithms.js";
import { tokens } from "../../../lib/tokens.js";

const DEFAULT_CONFIG = {
    releaseDelay: 200,
    propagationDelay: 50,
    fudgeFactor: 0,
    littleBoltSound: {
        enable: true,
        file: "psfx.weapon-shooshes.lightning",
        volume: 0.5
    },
    bigBoltSound: {
        enable: true,
        file: "psfx.cantrips.thunderclap.v1",
        volume: 0.2
    }
};

/**
 * Creates the Adjacent Chain Lightning sequence effects.
 * @param {Token} token - The casting token.
 * @param {Array<Token>} targetTokens - An array of target tokens.
 * @param {object} config - Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
function create(token, targetTokens, config = {}) {
    config = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    if (!targetTokens || targetTokens.length === 0) {
        console.warn("Chain Lightning (Adjacent): No targets provided.");
        return new Sequence();
    }

    const seq = new Sequence();
    const N = targetTokens.length;
    const A = primMST(targetTokens, tokens.getDistance, config.fudgeFactor);

    // BFS to find parent and level of each node in the MST
    const parent = Array(N).fill(-1);
    const level = Array(N).fill(0);
    const queue = [0];
    const visited = new Set([0]);

    while (queue.length > 0) {
        const u = queue.shift();
        for (let v = 0; v < N; v++) {
            if (A[u][v] === 0 && !visited.has(v)) {
                visited.add(v);
                parent[v] = u;
                level[v] = level[u] + 1;
                queue.push(v);
            }
        }
    }

    // Phase 1: Little Bolts (electric arcs)
    for (let v = 0; v < N; v++) {
        const sourceToken = (v === 0) ? token : targetTokens[parent[v]];
        const currentToken = targetTokens[v];
        const delayTime = level[v] * config.propagationDelay;

        const effect = seq.effect()
            .file(closest("jb2a.electric_arc.blue02"))
            .atLocation(sourceToken)
            .stretchTo(currentToken, { onlyX: true })
            .duration(1000)
            .fadeIn(250)
            .fadeOut(750)
            .belowTokens()
            .animateProperty("sprite", "height", { from: -2, to: -1, duration: 200, gridUnits: true })
            .opacity(0.75);

        if (delayTime > 0) {
            effect.delay(delayTime);
        }

        // Play shoosh sound when hit, if enabled
        if (config.littleBoltSound?.enable && config.littleBoltSound?.file) {
            seq.sound()
                .file(closest(config.littleBoltSound.file))
                .volume(config.littleBoltSound.volume ?? 0.5)
                .delay(delayTime);
        }
    }

    // Phase 2: Big Bolts (primary/secondary chain lightning)
    for (let v = 0; v < N; v++) {
        const isPrimary = (v === 0);
        const sourceToken = isPrimary ? token : targetTokens[parent[v]];
        const currentToken = targetTokens[v];
        
        const delayTime = isPrimary
            ? config.releaseDelay
            : config.releaseDelay + 800 + (level[v] - 1) * config.propagationDelay;

        const file = isPrimary 
            ? closest("jb2a.chain_lightning.primary.blue")
            : closest("jb2a.chain_lightning.secondary.blue");
            
        const offset = isPrimary
            ? { offset: { x: token.document.width * 0.25 }, gridUnits: true, local: true }
            : { offset: { x: -0.1 }, gridUnits: true, local: true };

        // 1. Big lightning bolt
        seq.effect()
            .file(file)
            .atLocation(sourceToken, offset)
            .stretchTo(currentToken)
            .zIndex(2)
            .delay(delayTime);

        // 2. Shocking static electricity on target
        seq.effect()
            .file(closest('jb2a.static_electricity.03.blue'))
            .attachTo(currentToken)
            .scaleToObject(1.25, { considerTokenScale: true })
            .opacity(1)
            .playbackRate(1)
            .fadeOut(1000)
            .randomRotation()
            .repeats(3, 300, 300)
            .delay(delayTime);

        // 3. Shaking copy sprite representing electrocution
        seq.effect()
            .copySprite(currentToken)
            .spriteRotation(-(currentToken.document?.rotation ?? currentToken.rotation ?? 0))
            .attachTo(currentToken)
            .scaleToObject(1, { considerTokenScale: true })
            .fadeIn(250)
            .fadeOut(1500)
            .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
            .duration(4000)
            .opacity(0.25)
            .delay(delayTime);

        // 4. Thunder damage effect under the token
        seq.effect()
            .file(closest("eskie.damage.thunder.01.lightpurple"))
            .attachTo(currentToken)
            .scaleToObject(1.25, { considerTokenScale: true })
            .belowTokens()
            .delay(delayTime);

        // 5. Thunderclap sound when hit, if enabled
        if (config.bigBoltSound?.enable && config.bigBoltSound?.file) {
            seq.sound()
                .file(closest(config.bigBoltSound.file))
                .volume(config.bigBoltSound.volume ?? 0.2)
                .delay(delayTime);
        }
    }

    return seq;
}

/**
 * Plays the Adjacent Chain Lightning animation.
 * @param {Token} token - The casting token.
 * @param {Array<Token>} targetTokens - An array of target tokens.
 * @param {object} config - Configuration options for the animation.
 */
function play(token, targetTokens, config = {}) {
    const sequence = create(token, targetTokens, config);
    sequence.play();
}

export const chainLightningPrims = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};
