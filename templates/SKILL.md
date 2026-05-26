---
name: workspace-maxxing
description: "Creates structured, deterministic AI workflow workspaces using ICM methodology. Use when user asks to 'build a workspace', 'create a workflow', 'automate a process', 'validate this workspace', or 'create an agent'."
---

# Workspace-Maxxing Skill

## Overview

This is an **AI agent skill** that creates ICM-compliant workspaces with invokable agents.

**User Flow:**
1. Install: `npx workspace-maxxing init`
2. Invoke: `/workspace-maxxing` in your agent harness or CLI
3. Request: "Create a daily digest workspace" (or similar)
4. The skill builds: ICM workspace + invokable agent

## When to Use

- User asks to build, create, or automate a workflow
- User asks to validate an existing workspace
- User asks for workspace architecture or structure design
- User asks to assess or install tools for a workspace
- **User asks to create an agent for a specific task**

## User Commands (to the AI agent)

| Request | What Happens |
|---------|-------------|
| "Build a workspace for X" | Creates ICM workspace with X workflow |
| "Create an agent for Y" | Creates invokable @agent for Y task |
| "Validate my workspace" | Checks ICM compliance |
| "Add tools for Z" | Discovers and installs tools for Z |

## Tool Discovery (MANDATORY Before Agent Delivery)

When creating ANY agent, ALWAYS do this FIRST:

1. **Check native tools** — What capabilities does the AI agent already have?
   - File system access, HTTP requests, browser automation, etc.

2. **Search for domain tools** — Use web search for:
   - "[domain] MCP server GitHub"
   - "[domain] CLI tool npm"

3. **Verify tool accessibility** — Confirm available tools work.

4. **Include tool instructions in agent prompts** — The created agent must know what tools are available and how to use them.

5. **Document tools** — Write discovered tools to `00-meta/tools.md`.

---

## Execution Mode: Inline Workflow

All phases execute **inline within your conversation**. Do NOT attempt to run TypeScript scripts or external commands. Create files directly using your file-writing capabilities.

### PHASE 1: RESEARCH (Inline)

When you receive a workspace request (e.g., "I need a gym planning workspace"):

1. **Identify the workflow type**
   - What is being automated?

2. **Analyze natural stages (DYNAMIC — not fixed to 3!)**
   - Simple workflow (2-3 phases): 01-input, 02-output
   - Medium workflow (3-4 phases): 01-input, 02-process, 03-output
   - Complex workflow (5+ phases): 01-discover, 02-validate, 03-enrich, 04-format, 05-export
   - **Pick stage names that match the actual workflow, not generic defaults**

3. **Discover installable tools (SEARCH REQUIRED!)**
   - Search for MCPs or CLI tools that can help this workflow
   - Document found tools in research findings

4. **Determine inputs and outputs**
   - What data goes IN to each stage?
   - What markdown artifacts come OUT?

### PHASE 2: ARCHITECTURE (Inline)

After research, design the workspace structure:

1. **Define stage folders** based on your research
2. **Create SYSTEM.md** with folder map and rules
3. **Create root CONTEXT.md** with routing table
4. **Create each stage's CONTEXT.md** with purpose, inputs, outputs, dependencies, completion criteria, and handoff

### PHASE 3: BUILD (Inline)

Create the ICM workspace by writing all files directly:

- `SYSTEM.md` — Global rules and folder map
- `CONTEXT.md` — Root routing table
- `00-meta/tools.md` — Tool inventory
- `00-meta/execution-log.md` — Stage completion tracker
- `NN-stage/CONTEXT.md` — Per-stage context contract

### PHASE 4: VALIDATE (Inline)

Check that the structure follows ICM rules:

- Every numbered stage has a CONTEXT.md with required sections
- Root CONTEXT.md routing table references all stages
- SYSTEM.md has folder map, role, rules, guardrails
- Execution log has checklist for all stages
- Dependencies point upstream only (never to later stages)
- No product implementation code in stage folders

### PHASE 5: DELIVER (MUST DO THIS!)

**EVERY workspace must have an invokable agent!**

Create `.agents/skills/<agent-name>/` with these files:

#### 1. SKILL.md:
```markdown
---
name: <agent-name>
description: "Execute <workflow> workflow. Use when user wants <purpose>."
triggers: ["/<agent-name>", "<workflow>", "run <name> workflow"]
---

# <agent-name> Skill

## Purpose
<What this agent does>

## When to Use
- <Use case 1>
- <Use case 2>

## Workspace Location
This agent's workspace is at: <workspace-path>

## Workflow Stages
- 01-<stage> → <description>
- 02-<stage> → <description>
- 03-<stage> → <description>

## How It Works (MANDATORY - Follow Exactly)
1. Read `<workspace-path>/SYSTEM.md` first for global rules
2. Read `<workspace-path>/CONTEXT.md` for routing
3. Load `<workspace-path>/NN-stage/CONTEXT.md` - the specific stage context
4. Execute the task following stage instructions
5. Write output to the appropriate stage folder
6. Update `<workspace-path>/00-meta/execution-log.md` to mark stage complete

**CRITICAL PATH RULE**: Always prefix stage folder paths with `<workspace-path>/`. Never use relative paths like `01-identify/CONTEXT.md` or `00-meta/execution-log.md` alone.

## Available Tools
<List tools from `<workspace-path>/00-meta/tools.md`>
```

