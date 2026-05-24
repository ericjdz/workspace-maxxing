# Register-Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `register-skills`, `unregister-skills`, and `list-skills` CLI commands that maintain a global skill manifest and wire skills into detected agent platforms.

**Architecture:** A new `src/registry.ts` module owns the manifest (read/write/query). A new `src/registry-wiring.ts` handles per-platform wiring (copy + management headers). CLI routing in `src/index.ts` dispatches to these modules. Each platform wirer implements a shared interface.

**Tech Stack:** Node.js, TypeScript, fs/path/os stdlib. No new dependencies.

---

### File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/registry.ts` | Create | Manifest CRUD — load, save, add, remove, list, find |
| `src/registry-wiring.ts` | Create | Platform detection + wiring/unwiring (copy SKILL.md with headers, clean up) |
| `src/index.ts` | Modify | Add CLI routing for `register-skills`, `unregister-skills`, `list-skills` |
| `tests/registry.test.ts` | Create | Unit tests for manifest operations |
| `tests/registry-wiring.test.ts` | Create | Unit tests for platform wiring |
| `tests/cli.test.ts` | Modify | Add CLI integration tests for new commands |

---

### Task 1: Manifest Module (`src/registry.ts`)

**Files:**
- Create: `src/registry.ts`
- Test: `tests/registry.test.ts`

- [ ] **Step 1: Write failing tests for manifest operations**

