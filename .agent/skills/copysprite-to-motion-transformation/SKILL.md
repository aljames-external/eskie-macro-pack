---
name: copysprite-to-motion-transformation
description: Rules and architectural contracts for transforming legacy Sequencer `.copySprite()` token movement animations into modern Sequencer 4.3.0+ `.motion()` animations.
---

# CopySprite to Motion Transformation Rules (Sequencer 4.3.0+)

Starting with **Sequencer 4.3.0+**, token movement, trajectory jumps, dives, recoil, and pushback animations should utilize native `.motion()` on `.animation().on(token)` rather than hiding the token (`opacity(0)`) and animating a temporary `.copySprite(token)` clone effect.

## Architectural Comparison

| Feature | Legacy `.copySprite()` Pattern | Modern `.motion()` Pattern (Sequencer 4.3.0+) |
| :--- | :--- | :--- |
| **Token Visibility** | Token must be hidden (`opacity(0)`) during motion | Token remains visible natively; zero opacity flickering |
| **Visual Source** | Temporary `.effect().copySprite(token)` clone | Native placeable token animated directly on canvas |
| **Trajectory & Arcs** | Complex `.animateProperty('spriteContainer', 'position.y', ...)` | Declarative `.motion({ arc, rotation, ease, speed })` |
| **Document Position** | Requires trailing `.teleportTo(...)` to snap token document | Native movement updates document coordinates seamlessly |
| **Canvas Integration** | Fog of war, elevation, dynamic light & vision lag behind | Dynamic vision, fog of war, attachments & lights update in real-time |
| **Interruption Safety** | Cancelled sequences risk leaving token hidden (`opacity = 0`) | Cancellation cleanly restores token without opacity or rotation corruption |

## Transformation Rules

### Rule 1: Eliminate Token Hiding and Teleport Bookends
* **Legacy Pattern**:
  ```javascript
  sequence.animation().on(token).opacity(0);
  // ... copySprite effect ...
  sequence.animation().on(token).teleportTo(targetPos).rotate(finalRotation).opacity(1);
  ```
* **Modern Pattern**:
  Remove the initial `.opacity(0)` token hiding step and the trailing `.teleportTo(...)` / `.opacity(1)` step. The `.motion()` section handles token translation and final positioning directly.

### Rule 2: Convert `.copySprite()` Effect Movement to `.animation().on(token).motion()`
* **Legacy Pattern**:
  ```javascript
  sequence.effect()
      .copySprite(token)
      .spriteRotation(-tokenRotation)
      .atLocation(token)
      .scaleToObject(1, { considerTokenScale: true })
      .moveTowards(position, { delay: 100, rotate: false, ease: "easeOutQuint" })
      .duration(1300)
      .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.8, duration: 550, delay: 100, gridUnits: true, ease: "easeOutQuint" })
      .animateProperty('spriteContainer', 'position.y', { from: 0, to: 0.8, duration: 550, delay: 650, gridUnits: true, ease: "easeOutQuad" })
      .animateProperty('sprite', 'rotation', { from: 0, to: 90, duration: 500, delay: 100, ease: "easeOutCubic" });
  ```
* **Modern Pattern**:
  ```javascript
  sequence.animation()
      .on(token)
      .moveTowards(position, { delay: 100, rotate: false, ease: "easeOutQuint" })
      .motion({
          arc: 0.8,
          rotation: 90,
          duration: 1300,
          ease: "easeOutQuint"
      });
  ```

### Rule 3: Recoil & Impulse Motion for Attacks
* **Legacy Pattern**:
  Spawning a `.copySprite(token)` clone that shifts backwards to simulate gun recoil or blast pushback.
* **Modern Pattern**:
  Use `.motion({ recoil: 0.3, duration: 300 })` or `.motion({ impulse: -0.4 })` directly on `sequence.animation().on(token)`.

### Rule 4: Preserving Motion Shadows & Ghosting Afterimages
* **CopySprite Scope**: If an animation intentionally spawns a translucent shadow/afterimage behind the token (e.g. motion shadow with `saturate: -1, brightness: 0`), keep `.effect().copySprite(token)` **strictly** for the visual shadow overlay, but do NOT hide the main token.
* The main token itself moves natively via `.animation().on(token).moveTowards(...).motion(...)`.

### Rule 5: Module Requirement Contract
* Always update `module.json` to enforce `"sequencer": { "compatibility": { "minimum": "4.3.0" } }`.
