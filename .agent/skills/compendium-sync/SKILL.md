---
name: compendium-sync
description: Synchronize (pack/unpack) Foundry VTT compendium packs between Git-friendly JSON files and VTT binary LevelDB format. Make sure to use this skill whenever you are asked to "pack", "unpack", "extract", "compile", "sync" compendiums or macros, or before you commit changes that modify macros in VTT.
compatibility: Foundry VTT V11+, Node.js
---

# Compendium Sync Skill

This skill guides the agent in packing and unpacking Foundry VTT compendium databases (`packs/eskie-aa-integration`) using the official `@foundryvtt/foundryvtt-cli`. 

LevelDB is a binary format that is hostile to Git version control. To prevent massive binary diffs and merge conflicts, macros should be **unpacked** into flat JSON files for Git tracking and **packed** back into LevelDB for VTT execution.

## Commands

All operations are managed by the parameterized script `sync.py`.

### 1. Unpack (Extract from VTT to Git)
Extracts the binary LevelDB database into individual, human-readable JSON files.
```bash
python3 .agent/skills/compendium-sync/scripts/sync.py unpack
```
*   **When to run:** 
    *   After you or the user edits macros inside Foundry VTT and saves them.
    *   **CRITICAL:** Always run this BEFORE staging or committing any changes.

### 2. Pack (Compile from Git to VTT)
Compiles the individual Git JSON files back into the binary LevelDB files.
```bash
python3 .agent/skills/compendium-sync/scripts/sync.py pack
```
*   **When to run:**
    *   After pulling down new macro changes from Git.
    *   Before launching Foundry VTT to test or run the module locally.

---

## Git Workflow for Compendiums

When working with compendiums, adhere strictly to this workflow:

1.  **Before making changes:** Ensure your local workspace is clean.
2.  **Edit macros:** The user or developer edits macros in the VTT editor.
3.  **Unpack:** Run the `unpack` command to generate/update the JSON files.
4.  **Stage JSONs:** Add the JSON files (usually located in `packs/eskie-aa-integration/_source/` or similar nested folders) to Git:
    ```bash
    git add packs/eskie-aa-integration/_source/
    ```
5.  **Commit:** Commit the clean text diffs following the [git-commit](file:///usr/local/google/home/aljames/jetski/eskie-macro-pack/.agent/skills/git-commit/SKILL.md) guidelines.

---

## Troubleshooting

### "Error: Node.js (and 'npx') must be installed"
If the sync script reports that Node.js is missing:
1.  **Stop work.**
2.  Explain to the user that Node.js is required to run the Foundry VTT CLI.
3.  Ask them to install Node.js (v18+) and npm on their host system.
4.  Once they confirm installation, re-run the sync command.
