// Original Author: .eskie
// Adjacency Matrix Refactoring: Antigravity

import { closest } from "../../../lib/filemanager.js";
import { time } from "../../../lib/time.js";
import { primMST } from "../../../lib/algorithms.js";
import { tokens } from "../../../lib/tokens.js";

const DEFAULT_CONFIG = {
    releaseDelay: 200,
    propagationDelay: 50,
    fudgeFactor: 0
};

/**
 * Propagates the "little bolts" (electric arcs) along the MST adjacency tree.
 */
async function propagateLittleBolts(nodeIndex, sourceToken, targetTokens, A, N, propagationDelay) {
    const currentToken = targetTokens[nodeIndex];
    const children = [];
    for (let j = 0; j < N; j++) {
        if (A[nodeIndex][j] === 0) {
            children.push(j);
        }
    }

    const seq = new Sequence();
    seq.effect()
        .file(closest("jb2a.electric_arc.blue02"))
        .atLocation(sourceToken)
        .stretchTo(currentToken, { onlyX: true })
        .duration(1000)
        .fadeIn(250)
        .fadeOut(750)
        .belowTokens()
        .animateProperty("sprite", "height", { from: -2, to: -1, duration: 200, gridUnits: true })
        .opacity(0.75);

    // Play the little bolt (non-blocking)
    seq.play({ preload: true });

    // Configurable stagger delay (propagationDelay) for cascading flow
    await time.wait(propagationDelay);

    if (children.length > 0) {
        await Promise.all(children.map(childIndex => 
            propagateLittleBolts(childIndex, currentToken, targetTokens, A, N, propagationDelay)
        ));
    } else {
        // Let the final leaf node's arc finish fading slightly
        await time.wait(100);
    }
}

/**
 * Propagates the "big bolts" (primary/secondary chain lightning) along the MST adjacency tree.
 */
async function propagateBigBolts(nodeIndex, sourceToken, targetTokens, A, N, caster, propagationDelay) {
    const currentToken = targetTokens[nodeIndex];
    const children = [];
    for (let j = 0; j < N; j++) {
        if (A[nodeIndex][j] === 0) {
            children.push(j);
        }
    }

    const seq = new Sequence();
    const isPrimary = (sourceToken === caster);
    const file = isPrimary 
        ? closest("jb2a.chain_lightning.primary.blue")
        : closest("jb2a.chain_lightning.secondary.blue");
        
    const offset = isPrimary
        ? { offset: { x: caster.document.width * 0.25 }, gridUnits: true, local: true }
        : { offset: { x: -0.1 }, gridUnits: true, local: true };

    // 1. Big lightning bolt
    seq.effect()
        .file(file)
        .atLocation(sourceToken, offset)
        .stretchTo(currentToken)
        .zIndex(2);

    // 2. Shocking static electricity on target (from electric-door)
    seq.effect()
        .file(closest('jb2a.static_electricity.03.blue'))
        .attachTo(currentToken)
        .scaleToObject(1.25, { considerTokenScale: true })
        .opacity(1)
        .playbackRate(1)
        .fadeOut(1000)
        .randomRotation()
        .repeats(3, 300, 300);

    // 3. Shaking copy sprite representing electrocution (from electric-door)
    seq.effect()
        .copySprite(currentToken)
        .spriteRotation(-(currentToken.document?.rotation ?? currentToken.rotation ?? 0))
        .attachTo(currentToken)
        .scaleToObject(1, { considerTokenScale: true })
        .fadeIn(250)
        .fadeOut(1500)
        .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
        .duration(4000)
        .opacity(0.25);

    // Play the big strike (non-blocking)
    seq.play({ preload: true });

    // If it's the primary bolt (caster to initial target), wait 800ms for it to hit.
    // Otherwise, use the configurable propagation delay.
    const staggerDelay = isPrimary ? 800 : propagationDelay;
    await time.wait(staggerDelay);

    if (children.length > 0) {
        await Promise.all(children.map(childIndex => 
            propagateBigBolts(childIndex, currentToken, targetTokens, A, N, caster, propagationDelay)
        ));
    } else {
        // Let the final strike's visual effects linger
        await time.wait(1200);
    }
}

/**
 * Creates the Adjacent Chain Lightning sequence effects.
 * @param {Token} token - The casting token.
 * @param {Array<Token>} targetTokens - An array of target tokens.
 * @param {object} config - Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function create(token, targetTokens, config = {}) {
    config = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    if (!targetTokens || targetTokens.length === 0) {
        console.warn("Chain Lightning (Adjacent): No targets provided.");
        return new Sequence();
    }

    const masterSequence = new Sequence();

    masterSequence.thenDo(async () => {
        const N = targetTokens.length;
        const A = primMST(targetTokens, tokens.getDistance, config.fudgeFactor);

        // Phase 1: Start little bolts propagation (non-blocking)
        const littleBoltsPromise = propagateLittleBolts(0, token, targetTokens, A, N, config.propagationDelay);

        // Wait releaseDelay from the start of the initial little bolt
        await time.wait(config.releaseDelay);

        // Phase 2: Start big bolts propagation
        const bigBoltsPromise = propagateBigBolts(0, token, targetTokens, A, N, token, config.propagationDelay);

        // Wait for both trees to fully complete before finishing the sequence
        await Promise.all([littleBoltsPromise, bigBoltsPromise]);
    });

    return masterSequence;
}

/**
 * Plays the Adjacent Chain Lightning animation.
 * @param {Token} token - The casting token.
 * @param {Array<Token>} targetTokens - An array of target tokens.
 * @param {object} options - Options for playing the animation, including config.
 */
async function play(token, targetTokens, config = {}) {
    const sequence = await create(token, targetTokens, config);
    sequence.play();
}

export const chainLightningPrims = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};
