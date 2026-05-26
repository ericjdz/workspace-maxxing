---
name: validation
description: "Checks workspace ICM compliance. Use when validating a workspace or checking compliance."
triggers: ["validate workspace", "check compliance", "run validation"]
---

## Overview

Ensure workspace meets ICM standards through structural validation.

## When to Use

- After workspace scaffolding
- After any structural change
- Before claiming delivery

## When Not to Use

- Generating outputs
- Fixing failures
- Researching patterns

## The Process

1. Check required workspace files and folders exist.
2. Verify required sections are present in `SYSTEM.md` and `CONTEXT.md`.
3. Confirm stage folders and routing files match the workspace structure.
4. Report pass or fail with the missing or mismatched items.

## Red Flags

- Missing required files
- Missing required sections
- Unexpected workspace structure
- Reporting pass without checking the files

## Report Format

- Status: pass or fail
- Findings: list missing files, sections, or structure issues
- Done: stop after reporting results

## Integration

- Consumes workspace files directly.
- Produces a simple compliance result.
