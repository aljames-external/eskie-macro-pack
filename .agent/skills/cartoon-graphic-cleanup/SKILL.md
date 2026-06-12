---
name: cartoon-graphic-cleanup
description: Replaces legacy `animated-spell-effects-cartoon` graphic assets with modern equivalents. Make sure to use this skill whenever the user asks to clean up, replace, or remove `animated-spell-effects-cartoon` graphics or assets, or when refactoring/updating existing animations that reference these legacy cartoon files.
---

# Cartoon Graphic Cleanup

This skill guides you through replacing legacy `animated-spell-effects-cartoon` (often referred to as JK cartoon) graphic assets in effect and macro definitions with their modern, high-quality equivalents (`eskie.` or `jb2a.` prefixes).

## Asset Mapping Reference

When you encounter any legacy cartoon references in the codebase, replace them according to the following mapping table:

| Legacy Cartoon Asset Path | Modern Replacement Path | Notes / Context |
| :--- | :--- | :--- |
| `animated-spell-effects-cartoon.magic.mind sliver` | `eskie.attack.ranged.arrow.01.physical.[color]` | e.g. `.purple` or `.blue` based on context |
| `animated-spell-effects-cartoon.smoke.97` | `eskie.smoke.05` | General smoke puffs |
| `animated-spell-effects-cartoon.misc.fiery eyes.04` | `jb2a.eyes.01.single.orangeyellow` | Petrifying gaze, fiery eyes |
| `animated-spell-effects-cartoon.energy.pulse.yellow` | `eskie.pulse.energy.01.yellow.yellow` | Energy pulses, divine strike |
| `animated-spell-effects-cartoon.energy.pulse.green` | `eskie.pulse.energy.01.green` | Healing/spore pulses |
| `animated-spell-effects-cartoon.misc.all seeing eye` | `eskie.symbol.eye.01.red` | All-seeing eyes |
| `animated-spell-effects-cartoon.smoke.11` | `jb2a.smoke.puff.centered.grey` | Rock falls, boulders |
| `animated-spell-effects-cartoon.level 01.healing word.[color]` | `eskie.pulse.energy.02.fast.[color]` | Healing word, color is dynamic |

## Code Pattern Guidelines

1. **Always use `closest()`:** When performing replacements, ensure that the final asset path is wrapped in `closest("...")` so it can be dynamically resolved based on the user's active modules.
2. **Import `closest`:** If the file does not already import `closest`, add the import from the file manager:
   ```javascript
   import { closest } from "../../../lib/filemanager.js";
   ```
   *(Ensure the relative path to `filemanager.js` matches the file structure of the target file).*

## Example Transformation

### Before
```javascript
        .effect()
        .file("animated-spell-effects-cartoon.magic.mind sliver")
        .atLocation(token)
```

### After
```javascript
        .effect()
        .file(closest("eskie.attack.ranged.arrow.01.physical.purple"))
        .atLocation(token)
```