```typescript
// tests/registry.test.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getRegistryPath,
  loadRegistry,
  saveRegistry,
  addSkill,
  removeSkill,
  listSkills,
  findSkill,
  SkillEntry,
  SkillRegistry,
} from '../src/registry';

describe('registry', () => {
  let tempDir: string;
  let originalHome: string | undefined;
  let originalAppdata: string | undefined;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wm-registry-'));
    originalHome = process.env.HOME;
    originalAppdata = process.env.APPDATA;
    // Override home for cross-platform testing
    process.env.HOME = tempDir;
    process.env.APPDATA = tempDir;
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    if (originalHome !== undefined) process.env.HOME = originalHome;
    else delete process.env.HOME;
    if (originalAppdata !== undefined) process.env.APPDATA = originalAppdata;
    else delete process.env.APPDATA;
  });

  describe('getRegistryPath', () => {
    it('returns path under home config directory', () => {
      const result = getRegistryPath();
      expect(result).toContain('workspace-maxxing');
      expect(result).toContain('skill-registry.json');
    });
  });

  describe('loadRegistry', () => {
    it('returns empty registry when file does not exist', () => {
      const registry = loadRegistry();
      expect(registry.version).toBe(1);
      expect(registry.skills).toEqual([]);
    });

    it('loads existing registry from disk', () => {
      const registryPath = getRegistryPath();
      fs.mkdirSync(path.dirname(registryPath), { recursive: true });
      const data: SkillRegistry = {
        version: 1,
        skills: [{
          name: 'test-skill',
          path: '/some/path',
          registeredAt: '2026-01-01T00:00:00Z',
          source: 'workspace-maxxing',
          platforms: ['opencode'],
        }],
      };
      fs.writeFileSync(registryPath, JSON.stringify(data, null, 2));

      const registry = loadRegistry();
      expect(registry.skills).toHaveLength(1);
      expect(registry.skills[0].name).toBe('test-skill');
    });
  });

  describe('addSkill', () => {
    it('adds a skill entry and saves to disk', () => {
      const entry: Omit<SkillEntry, 'registeredAt'> = {
        name: 'my-skill',
        path: path.join(tempDir, 'skills', 'my-skill'),
        source: 'workspace-maxxing',
        platforms: ['opencode', 'claude'],
      };
      // Create the skill directory so validation passes
      fs.mkdirSync(entry.path, { recursive: true });
      fs.writeFileSync(path.join(entry.path, 'SKILL.md'), '# My Skill');

      addSkill(entry);

      const registry = loadRegistry();
      expect(registry.skills).toHaveLength(1);
      expect(registry.skills[0].name).toBe('my-skill');
      expect(registry.skills[0].registeredAt).toBeDefined();
    });

    it('throws on duplicate skill name', () => {
      const skillDir = path.join(tempDir, 'skills', 'dupe');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Dupe');

      addSkill({ name: 'dupe', path: skillDir, source: 'workspace-maxxing', platforms: ['opencode'] });
      expect(() => {
        addSkill({ name: 'dupe', path: skillDir, source: 'workspace-maxxing', platforms: ['opencode'] });
      }).toThrow(/already registered/);
    });

    it('throws when path has no SKILL.md', () => {
      const emptyDir = path.join(tempDir, 'empty-skill');
      fs.mkdirSync(emptyDir, { recursive: true });

      expect(() => {
        addSkill({ name: 'empty', path: emptyDir, source: 'workspace-maxxing', platforms: ['opencode'] });
      }).toThrow(/No SKILL.md found/);
    });
  });

  describe('removeSkill', () => {
    it('removes a skill by name', () => {
      const skillDir = path.join(tempDir, 'skills', 'remove-me');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Remove');

      addSkill({ name: 'remove-me', path: skillDir, source: 'workspace-maxxing', platforms: ['opencode'] });
      const removed = removeSkill('remove-me');
      expect(removed).not.toBeNull();
      expect(removed!.name).toBe('remove-me');

      const registry = loadRegistry();
      expect(registry.skills).toHaveLength(0);
    });

    it('returns null for non-existent skill', () => {
      const removed = removeSkill('nonexistent');
      expect(removed).toBeNull();
    });
  });

  describe('listSkills', () => {
    it('returns all registered skills', () => {
      const skill1Dir = path.join(tempDir, 'skills', 's1');
      const skill2Dir = path.join(tempDir, 'skills', 's2');
      fs.mkdirSync(skill1Dir, { recursive: true });
      fs.mkdirSync(skill2Dir, { recursive: true });
      fs.writeFileSync(path.join(skill1Dir, 'SKILL.md'), '# S1');
      fs.writeFileSync(path.join(skill2Dir, 'SKILL.md'), '# S2');

      addSkill({ name: 's1', path: skill1Dir, source: 'workspace-maxxing', platforms: ['opencode'] });
      addSkill({ name: 's2', path: skill2Dir, source: 'workspace-maxxing', platforms: ['claude'] });

      const skills = listSkills();
      expect(skills).toHaveLength(2);
    });
  });

  describe('findSkill', () => {
    it('finds skill by name', () => {
      const skillDir = path.join(tempDir, 'skills', 'findable');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Find');

      addSkill({ name: 'findable', path: skillDir, source: 'workspace-maxxing', platforms: ['opencode'] });

      const found = findSkill('findable');
      expect(found).not.toBeNull();
      expect(found!.name).toBe('findable');
    });

    it('returns null for missing skill', () => {
      expect(findSkill('missing')).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/registry.test.ts --no-coverage`
Expected: FAIL — `Cannot find module '../src/registry'`

- [ ] **Step 3: Implement the registry module**

