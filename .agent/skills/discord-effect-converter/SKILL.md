---
name: discord-effect-converter
description: Instructions for converting legacy Discord animations into the modern modular format in src/animation/effects. Make sure to use this skill whenever you are asked to "update scripts in the new-submissions folder" or convert any Discord animation scripts.
compatibility: Foundry VTT V11+
---

# Discord Animation to Modular Format Conversion

When asked to update scripts in the `new-submissions` folder or to convert Discord animations to the modular format, execute the following transformations. You MUST reference the template files in the `references/` directory to understand the exact target structure:
- For standard or token animations, read `references/template_token.js`. Save to `src/animation/effects/token/` or `on-target/`.
- For active effects, read `references/template_active_effect.js`. Save to `src/animation/effects/active-effect/`.
- For position/crosshair-driven template effects, read `references/template_template.js`. Save to `src/animation/effects/template/`.

## Code Style & Transformations

*   **Style Guide:** Ensure all code adheres strictly to the [style-guide](file:///usr/local/google/home/aljames/jetski/eskie-macro-pack/.agent/skills/style-guide/SKILL.md) skill (4-space indentation, semicolons, single quotes, 1TBS, single-line if-returns).
*   **Modular Structure:** Encapsulate animation logic inside an `export async function create(...)` function returning a `Sequence` object. The final module MUST export an object containing `create`, `play`, and `stop` at its root.
*   **Parameters:**
    *   **Token & Active Effects:** Signature `(source, target, config = {})` or `(source, targetTokens, config = {})`.
    *   **Template Effects:** Signature `(source, config = {})`. Target tokens MUST be extracted via `config.targets?.length ? config.targets : Array.from(game.user.targets)`.
*   **Asset Safety & Image Paths:** Wrap EVERY argument passed to `.file(...)` with the `closest(...)` function imported from `../../../lib/filemanager.js` (e.g., `.file(closest('jb2a.impact.01'))`).
*   **Sound Configuration:** Sound effects MUST be defined in `DEFAULT_CONFIG`, volume scaled by `sound.volume`, and plays protected inside an `if` block (see [references/examples.md#1-sound-configuration-pattern](file:///usr/local/google/home/aljames/jetski/eskie-macro-pack/.agent/skills/discord-effect-converter/references/examples.md#1-sound-configuration-pattern)).
*   **Standard Configuration:** Define a global `DEFAULT_CONFIG` at the top of the file, export it in the root object, and merge it safely using `foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false })` inside `create` / `play`.
*   **Multi-Target Timing:** Do NOT chain `.wait()` sequentially on the main sequence. Instead, create a new isolated Sequence for each target and add it using `sequence.addSequence(targetSeq)`.
*   **Scale and Rotation Conventions:**
    *   **`scaleToObject`:** Every `.scaleToObject(...)` call MUST include `{ considerTokenScale: true }`.
    *   **`copySprite`:** Negate token world rotation using `.spriteRotation(-token.document.rotation)`.
    *   **`buttonDialog`:** Replace deprecated `warpgate.buttonDialog` with `dialog.buttonDialog` (imported from `../../../lib/dialog.js`) and convert numeric `value` fields into descriptive string identifiers.

## Legacy Graphic Cleanups
*   **Modern Replacements:** Replace legacy `animated-spell-effects-cartoon` assets with modern `eskie.` or `jb2a.` prefixes according to the [cartoon-graphic-cleanup](file:///usr/local/google/home/aljames/jetski/eskie-macro-pack/.agent/skills/cartoon-graphic-cleanup/SKILL.md) skill.
*   **Offsets & Deletions:** Apply rotation offsets for orientation corrections and delete entire `.effect()` blocks for removed assets (see [references/examples.md#2-ranged-mind-sliver-conversion-example](file:///usr/local/google/home/aljames/jetski/eskie-macro-pack/.agent/skills/discord-effect-converter/references/examples.md#2-ranged-mind-sliver-conversion-example)).

## Integration & Attribution
*   **Relocation & Registration:** Move the converted file to `src/animation/effects/`, register it in `_effects.js`, and register it with Automated Animations at the bottom of the file (see [auto-animations-diagnoser](file:///usr/local/google/home/aljames/jetski/eskie-macro-pack/.agent/skills/auto-animations-diagnoser/SKILL.md)).
*   **Attribution:** Credit the original author and the conversion author at the top of the file. Add the author to the `README.md` if they are a new contributor.
