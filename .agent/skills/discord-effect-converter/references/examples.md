# Discord Animation Converter: Code Patterns & Examples

This reference document contains concrete code patterns and examples for converting legacy Discord animations into modern, modular animation files.

---

## 1. Sound Configuration Pattern

If a legacy script contains sound effects, you MUST define a global `sound` object inside `DEFAULT_CONFIG` at the top level of the file and protect all `.sound()` plays.

### Config Definition
```javascript
const DEFAULT_CONFIG = {
    // ... other options
    sound: {
        enabled: true,
        volume: 0.5,
    }
};
```

### Protection & Volume Scaling in `create`
```javascript
// 1. settingsOverride must be called at the start
config = settingsOverride(config);
const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
const { sound } = mConfig;

// 2. Wrap .sound() in an if block and scale volume
if (sound.enabled) {
    sequence.sound()
        .file(closest("path/to/sound.wav"))
        .volume(sound.volume * 0.8); // Relative adjustment
}
```

---

## 2. Ranged Mind Sliver Conversion Example

Demonstrates converting a legacy `animated-spell-effects-cartoon.magic.mind sliver` attack. Note the `-90` rotation offset added to correct the sprite orientation.

### ❌ Legacy Code
```javascript
sequence.effect()
    .file(closest("animated-spell-effects-cartoon.magic.mind sliver"))
    .atLocation(token)
    .stretchTo(target)
```

###  Modular Code
```javascript
import { closest } from "../../../lib/filemanager.js";

sequence.effect()
    .file(closest("eskie.attack.ranged.arrow.01.physical.heavy.purpleblack"))
    .rotate(existingRotation - 90) // Additive -90 rotation delta
    .atLocation(token)
    .stretchTo(target)
```

---

## 3. Removed Effects (No Replacement)

If a legacy effect is flagged as "removed — no replacement" (such as `animated-spell-effects-cartoon.energy.tentacles` in arms-of-hadar), you MUST delete the entire `.effect()` block and its wait/scale chains.

### ❌ Legacy Code (Remove entirely!)
```javascript
sequence.effect()
    .file(closest("animated-spell-effects-cartoon.energy.tentacles"))
    .atLocation(target)
    .moveTowards(...)
    .scaleToObject(1)
    .opacity(0.75)
```
