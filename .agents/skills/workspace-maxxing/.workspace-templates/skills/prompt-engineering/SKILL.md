---
name: prompt-engineering
description: "Improves CONTEXT.md and SYSTEM.md prompts for better agent behavior. Use when prompts need improvement or after validation identifies content gaps."
triggers: ["improve prompts", "fix content gaps", "optimize prompts", "clarify instructions"]
---

## Overview

Optimize workspace prompts for clarity, completeness, and agent guidance. Prompt engineering resolves content-level quality issues without structural redesign.

## When to Use

- Validation identifies missing or weak content
- Prompts are vague or incomplete
- Agent behavior does not match expectations

## When Not to Use

- For structural issues (use architecture)
- For dependency installation (use tooling)

## The Process

1. **Identify weak prompts** - Read validation findings.
2. **Analyze current prompts** - Identify what is missing, vague, or contradictory.
3. **Apply prompt patterns** - Use clear structure, examples, constraints, and output format guidance.
4. **Update CONTEXT.md files** - Improve stage-specific instructions.
5. **Update SYSTEM.md if needed** - Improve folder map, rules, and tool inventory guidance.
6. **Re-run validation** - Verify improvements did not break compliance.

## Red Flags

- Cosmetic wording changes with no measurable improvement
- Prompt edits made without re-validation
- Content removed without replacement
- No clear improvement in guidance

## Report Format

- Changes made: list the prompt updates
- Findings: note what was missing or unclear
- Done: stop after the prompt edit

## Integration

- Consumes findings from validation.
- Produces clearer prompt content.
