# workspace-maxxing

<p align="center">
  <a href="https://www.npmjs.com/package/workspace-maxxing">
    <img src="https://img.shields.io/npm/v/workspace-maxxing?style=flat&color=blue" alt="npm version">
  </a>
  <a href="https://github.com/ericjdz/workflow-maxxing/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/workspace-maxxing?style=flat&color=green" alt="MIT License">
  </a>
  <a href="https://github.com/ericjdz/workflow-maxxing">
    <img src="https://img.shields.io/github/stars/ericjdz/workflow-maxxing?style=flat" alt="GitHub stars">
  </a>
</p>

## About

workspace-maxxing was born from a simple frustration: every AI workflow project started the same way—messy prompts, scattered context, and outputs that were impossible to reproduce.

I built this tool to enforce structure without killing creativity. The ICM methodology provided the framework, but the CLI makes it actionable. Now a single command scaffolds a complete workflow workspace with numbered stages, context contracts, and an invokable agent ready for iteration.

If you've ever struggled to get an AI to follow a consistent process, or if your prompts have drifted so far from the original intent that debugging feels impossible—this tool is for you.

---

Build structured, interpretable AI workflow workspaces and invokable agents from one command.

workspace-maxxing is an npx-installable CLI + skill package that helps you:

- Scaffold ICM-style workspace folders
- Install the `workspace-maxxing` skill into your agent environment
- Generate an invokable agent for your workflow
- Validate and iterate toward robust outputs

## What Is workspace-maxxing?

workspace-maxxing turns vague requests like "build me a lead gen workflow" into a concrete, file-structured workspace with stage boundaries and context contracts.

Instead of throwing everything into one giant prompt, it creates a staged workflow with:

- `SYSTEM.md` for global rules
- Root `CONTEXT.md` for routing
- Numbered stage folders for execution order
- `00-meta/` for execution log and tool inventory
- Generated agent prompts and configuration

## Why Use It?

Use workspace-maxxing when you want workflows that are easier to debug, review, and repeat.

1. Better control over agent behavior: numbered stages and explicit context files reduce prompt drift.
2. Easier review and handoff: outputs live in plain files, so humans can inspect and edit between stages.
3. Repeatable execution: the same structure can run new input with less re-prompting.
4. Cross-platform agent install: supports OpenCode, Claude Code, GitHub Copilot, and Gemini CLI targets.
5. Built-in quality loop: includes validation, test generation, benchmark scoring, and fix retries.

## Methodology Basis (ICM)

This project is based in part on Interpratable Context Methodology (ICM) including folder-structure conventions such as numbered stage folders, stage contracts, selective context loading, and file-based handoffs.

Attribution:

- Jake Van Clief's ICM framework and conventions (RinDig repository)
- The broader ICM five-layer folder architecture described in public ICM template work

Relevant reference:

- https://arxiv.org/html/2603.16021v2

workspace-maxxing adapts those ideas to this CLI-driven layout:

```text
workspace/
  SYSTEM.md
  CONTEXT.md
  00-meta/
    tools.md
    execution-log.md
  01-input/
    CONTEXT.md
  02-process/
    CONTEXT.md
  03-output/
    CONTEXT.md
```

## Quick Start

### 1) Install the skill

```bash
npx workspace-maxxing init
```

For other platforms:

```bash
npx workspace-maxxing --claude
npx workspace-maxxing --copilot
npx workspace-maxxing --gemini
```

Then invoke the skill in your agent harness or CLI:

```text
/workspace-maxxing
Create a daily digest workflow for AI news.
```

### 2) Create a full workspace plus agent directly

```bash
npx workspace-maxxing init --workspace-name "Daily Digest"
```

Common options:

- `--workspace-name <name>`
- `--stages <comma-separated-stages>`
- `--output <path>`
- `--agent-name <name>`
- `--no-agent`
- `--threshold <score>` (default: 85)
- `--max-iterations <n>` (default: 3)

Example:

```bash
npx workspace-maxxing init \
  --workspace-name "Lead Pipeline" \
  --stages "01-intake,02-enrich,03-output" \
  --output "./lead-workspace"
```

## Use Cases

After install, use `/workspace-maxxing` in your agent harness or CLI:

- "Build a workspace for weekly product analytics reports"
- "Create an agent for PR review triage"
- "Validate this workspace"
- "Improve this workspace until robust"
- "Create a content pipeline for newsletters"
- "Set up a customer-support triage workflow"

The skill internally routes through specialized sub-skills such as:

- `research`
- `architecture`
- `tooling`
- `validation`
- `worker`
- `fixer`
- `iteration`

## Onboarding

Use this first-run flow when setting up workspace-maxxing in a new repo:

1. Install the skill for your environment (`install`, `--claude`, `--copilot`, or `--gemini`).
2. Start your AI session and invoke `/workspace-maxxing`.
3. Describe the workflow goal in one sentence.
4. Review generated files (`SYSTEM.md`, `CONTEXT.md`, stage folders, and `00-meta/`).
5. Run validation or iteration to improve robustness before regular use.

## CLI Commands

```bash
# Help
npx workspace-maxxing --help

# Install skill (OpenCode target)
npx workspace-maxxing install

# Install skill for specific target
npx workspace-maxxing --opencode
npx workspace-maxxing --claude
npx workspace-maxxing --copilot
npx workspace-maxxing --gemini

# Create workspace (+ agent by default)
npx workspace-maxxing init
```

### Skill Registry

```bash
# Register all skills from a workspace into the global registry
npx workspace-maxxing register-skills ./my-workspace/.agents/skills --global

# Register for specific platforms
npx workspace-maxxing register-skills ./path/to/skills --opencode --claude

# List all registered skills
npx workspace-maxxing list-skills

# Unregister a skill
npx workspace-maxxing unregister-skills my-skill

# Unregister all
npx workspace-maxxing unregister-skills --all

# Re-sync all registered skills from source
npx workspace-maxxing register-skills --sync
```

## Local Development

From this repository:

```bash
npm install
npm run build
npm test
```

Run built CLI directly:

```bash
node dist/index.js init --workspace-name "Test Workspace"
```

If you want to test as a local package before publish:

```bash
npm pack
npx --yes --package ./workspace-maxxing-<version>.tgz workspace-maxxing install
```

## Requirements

- Node.js 18+
- npm
- An AI agent environment (OpenCode, Claude Code, GitHub Copilot, or Gemini CLI)

## License

MIT
