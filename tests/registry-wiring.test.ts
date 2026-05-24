import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

type RegistryWiringModule = Record<string, any>;

describe('registry-wiring', () => {
  let tempDir: string;
  let originalHome: string | undefined;
  let originalUserProfile: string | undefined;
  let originalAppData: string | undefined;

  const loadModule = (): Partial<RegistryWiringModule> => {
    jest.resetModules();

    try {
      return require('../src/registry-wiring') as RegistryWiringModule;
    } catch {
      return {};
    }
  };

  const getHomeDir = (): string => tempDir;

  const getConfigDir = (): string =>
    process.platform === 'win32' ? tempDir : path.join(tempDir, '.config');

  const getOpencodeDir = (): string => path.join(getConfigDir(), 'opencode');

  const getTargetSkillDir = (platform: 'opencode' | 'claude' | 'copilot' | 'gemini', skillName: string): string => {
    const homeDir = getHomeDir();

    switch (platform) {
      case 'opencode':
        return path.join(getConfigDir(), 'opencode', 'skills', skillName);
      case 'claude':
        return path.join(homeDir, '.claude', 'skills', skillName);
      case 'copilot':
        return path.join(homeDir, '.github', 'copilot-skills', skillName);
      case 'gemini':
        return path.join(homeDir, '.gemini', 'skills', skillName);
    }
  };

  const createSkillSource = (skillName: string, content = '# Example skill\n'): string => {
    const sourceDir = path.join(tempDir, 'sources', skillName);
    fs.mkdirSync(sourceDir, { recursive: true });
    fs.writeFileSync(path.join(sourceDir, 'SKILL.md'), content);
    return sourceDir;
  };

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-maxxing-registry-wiring-'));
    originalHome = process.env.HOME;
    originalUserProfile = process.env.USERPROFILE;
    originalAppData = process.env.APPDATA;

    process.env.HOME = tempDir;
    process.env.USERPROFILE = tempDir;
    process.env.APPDATA = tempDir;
  });

  afterEach(() => {
    if (originalHome === undefined) {
      delete process.env.HOME;
    } else {
      process.env.HOME = originalHome;
    }

    if (originalUserProfile === undefined) {
      delete process.env.USERPROFILE;
    } else {
      process.env.USERPROFILE = originalUserProfile;
    }

    if (originalAppData === undefined) {
      delete process.env.APPDATA;
    } else {
      process.env.APPDATA = originalAppData;
    }

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('detectAvailablePlatforms detects opencode when config dir exists', () => {
    const registryWiring = loadModule();
    fs.mkdirSync(getOpencodeDir(), { recursive: true });

    expect(registryWiring.detectAvailablePlatforms?.()).toEqual(['opencode']);
  });

  it('detectAvailablePlatforms returns empty when no platforms exist', () => {
    const registryWiring = loadModule();

    expect(registryWiring.detectAvailablePlatforms?.()).toEqual([]);
  });

  it('wireSkill copies SKILL.md with management header to correct opencode path', () => {
    const registryWiring = loadModule();
    const skillName = 'example-skill';
    const sourcePath = createSkillSource(skillName, '# Example skill\nBody\n');

    const result = registryWiring.wireSkill?.(skillName, sourcePath, 'opencode');
    const targetPath = path.join(getTargetSkillDir('opencode', skillName), 'SKILL.md');
    const targetContent = fs.readFileSync(targetPath, 'utf8');

    expect(result).toEqual({
      success: true,
      platform: 'opencode',
      targetPath,
    });
    expect(targetContent).toBe(
      registryWiring.MANAGEMENT_HEADER?.(sourcePath) + '# Example skill\nBody\n',
    );
  });

  it('wireSkill returns error result when no SKILL.md at source', () => {
    const registryWiring = loadModule();
    const sourcePath = path.join(tempDir, 'sources', 'missing-skill');
    fs.mkdirSync(sourcePath, { recursive: true });

    const result = registryWiring.wireSkill?.('missing-skill', sourcePath, 'opencode');

    expect(result).toEqual({
      success: false,
      platform: 'opencode',
      targetPath: path.join(getTargetSkillDir('opencode', 'missing-skill'), 'SKILL.md'),
      error: expect.stringContaining('No SKILL.md found'),
    });
  });

  it('unwireSkill removes wired directory', () => {
    const registryWiring = loadModule();
    const skillName = 'remove-me';
    const sourcePath = createSkillSource(skillName);

    registryWiring.wireSkill?.(skillName, sourcePath, 'opencode');

    const targetDir = getTargetSkillDir('opencode', skillName);
    expect(fs.existsSync(targetDir)).toBe(true);
    expect(registryWiring.unwireSkill?.(skillName, 'opencode')).toBe(true);
    expect(fs.existsSync(targetDir)).toBe(false);
  });

  it('unwireSkill returns false for non-existent skill', () => {
    const registryWiring = loadModule();

    expect(registryWiring.unwireSkill?.('missing-skill', 'opencode')).toBe(false);
  });

  it('wire then unwire round-trip works', () => {
    const registryWiring = loadModule();
    const skillName = 'round-trip';
    const sourcePath = createSkillSource(skillName, '# Round trip\n');

    const wireResult = registryWiring.wireSkill?.(skillName, sourcePath, 'opencode');
    const targetPath = path.join(getTargetSkillDir('opencode', skillName), 'SKILL.md');

    expect(wireResult?.success).toBe(true);
    expect(fs.existsSync(targetPath)).toBe(true);
    expect(registryWiring.unwireSkill?.(skillName, 'opencode')).toBe(true);
    expect(fs.existsSync(getTargetSkillDir('opencode', skillName))).toBe(false);
  });
});
