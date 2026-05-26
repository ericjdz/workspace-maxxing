#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { detectProjectRoot, installSkill, AgentTarget, copyDirSync } from './install';
import { scaffoldWorkspace } from './scripts/scaffold';
import { createAgent, generateAgentName, AgentOptions } from './agent-creator';
import { detectPlatform, getPlatformInstaller } from './platforms';
import { scanForSkills, addSkill, removeSkill, listSkills } from './registry';
import { detectAvailablePlatforms, wireSkill, unwireSkill, WirePlatform } from './registry-wiring';

/**
 * Copy sub-skills directory to workspace's .agents/skills/ folder.
 * This enables /skill research, /skill tooling, etc. inside the workspace.
 */
function copySubSkillsToWorkspace(templatesDir: string, workspaceDir: string): void {
  const skillsSrc = path.join(templatesDir, '.workspace-templates', 'skills');
  const skillsDest = path.join(workspaceDir, '.agents', 'skills');
  
  if (!fs.existsSync(skillsSrc)) {
    console.log('Warning: No sub-skills found in templates');
    return;
  }
  
  copyDirSync(skillsSrc, skillsDest);
  console.log(`Copied sub-skills to: ${skillsDest}`);
}

function showHelp(): void {
  console.log(`
workspace-maxxing — npx-installable skill for AI agents

Usage:
  npx workspace-maxxing [command]

Commands:
  init              Install workspace-maxxing skill to current project (default)

Installation Options:
  --opencode        Install skill for OpenCode agents (default)
  --claude          Install skill for Claude Code agents
  --copilot         Install skill for GitHub Copilot agents
  --gemini          Install skill for Gemini CLI agents

Skill Registry:
  register-skills <path>   Register skills from a directory into the global registry
  list-skills              List all registered skills
  unregister-skills <name> Unregister a skill by name

Registry Options:
  --global                 Wire into all detected agent platforms
  --name <name>            Override skill name (single skill only)
  --sync                   Re-sync all registered skills from source
  --all                    Unregister all skills

Examples:
  # Install skill (recommended)
  npx workspace-maxxing init

  # Install for specific platform
  npx workspace-maxxing --claude
  npx workspace-maxxing --copilot
  npx workspace-maxxing --gemini

After install, use the skill in your agent harness or CLI:
  /workspace-maxxing
  Create a workflow for [your task]
`);
}

