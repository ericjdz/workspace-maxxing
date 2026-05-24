import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

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

const DEFAULT_REGISTRY: SkillRegistry = {
  version: 1,
  skills: [],
};

function getBaseConfigDir(): string {
  if (process.platform === 'win32') {
    return process.env.APPDATA || os.homedir();
  }

  return process.env.HOME || os.homedir();
}

function getSkillFilePath(skillPath: string): string {
  return path.join(skillPath, 'SKILL.md');
}

export function getRegistryPath(): string {
  if (process.platform === 'win32') {
    return path.join(getBaseConfigDir(), 'workspace-maxxing', 'skill-registry.json');
  }

  return path.join(getBaseConfigDir(), '.config', 'workspace-maxxing', 'skill-registry.json');
}

export function loadRegistry(): SkillRegistry {
  const registryPath = getRegistryPath();

  if (!fs.existsSync(registryPath)) {
    return { ...DEFAULT_REGISTRY, skills: [] };
  }

  return JSON.parse(fs.readFileSync(registryPath, 'utf8')) as SkillRegistry;
}

export function saveRegistry(registry: SkillRegistry): void {
  const registryPath = getRegistryPath();
  fs.mkdirSync(path.dirname(registryPath), { recursive: true });
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
}

export function addSkill(entry: Omit<SkillEntry, 'registeredAt'>): SkillEntry {
  const skillFilePath = getSkillFilePath(entry.path);
  if (!fs.existsSync(skillFilePath)) {
    throw new Error(`No SKILL.md found at ${entry.path}`);
  }

  const registry = loadRegistry();
  if (registry.skills.some((skill) => skill.name === entry.name)) {
    throw new Error(`Skill "${entry.name}" is already registered`);
  }

  const skillEntry: SkillEntry = {
    ...entry,
    registeredAt: new Date().toISOString(),
  };

  registry.skills.push(skillEntry);
  saveRegistry(registry);
  return skillEntry;
}

export function removeSkill(name: string): SkillEntry | null {
  const registry = loadRegistry();
  const index = registry.skills.findIndex((skill) => skill.name === name);

  if (index === -1) {
    return null;
  }

  const [removed] = registry.skills.splice(index, 1);
  saveRegistry(registry);
  return removed;
}

export function listSkills(): SkillEntry[] {
  return loadRegistry().skills;
}

export function findSkill(name: string): SkillEntry | null {
  return loadRegistry().skills.find((skill) => skill.name === name) || null;
}

export function scanForSkills(dir: string): Array<{ name: string; path: string }> {
  if (!fs.existsSync(dir)) {
    throw new Error(`Directory does not exist: ${dir}`);
  }

  const directSkillPath = getSkillFilePath(dir);
  if (fs.existsSync(directSkillPath)) {
    return [{ name: path.basename(dir), path: dir }];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ name: entry.name, path: path.join(dir, entry.name) }))
    .filter((entry) => fs.existsSync(getSkillFilePath(entry.path)));
}
