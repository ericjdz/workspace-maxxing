import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export type WirePlatform = 'opencode' | 'claude' | 'copilot' | 'gemini';

export interface WireResult {
  success: boolean;
  platform: WirePlatform;
  targetPath: string;
  error?: string;
}

export function MANAGEMENT_HEADER(sourcePath: string): string {
  return [
    '<!-- Managed by workspace-maxxing — do not edit manually -->',
    `<!-- Source: ${sourcePath} -->`,
    "<!-- Run 'npx workspace-maxxing register-skills --sync' to update -->",
    '',
    '',
  ].join('\n');
}

function getHomeDir(): string {
  return process.env.HOME || process.env.USERPROFILE || os.homedir();
}

function getConfigDir(): string {
  if (process.platform === 'win32') {
    return process.env.APPDATA || getHomeDir();
  }

  return path.join(getHomeDir(), '.config');
}

function getPlatformRoot(platform: WirePlatform): string {
  switch (platform) {
    case 'opencode':
      return path.join(getConfigDir(), 'opencode');
    case 'claude':
      return path.join(getHomeDir(), '.claude');
    case 'copilot':
      return path.join(getHomeDir(), '.github');
    case 'gemini':
      return path.join(getHomeDir(), '.gemini');
  }
}

function getTargetDirectory(skillName: string, platform: WirePlatform): string {
  switch (platform) {
    case 'opencode':
      return path.join(getPlatformRoot(platform), 'skills', skillName);
    case 'claude':
      return path.join(getPlatformRoot(platform), 'skills', skillName);
    case 'copilot':
      return path.join(getPlatformRoot(platform), 'copilot-skills', skillName);
    case 'gemini':
      return path.join(getPlatformRoot(platform), 'skills', skillName);
  }
}

function getTargetFilePath(skillName: string, platform: WirePlatform): string {
  return path.join(getTargetDirectory(skillName, platform), 'SKILL.md');
}

export function detectAvailablePlatforms(): WirePlatform[] {
  const platforms: WirePlatform[] = ['opencode', 'claude', 'copilot', 'gemini'];

  return platforms.filter((platform) => fs.existsSync(getPlatformRoot(platform)));
}

export function wireSkill(skillName: string, sourcePath: string, platform: WirePlatform): WireResult {
  const sourceFilePath = path.join(sourcePath, 'SKILL.md');
  const targetPath = getTargetFilePath(skillName, platform);

  if (!fs.existsSync(sourceFilePath)) {
    return {
      success: false,
      platform,
      targetPath,
      error: `No SKILL.md found at ${sourcePath}`,
    };
  }

  try {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    const content = fs.readFileSync(sourceFilePath, 'utf8');
    fs.writeFileSync(targetPath, MANAGEMENT_HEADER(sourcePath) + content);

    return {
      success: true,
      platform,
      targetPath,
    };
  } catch (error) {
    return {
      success: false,
      platform,
      targetPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function unwireSkill(skillName: string, platform: WirePlatform): boolean {
  const targetDir = getTargetDirectory(skillName, platform);

  if (!fs.existsSync(targetDir)) {
    return false;
  }

  fs.rmSync(targetDir, { recursive: true, force: true });
  return true;
}
