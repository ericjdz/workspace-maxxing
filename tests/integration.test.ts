import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createHash } from 'crypto';
import { execFileSync } from 'child_process';

const repoRoot = path.join(__dirname, '..');
const cliPath = path.join(repoRoot, 'dist', 'index.js');
const templatesPath = path.join(repoRoot, 'templates');

function runBuildOnce(): void {
  const npmExecPath = process.env.npm_execpath;

  if (npmExecPath) {
    execFileSync(process.execPath, [npmExecPath, 'run', 'build'], {
      cwd: repoRoot,
      stdio: 'pipe',
    });
    return;
  }

  execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], {
    cwd: repoRoot,
    stdio: 'pipe',
  });
}

function runInstaller(targetDir: string): string {
  return execFileSync(process.execPath, [cliPath, '--opencode'], {
    cwd: targetDir,
    encoding: 'utf-8',
    env: {
      ...process.env,
      WORKSPACE_MAXXING_TEMPLATES: templatesPath,
    },
  });
}

function snapshotDirectory(rootDir: string): { files: string[]; hash: string } {
  const files: string[] = [];

  const walk = (currentDir: string): void => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
      } else {
        files.push(path.relative(rootDir, absolutePath));
      }
    }
  };

  walk(rootDir);
  files.sort();

  const hash = createHash('sha256');
  for (const relativeFilePath of files) {
    hash.update(relativeFilePath);
    hash.update('\0');
    hash.update(fs.readFileSync(path.join(rootDir, relativeFilePath)));
  }

  return {
    files,
    hash: hash.digest('hex'),
  };
}

beforeAll(() => {
  runBuildOnce();
});

describe('Integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-maxxing-integration-'));
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{}');
  });

  afterEach(() => {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('end-to-end: install and verify complete structure', () => {
    // Run installer
    const output = runInstaller(tempDir);

    expect(output).toContain('installed');

    // Verify skill directory
    const skillDir = path.join(tempDir, '.agents', 'skills', 'workspace-maxxing');
    expect(fs.existsSync(skillDir)).toBe(true);

    // Verify all expected files exist
    const expectedFiles = [
      'SKILL.md',
      '.workspace-templates/SYSTEM.md',
      '.workspace-templates/CONTEXT.md',
      '.workspace-templates/workspace/00-meta/CONTEXT.md',
      '.workspace-templates/workspace/01-input/CONTEXT.md',
      '.workspace-templates/workspace/02-process/CONTEXT.md',
      '.workspace-templates/workspace/03-output/CONTEXT.md',
      '.workspace-templates/workspace/README.md',
      'scripts/scaffold.ts',
      'scripts/validate.ts',
      'scripts/install-tool.ts',
    ];

    for (const file of expectedFiles) {
      const filePath = path.join(skillDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content.trim().length).toBeGreaterThan(0);
    }

    // Verify SKILL.md has required sections
    const skillContent = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf-8');
    expect(skillContent).toContain('## Overview');
    expect(skillContent).toContain('## When to Use');
    expect(skillContent).toContain('## The Iron Law');
    expect(skillContent).toContain('## Execution Mode: Inline Workflow');
    expect(skillContent).toContain('## Anti-Rationalization Table');
    expect(skillContent).toContain('## ICM Rules');
    expect(skillContent).toContain('## Output Format');

    // Verify SYSTEM.md has Layer 0 content
    const systemContent = fs.readFileSync(path.join(skillDir, '.workspace-templates', 'SYSTEM.md'), 'utf-8');
    expect(systemContent.toLowerCase()).toContain('folder map');
  });

  it('idempotency: running install twice produces valid result', () => {
    const firstOutput = runInstaller(tempDir);
    expect(firstOutput).toContain('installed');

    const skillDir = path.join(tempDir, '.agents', 'skills', 'workspace-maxxing');
    expect(fs.existsSync(path.join(skillDir, 'SKILL.md'))).toBe(true);

    const firstSnapshot = snapshotDirectory(skillDir);
    expect(firstSnapshot.files.length).toBeGreaterThan(0);
    expect(firstSnapshot.files).toContain('SKILL.md');
    expect(firstSnapshot.files).toContain(path.join('scripts', 'validate.ts'));

    const secondOutput = runInstaller(tempDir);
    expect(secondOutput).toContain('installed');

    const secondSnapshot = snapshotDirectory(skillDir);
    expect(secondSnapshot.files).toEqual(firstSnapshot.files);
    expect(secondSnapshot.hash).toBe(firstSnapshot.hash);
  });
});