```typescript
// src/registry.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface SkillEntry {
  name: string;
  path: string;
  registeredAt: string;
  source: string;
  platforms: string[];
}

export interface SkillRegistry {
  version: number;
  skills: SkillEntry[];
}

/**
 * Returns the path to the global skill registry file.
 * Windows: %APPDATA%/workspace-maxxing/skill-registry.json
 * Unix: ~/.config/workspace-maxxing/skill-registry.json
 */
export function getRegistryPath(): string {
  const configDir = process.platform === 'win32'
    ? path.join(process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'), 'workspace-maxxing')
    : path.join(process.env.HOME ?? os.homedir(), '.config', 'workspace-maxxing');
  return path.join(configDir, 'skill-registry.json');
}

export function loadRegistry(): SkillRegistry {
  const registryPath = getRegistryPath();
  if (!fs.existsSync(registryPath)) {
    return { version: 1, skills: [] };
  }
  const raw = fs.readFileSync(registryPath, 'utf-8');
  return JSON.parse(raw) as SkillRegistry;
}

export function saveRegistry(registry: SkillRegistry): void {
  const registryPath = getRegistryPath();
  fs.mkdirSync(path.dirname(registryPath), { recursive: true });
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
}

export function addSkill(entry: Omit<SkillEntry, 'registeredAt'>): SkillEntry {
  // Validate SKILL.md exists
  const skillMdPath = path.join(entry.path, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    throw new Error(`No SKILL.md found in ${entry.path}`);
  }

  const registry = loadRegistry();

  // Check for duplicates
  if (registry.skills.some(s => s.name === entry.name)) {
    throw new Error(
      `Skill '${entry.name}' already registered. Use --name to alias or unregister first.`
    );
  }

  const fullEntry: SkillEntry = {
    ...entry,
    registeredAt: new Date().toISOString(),
  };

  registry.skills.push(fullEntry);
  saveRegistry(registry);
  return fullEntry;
}

export function removeSkill(name: string): SkillEntry | null {
  const registry = loadRegistry();
  const idx = registry.skills.findIndex(s => s.name === name);
  if (idx === -1) return null;

  const [removed] = registry.skills.splice(idx, 1);
  saveRegistry(registry);
  return removed;
}

export function listSkills(): SkillEntry[] {
  return loadRegistry().skills;
}

export function findSkill(name: string): SkillEntry | null {
  const registry = loadRegistry();
  return registry.skills.find(s => s.name === name) ?? null;
}

/**
 * Scan a directory for skill folders (containing SKILL.md).
 * Returns an array of { name, path } for each found skill.
 */
export function scanForSkills(dir: string): Array<{ name: string; path: string }> {
  const absDir = path.resolve(dir);
  if (!fs.existsSync(absDir)) {
    throw new Error(`Directory not found: ${absDir}`);
  }

  const results: Array<{ name: string; path: string }> = [];

  // Check if this directory itself contains SKILL.md
  if (fs.existsSync(path.join(absDir, 'SKILL.md'))) {
    results.push({ name: path.basename(absDir), path: absDir });
    return results;
  }

  // Otherwise scan subdirectories
  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subDir = path.join(absDir, entry.name);
      if (fs.existsSync(path.join(subDir, 'SKILL.md'))) {
        results.push({ name: entry.name, path: subDir });
      }
    }
  }

  return results;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/registry.test.ts --no-coverage`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/registry.ts tests/registry.test.ts
git commit -m "feat: add skill registry manifest module"
```

---

### Task 2: Platform Wiring Module (`src/registry-wiring.ts`)

**Files:**
- Create: `src/registry-wiring.ts`
- Test: `tests/registry-wiring.test.ts`

- [ ] **Step 1: Write failing tests for wiring operations**

```typescript
// tests/registry-wiring.test.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  detectAvailablePlatforms,
  wireSkill,
  unwireSkill,
  MANAGEMENT_HEADER,
} from '../src/registry-wiring';

