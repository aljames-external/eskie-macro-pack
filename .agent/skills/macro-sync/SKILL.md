---
name: macro-sync
description: Synchronize and automatically compile modular effects from src/animation/effects/ into standalone, copy-pasteable macros in src/standalone-macros/. Make sure to use this skill whenever you add, modify, or refactor any animation effects, to ensure the standalone versions are always in perfect sync.
compatibility: Foundry VTT V11+, Python 3
---

# Standalone Macro Auto-Sync Skill

This skill guides the agent in automatically compiling modular, ES6-based animation effects from `src/animation/effects/` into self-contained, copy-pasteable VTT macros inside `src/standalone-macros/`.

This ensures that the standalone macros distributed to users never drift or become out of date when core module animations are updated.

## Script Usage

The synchronization and compilation are handled by the custom python script `sync.py`.

### Compile a Specific Module
To automatically compile and synchronize a modular effect into a standalone macro, run:
```bash
python3 .agent/skills/macro-sync/scripts/sync.py <path/to/module.js> <path/to/standalone-macro.js>
```

### Examples:
*   **Speak with Dead:**
    ```bash
    python3 .agent/skills/macro-sync/scripts/sync.py src/animation/effects/active-effect/speakWithDead.js src/standalone-macros/speak-with-dead.js
    ```
*   **Hacking:**
    ```bash
    python3 .agent/skills/macro-sync/scripts/sync.py src/animation/effects/token/hacking.js src/standalone-macros/hacking.js
    ```

---

## Under the Hood: Automated Compilation

The `sync.py` script automatically performs the following transformations to make the modular code VTT-compatible:

1.  **Strip ES6 imports/exports:** Removes ES6 `import` statements and root `export` objects that VTT macros do not support natively.
2.  **Closest helper injection:** Injects a local, safe `closest(...)` helper function at the top of the macro. This resolves premium/free asset paths if the Eskie module is active, but falls back gracefully to default paths if run as a standalone copy-paste macro.
3.  **Variable setup:** Automatically prepends VTT-specific variable setups:
    *   `const token = canvas.tokens.controlled[0];` with warning checks.
    *   `const target = game.user.targets.first();` (if the original module takes a target argument).
4.  **Configuration extraction:** Extracts `DEFAULT_CONFIG` from the module and defines it as a local `config` object in the macro.
5.  **Toggle logic generation:**
    *   If the effect is persistent (contains `.persist()`), the script wraps the play sequence inside an `isPlaying` toggle check using `Sequencer.EffectManager.getEffects(...)` and `endEffects(...)` to allow the macro to turn the effect on/off.
    *   If it is a one-shot animation, it plays the sequence directly.
6.  **Helper function preservation:** Automatically extracts any internal helper functions (e.g., functions starting with `_`) and appends them to the bottom of the macro.

---

## Workflow

Whenever you modify or create an animation effect:
1.  Verify the effect works and conforms to the style guide using the linter.
2.  Check if a standalone version of the macro exists in `src/standalone-macros/`.
3.  Run the `sync.py` script to compile the new changes into the standalone macro.
4.  Run the style guide linter on the generated macro to ensure no formatting rules were violated:
    ```bash
    python3 .agent/skills/style-guide/scripts/lint.py src/standalone-macros/<macro-file>.js
    ```
5.  Stage and commit both the modular effect file and the synchronized standalone file.
