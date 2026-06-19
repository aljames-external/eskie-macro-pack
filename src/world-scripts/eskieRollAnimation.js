/**
 * World Script: Eskie Roll Animations
 * Plays a custom d20 roll animation sequence above tokens during saving throws and ability checks.
 * Supports D&D 5e (with or without Midi-QOL), Pathfinder 2e (PF2e), and generic d20 systems.
 */

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
// ABILITY AND SKILL NORMALIZATION HELPERS
// ============================================================================

const BASE_ABILITY_MAP = {
    str: "strength", strength: "strength",
    dex: "dexterity", dexterity: "dexterity",
    con: "constitution", constitution: "constitution",
    int: "intelligence", intelligence: "intelligence",
    wis: "wisdom", wisdom: "wisdom",
    cha: "charisma", charisma: "charisma"
};

/**
 * Shared helper to extract and normalize abilities/skills into Eskie asset names.
 * Consolidates mapping structures across all adapters to prevent code duplication.
 */
function parseAndNormalizeAbility(rawAbility, combinedText, customMap = {}) {
    let raw = rawAbility;
    if (!raw) {
        // Shared regex matching common ability and skill names/abbreviations
        const abilityRegex = /(strength|dexterity|constitution|intelligence|wisdom|charisma|str|dex|con|int|wis|cha|perception|prc|acr|ath|ste|sle)/;
        const match = combinedText.match(abilityRegex);
        if (match) raw = match[1];
    }

    if (raw) {
        const lowerRaw = raw.toLowerCase();
        const mergedMap = { ...BASE_ABILITY_MAP, ...customMap };
        return mergedMap[lowerRaw] || lowerRaw;
    }
    return null;
}

// ============================================================================
// MODULE ADAPTERS (AUTOMATION EXTENSIONS)
// ============================================================================

const MODULE_ADAPTERS = {
    // ------------------------------------------------------------------------
    // Midi-QOL Module Adapter
    // ------------------------------------------------------------------------
    "midi-qol": {
        isActive() {
            return game.modules.get("midi-qol")?.active;
        },
        extractRolls(message) {
            const rolls = [];
            const contentText = message.content || "";

            // 1. Check for single target outcome flags
            let outcome = "indeterminant";
            if (message.flags?.["midi-qol"]?.isSuccess) outcome = "success";
            else if (message.flags?.["midi-qol"]?.isFailure) outcome = "failure";

            // 2. Parse multi-target saves display HTML using Foundry's built-in jQuery
            if (contentText.includes("midi-qol")) {
                const $content = $(contentText);
                const $saveDisplay = $content.find(".midi-qol-saves-display");
                
                if ($saveDisplay.length) {
                    const $targetLis = $saveDisplay.find("li.midi-qol-target-select");
                    
                    // Parse the short ability code from the save display block text
                    let saveAbility = null;
                    const textContext = $saveDisplay.text().toLowerCase();
                    const abilityRegex = /(strength|dexterity|constitution|intelligence|wisdom|charisma|str|dex|con|int|wis|cha|acr|ath|per|ste)/;
                    const match = textContext.match(abilityRegex);
                    if (match) saveAbility = match[1];

                    $targetLis.each((index, el) => {
                        const $li = $(el);
                        const tokenId = el.dataset.id;
                        let targetOutcome = "indeterminant";
                        let isResolved = false;

                        if ($li.hasClass("success") || $li.find(".fa-check").length > 0) {
                            targetOutcome = "success";
                            isResolved = true;
                        } else if ($li.hasClass("failure") || $li.find(".fa-times").length > 0) {
                            targetOutcome = "failure";
                            isResolved = true;
                        }

                        if (isResolved && tokenId) {
                            rolls.push({
                                source: "midi-qol-html",
                                rawAbility: saveAbility,
                                outcome: targetOutcome,
                                tokenId: tokenId
                            });
                        }
                    });
                }
            }

            // If flag outcomes exist but no HTML saves (e.g., single-target roll card updates)
            if (rolls.length === 0 && outcome !== "indeterminant") {
                rolls.push({
                    source: "midi-qol-flags",
                    rawAbility: null,
                    outcome: outcome,
                    tokenId: null
                });
            }

            return { rolls, outcome };
        }
    }
};

// ============================================================================
// SYSTEM ADAPTERS
// ============================================================================

