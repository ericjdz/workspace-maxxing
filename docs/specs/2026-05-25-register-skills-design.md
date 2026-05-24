# Register-Skills: Global Skill Registry

**Status**: Approved
**Date**: 2026-05-25
**Author**: Eric / workspace-maxxing

---

## Problem

When workspace-maxxing generates a workflow workspace, the skills inside it are only accessible from that workspace's directory. To use them globally, users must manually copy skill files into platform-specific directories (`~/.agents/skills/`, `~/.config/opencode/skills/`, etc.). This is fragile, creates duplication, and makes updates painful.

## Solution

A `register-skills` command that:
1. Records skill paths in a central manifest file
2. Wires those skills into each detected agent harness platform
3. Provides `list-skills` and `unregister-skills` for full lifecycle management

## Architecture

### Two-Layer System

**Layer 1 — Manifest** (`~/.config/workspace-maxxing/skill-registry.json`):
Platform-agnostic source of truth. Stores skill metadata and absolute paths. This file is owned by workspace-maxxing and is portable across platforms.

**Layer 2 — Platform Wiring**:
Reads the manifest and creates native references for each detected agent harness. Each platform gets its own integration method.

```
workspace-maxxing register-skills ./my-workspace/.agents/skills
    |
    +---> writes to ~/.config/workspace-maxxing/skill-registry.json
    |
    +---> wires into detected platforms:
          +---> OpenCode: copy to ~/.config/opencode/skills/<name>/SKILL.md
          +---> Claude Code: append skill entry to CLAUDE.md
          +---> Copilot: copy to .github/copilot-skills/<name>/
          +---> Gemini: append skill path to GEMINI.md
```

## Manifest Schema

Location: `~/.config/workspace-maxxing/skill-registry.json`

On Windows: `%APPDATA%/workspace-maxxing/skill-registry.json`

```json
{
  "version": 1,
  "skills": [
    {
      "name": "research-pipeline",
      "path": "/home/eric/projects/research-pipeline/.agents/skills/research-pipeline",
      "registeredAt": "2026-05-25T10:30:00Z",
      "source": "workspace-maxxing",
      "platforms": ["opencode", "claude"]
    }
  ]
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Skill name (derived from folder name or user-provided) |
| `path` | string | Absolute path to the skill directory (contains SKILL.md) |
| `registeredAt` | ISO 8601 | When the skill was registered |
| `source` | string | Always `"workspace-maxxing"` (future: could track other sources) |
| `platforms` | string[] | Which platforms this skill is wired into |

## CLI Commands

### `register-skills`

Register skills from a directory into the global registry and wire into detected platforms.

```bash
# Register all skills found in a directory
npx workspace-maxxing register-skills ./path/to/skills --global

# Register for specific platforms only
npx workspace-maxxing register-skills ./path/to/skills --opencode --claude

# Register with a custom name
npx workspace-maxxing register-skills ./path/to/skills --name my-custom-name
```

**Behavior**:
1. Scan the given path for skill directories (folders containing `SKILL.md`)
2. Add each skill to the manifest
3. Detect which platforms are available on the system
4. Wire each skill into all detected platforms (or only those specified with flags)
5. Print a summary of what was registered and where

**Flags**:
- `--global`: Register into all detected platforms (default if no platform flags given)
- `--opencode`, `--claude`, `--copilot`, `--gemini`: Register into specific platform(s)
- `--name <name>`: Override the skill name (only valid when registering a single skill)

### `list-skills`

List all registered skills with their paths and platform wiring status.

```bash
npx workspace-maxxing list-skills
```

**Output**:
```
Registered Skills:

  research-pipeline
    Path: /home/eric/projects/research-pipeline/.agents/skills/research-pipeline
    Platforms: opencode, claude
    Registered: 2026-05-25
    Status: OK

  content-writer
    Path: /home/eric/projects/content-pipeline/.agents/skills/content-writer
    Platforms: opencode
    Registered: 2026-05-24
    Status: WARNING - source path not found
