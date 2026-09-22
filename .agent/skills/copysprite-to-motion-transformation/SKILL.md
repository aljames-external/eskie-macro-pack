---
name: copysprite-to-motion-transformation
description: Official rules and architectural contracts for transforming legacy Sequencer `.copySprite()` token movement animations into modern Sequencer 4.3.0+ `.motion()` animations.
---

# CopySprite to Motion Transformation Rules (Sequencer 4.3.0+)

Starting with **Sequencer 4.3.0+**, token movement, trajectory jumps, dives, recoil, knockback, and pushback animations should utilize native `.motion()` on `sequence.motion(token)` (or `sequence.animation().on(token)`) rather than hiding the token (`opacity(0)`) and animating a temporary `.copySprite(token)` clone effect.

## Official Sequencer 4.3.0 Motion API Methods

The `.motion()` section visually animates a Token, Tile, or Drawing sprite without modifying the underlying document coordinates until updated:

* **`.moveTo(destination, { ignoreMotion, attachTo })`**: Move sprite to a destination position or placeable. Target placeable follows visible position unless `ignoreMotion: true`.
* **`.moveBy(offset | target, { attachTo })`**: Relative displacement offset by fixed coordinates or towards/away from a target (ideal for knockback, recoil, pushback, and grapple).
* **`.rotateTo(angle)` / `.rotateBy(amount)`**: Rotates the sprite to an absolute angle or relative spin.
* **`.scaleTo(scale)` / `.scaleBy(amount)`**: Scales sprite uniformly or per axis.
* **`.fadeTo(opacity)` / `.fadeBy(amount)`**: Fades opacity.
* **`.tintTo(color)`**: Temporary color tinting.
* **`.noise()` / `.oscillate()`**: Additive random shake/jitter or periodic wave movement.
* **`.persist()`**: Holds motion until `Sequencer.MotionManager.endMotion(token)`.
* **`.persistUntilUpdate()`**: Holds visual displacement until token document is updated, then ends motion seamlessly without visual snapping.

## Transformation Rules

### Rule 1: Eliminate Token Hiding & Manual Teleport Bookends
* **Legacy Pattern**:
  ```javascript
  sequence.animation().on(token).opacity(0);
  // ... copySprite effect ...
  sequence.animation().on(token).teleportTo(targetPos).rotate(finalRotation).opacity(1);
  ```
* **Modern Pattern**:
  Remove the initial `.opacity(0)` token hiding step and trailing `.teleportTo(...)` / `.opacity(1)` bookends. `.motion()` handles visual sprite trajectory directly, and `.persistUntilUpdate()` or native movement updates position seamlessly.

### Rule 2: Convert `.copySprite()` Flight/Jump Trajectories to `.motion()`
* **Legacy Pattern**:
  ```javascript
  sequence.effect()
      .copySprite(token)
      .atLocation(token)
      .moveTowards(position, { delay: 100, rotate: false })
      .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.8, duration: 550, delay: 100, gridUnits: true })
      .animateProperty('sprite', 'rotation', { from: 0, to: 90, duration: 500, delay: 100 });
  ```
* **Modern Pattern**:
  ```javascript
  sequence.motion(token)
      .moveTo(position, { delay: 100 })
      .rotateTo(90, { duration: 500, delay: 100 });
  ```

### Rule 3: Use `ignoreMotion: true` for Ground Shadows & Anchored Cues
* In Sequencer 4.3.0+, `.effect()` and `.sound()` attached or aimed at a placeable (`.atLocation()`, `.attachTo()`, `.stretchTo()`, `.rotateTowards()`) **automatically follow its visible position** as it moves via `.motion()`.
* **Ground Shadow Rule**: When placing a shadow or ground decal beneath a flying or leaping token during `.motion()`, pass `{ ignoreMotion: true }` so the shadow stays anchored on the ground at the document position:
  ```javascript
  sequence.effect()
      .file(closest("eskie.smoke.shadow"))
      .atLocation(token, { ignoreMotion: true })
      .belowTokens();
  ```

### Rule 4: Attack Recoil, Knockback & Pushback via `.moveBy()`
* **Legacy Pattern**: Spawning a temporary `.copySprite(token)` clone shifting backward.
* **Modern Pattern**: Use `.moveBy()` for clean recoil/knockback:
  ```javascript
  sequence.motion(token)
      .moveBy({ x: -0.3, y: 0 }, { duration: 250 });
  ```

### Rule 5: Crosshair Collection Options (`{ ignoreMotion: true }`)
* Use standard options object for crosshair target collection:
  ```javascript
  Sequencer.Crosshair.collect(crosshair, { types: ["Token"], ignoreMotion: false });
  ```

### Rule 6: Module Requirement Contract
* Always update `module.json` to enforce `"sequencer": { "compatibility": { "minimum": "4.3.0" } }`.
