// Original Author: .eskie
// Adjacency Matrix Refactoring: Antigravity

import { closest } from "../../../lib/filemanager.js";
import { primMST } from "../../../lib/algorithms.js";
import { tokens } from "../../../lib/tokens.js";
import { settingsOverride } from "../../../lib/settings.js";

const DEFAULT_CONFIG = {
    releaseDelay: 200,
    propagationDelay: 50,
    fudgeFactor: 0,
    sound: {
        enabled: true,
        littleBoltVolume: 0.5,
        bigBoltVolume: 0.2
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
    config = settingsOverride(config);
    config = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    if (!targetTokens || targetTokens.length === 0) {
        console.warn("Chain Lightning (Adjacent): No targets provided.");
        return new Sequence();
    }

    const { sound } = config;
    const N = targetTokens.length;
    const A = primMST(targetTokens, tokens.getDistance, config.fudgeFactor);

    // 1. Build propagationLevels of levels using BFS on the MST tree structure
    // propagationLevels = [ 
    //   [ { parent: caster, children: [target0] } ], // Level 0
    //   [ { parent: target0, children: [target1, target2] } ], // Level 1
    //   ... 
    // ]
    const propagationLevels = [];
    
    // Level 0: from caster to target 0
    propagationLevels.push([
        { parent: token, children: [targetTokens[0]] }
    ]);

    let currentLevelNodes = [0];
    const visited = new Set([0]);

    while (true) {
        const nextLevelGroups = [];
        const nextLevelNodes = [];

        for (const u of currentLevelNodes) {
            const children = [];
            for (let v = 0; v < N; v++) {
                if (A[u][v] === 0 && !visited.has(v)) {
                    visited.add(v);
                    children.push(targetTokens[v]);
                    nextLevelNodes.push(v);
                }
            }
            if (children.length > 0) {
                nextLevelGroups.push({
                    parent: targetTokens[u],
                    children: children
                });
            }
        }

        if (nextLevelGroups.length === 0) {
            break;
        }

        propagationLevels.push(nextLevelGroups);
        currentLevelNodes = nextLevelNodes;
    }

    // 2. Construct the Little Bolts sequence
    const littleSeq = new Sequence();
    for (let i = 0; i < propagationLevels.length; i++) {
        const levelGroups = propagationLevels[i];
        for (const group of levelGroups) {
            const parentToken = group.parent;
            for (const childToken of group.children) {
                littleSeq.effect()
                    .file(closest("jb2a.electric_arc.blue02"))
                    .atLocation(parentToken)
                    .stretchTo(childToken, { onlyX: true })
                    .duration(1000)
                    .fadeIn(250)
                    .fadeOut(750)
                    .belowTokens()
                    .animateProperty("sprite", "height", { from: -2, to: -1, duration: 200, gridUnits: true })
                    .opacity(0.75);
            }
        }
        
        if (sound.enabled) {
            littleSeq.sound()
                .file(closest("psfx.weapon-shooshes.lightning"))
                .volume(sound.littleBoltVolume ?? 0.5);
        }
        
        if (i < propagationLevels.length - 1) {
            littleSeq.wait(config.propagationDelay);
        }
    }

    // 3. Construct the Big Bolts sequence
    const bigSeq = new Sequence();
    bigSeq.wait(config.releaseDelay);
    for (let i = 0; i < propagationLevels.length; i++) {
        const levelGroups = propagationLevels[i];
        const isPrimary = (i === 0);
        
        for (const group of levelGroups) {
            const parentToken = group.parent;
            for (const childToken of group.children) {
                const file = isPrimary 
                    ? closest("jb2a.chain_lightning.primary.blue")
                    : closest("jb2a.chain_lightning.secondary.blue");
                    
                const offset = isPrimary
                    ? { offset: { x: token.document.width * 0.25 }, gridUnits: true, local: true }
                    : { offset: { x: -0.1 }, gridUnits: true, local: true };

                // Big lightning bolt
                bigSeq.effect()
                    .file(file)
                    .atLocation(parentToken, offset)
                    .stretchTo(childToken)
                    .zIndex(2);

                // Shocking static electricity on target
                bigSeq.effect()
                    .file(closest('jb2a.static_electricity.03.blue'))
                    .attachTo(childToken)
                    .scaleToObject(1.25, { considerTokenScale: true })
                    .opacity(1)
                    .playbackRate(1)
                    .fadeOut(1000)
                    .randomRotation()
                    .repeats(3, 300, 300);

                // Shaking copy sprite representing electrocution
                bigSeq.effect()
                    .copySprite(childToken)
                    .spriteRotation(-(childToken.document?.rotation ?? childToken.rotation ?? 0))
                    .attachTo(childToken)
                    .scaleToObject(1, { considerTokenScale: true })
                    .fadeIn(250)
                    .fadeOut(1500)
                    .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
                    .duration(4000)
                    .opacity(0.25);

                // Thunder damage effect under the token
                bigSeq.effect()
                    .file(closest("eskie.damage.thunder.01.lightpurple"))
                    .attachTo(childToken)
                    .scaleToObject(1.25, { considerTokenScale: true })
                    .belowTokens();
            }
        }
        
        if (sound.enabled) {
            bigSeq.sound()
                .file(closest("psfx.cantrips.thunderclap.v1"))
                .volume(sound.bigBoltVolume ?? 0.2);
        }
        
        if (i < propagationLevels.length - 1) {
            const waitTime = isPrimary ? 800 : config.propagationDelay;
            bigSeq.wait(waitTime);
        }
    }

    // Combine both sequences to play in parallel
    const masterSequence = new Sequence();
    masterSequence.addSequence(littleSeq);
    masterSequence.addSequence(bigSeq);

    return masterSequence;
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
