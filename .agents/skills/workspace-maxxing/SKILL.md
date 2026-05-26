---
name: workspace-maxxing
description: "Creates structured, deterministic AI workflow workspaces using ICM methodology. Use when user asks to 'build a workspace', 'create a workflow', 'automate a process', 'validate this workspace', 'run test cases', or 'create an agent'."
---

# Workspace-Maxxing Skill

## Overview

This is an **AI agent skill** that creates ICM-compliant workspaces with invokable agents. 

**User Flow:**
1. Install: `npx workspace-maxxing install` 
2. Invoke: `@workspace-maxxing` in your AI agent
3. Request: "Create a daily digest workspace" (or similar)
4. The skill builds: ICM workspace + invokable agent

## When to Use

- User asks to build, create, or automate a workflow
- User asks to validate an existing workspace
- User asks for workspace architecture or structure design
- User asks to assess or install tools for a workspace
- User asks to run test cases against a workspace
- **User asks to create an agent for a specific task** (e.g., "create a daily digest agent", "make a news aggregator agent")

## User Commands (to the AI agent)

When you invoke `@workspace-maxxing`, you can ask:

| Request | What Happens |
|---------|-------------|
| "Build a workspace for X" | Creates ICM workspace with X workflow |
| "Create an agent for Y" | Creates invokable @agent for Y task |
| "Validate my workspace" | Checks ICM compliance |
| "Add tools for Z" | Uses tooling phase to install tools |

**IMPORTANT - Tool Discovery Before Agent Delivery:**

When creating ANY agent, ALWAYS do this FIRST:

1. **Check native tools** - What capabilities does the AI agent already have?
   - Playwright, puppeteer for browser automation?
   - Curl, wget for HTTP requests?
   - File system access?
   - Database connections?

2. **Verify tool accessibility** - Run a simple test to confirm tools work:
   ```
   Test: Can you make a simple HTTP request?
   Test: Can you list files in the current directory?
   Test: Can you execute a simple script?
   ```

3. **Install missing tools** - If native tools are insufficient:
   - Use `/skill tooling` to install MCP servers
   - Use `npm install` for CLI tools
   - Document installed tools in `00-meta/tools.md`

4. **Include tool instructions in agent prompts** - The created agent must know:
   - What tools are available
   - How to use them
   - Any rate limits or constraints

The skill will then execute the appropriate phases internally.

## Agent Creation Workflow

When you invoke `workspace-maxxing` with a request to create an agent (e.g., "create a lead scraping agent"), follow this flow:

```
1. Parse the request to extract the agent purpose (e.g., "Lead Scraper")
2. DISCOVER TOOLS:
   - Check what native tools are available in the AI agent (playwright, puppeteer, curl, etc.)
   - Verify tool accessibility by running a simple test
   - If native tools are insufficient, search for and install MCPs or CLI tools
   - Document tools in 00-meta/tools.md
3. Create ICM workspace structure (SYSTEM.md, CONTEXT.md, stage folders)
4. Create invokable agent in .agents/skills/<purpose>/
   - Include tool usage instructions in the agent prompts
5. Install agent for platform (OpenCode/Claude/Copilot/Gemini)
6. Deliver workspace with agent
```

**Tool Discovery is MANDATORY** - always check available tools, verify accessibility, and install missing tools before delivering the agent.

## When Not to Use

- Simple file creation or editing (use direct file operations)
- Questions about ICM methodology (answer directly)
- Non-workspace tasks (check for other applicable skills first)

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
- Use 00-meta/execution-log.md as the source of truth for stage completion state.
- A later stage is blocked until the previous stage is checked complete with evidence notes.

## Workflow Phases

The skill guides the AI through these phases inline:

```
Phase 1: RESEARCH - Gather requirements and discover tools
  ->
Phase 2: ARCHITECTURE - Design workspace structure
  ->
Phase 3: BUILD - Create workspace files
  ->
Phase 4: VALIDATE - Check ICM compliance
  ->
Phase 5: DELIVER - Package workspace with invokable agent
```

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

- workspace/ - the built markdown-first workflow workspace
- .agents/skills/<workspace-name>/ - installable skill
- 00-meta/execution-log.md - stage completion evidence

## CLI Reference

```bash
# Create workspace with agent
npx workspace-maxxing init --workspace-name "Daily Digest"

# Create workspace without agent
npx workspace-maxxing init --workspace-name "My Workflow" --no-agent

# Custom agent name
npx workspace-maxxing init --workspace-name "AI News" --agent-name "news-agent"

# Install skill for specific platform
npx workspace-maxxing --opencode
npx workspace-maxxing --claude
npx workspace-maxxing --copilot
npx workspace-maxxing --gemini
```

### What Gets Created

1. **ICM Workspace** - Folder structure with SYSTEM.md, CONTEXT.md, stage folders
2. **Invokable Agent** - Stored in `.agents/skills/<name>/`

### Agent Structure

```
workspace/
  .agents/
    skills/
      <name>/
        SKILL.md
        config.json
        prompts/
          system.md
          tasks/
        tools/
        tests/
  01-stage/
  02-stage/
  03-stage/
  SYSTEM.md
  CONTEXT.md
```

### Invoking the Agent

After workspace is created, use `@` or `/` followed by the agent name:

- **OpenCode**: `@daily-digest`
- **Claude Code**: Via `.claude/skills/` directory
- **Copilot**: Via `.github/copilot-instructions/`
- **Gemini**: Via `.gemini/skills/` directory
