# Manual Module-to-Macro Conversion Guide

If the automated `macro-sync` script fails or a highly customized standalone macro is required, follow this guide to translate modular JavaScript animation effects into standalone VTT macros.

---

## Manual Conversion Steps

1.  **Locate the Effect File:** Find the relevant animation script in `src/animation/effects/`.
2.  **Handle Multiple Variants:** Check if the effect has multiple variants (e.g., `_rage.js` which exports `v1`, `v2`, `v3`, etc.). 
    *   **CRITICAL:** If there are multiple variants, ask the user to clarify which version they want before proceeding.
3.  **Extract the Sequence:** Extract the core `new Sequence()` logic from the `create` or `play` functions of the effect.
4.  **Remove Module Dependencies:**
    *   Remove all `import` statements.
    *   For `closest()`, remove the function call and just use the string (e.g., change `closest('jb2a.magic_missile')` to `'jb2a.magic_missile'`) unless you inject a local standalone `closest` helper.
5.  **Set up Target/Source Variables:**
    *   Define these at the top of the script using Foundry globals:
        ```javascript
        const token = canvas.tokens.controlled[0];
        if (!token) return ui.notifications.warn("Please select a token!");
        ```
    *   *Note: If adding or changing an if statement that immediately returns, write it as a single line.*
6.  **Implement Toggle Functionality (Play/Stop):**
    *   If the original effect is persistent (`.persist()`), the macro should function as a toggle.
    *   Use `Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0` to check if it is playing, and end it using `Sequencer.EffectManager.endEffects(...)`.
7.  **Output the Macro:** Write the resulting JavaScript code into `src/standalone-macros/` following the naming convention of the existing files.

---

## Concrete Example: Before & After

### Before: Module Effect (e.g., `src/animation/effects/buff/example.js`)
```javascript
import { closest } from "../../../../lib/filemanager.js";
import { autoanimations } from "../../../../integration/autoanimations.js";

const DEFAULT_CONFIG = { color: 'red' };

function create(token, config = {}) {
    const { color } = foundry.utils.mergeObject(DEFAULT_CONFIG, config);
    let seq = new Sequence()
        .effect()
        .name(`exampleBuff - ${token.id}`)
        .file(closest(`jb2a.impact.ground_crack.${color}.02`))
        .atLocation(token)
        .size(3.5, { gridUnits: true })
        .persist();
    return seq;
}

export const exampleBuff = { 
    create, 
    play: async (t, c) => (await create(t, c))?.play(),
    stop: async (t) => Sequencer.EffectManager.endEffects({ name: `exampleBuff - ${t.id}`, object: t })
};
```

### After: Standalone Macro
```javascript
// Standalone Macro
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const color = 'red';
const label = `exampleBuff - ${token.id}`;

const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
} else {
    new Sequence()
        .effect()
        .name(label)
        .file(`jb2a.impact.ground_crack.${color}.02`)
        .atLocation(token)
        .size(3.5, { gridUnits: true })
        .persist()
        .play();
}
```
