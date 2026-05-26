# Scripts Reference (CLI Development Only)

These scripts are used by the `npx workspace-maxxing init` CLI command internally. They are NOT for use by AI agents reading the skill — agents should follow the inline workflow described in SKILL.md.

## scaffold.ts — Generate ICM Workspace

Creates a complete ICM workspace folder structure.

```bash
node dist/scripts/scaffold.js --name "research" --stages "01-research,02-analysis,03-report" --output ./workspace
```

## validate.ts — Check ICM Compliance

Validates a workspace against ICM rules.

```bash
node dist/scripts/validate.js --workspace ./workspace
```

## install-tool.ts — Install Packages

Installs a tool and updates the workspace inventory.

```bash
node dist/scripts/install-tool.js --tool "pdf-lib" --manager npm --workspace ./workspace
```
