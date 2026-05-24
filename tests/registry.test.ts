import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

type RegistryModule = Record<string, any>;

describe('registry', () => {
  let tempDir: string;
  let originalHome: string | undefined;
  let originalAppData: string | undefined;

  const loadModule = (): Partial<RegistryModule> => {
    jest.resetModules();

    try {
      return require('../src/registry') as RegistryModule;
    } catch {
      return {};
    }
  };

  const createSkillDir = (baseDir: string, name: string): string => {
    const skillDir = path.join(baseDir, name);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), `# ${name}`);
    return skillDir;
  };

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-maxxing-registry-'));
    originalHome = process.env.HOME;
    originalAppData = process.env.APPDATA;
    process.env.HOME = tempDir;
    process.env.APPDATA = tempDir;
  });

  afterEach(() => {
    if (originalHome === undefined) {
      delete process.env.HOME;
    } else {
      process.env.HOME = originalHome;
    }

    if (originalAppData === undefined) {
      delete process.env.APPDATA;
    } else {
      process.env.APPDATA = originalAppData;
    }

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('getRegistryPath returns path containing workspace-maxxing and skill-registry.json', () => {
    const registry = loadModule();

    expect(registry.getRegistryPath?.()).toContain('workspace-maxxing');
    expect(registry.getRegistryPath?.()).toContain('skill-registry.json');
  });

  it('loadRegistry returns empty registry when file does not exist', () => {
    const registry = loadModule();

    expect(registry.loadRegistry?.()).toEqual({ version: 1, skills: [] });
  });

  it('loadRegistry loads existing registry from disk', () => {
    const registry = loadModule();
    const registryPath = registry.getRegistryPath?.();

    fs.mkdirSync(path.dirname(registryPath!), { recursive: true });
    fs.writeFileSync(
      registryPath!,
      JSON.stringify({
        version: 1,
        skills: [
          {
            name: 'alpha',
            path: 'C:/skills/alpha',
            registeredAt: '2026-01-01T00:00:00.000Z',
            source: 'local',
            platforms: ['opencode'],
          },
        ],
      }),
    );

    expect(registry.loadRegistry?.()).toEqual({
      version: 1,
      skills: [
        {
          name: 'alpha',
          path: 'C:/skills/alpha',
          registeredAt: '2026-01-01T00:00:00.000Z',
          source: 'local',
          platforms: ['opencode'],
        },
      ],
    });
  });

  it('addSkill adds entry and saves to disk, sets registeredAt', () => {
    const registry = loadModule();
    const skillDir = createSkillDir(tempDir, 'alpha');

    const added = registry.addSkill?.({
      name: 'alpha',
      path: skillDir,
      source: 'local',
      platforms: ['opencode', 'claude'],
    });

    expect(added).toMatchObject({
      name: 'alpha',
      path: skillDir,
      source: 'local',
      platforms: ['opencode', 'claude'],
    });
    expect(added?.registeredAt).toEqual(expect.any(String));
    expect(new Date(added!.registeredAt).toISOString()).toBe(added!.registeredAt);
    expect(registry.loadRegistry?.().skills).toHaveLength(1);
    expect(registry.loadRegistry?.().skills[0]).toMatchObject({
      name: 'alpha',
      path: skillDir,
    });
  });

  it('addSkill throws on duplicate name', () => {
    const registry = loadModule();
    const skillDir = createSkillDir(tempDir, 'alpha');

    registry.addSkill?.({
      name: 'alpha',
      path: skillDir,
      source: 'local',
      platforms: ['opencode'],
    });

    expect(() =>
      registry.addSkill?.({
        name: 'alpha',
        path: skillDir,
        source: 'local',
        platforms: ['opencode'],
      }),
    ).toThrow(/already registered/);
  });

  it('addSkill throws when path has no SKILL.md', () => {
    const registry = loadModule();
    const skillDir = path.join(tempDir, 'missing-skill');
    fs.mkdirSync(skillDir, { recursive: true });

    expect(() =>
      registry.addSkill?.({
        name: 'missing-skill',
        path: skillDir,
        source: 'local',
        platforms: ['opencode'],
      }),
    ).toThrow(/No SKILL.md found/);
  });

  it('removeSkill removes by name and returns removed entry', () => {
    const registry = loadModule();
    const skillDir = createSkillDir(tempDir, 'alpha');
    registry.addSkill?.({
      name: 'alpha',
      path: skillDir,
      source: 'local',
      platforms: ['opencode'],
    });

    const removed = registry.removeSkill?.('alpha');

    expect(removed?.name).toBe('alpha');
    expect(registry.loadRegistry?.().skills).toEqual([]);
  });

  it('removeSkill returns null for non-existent skill', () => {
    const registry = loadModule();

    expect(registry.removeSkill?.('missing')).toBeNull();
  });

  it('listSkills returns all registered skills', () => {
    const registry = loadModule();
    const alphaDir = createSkillDir(tempDir, 'alpha');
    const betaDir = createSkillDir(tempDir, 'beta');

    registry.addSkill?.({
      name: 'alpha',
      path: alphaDir,
      source: 'local',
      platforms: ['opencode'],
    });
    registry.addSkill?.({
      name: 'beta',
      path: betaDir,
      source: 'remote',
      platforms: ['claude'],
    });

    expect(registry.listSkills?.().map((entry: { name: string }) => entry.name)).toEqual(['alpha', 'beta']);
  });

  it('findSkill finds by name', () => {
    const registry = loadModule();
    const skillDir = createSkillDir(tempDir, 'alpha');
    registry.addSkill?.({
      name: 'alpha',
      path: skillDir,
      source: 'local',
      platforms: ['opencode'],
    });

    expect(registry.findSkill?.('alpha')).toMatchObject({ name: 'alpha', path: skillDir });
  });

  it('findSkill returns null for missing skill', () => {
    const registry = loadModule();

    expect(registry.findSkill?.('missing')).toBeNull();
  });

  it('scanForSkills finds skills in subdirectories', () => {
    const registry = loadModule();
    const scanDir = path.join(tempDir, 'skills');
    fs.mkdirSync(scanDir, { recursive: true });
    createSkillDir(scanDir, 'alpha');
    createSkillDir(scanDir, 'beta');
    fs.mkdirSync(path.join(scanDir, 'not-a-skill'), { recursive: true });

    expect(registry.scanForSkills?.(scanDir)).toEqual([
      { name: 'alpha', path: path.join(scanDir, 'alpha') },
      { name: 'beta', path: path.join(scanDir, 'beta') },
    ]);
  });

  it('scanForSkills finds skill when dir itself has SKILL.md', () => {
    const registry = loadModule();
    const skillDir = createSkillDir(tempDir, 'alpha');

    expect(registry.scanForSkills?.(skillDir)).toEqual([{ name: 'alpha', path: skillDir }]);
  });

  it('scanForSkills throws for non-existent directory', () => {
    const registry = loadModule();

    expect(() => registry.scanForSkills?.(path.join(tempDir, 'missing'))).toThrow();
  });
});
