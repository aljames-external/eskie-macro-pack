/**
 * World Script: Eskie Roll Animations
 * Plays a custom d20 roll animation sequence above tokens during saving throws and ability checks.
 * Supports D&D 5e (with or without Midi-QOL), Pathfinder 2e (PF2e), and generic d20 systems.
 */

import { dnd5eAdapter } from "./adapters/system/dnd5e.js";
import { pf2eAdapter } from "./adapters/system/pf2e.js";
import { genericAdapter } from "./adapters/system/generic.js";

// ============================================================================
// SEQUENCER ANIMATION TRIGGER
// ============================================================================

async function playEskieRollAnimation(token, config = {}) {
    if (!token) return;

    const rollType = config.rollType || "default";
    const outcome = config.outcome || "indeterminant";

    let color = "white";
    if (outcome === "success") color = "green";
    if (outcome === "failure") color = "red";

    const rollPath = `eskie.ui.ability_check.d20.01.roll.${rollType}.${color}`;
    const smokePath = `eskie.smoke.07.white`;
    const dieSize = 100; 

    const verticalOffset = -(token.h * 0.80);
    const locationOptions = { offset: { x: 0, y: verticalOffset } };

    console.log(`[Eskie Animation] Playing animation: rollPath="${rollPath}", token="${token.name}", outcome="${outcome}"`);

    new Sequence()
        .effect()
            .file(rollPath)
            .atLocation(token, locationOptions)
            .anchor({ x: 0.5, y: 0.5 })
            .size(dieSize) 
            .duration(1500)
            .belowTokens(false)
            .elevation(10)
        .effect()
            .file(smokePath)
            .atLocation(token, locationOptions)
            .delay(0)       
            .duration(1000) 
            .size(dieSize * 1.5) 
            .belowTokens(false)
            .elevation(11)  
        .play({ remote: true }); 
}

// ============================================================================
// SYSTEM ADAPTER RESOLUTION
// ============================================================================

const SYSTEM_ADAPTERS = {
    "dnd5e": dnd5eAdapter,
    "pf2e": pf2eAdapter,
    "generic": genericAdapter
};

/**
 * Dynamically resolves the best system adapter for the current game system.
 */
function getSystemAdapter() {
    const systemId = game.system.id;
    return SYSTEM_ADAPTERS[systemId] || SYSTEM_ADAPTERS["generic"];
}

// ============================================================================
// ROLL DETAILS PARSING & DISPATCHING
// ============================================================================

/**
 * Parses raw chat text, flavor, and flags using the system adapter
 * to determine if this card contains actionable rolls.
 */
function getRollDetails(message) {
  const adapter = getSystemAdapter();
  
  // Extract raw rolls from the system adapter
  const rolls = adapter.extractRolls(message);
  if (rolls.length === 0) return [];

  const flavorText = message.flavor?.toLowerCase() || "";
  const contentText = message.content || "";
  const contentLower = contentText.toLowerCase();
  const combinedText = `${flavorText} ${contentLower}`;

  // Normalize outcomes and abilities
  rolls.forEach(roll => {
    // Normalize Outcome
    if (roll.outcome === "indeterminant") {
      const successMatch = /success|pass/.exec(combinedText);
      const failureMatch = /failure|fail/.exec(combinedText);
      if (successMatch) {
        roll.outcome = "success";
      } else if (failureMatch) {
        roll.outcome = "failure";
      }
    }

    // Normalize Ability using the adapter
    roll.ability = adapter.normalizeAbility(roll.rawAbility, combinedText);
  });

  return rolls;
}

/**
 * Pinpoints the exact rolling token document.
 */
function getSpeakerToken(message, extractedTokenId) {
  if (extractedTokenId) {
    const htmlTarget = canvas.tokens.get(extractedTokenId);
    if (htmlTarget) return htmlTarget;
  }
  return canvas.tokens.get(message.speaker.token) 
         || canvas.tokens.controlled[0] 
         || game.user.character?.getActiveTokens()[0];
}

/**
 * Evaluates the message and triggers animations for unplayed rolls.
 */
async function processMessageAndPlay(message, userId) {
  // Only run validation calculations once on the user machine modifying the doc
  if (game.user.id !== userId) return;

  const rolls = getRollDetails(message);
  if (rolls.length === 0) return;

  // Retrieve the list of token IDs that have already animated for this message
  const firedTokens = message.flags?.world?.eskieAnimatedTokens || [];
  
  // Checking newFiredTokens dynamically instead of firedTokens ensures that if
  // multiple roll records for the same token are extracted in a single update,
  // we deduplicate in real-time and only play the animation ONCE.
  const newFiredTokens = [...firedTokens];
  let updatedFlags = false;

  for (const roll of rolls) {
    const token = getSpeakerToken(message, roll.tokenId);
    if (!token) continue;

    // Check if we've already animated this specific token (in a previous update OR earlier in this loop)
    if (newFiredTokens.includes(token.id)) continue;

    // Trigger the sequence
    playEskieRollAnimation(token, {
      rollType: roll.ability || "default",
      outcome: roll.outcome
    });

    newFiredTokens.push(token.id);
    updatedFlags = true;
  }

  // Update the message flags if we played any new animations
  if (updatedFlags) {
    await message.setFlag("world", "eskieAnimatedTokens", newFiredTokens);
  }
}

// ============================================================================
// RUNTIME HOOKS
// ============================================================================

export function initialize() {
  const adapter = getSystemAdapter();
  console.log(`EMP | Initializing World Script: Eskie Roll Animations. Active System: "${adapter.id}"`);
  
  // Register Hooks
  Hooks.on("createChatMessage", (message, options, userId) => {
    processMessageAndPlay(message, userId);
  });

  Hooks.on("updateChatMessage", (message, updateData, options, userId) => {
    if (!updateData.content) return;
    processMessageAndPlay(message, userId);
  });
}
