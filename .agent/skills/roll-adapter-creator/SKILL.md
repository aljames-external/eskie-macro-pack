---
name: roll-adapter-creator
description: Guides the creation and registration of a new system roll adapter to extend the automated roll animation system. Make sure to use this skill whenever you are asked to "add support for a new game system", "support rolls in a new system", or "create an adapter for a system", even if they don't explicitly say "roll adapter creator".
compatibility: Foundry VTT V11+
---

# World Script Roll Adapter Creator Skill

This skill guides the agent in creating a new system-specific roll adapter to extend the automated roll animation system ([eskieRollAnimation.js](file:///usr/local/google/home/aljames/jetski/eskie-macro-pack/src/world-scripts/eskieRollAnimation.js)) for new game systems (e.g., Lancer, Cypher, etc.).

All system adapters inherit from `BaseSystemAdapter` and normalize rolls into canonical Eskie check animations.

## Step-by-Step Workflow

### 1. Initialize the Adapter File
Create a new JavaScript file inside the system adapters folder:
`src/world-scripts/adapters/system/<system-id>.js`
*(Replace `<system-id>` with the exact identifier used by the game system, which matches `game.system.id` in VTT).*

### 2. Copy the Template
Read the template file [template_adapter.js](file:///usr/local/google/home/aljames/jetski/eskie-macro-pack/.agent/skills/roll-adapter-creator/references/template_adapter.js) and copy its structure into your new file.

### 3. Implement `extractRolls(message)`
Customize the `extractRolls` method to parse the specific chat message structure of your target game system:
*   **Speaker Token:** Extract the token ID using `message.speaker.token`.
*   **System Flags:** Inspect the message's `message.flags` object for system-specific roll properties (e.g., skill keys, d20 checks).
*   **Outcome:** If the system flags provide a roll outcome (success, failure), set the `outcome` property. Otherwise, default to `"indeterminant"`.
*   **Format:** Return an array of rolls matching this structure:
    ```javascript
    return [{
        source: "system-name-source",
        rawAbility: "raw-ability-or-skill-key", // E.g., 'str', 'acr', 'perception'
        outcome: "success" | "failure" | "indeterminant",
        tokenId: tokenId
    }];
    ```

### 4. Implement `normalizeAbility(rawAbility, combinedText)`
Map system-specific skill or attribute abbreviations to the six canonical D&D attributes (strength, dexterity, constitution, intelligence, wisdom, charisma):
*   Define a `systemCustomMap` containing key-value pairs (e.g., `{ ath: "strength", acr: "dexterity" }`).
*   Call `super.normalizeAbility(rawAbility, combinedText, systemCustomMap)`. This merges your custom map with the base mappings and returns the normalized string.

### 5. Register the Adapter in the Orchestrator
To activate your new adapter, you must register it inside [eskieRollAnimation.js](file:///usr/local/google/home/aljames/jetski/eskie-macro-pack/src/world-scripts/eskieRollAnimation.js):

1.  **Import the class:** Add the import at the top of the file:
    ```javascript
    import { MySystemAdapter } from "./adapters/system/mySystem.js";
    ```
2.  **Add to the constructor selection:** Inside the constructor of the `EskieRollTracker` class, add a conditional check for the new system:
    ```javascript
    // Inside class EskieRollTracker constructor:
    const systemId = game.system.id;
    if (systemId === "dnd5e") {
        this.activeAdapter = new Dnd5eAdapter();
    } else if (systemId === "pf2e") {
        this.activeAdapter = new Pf2eAdapter();
    } else if (systemId === "my-system-id") { // Add your system here!
        this.activeAdapter = new MySystemAdapter();
    } else {
        this.activeAdapter = new GenericAdapter();
    }
    ```

### 6. Verify and Lint
Before completing the task, run the style guide linter on your new adapter file:
```bash
python3 .agent/skills/style-guide/scripts/lint.py src/world-scripts/adapters/system/<system-id>.js
```
Fix any linting errors reported by the script!
