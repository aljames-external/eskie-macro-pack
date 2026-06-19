---
name: style-guide
description: Coding style guidelines and conventions for the eskie-macro-pack project. Make sure to use this skill whenever you write, edit, or refactor ANY code in this repository, to ensure consistency with the project's formatting and patterns.
---

# Eskie Macro Pack Style Guide

When writing or modifying code in the `eskie-macro-pack` repository, adhere strictly to the following style guidelines.

## General Formatting

*   **Indentation:** Use exactly 4 spaces for indentation. Never use tabs.
*   **Semicolons:** Always terminate statements with a semicolon (`;`).
*   **Quotes:** Use single quotes (`'`) for standard strings. Use backticks (`` ` ``) for template literals/interpolation. Avoid double quotes (`"`) unless escaping single quotes is necessary.
*   **Brace Style:** Use the One True Brace Style (1TBS). The opening brace must be on the same line as the statement:
    ```javascript
    function example() {
        // ...
    }
    ```

## Naming Conventions

*   **Variables and Functions:** Use `camelCase`.
*   **Constants:** Use `UPPER_SNAKE_CASE` (e.g., `MODULE_ID`).
*   **Object Properties:** Use `camelCase`.

## Modules and Structure

*   **Module System:** Use ES6 module syntax (`import` and `export`).
*   **Exports:** Prefer named exports over default exports.
*   **Function Declarations in Exports:** Do **not** declare functions inline inside an exported variable. Declare the function separately first, then export it.
    ```javascript
    // Incorrect: function declared inside the export variable
    export const actions = {
        doSomething: function() {
            // ...
        },
    };

    // Correct: function declared outside, then referenced
    function doSomething() {
        // ...
    }

    export const actions = {
        doSomething,
    };
    ```

## Control Structures

*   **If-Return Statements:** Keep an `if` statement concise if it immediately returns or executes a single action. *Note: Per user global rules, if adding or changing an if statement that immediately returns, write it as a single line.*
    ```javascript
    // Required pattern for immediate returns
    if (condition) return true;
    ```

## Logging

*   **Prefixes:** Always prefix console logs, warnings, and errors with `'EMP | '`. This makes it easy to identify module logs in the console.
    ```javascript
    console.log('EMP | Eskie Macro Pack module ready');
    console.warn('EMP | Filemanager closest path diverged');
    ```

## Foundry VTT Specifics

*   **Hooks:** Use `Hooks.once` or `Hooks.on` for all Foundry VTT lifecycle events.
*   **Settings and Localization:** Use `game.settings.register` and `game.i18n.localize` for module settings and text definitions.
*   **Flag Scope:** Always import `MODULE_ID` from constants (e.g., `import { MODULE_ID } from '../../lib/constants.js';` or relative path) and use it when getting or setting document flags (e.g., `tile.document.getFlag(MODULE_ID, ...)`). Do NOT hardcode the module ID or folder name strings (such as `'eskie-macro-pack'`) because the active module scope key is `'eskie-macros'`.

## Sequencer Specifics

*   **Optional Asset Libraries:** Optional asset libraries (like `psfx` or similar config parameters) that use `closest()` MUST be protected inside an `if` statement rather than using `.playIf(...)`. If `closest()` is called on an asset that doesn't exist, it throws an error immediately, breaking the script before the `playIf` check even occurs.
    ```javascript
    // Incorrect: closest() throws if asset is missing, before playIf evaluates
    sequence.sound()
        .file(closest(sound.file))
        .playIf(sound.enabled);

    // Correct: closest() is never evaluated if sound is disabled
    if (sound.enabled) {
        sequence.sound()
            .file(closest(sound.file));
    }
    ```

*   **copySprite Rotation Fix:** Every `.copySprite(token)` effect MUST include `.spriteRotation(-token.document.rotation)` immediately after to counteract the token's world rotation. Without this, the sprite renders in a rotated orientation that does not match the token's visual appearance.
    ```javascript
    // Incorrect: sprite may appear rotated if the token has a non-zero rotation
    sequence.effect()
        .copySprite(token)
        .attachTo(token);

    // Correct: always negate the token's rotation on copySprite effects
    sequence.effect()
        .copySprite(token)
        .attachTo(token)
        .spriteRotation(-token.document.rotation);
    ```

## Automated Linting

*   **Linter Script:** Before finalizing your code changes, you MUST run the provided linter script on any JavaScript files you modified to automatically check for style guide adherence.
    ```bash
    python .agent/skills/style-guide/scripts/lint.py <path/to/file.js>
    ```
*   **Automated Checks Performed:** The script automatically validates:
    1.  **Tabs:** Ensures only spaces are used for indentation.
    2.  **Console Logging:** Verifies all `console.log/warn/error/info` statements are prefixed with `'EMP | '`.
    3.  **copySprite Rotation Fix:** Ensures all `.copySprite(token)` calls have a matching `.spriteRotation(-token.document.rotation)` chained in the statement to correct world rotation issues.
    4.  **scaleToObject Scaling:** Ensures all `.scaleToObject(...)` calls specify the `{ considerTokenScale: true }` option.
    5.  **Sound Safety:** Warns if `.sound()` plays an asset wrapped in `closest(...)` but is not enclosed inside an `if (sound.enabled)` safety check (which would crash if files are missing).
    6.  **Settings Override:** Verifies all `create` and `play` functions call `config = settingsOverride(config);` at their beginning to respect user settings.
    7.  **Deprecated VTT APIs:** Detects and flags deprecated VTT properties (like `.data.name`, `.document.data.width`, `warpgate.crosshairs.show`, `warpgate.buttonDialog`, or hardcoded `'eskie-macro-pack'` string in flags).

If the linter reports any errors, you MUST fix them before completing the task.

