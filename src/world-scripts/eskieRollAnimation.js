/**
 * World Script: Eskie Roll Animations
 * Plays a custom d20 roll animation sequence above tokens during saving throws and ability checks.
 */

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

function getRollDetails(message) {
  const flavorText = message.flavor?.toLowerCase() || "";
  const contentText = message.content || "";
  const contentLower = contentText.toLowerCase();
  const combinedText = `${flavorText} ${contentLower}`;
  
  const rolls = [];

  // 1. Core System Flag Checks (Direct rolls made by a single token)
  const rollFlags = message.flags?.dnd5e?.roll;
  if (rollFlags) {
    const isCoreValid = ["save", "ability", "skill"].includes(rollFlags.type);
    if (isCoreValid) {
      rolls.push({
        source: "core-flags",
        ability: rollFlags.ability,
        outcome: "indeterminant",
        tokenId: null, // Signals fallback to the speaker token (correct for direct rolls)
        rawAbility: rollFlags.ability
      });
    }
  }

  // 2. Midi-QOL Flag Checks (Single-target outcome flags)
  let midiOutcome = "indeterminant";
  if (message.flags?.["midi-qol"]?.isSuccess) midiOutcome = "success";
  else if (message.flags?.["midi-qol"]?.isFailure) midiOutcome = "failure";

  // 3. Advanced Midi-QOL HTML Parsing (For automated multi-target saves/checks)
  if (contentText.includes("midi-qol")) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentText, "text/html");
    
    const saveDisplay = doc.querySelector(".midi-qol-saves-display");
    if (saveDisplay) {
      // Find all target list items in the save display container
      const targetLis = saveDisplay.querySelectorAll("li.midi-qol-target-select");
      
      // Determine the ability/save type from the display text context
      let saveAbility = null;
      const textContext = saveDisplay.textContent.toLowerCase();
      const abilityRegex = /(strength|dexterity|constitution|intelligence|wisdom|charisma|str|dex|con|int|wis|cha|acr|ath|per|ste)/;
      const match = textContext.match(abilityRegex);
      if (match) saveAbility = match[1];

      targetLis.forEach(targetLi => {
        const tokenId = targetLi.dataset.id;
        let targetOutcome = "indeterminant";
        let isResolved = false;

        // Check if this specific target has resolved their save yet
        if (targetLi.classList.contains("success") || targetLi.querySelector(".fa-check")) {
          targetOutcome = "success";
          isResolved = true;
        } else if (targetLi.classList.contains("failure") || targetLi.querySelector(".fa-times")) {
          targetOutcome = "failure";
          isResolved = true;
        }

        // Only add to rolls if the target has actually resolved their save
        if (isResolved && tokenId) {
          rolls.push({
            source: "midi-html",
            ability: saveAbility,
            outcome: targetOutcome,
            tokenId: tokenId,
            rawAbility: saveAbility
          });
        }
      });
    }
  }

  // 4. Fallback Keyword Strings (Only run if no rolls have been identified yet)
  if (rolls.length === 0) {
    // Explicitly ignore item usage, attacks, and damage cards to prevent false positives on caster cards
    const isItemUsage = message.flags?.dnd5e?.messageType === "usage";
    const isMidiAttackOrDamage = ["attack", "damage", "item"].includes(message.flags?.["midi-qol"]?.messageType);
    
    if (!isItemUsage && !isMidiAttackOrDamage) {
      const hasKeywords = /save|saving\s+throw|check|skill/.test(combinedText);
      if (hasKeywords) {
        rolls.push({
          source: "fallback-keywords",
          ability: null,
          outcome: "indeterminant",
          tokenId: null // Fallback to speaker
        });
      }
    }
  }

  // 5. Normalize Abilities & Outcomes for all detected rolls
  rolls.forEach(roll => {
    // Normalize Outcome
    if (roll.outcome === "indeterminant") {
      if (midiOutcome !== "indeterminant") {
        roll.outcome = midiOutcome;
      } else {
        if (combinedText.includes("success") || combinedText.includes("pass")) roll.outcome = "success";
        if (combinedText.includes("failure") || combinedText.includes("fail")) roll.outcome = "failure";
      }
    }

    // Normalize Ability string
    let raw = roll.rawAbility;
    if (!raw) {
      const abilityRegex = /(strength|dexterity|constitution|intelligence|wisdom|charisma|str|dex|con|int|wis|cha)/;
      const match = combinedText.match(abilityRegex);
      if (match) raw = match[1];
    }

    if (raw) {
      const abilityMap = {
        str: "strength", strength: "strength", ath: "strength",
        dex: "dexterity", dexterity: "dexterity", acr: "dexterity", ste: "dexterity", sle: "dexterity",
        con: "constitution", constitution: "constitution",
        int: "intelligence", intelligence: "intelligence", arc: "intelligence", his: "intelligence", inv: "intelligence", nat: "intelligence", rel: "intelligence",
        wis: "wisdom", wisdom: "wisdom", ani: "wisdom", ins: "wisdom", med: "wisdom", per: "wisdom", sur: "wisdom",
        cha: "charisma", charisma: "charisma", dec: "charisma", itm: "charisma", prf: "charisma", pers: "charisma"
      };
      roll.ability = abilityMap[raw.toLowerCase()] || raw;
    }
  });

  return rolls;
}

function getSpeakerToken(message, extractedTokenId) {
  if (extractedTokenId) {
    const htmlTarget = canvas.tokens.get(extractedTokenId);
    if (htmlTarget) return htmlTarget;
  }
  return canvas.tokens.get(message.speaker.token) 
         || canvas.tokens.controlled[0] 
         || game.user.character?.getActiveTokens()[0];
}

async function processMessageAndPlay(message, userId) {
  // Only run validation calculations once on the user machine modifying the doc
  if (game.user.id !== userId) return;

  const rolls = getRollDetails(message);
  if (rolls.length === 0) return;

  // Retrieve the list of token IDs that have already animated for this message
  const firedTokens = message.flags?.world?.eskieAnimatedTokens || [];
  const newFiredTokens = [...firedTokens];
  let updatedFlags = false;

  for (const roll of rolls) {
    const token = getSpeakerToken(message, roll.tokenId);
    if (!token) continue;

    // Check if we've already animated this specific token for this message
    if (firedTokens.includes(token.id)) continue;

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

export function initialize() {
  console.log("EMP | Initializing World Script: Eskie Roll Animations");
  
  // Register Hooks
  Hooks.on("createChatMessage", (message, options, userId) => {
    processMessageAndPlay(message, userId);
  });

  Hooks.on("updateChatMessage", (message, updateData, options, userId) => {
    if (!updateData.content) return;
    processMessageAndPlay(message, userId);
  });
}
