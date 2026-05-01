---
name: skill-creation-improver
description: A skill used to prompt for and suggest robust improvements when creating or updating other agent skills. Make sure to use this skill whenever you are helping the user create a new skill or use the skill-creator, to ensure the new skill adheres to the highest standards of reliability.
---

# Skill Creation Improver

When you are asked to create a new skill, or when you are actively using the `skill-creator`, you should strongly recommend the following structural improvements to ensure the resulting skill is robust, testable, and reliable. 

If the user asks you to create a skill, proactively ask if they would like you to implement these best practices along with it.

## 1. Concrete Examples (Before & After)
Abstract instructions are often misinterpreted. Strongly suggest adding concrete examples. 
- If the skill modifies code or data, recommend adding a "Before" and "After" example to the `SKILL.md`.

## 2. Quantitative Evaluation Suites
All robust skills should be testable.
- Suggest creating an `evals/evals.json` file containing 2-3 realistic test prompts.
- This allows the `skill-creator` to run automated benchmarks to verify the skill's success rate and catch edge-cases.

## 3. Deterministic Helper Scripts
Don't make the LLM do things that code can do perfectly.
- If the skill involves repetitive formatting, API string replacements, or strict rule verification, suggest writing a small Python helper script in a `scripts/` directory (e.g., `scripts/lint.py` or `scripts/pre_convert.py`).
- Instruct the skill to run the helper script as part of its workflow.

## 4. Progressive Disclosure (Reference Files)
Don't overcrowd the main `SKILL.md` (keep it under 500 lines).
- If the skill requires large templates, long reference documents, or extensive code examples, suggest placing them in a `references/` directory (e.g., `references/template.js`).
- Update the main `SKILL.md` to explicitly instruct the agent to read those specific reference files when needed.

## 5. "Pushy" Descriptions
The `description` field in the YAML frontmatter is the primary trigger.
- Ensure the description explicitly states exactly *when* the agent should trigger it, using imperative language (e.g., *"Make sure to use this skill whenever..."*).
- Do not just describe what the skill does; describe the context in which it is useful.

## 6. Context Archiving
The user prompt or event that triggered the creation or modification of a skill should be saved in a `CONTEXT.md` file in the same directory as the `SKILL.md` file. This will allow for auditability, traceability, and a way to reproduce the skill's recreation or modification at a later date with high fidelity when the underlying model or context window changes.
- Denote new events with a heading like `## [YYYY-MM-DD HH:MM:SS] - Skill Creation`
- Add the content of the user's prompt or event to the `CONTEXT.md` file
- Add any independent reasoning or internal logic that informed the final implementation to the `CONTEXT.md` file if not directly inferable from the user's prompt or event.
- [IMPORTANT] Do not delete old context when adding new context.