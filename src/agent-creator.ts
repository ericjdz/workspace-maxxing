import * as fs from 'fs';
import * as path from 'path';

export interface AgentOptions {
  name: string;
  purpose: string;
  workspacePath: string;
  platforms?: string[];
  stages?: string[];
}

function getNumberedFolders(workspacePath: string): string[] {
  try {
    const entries = fs.readdirSync(workspacePath, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && /^\\d{2}-/.test(e.name) && e.name !== '00-meta')
      .map((e) => e.name);
  } catch (e) {
    return ['01-input', '02-process', '03-output'];
  }
}

export function generateAgentName(purpose: string): string {
  // Convert "Daily Digest" -> "daily-digest"
  // Convert "AI News Aggregator" -> "ai-news-aggregator"
  const cleaned = purpose
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  return cleaned;
}

export function createAgent(options: AgentOptions): void {
  const { name, purpose, workspacePath } = options;
  
  // Remove @ prefix for directory name
  const dirName = name.startsWith('@') ? name.slice(1) : name;
  const agentDir = path.join(workspacePath, '.agents', 'skills', dirName);
  
  // Create directory structure
  fs.mkdirSync(path.join(agentDir, 'prompts', 'tasks'), { recursive: true });
  fs.mkdirSync(path.join(agentDir, 'tools'), { recursive: true });
  fs.mkdirSync(path.join(agentDir, 'tests'), { recursive: true });
  
  const stages = options.stages && options.stages.length > 0 
    ? options.stages 
    : getNumberedFolders(workspacePath);

  // Write SKILL.md
  const skillContent = generateSkillMd(name, purpose, workspacePath, stages);
  fs.writeFileSync(path.join(agentDir, 'SKILL.md'), skillContent);

  // Write skill index for proper discovery by name
  const indexContent = `name: ${dirName}\ndescription: "${purpose}"\n`;
  fs.writeFileSync(path.join(agentDir, '.skill'), indexContent);
  
  // Write config.json
  const configContent = JSON.stringify({
    name,
    purpose,
    platforms: options.platforms ?? ['opencode', 'claude', 'copilot', 'gemini'],
    robustnessThreshold: 85,
    iterationCount: 0,
    testCases: [],
  }, null, 2);
  fs.writeFileSync(path.join(agentDir, 'config.json'), configContent);
  
  // Write prompts/system.md
  const systemPrompt = generateSystemPrompt(name, purpose, workspacePath, stages);
  fs.writeFileSync(path.join(agentDir, 'prompts', 'system.md'), systemPrompt);
  
  // Write prompts/tasks/ default task prompt
  const taskPrompt = generateTaskPrompt(name, purpose, workspacePath);
  fs.writeFileSync(path.join(agentDir, 'prompts', 'tasks', 'default.md'), taskPrompt);
  
  console.log(`Agent "${name}" created at: ${agentDir}`);
}

function generateSkillMd(name: string, purpose: string, workspacePath: string, stages: string[]): string {
  const dirName = name.startsWith('@') ? name.slice(1) : name;
  const stagesList = stages.map(s => `- \`${s}/\` - Process step`).join('\\n');
  
  return `---
name: ${name}
description: "${purpose}. Use when user wants to run this workflow."
triggers: ["${name}", "${purpose.toLowerCase()}", "run ${dirName} workflow"]
---

# ${name} Agent

## Purpose
${purpose}

## Workspace Location
This agent's workspace is located at:
\`${workspacePath}\`

Read \`${workspacePath}/SYSTEM.md\` first, then \`${workspacePath}/CONTEXT.md\`.

## When to Use
- User wants to execute the workflow
- User asks to process inputs and generate outputs
- User wants to run automated tasks

## The Iron Law

NO SKIPPING WORKFLOW STEPS
NO IMPLEMENTATION BEFORE PLAN
NO CLAIMING DONE WITHOUT OUTPUT

## Capabilities
- Execute workflow tasks following ICM stage boundaries
- Process inputs and generate outputs sequentially
- Read workspace context (SYSTEM.md, stage CONTEXT.md)
- Produce structured markdown outputs

## How It Works

1. **Read Context** - Load SYSTEM.md, root CONTEXT.md, and relevant stage CONTEXT.md
2. **Process Task** - Execute the requested workflow step
3. **Write Output** - Save results to appropriate stage folder
4. **Report** - Provide summary in chat + log to file

## Workflow Stages
${stagesList}

## Output Format

- Stage outputs as markdown files in numbered folders
- Progress reported in hybrid format (chat summary + file details)
- Results logged for traceability

## Configuration
See config.json for agent configuration options.

## Anti-Rationalization

| Thought | Reality |
|---------|----------|
| "I know what to do" | Read the stage CONTEXT.md first |
| "Good enough" | Follow the workflow exactly |
| "Skip a stage" | Workflow stages exist for a reason |
| "No output needed" | Every task produces artifacts |
`;
}

function generateSystemPrompt(name: string, purpose: string, workspacePath: string, stages: string[]): string {
  const stagesList = stages.map(s => `- \`${s}/\` - Process step`).join('\\n');
  
  return `# ${name} - System Prompt

## Role
You are ${name}, an autonomous workflow agent that executes the ${purpose} workflow.

## Workspace Context
Workspace Path: \`${workspacePath}\`
- Read \`${workspacePath}/SYSTEM.md\` first for global rules
- Load root \`${workspacePath}/CONTEXT.md\` for routing
- Read relevant stage \`CONTEXT.md\` for specific instructions

## Workflow Execution

1. **Understand the request** - What does the user want to accomplish?
2. **Load appropriate context** - Read only the needed stage files
3. **Execute the task** - Follow the stage-specific instructions
4. **Produce output** - Write results to the appropriate folder
5. **Report progress** - Provide summary in chat + update \`00-meta/execution-log.md\`

## Stage Boundaries
${stagesList}
- \`00-meta/\` - Configuration and tools

## Tools Inventory
Always check \`${workspacePath}/00-meta/tools.md\` to understand what tools are available before attempting to install new ones or running external commands.

## Constraints
- Stay within workspace scope
- Follow ICM folder boundaries strictly
- Do not create product implementation code
- Keep outputs as markdown artifacts
- Report progress in hybrid format (chat + files)

## Error Handling
- If context is missing, ask for clarification
- If input is empty, ask for valid input
- If input is very large, process in chunks
- If stage dependencies are unclear, check execution-log.md
- If task is outside workspace scope, redirect to workflow design
`;
}

function generateTaskPrompt(name: string, purpose: string, workspacePath: string): string {
  return `# Default Task Prompt

## Task
Execute the workflow request from the user.

## Input
Read the user's request and determine which workflow stage applies.

## Process
1. Load the relevant stage context inside \`${workspacePath}\`
2. Follow the stage's completion criteria
3. Produce the required outputs

## Output
Write results to the appropriate stage folder as markdown artifacts.

## Success Criteria
- Output conforms to stage purpose
- Required evidence is produced
- Handoff notes updated for next stage
- execution-log.md is updated
`;
}