#### 2. config.json:
```json
{
  "name": "<agent-name>",
  "purpose": "<purpose>",
  "platforms": ["opencode", "claude", "copilot", "gemini"]
}
```

#### 3. prompts/system.md:
```markdown
# <agent-name> System Prompt

You are a <purpose> assistant. Guide users through:
1. 01-<stage> — <what to do>
2. 02-<stage> — <what to do>
3. 03-<stage> — <what to do>

## Workspace Location
Read files from: <workspace-path>

## Error Handling
- If context is missing, ask for clarification
- If input is empty, ask for valid input
- If input is very large, process in chunks
- If a stage dependency is unclear, check `<workspace-path>/00-meta/execution-log.md`

## Available Tools
<List from `<workspace-path>/00-meta/tools.md`>
```

**Critical**: Create `.agents/skills/<name>/` with these files BEFORE delivering!

After delivering the workspace and agent, suggest skill registration:

> Register these skills globally? Run:
> `npx workspace-maxxing register-skills <workspace-path>/.agents/skills --global`

---

## Session Restart Reminder (MANDATORY - Add to Final Output)

After delivering the workspace and agent, append this message to your final output:

```markdown
---

## Restart Your AI Session

To use the new `@<agent-name>` skill:

1. **Restart your AI session** (close and reopen the chat)
2. **Re-invoke the skill** by typing `@<agent-name>` or your workflow request

The new skill won't be available until you restart. This is how AI agent environments load skills into context.
```

---

## Stage Determination Rules

- **NEVER** use "01-input, 02-process, 03-output" as default stages
- **ANALYZE** what the user actually needs
- Use stages that make sense for THAT specific workflow
- Number of stages should match workflow complexity (2-7 is typical)

## The Iron Law

NO BUILD WITHOUT PLAN
NO PLAN WITHOUT RESEARCH
NO AGENT DELIVERY WITHOUT TOOL DISCOVERY
NO COMPLETION CLAIM WITHOUT VERIFICATION
NO PRODUCT IMPLEMENTATION INSIDE WORKSPACE BUILDING MODE
NO STAGE SKIPPING ACROSS NUMBERED WORKFLOW FOLDERS

## Scope Guardrails

- This skill builds an ICM workflow workspace, not the end-product application.
- Keep outputs as file-structured markdown workflow artifacts in numbered stage folders.
- Do not generate backend/frontend/runtime code for the target domain while running this skill.
- If a user asks for product implementation details, capture them as workflow requirements and continue building the workspace structure.

## Sequential Enforcement

- Follow numbered stage folders in strict order; do not jump ahead.
- Use `<workspace-path>/00-meta/execution-log.md` as the source of truth for stage completion state.
- A later stage is blocked until the previous stage is checked complete with evidence notes.

## When Not to Use

- Simple file creation or editing (use direct file operations)
- Questions about ICM methodology (answer directly)
- Non-workspace tasks (check for other applicable skills first)

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "This workspace looks good enough" | Good enough is the enemy of excellent. Run validation. |
| "I'll skip research and go straight to building" | Building without research produces generic, non-optimal workspaces. |
| "The user didn't ask for tests" | Autonomous workflows require self-verification. Tests are mandatory. |
| "I'll fix this later" | Later never comes. Fix it now or escalate. |
| "I'll do all phases at once" | Phases exist for a reason. Complete each before moving to the next. |

## ICM Rules

- Canonical sources: each fact lives in exactly one file
- One-way dependencies only: A -> B, never B -> A
- Selective loading: route to sections, not whole files
- Numbered folders for workflow stages

## Output Format

- `workspace/` — the built markdown-first workflow workspace
- `.agents/skills/<workspace-name>/` — installable invokable agent
- `00-meta/execution-log.md` — stage completion evidence

## CLI Reference

For developers using the CLI directly (not relevant when invoked as a skill):

```bash
# Create workspace with agent
npx workspace-maxxing init --workspace-name "Daily Digest"

# Install skill for specific platform
npx workspace-maxxing --opencode
npx workspace-maxxing --claude
npx workspace-maxxing --copilot
npx workspace-maxxing --gemini
```
