---
name: cartoon-graphic-cleanup
description: Replaces legacy `animated-spell-effects-cartoon` graphic assets with modern equivalents. Make sure to use this skill whenever the user asks to clean up, replace, or remove `animated-spell-effects-cartoon` graphics or assets, or when refactoring/updating existing animations that reference these legacy cartoon files.
---

# Cartoon Graphic Cleanup

This skill guides you through replacing legacy `animated-spell-effects-cartoon` (often referred to as JK cartoon) graphic assets in effect and macro definitions with their modern, high-quality equivalents (`eskie.` or `jb2a.` prefixes).

## Important: `closest()` No Longer Supports JK Paths

As of the cleanup in `c8e6e06`, the `closest()` function in `src/lib/filemanager.js` no longer has a `case` for `animated-spell-effects` or `animated-spell-effects-cartoon`. **These paths will not resolve correctly if passed to `closest()`** — they must be fully replaced with a modern path.

## Asset Mapping Reference

When you encounter any legacy cartoon references in the codebase, replace them according to the following mapping table:

| Legacy Cartoon Asset Path | Modern Replacement Path | Notes / Context |
| :--- | :--- | :--- |
| `animated-spell-effects-cartoon.magic.mind sliver` | `eskie.attack.ranged.arrow.01.physical.heavy.purpleblack` | Default/Necrotic mind sliver; will need an additional -90° added to the existing `.rotate()` value to match original orientation |
| `animated-spell-effects-cartoon.magic.mind sliver` | `eskie.attack.ranged.arrow.01.physical.heavy.redblack` | Fire/red variant |
| `animated-spell-effects-cartoon.magic.mind sliver` | `eskie.attack.ranged.arrow.01.physical.medium.purple` | Medium purple variant |
| `animated-spell-effects-cartoon.magic.mind sliver` | `eskie.attack.ranged.arrow.01.physical.medium.green` | Green/poison variant |
| `modules/animated-spell-effects-cartoon/spell-effects/cartoon/magic/mind_sliver_LINE.webm` | `eskie.attack.ranged.arrow.01.physical.heavy.red.normal` | Hard-coded file path variant of mind sliver |
| `animated-spell-effects-cartoon.smoke.97` | `eskie.smoke.05.black` | Dark/necrotic smoke; also seen as `eskie.smoke.05.tan` (context-dependent) |
| `animated-spell-effects-cartoon.smoke.97` | `eskie.smoke.05.purple` | Purple/necrotic smoke (poison, dark magic) |
| `animated-spell-effects-cartoon.smoke.99` | `eskie.smoke.01.white` | May need an additional -180° added to the existing `.spriteRotation()` value to match original orientation |
| `animated-spell-effects-cartoon.smoke.99` | `jb2a.smoke.puff.ring.01.white` | Ring puff variant |
| `animated-spell-effects-cartoon.smoke.53` | `eskie.smoke.01.white` | Needs two effects: one normal + one with `.mirrorX()` to replicate bilateral smoke |
| `animated-spell-effects-cartoon.smoke.47` | `jb2a.smoke.puff.side.grey` | Side smoke puff |
| `animated-spell-effects-cartoon.smoke.43` | `eskie.smoke.03.white` | Billowing smoke |
| `animated-spell-effects-cartoon.smoke.17` | *(kept as-is in `elementalBlast/electricity.js`)* | Not yet replaced — leave alone unless a clear equivalent is identified |
| `animated-spell-effects-cartoon.misc.fiery eyes.04` | `jb2a.eyes.01.single.orangeyellow` | Petrifying gaze, fiery eyes |
| `animated-spell-effects-cartoon.misc.fiery eyes.04` | `jb2a.eyes.01.single.orangered` | Orange-red eyes variant |
| `animated-spell-effects-cartoon.misc.all seeing eye` | `eskie.symbol.eye.01.red` | Alarm / all-seeing eye (red context) |
| `animated-spell-effects-cartoon.misc.all seeing eye` | `eskie.symbol.eye.01.purple` | Alarm / all-seeing eye (purple context) |
| `animated-spell-effects-cartoon.misc.demon` | `eskie.emote.confused` | Demon emote replacement |
| `animated-spell-effects-cartoon.energy.pulse.yellow` | `eskie.pulse.energy.01.yellow.yellow` | Energy pulses, divine strike |
| `animated-spell-effects-cartoon.energy.pulse.green` | `eskie.pulse.energy.01.green` | Healing/spore pulses |
| `animated-spell-effects-cartoon.energy.pulse.${pulseColor}` | `eskie.pulse.energy.01.yellow.${pulseColor}` | Dynamic color pulses; keep template literal |
| `animated-spell-effects-cartoon.level 01.healing word.${color}` | `eskie.pulse.energy.02.fast.${color}` | Healing word; keep template literal for dynamic color |
| `animated-spell-effects-cartoon.level 01.bless.blue` | `eskie.star.02.blue` | Bless effect |
| `animated-spell-effects-cartoon.air.portal` | `eskie.smoke.07.white` | Portal puff/teleport smoke |
| `animated-spell-effects-cartoon.air.puff.01` | `eskie.smoke.06.white` | Small air puff (landing, small impacts) |
| `animated-spell-effects-cartoon.air.puff.03` | `eskie.smoke.06.white` | Air puff variant (leap, jump) |
| `animated-spell-effects-cartoon.electricity.04` | `eskie.lightning.lightning_bolt.blue` | Lightning bolt; will need an additional -90° added to the existing `.rotate()` value to match original orientation |
| `animated-spell-effects-cartoon.electricity.35` | `eskie.damage.electricity.01.blue` | Electric damage |
| `animated-spell-effects-cartoon.electricity.ball.06` | `eskie.damage.electricity.01.purple` | Purple electric ball |
| `animated-spell-effects-cartoon.electricity.blast.03` | `eskie.lightning.lightning_bolt.blue` | Lightning bolt blast (stretch-to) |
| `animated-spell-effects-cartoon.electricity.discharge.06` | `eskie.damage.electricity.01.purple` | Electric discharge |
| `animated-spell-effects-cartoon.mix.electric ball.01` | `eskie.damage.electricity.01.blue` | Electric ball (mixed) |
| `animated-spell-effects-cartoon.water.63` | `jb2a.impact.water` | Water impact |
| `animated-spell-effects-cartoon.water.117` | `blfx.spell.template.circle.wave2.blood1.splatter.red` | Blood/water splatter circle (animate dead context) |
| `animated-spell-effects-cartoon.fire.03` | `blfx.spell.cast.swirl1.fire1.orange` | Fire swirl cast |
| `animated-spell-effects-cartoon.fire.explosion.01` | `jb2a.explosion.01.orange` | Fire explosion |
| `animated-spell-effects-cartoon.flash.25` | `jb2a.fairies.loop.01.greenyellow` | Flash/glitter (faerie fire context) |
| `animated-spell-effects-cartoon.earth.explosion.02` | `jb2a.impact.earth.01.browngreen` | Earth explosion / un-petrify |
| `animated-spell-effects-cartoon.earth.debris.04` | *(removed — no replacement)* | Debris effect was removed entirely from hit-the-dirt |
| `animated-spell-effects-cartoon.energy.tentacles` | *(removed — no replacement)* | Tentacle effect was removed entirely from arms-of-hadar |
| `animated-spell-effects-cartoon.cantrips.mending.yellow` | *(removed — no replacement)* | Mending/stun visual was removed from stunning-strike |
| `animated-spell-effects-cartoon.simple.27` | `jb2a.smoke.puff.centered.grey` | Simple smoke puff |

