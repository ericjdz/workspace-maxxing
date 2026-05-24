import * as fs from 'fs';
import * as path from 'path';

const templatesDir = path.join(__dirname, '..', 'templates');

describe('Template files', () => {
  const requiredFiles = [
    'SKILL.md',
    '.workspace-templates/SYSTEM.md',
    '.workspace-templates/CONTEXT.md',
    '.workspace-templates/workspace/00-meta/CONTEXT.md',
    '.workspace-templates/workspace/00-meta/execution-log.md',
    '.workspace-templates/workspace/01-input/CONTEXT.md',
    '.workspace-templates/workspace/02-process/CONTEXT.md',
    '.workspace-templates/workspace/03-output/CONTEXT.md',
    '.workspace-templates/workspace/README.md',
  ];

  describe.each(requiredFiles)('%s', (filePath) => {
    it('exists', () => {
      const fullPath = path.join(templatesDir, filePath);
      expect(fs.existsSync(fullPath)).toBe(true);
    });

    it('is not empty', () => {
      const fullPath = path.join(templatesDir, filePath);
      if (!fs.existsSync(fullPath)) {
        fail(`File does not exist: ${fullPath}`);
        return;
      }
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content.trim().length).toBeGreaterThan(0);
    });
  });

  it('SKILL.md contains required sections', () => {
    const skillPath = path.join(templatesDir, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      fail('SKILL.md does not exist');
      return;
    }
    const content = fs.readFileSync(skillPath, 'utf-8');

    expect(content).toContain('# Workspace-Maxxing');
    expect(content).toContain('## Overview');
    expect(content).toContain('## When to Use');
    expect(content).toContain('## User Commands');
    expect(content).toContain('## Tool Discovery');
    expect(content).toContain('## Execution Mode: Inline Workflow');
    expect(content).toContain('## Stage Determination Rules');
    expect(content).toContain('## The Iron Law');
    expect(content).toContain('## Scope Guardrails');
    expect(content).toContain('## Anti-Rationalization Table');
    expect(content).toContain('## ICM Rules');
    expect(content).toContain('## Output Format');
  });

  it('README.md exists', () => {
    const readmePath = path.join(__dirname, '..', 'README.md');
    expect(fs.existsSync(readmePath)).toBe(true);

    const content = fs.readFileSync(readmePath, 'utf-8');
    expect(content.toLowerCase()).toContain('workspace');
  });

  it('SYSTEM.md contains Layer 0 content', () => {
    const systemPath = path.join(templatesDir, '.workspace-templates', 'SYSTEM.md');
    if (!fs.existsSync(systemPath)) {
      fail('SYSTEM.md does not exist');
      return;
    }
    const content = fs.readFileSync(systemPath, 'utf-8');

    expect(content.toLowerCase()).toContain('folder map');
    expect(content).toContain('workspace');
  });

  it('CONTEXT.md contains routing table structure', () => {
    const contextPath = path.join(templatesDir, '.workspace-templates', 'CONTEXT.md');
    if (!fs.existsSync(contextPath)) {
      fail('CONTEXT.md does not exist');
      return;
    }
    const content = fs.readFileSync(contextPath, 'utf-8');

    expect(content).toContain('routing');
    expect(content).toContain('workspace');
  });

  it('SYSTEM.md includes robust workflow sections', () => {
    const systemPath = path.join(templatesDir, '.workspace-templates', 'SYSTEM.md');
    if (!fs.existsSync(systemPath)) {
      fail('SYSTEM.md does not exist');
      return;
    }

    const content = fs.readFileSync(systemPath, 'utf-8');

    expect(content).toContain('## Role');
    expect(content).toContain('## Folder Map');
    expect(content).toContain('## Workflow Rules');
    expect(content).toContain('## Scope Guardrails');
    expect(content).toContain('## Sequential Execution Protocol');
    expect(content).toContain('## Stage Boundaries');
    expect(content).toContain('## Tooling Policy');
    expect(content.toLowerCase()).toContain('markdown');
  });

  it('root CONTEXT.md includes routing, loading order, and handoff routing', () => {
    const contextPath = path.join(templatesDir, '.workspace-templates', 'CONTEXT.md');
    if (!fs.existsSync(contextPath)) {
      fail('CONTEXT.md does not exist');
      return;
    }

    const content = fs.readFileSync(contextPath, 'utf-8');

    expect(content).toContain('## How to Use This File');
    expect(content).toContain('## Task Routing');
    expect(content).toContain('## Loading Order');
    expect(content).toContain('## Scope Guardrails');
    expect(content).toContain('## Sequential Routing Contract');
    expect(content).toContain('## Stage Handoff Routing');
    expect(content).toContain('## Escalation');
    expect(content.toLowerCase()).toContain('markdown');
  });

  it('stage context templates include completion and handoff sections', () => {
    const stageFiles = [
      '.workspace-templates/workspace/01-input/CONTEXT.md',
      '.workspace-templates/workspace/02-process/CONTEXT.md',
      '.workspace-templates/workspace/03-output/CONTEXT.md',
    ];

    for (const file of stageFiles) {
      const fullPath = path.join(templatesDir, file);
      if (!fs.existsSync(fullPath)) {
        fail(`File does not exist: ${fullPath}`);
        return;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content).toContain('## Purpose');
      expect(content).toContain('## Inputs');
      expect(content).toContain('## Outputs');
      expect(content).toContain('## Dependencies');
      expect(content).toContain('## Required Evidence');
      expect(content).toContain('## Completion Criteria');
      expect(content).toContain('## Handoff');
      expect(content.toLowerCase()).toContain('markdown');
    }
  });

  it('execution-log template provides sequential stage checklist format', () => {
    const logPath = path.join(templatesDir, '.workspace-templates', 'workspace', '00-meta', 'execution-log.md');
    if (!fs.existsSync(logPath)) {
      fail('execution-log.md does not exist');
      return;
    }

    const content = fs.readFileSync(logPath, 'utf-8');
    expect(content).toContain('## Stage Checklist');
    expect(content).toContain('- [ ] 01-input');
    expect(content).toContain('- [ ] 02-process');
    expect(content).toContain('- [ ] 03-output');
  });

  it('template scaffold script generates robust routing and scope sections', () => {
    const scriptPath = path.join(templatesDir, '.workspace-templates', 'scripts', 'scaffold.ts');
    if (!fs.existsSync(scriptPath)) {
      fail('Template scaffold script does not exist');
      return;
    }

    const content = fs.readFileSync(scriptPath, 'utf-8');
    expect(content).toContain('## Workflow Rules');
    expect(content).toContain('## Scope Guardrails');
    expect(content).toContain('## Stage Boundaries');
    expect(content).toContain('## Task Routing');
    expect(content).toContain('## Loading Order');
  });

  it('template validate script enforces structural and semantic routing checks', () => {
    const scriptPath = path.join(templatesDir, '.workspace-templates', 'scripts', 'validate.ts');
    if (!fs.existsSync(scriptPath)) {
      fail('Template validate script does not exist');
      return;
    }

    const content = fs.readFileSync(scriptPath, 'utf-8');
    expect(content).toContain('REQUIRED_SYSTEM_HEADINGS');
    expect(content).toContain('REQUIRED_ROOT_CONTEXT_HEADINGS');
    expect(content).toContain('Root routing references all numbered stages');
    expect(content).toContain('dependencies do not point to later stages');
  });

  it('SKILL.md has YAML frontmatter with name and description', () => {
    const skillPath = path.join(templatesDir, 'SKILL.md');
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toMatch(/^---\r?\nname:/m);
    expect(content).toMatch(/description:/);
  });


});