```

### `unregister-skills`

Remove skills from the registry and clean up platform wiring.

```bash
# Unregister by name
npx workspace-maxxing unregister-skills research-pipeline

# Unregister all skills from a specific source path
npx workspace-maxxing unregister-skills --path ./path/to/skills

# Unregister all skills
npx workspace-maxxing unregister-skills --all
```

**Behavior**:
1. Remove the skill entry from the manifest
2. Remove platform-specific wiring (delete copied files, remove CLAUDE.md/GEMINI.md entries)
3. Print what was cleaned up

### `register-skills --sync`

Re-sync all registered skills from their source paths.

```bash
npx workspace-maxxing register-skills --sync
```

**Behavior**:
1. Read the manifest
2. For each entry, check if the source path still exists
3. Re-copy SKILL.md to all wired platforms (picks up source changes)
4. Flag any broken entries (source path missing)

## Platform Wiring Details

### Detection

Each platform is detected by checking for its configuration directory or files:

| Platform | Detection Method |
|----------|-----------------|
| OpenCode | `~/.config/opencode/` exists |
| Claude Code | `~/.claude/` exists or `.claude/` in cwd |
| Copilot | `~/.github/` exists or `.github/` in cwd |
| Gemini | `GEMINI.md` exists in cwd or home |

### Wiring Method

All platforms use **file copies with management headers**, not symlinks. This avoids Windows symlink permission issues and cross-drive problems.

Each copied file includes a header comment:
```markdown
<!-- Managed by workspace-maxxing — do not edit manually -->
<!-- Source: /home/eric/projects/research-pipeline/.agents/skills/research-pipeline -->
<!-- Run 'npx workspace-maxxing register-skills --sync' to update -->
```

| Platform | Wiring Location | Method |
|----------|----------------|--------|
| OpenCode | `~/.config/opencode/skills/<name>/SKILL.md` | Copy SKILL.md with management header |
| Claude Code | Append to `CLAUDE.md` available_skills section | Add skill entry with path reference |
| Copilot | `.github/copilot-skills/<name>/SKILL.md` | Copy SKILL.md with management header |
| Gemini | Append to `GEMINI.md` skill discovery | Add skill path entry |

### Unwiring

`unregister-skills` reverses wiring:
- **File copies**: Delete the copied files/directories
- **MD entries**: Remove the managed block (identified by management header comments)

## Post-Creation Prompt

When the workspace-maxxing skill (not CLI) creates a workspace, the final output includes:

```
Workspace created at ./research-pipeline

Register these skills globally? Run:
  npx workspace-maxxing register-skills ./research-pipeline/.agents/skills --global
```

This is a suggestion, not automatic. The user decides whether to register.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Source path moved/deleted | `list-skills` shows WARNING. `--sync` flags broken entries. |
| Platform not detected | Skip silently, log which platforms were wired. |
| Duplicate skill name | Error: "Skill 'X' already registered at /path. Use --name to alias or unregister first." |
| No platforms found | Register to manifest only. Warn: "No agent platforms detected." |
| Manifest doesn't exist | Create it on first `register-skills` call. |
| Skill directory has no SKILL.md | Skip with warning: "No SKILL.md found in /path, skipping." |
| Permission denied writing to platform dir | Error with suggestion to check permissions. |

## Future Considerations

- **Hot reload**: Watch source paths for changes, auto-sync (v2)
- **Remote registry**: Share skills across machines via git-backed registry (v3)
- **Skill versioning**: Track version in manifest, warn on outdated wiring (v2)
- **`workspace-maxxing publish`**: Publish a skill to npm/registry for others to install (v3)

## Implementation Notes

- Use `os.homedir()` for cross-platform home directory resolution
- Use `process.env.APPDATA` on Windows for config directory
- Manifest file creation: use `fs.mkdirSync(dir, { recursive: true })` before writing
- All file operations should be atomic where possible (write to temp, rename)
- Management headers use HTML comments (`<!-- -->`) so they're invisible in rendered markdown