## Code Pattern Guidelines

1. **Always use `closest()`:** When performing replacements, ensure that the final asset path is wrapped in `closest("...")` so it can be dynamically resolved based on the user's active modules.
2. **Import `closest`:** If the file does not already import `closest`, add the import from the file manager:
   ```javascript
   import { closest } from "../../../lib/filemanager.js";
   ```
   *(Ensure the relative path to `filemanager.js` matches the file structure of the target file).*
3. **Some assets are removed entirely:** If the legacy asset is listed as "removed — no replacement" above, delete the entire `.effect()` block (and its associated `.wait()` if applicable) rather than substituting a new file.
4. **Rotation adjustments:** Some replacements require a `.rotate()` or `.spriteRotation()` tweak because the new asset has a different default orientation than the original cartoon asset. When a rotation offset is noted, apply it as an **additive delta to whatever rotation value is already present** — do not replace the existing rotation, add to it (e.g. if the effect already has `.rotate(angleDeg)`, change it to `.rotate(angleDeg - 90)`).
5. **Mirrored smoke:** `smoke.53` required two separate effects — one normal and one with `.mirrorX()` — to reproduce the original bilateral appearance. Apply this pattern for wide/symmetric smoke.

## Example Transformation

### Before
```javascript
        .effect()
        .file(closest("animated-spell-effects-cartoon.magic.mind sliver"))
        .atLocation(token)
```

### After
```javascript
        .effect()
        .file(closest("eskie.attack.ranged.arrow.01.physical.heavy.purpleblack"))
        .rotate(existingRotation - 90)  // -90 added relative to existing rotation
        .atLocation(token)
```

### Removed Effect (no replacement)
```javascript
        // BEFORE: remove this entire block
        .effect()
        .file(closest("animated-spell-effects-cartoon.energy.tentacles"))
        .atLocation(target)
        .moveTowards(...)
        .scaleToObject(1)
        .filter("ColorMatrix", { hue: -100, brightness: 0 })
        .opacity(0.75)
```
