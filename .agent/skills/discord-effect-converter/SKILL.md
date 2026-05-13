---
name: discord-effect-converter
description: Instructions for converting legacy Discord animations into the modern modular format in src/animation/effects. Make sure to use this skill whenever you are asked to "update scripts in the new-submissions folder" or convert any Discord animation scripts.
compatibility: Foundry VTT V11+
---

# Discord Animation to Modular Format Conversion

When asked to update scripts in the `new-submissions` folder or to convert Discord animations to the modular format, execute the following transformations. You MUST reference the template files in the `references/` directory to understand the exact target structure:
- For standard or token animations, read `references/template_token.js`. Save these to `src/animation/effects/token/` or `on-target/`.
- For active effects, read `references/template_active_effect.js`. Save these to `src/animation/effects/active-effect/`.

> [!NOTE]
> If a legacy script utilizes a position or crosshair (`warpgate.crosshairs.show`) to place effects at, it is considered a **template-driven** effect. You MUST read `references/template_template.js` to understand its unique structure. These should be saved to `src/animation/effects/template/`.

## Code Style

*   **Apply Style Guide:** Ensure that all generated or updated code adheres strictly to the project's coding conventions. You MUST refer to the `style-guide` skill (located in `.agent/skills/style-guide/SKILL.md`) and apply its rules (e.g., 4-space indentation, semicolons, single quotes, 1TBS brace style, single-line if-statements) to the resulting module file.

## General Transformations

*   **Modular Structure:** Encapsulate the animation logic within an `export async function create(...)` function. This function MUST return a `Sequence` object.
*   **Root Exports:** The final module MUST export an object containing `create`, `play`, and `stop` at its root level. The `create` method is absolutely mandatory because the Automated Animations system directly calls `animation.create(token, config)`!
*   **Toggle Logic (Tagger):** Do NOT use `Tagger` to manage toggling features on/off inside the module's `create` function. The `create` function should solely generate the Sequence to turn the effect on. Use the `stop` function to end the effect.
*   **Parameter Handling:**
    *   **Token & Active Effects:** Pass the casting token as `source`. 
        *   If the animation only affects a single target, pass it as `target`. Signature: `(source, target, config = {})`.
        *   If the animation affects multiple targets, pass them as an array `targetTokens`. Signature: `(source, targetTokens, config = {})`.
        *   Pass configurations as `config`.
    *   **Template Effects:** Template effects only receive two arguments: `(source, config = {})`. Target tokens MUST be extracted via `config.targets?.length ? config.targets : Array.from(game.user.targets)`.
*   **Template Positioning:** If `config.template` exists, you MUST prioritize extracting the position from it (e.g., `config.template._object?.ray?.B`) instead of spawning a `Sequencer.Crosshair`. Refer to `template_template.js`.
*   **Multi-Target Timing:** When iterating over multiple targets with a delay (e.g., waiting 2 seconds before striking each), do NOT chain `.wait()` sequentially on the main sequence. You MUST create a new isolated Sequence for each target (`let targetSeq = new Sequence().wait(1000)`) and add it to the main sequence using `sequence.addSequence(targetSeq)`. This prevents cumulative, compounding delays.
*   **File Relocation:** Move the newly converted file from its input folder (e.g., `new-submissions`) to `src/animation/effects/`.
*   **Module Integration:** Update `src/animation/effects/_effects.js` to import and export the new modular animation.
*   **Variable Renaming:** Rename global variables like `targets` to `target` (for single-target) or `targetTokens` (for multi-target) to fit the modular function signature.
*   **Image Path Conversion:** You MUST wrap EVERY argument passed to `.file(...)` with the `closest(...)` function, regardless of whether it is an image, video, http link, or Sequencer database path. For example, `.file('https://i.imgur.com/image.png')` MUST become `.file(closest('https://i.imgur.com/image.png'))`. Make sure to import `closest` from `../../../lib/filemanager.js` (adjusting the relative path as necessary).
*   **Effect Comments:** Add descriptive comments explaining the visual or functional purpose of each effect or sequence chunk.
*   **Standard Configuration Pattern:**
    *   Every animation MUST have a global `const DEFAULT_CONFIG` object defined at the top level of the file.
    *   If a legacy script has a local `default_config` (inside `create` or `play`), you MUST move it to the global namespace as `DEFAULT_CONFIG`.
    *   This `DEFAULT_CONFIG` MUST be exported as `default_config` in the root export object of every animation module.
    *   **Exclusion**: Index or collection files (typically named `_*.js` or `index.js`) that only group and re-export other animations do NOT need to define or export a `default_config` of their own.
    *   If the export object contains nested API objects (e.g., `cast`, `target`), ensure `default_config` is present in those as well if they utilize it.
    *   Inside `create`, `play`, and `stop`, use `foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false })` for safe configuration management.
    *   Example: `const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });`
*   **Helper Functions:** Extract complex sequences of effects into smaller, logically grouped helper functions (e.g., `_castSpellEffects(sequence, token)`).

## API Updates

Ensure the script uses the latest Foundry VTT API patterns:

*   Replace `target.data.name` with `target.name`.
*   Replace `target.document.data.width` with `target.document.width`.
*   Replace `warpgate.crosshairs.show` with `Sequencer.Crosshair.show`.
*   Change the `t` property in the crosshairs configuration from `'line'` to `'ray'` for valid measured template types.
*   Replace deprecated `.from()` methods with `.copySprite()`.
*   **`scaleToObject` Convention:** Every `.scaleToObject(...)` call MUST include `{ considerTokenScale: true }` as its options argument. When scaling an effect to match the token's natural size, always use `.scaleToObject(1, { considerTokenScale: true })`. Never pass `token.document.texture.scaleX` as the scale value — this is already accounted for by the `considerTokenScale` option. For effects intentionally larger or smaller than the token, use a numeric multiplier (e.g. `.scaleToObject(1.5, { considerTokenScale: true })`).
*   Replace `warpgate.buttonDialog(buttonData)` with `eskie.util.dialog.buttonDialog(buttonData)` (or, inside a module file, import `{ dialog }` from `'../../../lib/dialog.js'` and call `dialog.buttonDialog(buttonData)` directly). The `buttonData` shape is identical — a `buttons` array with `label` and `value` fields, plus an optional `title`. When converting, **replace any numeric `value` fields with descriptive string identifiers** that reflect the semantic meaning of that choice. For example, `{ label: 'Hybrid Form', value: 1 }` should become `{ label: 'Hybrid Form', value: 'hybrid' }`, and `{ label: 'Wolf Form', value: 2 }` should become `{ label: 'Wolf Form', value: 'wolf' }`. Update all downstream comparisons to match the new string values (e.g. `if (result === 'hybrid')`). Since `DialogV2` always returns strings, this also eliminates any type-mismatch issues.

## Bug Fixes

*   Add a validation check to ensure `canvas.scene.background.src` exists before creating effects that rely on it, preventing errors on scenes without background images.

## Attribution

*   **Original Author:** Include a comment at the top of the file crediting the original author of the animation.
*   **Updater:** Add a comment at the top of the file crediting `bakanabaka` as the author of the modular conversion.
