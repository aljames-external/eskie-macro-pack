---
name: module-to-macro
description: Convert a modular animation effect in src/animation/effects/ into a standalone macro for VTT. Make sure to use this skill whenever the user asks to "convert an animation to a macro" or "create a standalone macro from an effect", guiding them to the automated script first.
compatibility: Foundry VTT V11+
---

# Module to Macro Conversion

When asked to convert a modular animation effect from `src/animation/effects/` into a standalone macro for Foundry VTT, always prioritize **automated synchronization** over manual translation.

## Primary Path: Automated Synchronization

Use the automated compilation tool provided in the [macro-sync](file:///usr/local/google/home/aljames/jetski/eskie-macro-pack/.agent/skills/macro-sync/SKILL.md) skill:
```bash
python3 .agent/skills/macro-sync/scripts/sync.py <path/to/module.js> <path/to/standalone-macro.js>
```
*   **Advantage:** This script automatically strips imports, injects safety guards, handles target detection, creates the local `closest` helper, and generates correct play/stop toggle logic, ensuring 100% feature parity without manual errors.

---

## Secondary Path: Manual Conversion

If the automated script fails, or if the user requests custom modifications that the script cannot handle, perform a manual conversion:
1.  Read the step-by-step translation instructions and view the concrete code examples in [references/manual_conversion.md](file:///usr/local/google/home/aljames/jetski/eskie-macro-pack/.agent/skills/module-to-macro/references/manual_conversion.md).
2.  Follow the rules for handling multiple variants, removing imports, and implementing toggle state.
3.  Write the resulting file into `src/standalone-macros/`.

---

## Evals

To verify the reliability of the manual and automated conversion workflows, reference the test cases maintained in `evals/evals.json`.
