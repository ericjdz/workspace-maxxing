---
name: testing
description: "Generates and runs test cases, evaluates results, and identifies gaps. Use when testing workspace quality, generating test cases, or after prompt improvements."
triggers: ["generate test cases", "run tests", "test workspace", "evaluate quality"]
---

## Overview

Verify workspace quality through systematic testing. Testing confirms outputs across sample, edge-case, and empty-input scenarios.

## When to Use

- After prompt-engineering improvements
- When no tests exist for the workspace
- Before claiming delivery

## When Not to Use

- Before workspace build is complete (run scaffold.ts first)
- For structural validation (use validation sub-skill)
- When applying direct fixes to failures

## The Process

1. **Generate test cases** - Run `node scripts/generate-tests.ts --workspace <path> --output ./tests.json`.
2. **Read test cases** - Parse generated test cases and expected outcomes.
3. **Run generation tests** - Produce sample content each stage should output.
4. **Run evaluation tests** - Review CONTEXT.md files against expected behavior.
5. **Aggregate results** - Identify recurring patterns and quality gaps.
6. **Document findings** - Create a pass/fail report per test case.

## Red Flags

- Test generation is skipped
- Generation tests run without evaluation tests
- Failed test cases are ignored
- Failure patterns are undocumented

## Report Format

- Status: pass, fail, or escalated
- Findings: list what passed, what failed, and any gaps
- Recommendations: suggest next actions without routing

## Integration

- Uses generate-tests.ts output as primary test input.
- Supplies pass/fail evidence for follow-up work.