const SYSTEM_ADAPTERS = {
    // ------------------------------------------------------------------------
    // D&D 5e Adapter
    // ------------------------------------------------------------------------
    "dnd5e": {
        extractRolls(message) {
            const rolls = [];
            const flavorText = message.flavor?.toLowerCase() || "";
            const contentText = message.content || "";
            const contentLower = contentText.toLowerCase();
            const combinedText = `${flavorText} ${contentLower}`;

            // 1. Core System Flag Checks (rolls from character sheets)
            const rollFlags = message.flags?.dnd5e?.roll;
            if (rollFlags) {
                const isCoreValid = ["save", "ability", "skill"].includes(rollFlags.type);
                if (isCoreValid) {
                    rolls.push({
                        source: "dnd5e-core-flags",
                        rawAbility: rollFlags.ability,
                        outcome: "indeterminant",
                        tokenId: null
                    });
                }
            }

            // 2. Process Active Module Adapters (e.g. Midi-QOL)
            let moduleOutcome = "indeterminant";
            const midiAdapter = MODULE_ADAPTERS["midi-qol"];
            if (midiAdapter && midiAdapter.isActive()) {
                const midiData = midiAdapter.extractRolls(message);
                if (midiData.rolls.length > 0) {
                    rolls.push(...midiData.rolls);
                }
                moduleOutcome = midiData.outcome;
            }

            // 3. Fallback Keyword Strings (Only run if no rolls have been identified yet)
            if (rolls.length === 0) {
                const isItemUsage = message.flags?.dnd5e?.messageType === "usage";
                const isMidiAttack = midiAdapter?.isActive() && ["attack", "damage", "item"].includes(message.flags?.["midi-qol"]?.messageType);
                
                if (!isItemUsage && !isMidiAttack) {
                    const hasKeywords = /save|saving\s+throw|check|skill/.test(combinedText);
                    if (hasKeywords) {
                        rolls.push({
                            source: "dnd5e-fallback-keywords",
                            rawAbility: null,
                            outcome: "indeterminant",
                            tokenId: null
                        });
                    }
                }
            }

            // Distribute module-level outcome to core/fallback rolls if they are still indeterminant
            rolls.forEach(roll => {
                if (roll.outcome === "indeterminant" && moduleOutcome !== "indeterminant") {
                    roll.outcome = moduleOutcome;
                }
            });

            return rolls;
        },

        normalizeAbility(rawAbility, combinedText) {
            // DnD 5e-specific skill and feature abbreviations
            const dnd5eMap = {
                ath: "strength",
                acr: "dexterity", ste: "dexterity", sle: "dexterity",
                arc: "intelligence", his: "intelligence", inv: "intelligence", nat: "intelligence", rel: "intelligence",
                ani: "wisdom", ins: "wisdom", med: "wisdom", per: "wisdom", sur: "wisdom",
                dec: "charisma", itm: "charisma", prf: "charisma", pers: "charisma"
            };
            return parseAndNormalizeAbility(rawAbility, combinedText, dnd5eMap);
        }
    },

    // ------------------------------------------------------------------------
    // Pathfinder 2e (PF2e) Adapter
    // ------------------------------------------------------------------------
    "pf2e": {
        extractRolls(message) {
            const rolls = [];
            const pf2eContext = message.flags?.pf2e?.context;

            if (pf2eContext) {
                const rollType = pf2eContext.type;
                const isValidType = ["saving-throw", "skill-check", "perception-check", "ability-check"].includes(rollType);
                
                if (isValidType) {
                    let outcome = "indeterminant";
                    const pf2eOutcome = pf2eContext.outcome; // 'success', 'criticalSuccess', 'failure', 'criticalFailure'
                    
                    if (pf2eOutcome) {
                        if (["success", "criticalSuccess"].includes(pf2eOutcome)) outcome = "success";
                        if (["failure", "criticalFailure"].includes(pf2eOutcome)) outcome = "failure";
                    }

                    rolls.push({
                        source: "pf2e-flags",
                        rawAbility: pf2eContext.ability || null,
                        outcome: outcome,
                        tokenId: message.speaker.token || null
                    });
                }
            }

            // Fallback text parsing if flags are missing/unpopulated
            if (rolls.length === 0) {
                const flavor = message.flavor?.toLowerCase() || "";
                const content = message.content?.toLowerCase() || "";
                const combined = `${flavor} ${content}`;
                
                const hasKeywords = /saving throw|check|skill|perception/.test(combined);
                const isAttack = message.flags?.pf2e?.context?.type === "attack-roll";

                if (hasKeywords && !isAttack) {
                    rolls.push({
                        source: "pf2e-fallback",
                        rawAbility: null,
                        outcome: "indeterminant",
                        tokenId: message.speaker.token || null
                    });
                }
            }

            return rolls;
        },

        normalizeAbility(rawAbility, combinedText) {
            // PF2e-specific perception/skill checks mapping
            const pf2eMap = {
                perception: "wisdom", prc: "wisdom"
            };
            return parseAndNormalizeAbility(rawAbility, combinedText, pf2eMap);
        }
    },

    // ------------------------------------------------------------------------
    // Generic / Fallback Adapter (Works for PF1e, D&D 3.5, etc.)
    // ------------------------------------------------------------------------
    "generic": {
        extractRolls(message) {
            const rolls = [];
            const flavorText = message.flavor?.toLowerCase() || "";
            const contentText = message.content || "";
            const contentLower = contentText.toLowerCase();
            const combinedText = `${flavorText} ${contentLower}`;

            const hasKeywords = /save|saving\s+throw|check|skill/.test(combinedText);
            const isAttackOrDamage = /attack|strike|damage|damage\s+roll/.test(combinedText);

            if (hasKeywords && !isAttackOrDamage) {
                rolls.push({
                    source: "generic-keywords",
                    rawAbility: null,
                    outcome: "indeterminant",
                    tokenId: null
                });
            }

            return rolls;
        },

        normalizeAbility(rawAbility, combinedText) {
            return parseAndNormalizeAbility(rawAbility, combinedText);
        }
    }
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
