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

## Automated Linting

*   **Linter Script:** Before finalizing your code changes, you MUST run the provided linter script on any JavaScript files you modified to automatically check for tabs and logging prefix violations.
    ```bash
    python .agent/skills/style-guide/scripts/lint.py <path/to/file.js>
    ```
    If the linter reports any errors, fix them before completing the task.