describe('registry-wiring', () => {
  let tempDir: string;
  let originalHome: string | undefined;
  let originalAppdata: string | undefined;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wm-wiring-'));
    originalHome = process.env.HOME;
    originalAppdata = process.env.APPDATA;
    process.env.HOME = tempDir;
    process.env.APPDATA = tempDir;
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    if (originalHome !== undefined) process.env.HOME = originalHome;
    else delete process.env.HOME;
    if (originalAppdata !== undefined) process.env.APPDATA = originalAppdata;
    else delete process.env.APPDATA;
  });

  describe('detectAvailablePlatforms', () => {
    it('detects opencode when config dir exists', () => {
      const opencodeDir = path.join(tempDir, '.config', 'opencode');
      fs.mkdirSync(opencodeDir, { recursive: true });

      const platforms = detectAvailablePlatforms();
      expect(platforms).toContain('opencode');
    });

    it('returns empty array when no platforms detected', () => {
      const platforms = detectAvailablePlatforms();
      expect(platforms).toEqual([]);
    });
  });

  describe('wireSkill', () => {
    it('copies SKILL.md with management header to opencode skills dir', () => {
      // Create source skill
      const skillDir = path.join(tempDir, 'source-skill');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Test Skill\n\nDoes things.');

      // Create opencode config dir so platform is "detected"
      const opencodeSkillsDir = path.join(tempDir, '.config', 'opencode', 'skills');
      fs.mkdirSync(opencodeSkillsDir, { recursive: true });

      const result = wireSkill('test-skill', skillDir, 'opencode');
      expect(result.success).toBe(true);

      const wiredPath = path.join(opencodeSkillsDir, 'test-skill', 'SKILL.md');
      expect(fs.existsSync(wiredPath)).toBe(true);

      const content = fs.readFileSync(wiredPath, 'utf-8');
      expect(content).toContain('Managed by workspace-maxxing');
      expect(content).toContain('# Test Skill');
    });
  });

  describe('unwireSkill', () => {
    it('removes wired skill from opencode skills dir', () => {
      // Wire first
      const skillDir = path.join(tempDir, 'source-skill');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Test Skill');

      const opencodeSkillsDir = path.join(tempDir, '.config', 'opencode', 'skills');
      fs.mkdirSync(opencodeSkillsDir, { recursive: true });

      wireSkill('test-skill', skillDir, 'opencode');

      const wiredDir = path.join(opencodeSkillsDir, 'test-skill');
      expect(fs.existsSync(wiredDir)).toBe(true);

      // Now unwire
      unwireSkill('test-skill', 'opencode');
      expect(fs.existsSync(wiredDir)).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/registry-wiring.test.ts --no-coverage`
Expected: FAIL — `Cannot find module '../src/registry-wiring'`

- [ ] **Step 3: Implement the wiring module**

```typescript
// src/registry-wiring.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export type WirePlatform = 'opencode' | 'claude' | 'copilot' | 'gemini';

export interface WireResult {
  success: boolean;
  platform: WirePlatform;
  targetPath: string;
  error?: string;
}

export const MANAGEMENT_HEADER = (sourcePath: string): string =>
  `<!-- Managed by workspace-maxxing — do not edit manually -->\n<!-- Source: ${sourcePath} -->\n<!-- Run 'npx workspace-maxxing register-skills --sync' to update -->\n\n`;

function getHomeDir(): string {
  return process.env.HOME ?? process.env.USERPROFILE ?? os.homedir();
}

function getConfigDir(): string {
  if (process.platform === 'win32') {
    return process.env.APPDATA ?? path.join(getHomeDir(), 'AppData', 'Roaming');
  }
  return path.join(getHomeDir(), '.config');
}

/**
 * Returns the wiring target directory for a given platform.
 */
function getWireTarget(platform: WirePlatform, skillName: string): string {
  const home = getHomeDir();
  const configDir = getConfigDir();

  switch (platform) {
    case 'opencode':
      return path.join(configDir, 'opencode', 'skills', skillName);
    case 'claude':
      return path.join(home, '.claude', 'skills', skillName);
    case 'copilot':
      return path.join(home, '.github', 'copilot-skills', skillName);
    case 'gemini':
      return path.join(home, '.gemini', 'skills', skillName);
  }
}

/**
 * Detect which agent platforms are available on this system.
 */
export function detectAvailablePlatforms(): WirePlatform[] {
  const home = getHomeDir();
  const configDir = getConfigDir();
  const platforms: WirePlatform[] = [];

  if (fs.existsSync(path.join(configDir, 'opencode'))) platforms.push('opencode');
  if (fs.existsSync(path.join(home, '.claude'))) platforms.push('claude');
  if (fs.existsSync(path.join(home, '.github'))) platforms.push('copilot');
  if (fs.existsSync(path.join(home, '.gemini'))) platforms.push('gemini');

  return platforms;
}

/**
 * Wire a skill into a specific platform by copying SKILL.md with management header.
 */
export function wireSkill(skillName: string, sourcePath: string, platform: WirePlatform): WireResult {
  const targetDir = getWireTarget(platform, skillName);

  try {
    fs.mkdirSync(targetDir, { recursive: true });

    const sourceSkillMd = path.join(sourcePath, 'SKILL.md');
    if (!fs.existsSync(sourceSkillMd)) {
      return { success: false, platform, targetPath: targetDir, error: `No SKILL.md at ${sourcePath}` };
    }

    const originalContent = fs.readFileSync(sourceSkillMd, 'utf-8');
    const wiredContent = MANAGEMENT_HEADER(sourcePath) + originalContent;

    fs.writeFileSync(path.join(targetDir, 'SKILL.md'), wiredContent);

    return { success: true, platform, targetPath: targetDir };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, platform, targetPath: targetDir, error: message };
  }
}

/**
 * Remove a wired skill from a specific platform.
 */
export function unwireSkill(skillName: string, platform: WirePlatform): boolean {
  const targetDir = getWireTarget(platform, skillName);

  if (!fs.existsSync(targetDir)) return false;

  fs.rmSync(targetDir, { recursive: true, force: true });
  return true;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/registry-wiring.test.ts --no-coverage`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/registry-wiring.ts tests/registry-wiring.test.ts
git commit -m "feat: add platform wiring module for skill registration"
```

---

### Task 3: CLI Commands (`src/index.ts`)

**Files:**
- Modify: `src/index.ts`
- Modify: `tests/cli.test.ts`

- [ ] **Step 1: Write failing CLI integration tests**

Add to `tests/cli.test.ts`:

```typescript
// Add these tests at the end of the existing describe('CLI') block:

  describe('register-skills', () => {
    it('registers skills from a directory', () => {
      // Create a mock skill directory
      const skillDir = path.join(tempDir, 'my-workspace', '.agents', 'skills', 'my-skill');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# My Skill');

      const skillsParent = path.join(tempDir, 'my-workspace', '.agents', 'skills');

      const output = execSync(
        `node "${cliPath}" register-skills "${skillsParent}" --global`,
        {
          cwd: tempDir,
          encoding: 'utf-8',
          env: {
            ...process.env,
            WORKSPACE_MAXXING_TEMPLATES: path.join(repoRoot, 'templates'),
            HOME: tempDir,
            APPDATA: tempDir,
          },
        }
      );

      expect(output).toContain('Registered');
      expect(output).toContain('my-skill');
    });

    it('shows error when no skills found in directory', () => {
      const emptyDir = path.join(tempDir, 'empty');
      fs.mkdirSync(emptyDir, { recursive: true });

      try {
        execSync(
          `node "${cliPath}" register-skills "${emptyDir}" --global`,
          {
            cwd: tempDir,
            encoding: 'utf-8',
            env: {
              ...process.env,
              WORKSPACE_MAXXING_TEMPLATES: path.join(repoRoot, 'templates'),
              HOME: tempDir,
              APPDATA: tempDir,
            },
          }
        );
        fail('Should have thrown');
      } catch (e: unknown) {
        const error = e as { stderr?: string };
        expect(error.stderr ?? '').toContain('No skills found');
      }
    });
  });

  describe('list-skills', () => {
    it('shows empty registry message when no skills registered', () => {
      const output = execSync(
        `node "${cliPath}" list-skills`,
        {
          cwd: tempDir,
          encoding: 'utf-8',
          env: {
            ...process.env,
            WORKSPACE_MAXXING_TEMPLATES: path.join(repoRoot, 'templates'),
            HOME: tempDir,
            APPDATA: tempDir,
          },
        }
      );

      expect(output).toContain('No skills registered');
    });
  });

  describe('unregister-skills', () => {
    it('unregisters a skill by name', () => {
      // Register first
      const skillDir = path.join(tempDir, 'my-workspace', '.agents', 'skills', 'removable');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Removable');

      const skillsParent = path.join(tempDir, 'my-workspace', '.agents', 'skills');

      execSync(
        `node "${cliPath}" register-skills "${skillsParent}" --global`,
        {
          cwd: tempDir,
          encoding: 'utf-8',
          env: {
            ...process.env,
            WORKSPACE_MAXXING_TEMPLATES: path.join(repoRoot, 'templates'),
            HOME: tempDir,
            APPDATA: tempDir,
          },
        }
      );

      // Now unregister
      const output = execSync(
        `node "${cliPath}" unregister-skills removable`,
        {
          cwd: tempDir,
          encoding: 'utf-8',
          env: {
            ...process.env,
            WORKSPACE_MAXXING_TEMPLATES: path.join(repoRoot, 'templates'),
            HOME: tempDir,
            APPDATA: tempDir,
          },
        }
      );

      expect(output).toContain('Unregistered');
      expect(output).toContain('removable');
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/cli.test.ts --no-coverage`
Expected: FAIL — commands not recognized

- [ ] **Step 3: Add CLI routing for new commands**

Add to `src/index.ts` — new imports at top:

```typescript
import { scanForSkills, addSkill, removeSkill, listSkills } from './registry';
import { detectAvailablePlatforms, wireSkill, unwireSkill, WirePlatform } from './registry-wiring';
```

Add to `showHelp()` — after the init command section:

```typescript
Skill Registry:
  register-skills <path>   Register skills from a directory into the global registry
  list-skills              List all registered skills
  unregister-skills <name> Unregister a skill by name

Registry Options:
  --global                 Wire into all detected agent platforms
  --opencode               Wire into OpenCode only
  --claude                 Wire into Claude Code only
  --copilot                Wire into GitHub Copilot only
  --gemini                 Wire into Gemini CLI only
  --name <name>            Override skill name (single skill only)
  --sync                   Re-sync all registered skills from source
  --all                    Unregister all skills
  --path <path>            Unregister all skills from a source path
```

Add command handlers in `main()` before the "invalid command" error:

```typescript
  // register-skills command
  if (args.includes('register-skills')) {
    const pathArg = args[args.indexOf('register-skills') + 1];
    if (!pathArg || pathArg.startsWith('-')) {
      // --sync mode
      if (args.includes('--sync')) {
        await handleSync();
        return;
      }
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

  // list-skills command
  if (args.includes('list-skills')) {
    handleListSkills();
    return;
  }

  // unregister-skills command
  if (args.includes('unregister-skills')) {
    if (args.includes('--all')) {
      await handleUnregisterAll();
      return;
    }

    const nameArg = args[args.indexOf('unregister-skills') + 1];
    if (!nameArg || nameArg.startsWith('-')) {
      console.error('Usage: workspace-maxxing unregister-skills <name> | --all');
      process.exit(1);
    }

    handleUnregister(nameArg);
    return;
  }
```

Add handler functions before `main()`:

```typescript
async function handleRegister(
  skillPath: string,
  platforms: WirePlatform[],
  nameOverride?: string,
): Promise<void> {
  const resolvedPath = path.resolve(process.cwd(), skillPath);
  const skills = scanForSkills(resolvedPath);

  if (skills.length === 0) {
    console.error(`No skills found in ${resolvedPath} (no directories with SKILL.md)`);
    process.exit(1);
  }

  if (nameOverride && skills.length > 1) {
    console.error('--name can only be used when registering a single skill');
    process.exit(1);
  }

  for (const skill of skills) {
    const name = nameOverride ?? skill.name;

    try {
      addSkill({
        name,
        path: skill.path,
        source: 'workspace-maxxing',
        platforms: platforms.map(String),
      });

      console.log(`Registered: ${name} (${skill.path})`);

      // Wire into platforms
      if (platforms.length === 0) {
        console.log('  No agent platforms detected. Skill registered to manifest only.');
      }

      for (const platform of platforms) {
        const result = wireSkill(name, skill.path, platform);
        if (result.success) {
          console.log(`  Wired to ${platform}: ${result.targetPath}`);
        } else {
          console.log(`  Failed to wire to ${platform}: ${result.error}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to register ${name}: ${message}`);
    }
  }
}

function handleListSkills(): void {
  const skills = listSkills();

  if (skills.length === 0) {
    console.log('No skills registered. Use register-skills to add skills.');
    return;
  }

  console.log('Registered Skills:\n');
  for (const skill of skills) {
    const sourceExists = fs.existsSync(skill.path);
    const status = sourceExists ? 'OK' : 'WARNING - source path not found';
    const date = skill.registeredAt.split('T')[0];

    console.log(`  ${skill.name}`);
    console.log(`    Path: ${skill.path}`);
    console.log(`    Platforms: ${skill.platforms.join(', ')}`);
    console.log(`    Registered: ${date}`);
    console.log(`    Status: ${status}`);
    console.log('');
  }
}

function handleUnregister(name: string): void {
  const removed = removeSkill(name);

  if (!removed) {
    console.error(`Skill '${name}' is not registered.`);
    process.exit(1);
  }

  // Unwire from all platforms it was wired to
  for (const platform of removed.platforms) {
    unwireSkill(name, platform as WirePlatform);
  }

  console.log(`Unregistered: ${name}`);
  console.log(`  Removed from: ${removed.platforms.join(', ')}`);
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

  console.log(`\nRemoved ${skills.length} skill(s).`);
}

async function handleSync(): Promise<void> {
  const skills = listSkills();
  if (skills.length === 0) {
    console.log('No skills registered. Nothing to sync.');
    return;
  }

  console.log('Syncing registered skills...\n');

  for (const skill of skills) {
    if (!fs.existsSync(skill.path)) {
      console.log(`  ${skill.name}: WARNING - source path not found (${skill.path})`);
      continue;
    }

    for (const platform of skill.platforms) {
      const result = wireSkill(skill.name, skill.path, platform as WirePlatform);
      if (result.success) {
        console.log(`  ${skill.name} -> ${platform}: synced`);
      } else {
        console.log(`  ${skill.name} -> ${platform}: FAILED (${result.error})`);
      }
    }
  }

  console.log('\nSync complete.');
}
```

- [ ] **Step 4: Run all tests**

Run: `npx jest --no-coverage`
Expected: All tests PASS (old + new)

- [ ] **Step 5: Commit**

```bash
git add src/index.ts tests/cli.test.ts
git commit -m "feat: add register-skills, list-skills, unregister-skills CLI commands"
```

---

### Task 4: Update Help Text and README

**Files:**
- Modify: `README.md`
- Modify: `templates/SKILL.md`

- [ ] **Step 1: Add CLI Commands section to README for registry commands**

Add after existing CLI Commands section in README.md:

```markdown
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
```

- [ ] **Step 2: Add post-creation prompt to templates/SKILL.md**

In the workspace creation output section of SKILL.md, add the registration suggestion:

```markdown
After workspace creation, suggest to the user:

> Register these skills globally? Run:
> `npx workspace-maxxing register-skills <workspace-path>/.agents/skills --global`
```

- [ ] **Step 3: Commit**

```bash
git add README.md templates/SKILL.md
git commit -m "docs: add skill registry documentation"
```

---

### Task 5: Build, Full Test, Version Bump

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: Clean compile, no errors

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: All tests pass (195 existing + new registry tests)

- [ ] **Step 3: Bump version**

Edit `package.json`: version `0.8.0` → `0.9.0`

- [ ] **Step 4: Final commit**

```bash
git add package.json
git commit -m "chore: bump version to 0.9.0"
```