function extractOption(args: string[], option: string): string | undefined {
  const idx = args.indexOf(option);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

async function createWorkspace(args: string[], templatesDir: string): Promise<void> {
  const workspaceName = extractOption(args, '--workspace-name') ?? 'My Workspace';
  const stagesStr = extractOption(args, '--stages') ?? '';
  if (!stagesStr) {
    console.warn('⚠ Warning: No --stages specified. Using generic defaults (01-input, 02-process, 03-output).\n  For better results, specify stages matching your workflow: --stages "01-research,02-analysis,03-report"');
  }
  const stages = stagesStr
    ? stagesStr.split(',').map(s => s.trim()).filter(Boolean)
    : ['01-input', '02-process', '03-output'];
  
  const withAgent = !hasFlag(args, '--no-agent');
  const agentNameOption = extractOption(args, '--agent-name');
  const outputDir = extractOption(args, '--output') 
    ? path.resolve(process.cwd(), extractOption(args, '--output')!)
    : path.resolve(process.cwd(), 'workspace');

  console.log('=== Workspace-Maxxing ===');
  console.log(`Creating workspace: ${workspaceName}`);
  console.log(`Stages: ${stages.join(', ')}`);
  console.log(`Output: ${outputDir}`);
  console.log(`With agent: ${withAgent}`);
  console.log('');

  // Step 1: Create workspace folder structure
  console.log('Step 1: Creating workspace folder structure...');
  scaffoldWorkspace({
    name: workspaceName,
    stages,
    output: outputDir,
    force: true,
  });

  // Step 2: Copy sub-skills to workspace for /skill commands
  console.log('\nStep 2: Installing sub-skills to workspace...');
  copySubSkillsToWorkspace(templatesDir, outputDir);
  
  // Step 3: Create agent if enabled
  if (withAgent) {
    console.log('\nStep 3: Creating invokable agent...');
    
    // Generate agent name from workspace name if not provided
    const agentName = agentNameOption ?? generateAgentName(workspaceName);
    
    const agentOptions: AgentOptions = {
      name: agentName,
      purpose: `Execute ${workspaceName} workflow`,
      workspacePath: outputDir,
      stages: stages,
    };
    
    createAgent(agentOptions);
    
    // Step 4: Install for detected platform
    console.log('\nStep 4: Installing for platform...');
    const agentDirName = agentName.startsWith('@') ? agentName.slice(1) : agentName;
    const agentPath = path.join(outputDir, '.agents', 'skills', agentDirName);
    const platform = detectPlatform();
    console.log(`Detected platform: ${platform}`);
    
    const installer = getPlatformInstaller(platform);
    installer.install(agentPath, outputDir);
    
    console.log('\n=== Workspace Creation Complete ===');
    console.log(`Workspace: ${outputDir}`);
    console.log(`Agent: ${agentName}`);
    const displayName = agentName.startsWith('@') ? agentName.slice(1) : agentName;
    console.log(`\nTo use this workflow, invoke: /${displayName} in your agent harness or CLI.`);
  } else {
    console.log('\n=== Workspace Creation Complete ===');
    console.log(`Workspace: ${outputDir}`);
    console.log('(Agent creation disabled with --no-agent)');
  }
}

async function handleRegister(skillPath: string, platforms: WirePlatform[], nameOverride?: string): Promise<void> {
  const resolvedPath = path.resolve(process.cwd(), skillPath);
  const skills = scanForSkills(resolvedPath);

  if (skills.length === 0) {
    console.error(`No skills found in ${resolvedPath}`);
    process.exit(1);
  }

  if (nameOverride && skills.length > 1) {
    console.error('Cannot use --name when registering multiple skills.');
    process.exit(1);
  }

  for (const skill of skills) {
    const skillName = nameOverride ?? skill.name;

    try {
      addSkill({
        name: skillName,
        path: skill.path,
        source: skill.path,
        platforms,
      });
      console.log(`Registered: ${skillName}`);

      for (const platform of platforms) {
        const result = wireSkill(skillName, skill.path, platform);
        if (result.success) {
          console.log(`  Wired to ${platform}: ${result.targetPath}`);
        } else {
          console.error(`  Failed to wire ${skillName} to ${platform}: ${result.error}`);
        }
      }
    } catch (error) {
      console.error(`Failed to register ${skillName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

function handleListSkills(): void {
  const skills = listSkills();

  if (skills.length === 0) {
    console.log('No skills registered. Use register-skills to add skills.');
    return;
  }

  for (const skill of skills) {
    const status = fs.existsSync(skill.source) ? 'OK' : 'WARNING';
    console.log(`Name: ${skill.name}`);
    console.log(`  Path: ${skill.path}`);
    console.log(`  Platforms: ${skill.platforms.join(', ') || '(none)'}`);
    console.log(`  Registered: ${skill.registeredAt}`);
    console.log(`  Status: ${status}`);
  }
}

function handleUnregister(name: string): void {
  const removed = removeSkill(name);

  if (!removed) {
    console.error(`Skill '${name}' is not registered.`);
    process.exit(1);
  }

  for (const platform of removed.platforms) {
    unwireSkill(name, platform as WirePlatform);
  }

  console.log(`Unregistered: ${name}`);
  console.log(`Platforms removed from: ${removed.platforms.join(', ') || '(none)'}`);
}

async function handleUnregisterAll(): Promise<void> {
  const skills = listSkills();

  if (skills.length === 0) {
    console.log('No skills registered.');
    return;
  }

  for (const skill of skills) {
    for (const platform of skill.platforms) {
      unwireSkill(skill.name, platform as WirePlatform);
    }
    removeSkill(skill.name);
    console.log(`Unregistered: ${skill.name}`);
  }

  console.log(`Total unregistered: ${skills.length}`);
}

async function handleSync(): Promise<void> {
  const skills = listSkills();

  if (skills.length === 0) {
    console.log('No skills registered. Nothing to sync.');
    return;
  }

  for (const skill of skills) {
    if (!fs.existsSync(skill.source)) {
      console.error(`Missing source for ${skill.name}: ${skill.source}`);
      continue;
    }

    for (const platform of skill.platforms) {
      const result = wireSkill(skill.name, skill.source, platform as WirePlatform);
      if (result.success) {
        console.log(`Synced ${skill.name} to ${platform}: ${result.targetPath}`);
      } else {
        console.error(`Failed to sync ${skill.name} to ${platform}: ${result.error}`);
      }
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  // Check for init command (installs skill) or platform flags
  const agentFlags: AgentTarget[] = ['opencode', 'claude', 'copilot', 'gemini'];
  const isInstallCommand = args.includes('init') || args.includes('install');
  const isPlatformFlag = agentFlags.some(flag => args.includes(`--${flag}`));
  
  if (args.length === 0 || isInstallCommand || isPlatformFlag) {
    const cwd = process.cwd();
    const projectRoot = detectProjectRoot(cwd);

    if (projectRoot !== cwd) {
      console.log(`Detected project root: ${projectRoot}`);
    }

    const templatesDir =
      process.env.WORKSPACE_MAXXING_TEMPLATES ??
      path.join(__dirname, '..', 'templates');

    // Detect target or default to opencode
    const agentFlags: AgentTarget[] = ['opencode', 'claude', 'copilot', 'gemini'];
    const detectedAgent = agentFlags.find((flag) => args.includes(`--${flag}`)) || 'opencode';

    console.log(`Installing workspace-maxxing skill...`);
    const result = await installSkill(projectRoot, templatesDir, detectedAgent);

    if (result.success) {
      console.log(`✓ Skill installed to: ${result.skillPath}`);
      console.log(`\nOpen a new session and invoke /workspace-maxxing in your agent harness or CLI to create your first workflow.`);
    } else {
      console.error(`Installation failed: ${result.error}`);
      process.exit(1);
    }

    return;
  }

  // register-skills command
  if (args.includes('register-skills')) {
    const regIdx = args.indexOf('register-skills');
    const pathArg = args[regIdx + 1];
    if (args.includes('--sync')) {
      await handleSync();
      return;
    }
    if (!pathArg || pathArg.startsWith('-')) {
      console.error('Usage: workspace-maxxing register-skills <path> [--global|--opencode|--claude|--copilot|--gemini]');
      process.exit(1);
    }
    const nameOverride = extractOption(args, '--name');
    const platformFlags: WirePlatform[] = ['opencode', 'claude', 'copilot', 'gemini'];
    const requestedPlatforms = platformFlags.filter(p => args.includes(`--${p}`));
    const useGlobal = args.includes('--global') || requestedPlatforms.length === 0;
    const targetPlatforms = useGlobal ? detectAvailablePlatforms() : requestedPlatforms;
    await handleRegister(pathArg, targetPlatforms, nameOverride ?? undefined);
    return;
  }

  if (args.includes('list-skills')) {
    handleListSkills();
    return;
  }

  if (args.includes('unregister-skills')) {
    if (args.includes('--all')) {
      await handleUnregisterAll();
      return;
    }
    const unregIdx = args.indexOf('unregister-skills');
    const nameArg = args[unregIdx + 1];
    if (!nameArg || nameArg.startsWith('-')) {
      console.error('Usage: workspace-maxxing unregister-skills <name> | --all');
      process.exit(1);
    }
    handleUnregister(nameArg);
    return;
  }

  // Any other argument is invalid
  console.error('Invalid command. Use --help for usage information.');
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
