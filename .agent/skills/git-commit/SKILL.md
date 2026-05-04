---
name: git-commit
description: Automates the creation of standardized git commits following the repository's convention. Use this skill whenever you need to commit changes to the repository, ensuring the commit message is well-formatted and focused.
---

# Git Commit Skill

This skill ensures that all git commits in the `eskie-macro-pack` repository are standardized, focused, and descriptive.

## Commit Strategy

All commit messages must follow the format: `<type>: <Description>`

### Types
- **feat**: New features, animations, or integrations (e.g., `feat: Add Chromatic Orb effect`).
- **fix** or **bugfix**: Correcting unintended behavior or errors (e.g., `fix: Resolve token scaling issue`).
- **cleanup**: Refactoring, style adjustments, documentation updates, or non-functional improvements (e.g., `cleanup: Align with style guide`).
- **skill**: Changes related to agent skills in `.agent/skills/` (e.g., `skill: Add git-commit skill`).

### Rules
1.  **Single Focus**: Each commit should fit into exactly one of these categories. Avoid bundling unrelated changes across categories in a single commit.
2.  **Skill Exception**: When creating a new skill or applying it for the first time, the `skill` category may cover both the creation of the skill and its initial application to the codebase in a single commit.
3.  **Description**:
    - Start with an uppercase letter.
    - Be concise but descriptive.
    - Do not end with a period.
4.  **Staging**: If no files are staged, identify the relevant files for the current task and stage them before committing.

## Workflow

1.  **Status Check**: Run `git status` to see what changes exist.
2.  **Identify Changes**: Determine which files are relevant to the completed task.
3.  **Stage Files**: Use `git add <files>` to stage the relevant changes. Avoid staging unrelated files.
4.  **Determine Type**: Analyze the changes to pick the single most appropriate type (`feat`, `fix`, `cleanup`, `skill`).
5.  **Generate Message**: Create the commit message following the `<type>: <Description>` format.
6.  **Commit**: Execute `git commit -m "<message>"`.

## Examples

| Scenario | Commit Message |
| :--- | :--- |
| New animation added | `feat: Add Chromatic Orb effect` |
| Bug with token scaling | `fix: Correct token scaling for mask effects` |
| Style guide alignment | `cleanup: Align fire effects with 1TBS style` |
| New skill created | `skill: Add git-commit skill` |
