import * as fs from 'fs';
import * as path from 'path';

const templatesDir = path.join(__dirname, '..', 'templates', '.workspace-templates');
const skillsDir = path.join(templatesDir, 'skills');

describe('Shared References', () => {
  describe('references/ directory', () => {
    it('contains anti-patterns.md', () => {
      const filePath = path.join(templatesDir, 'references', 'anti-patterns.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('Rationalization');
      expect(content).toContain('Thought');
      expect(content).toContain('Reality');
    });

    it('contains reporting-format.md', () => {
      const filePath = path.join(templatesDir, 'references', 'reporting-format.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('skill');
      expect(content).toContain('status');
      expect(content).toContain('findings');
      expect(content).toContain('recommendations');
      expect(content).toContain('nextSkill');
    });

    it('contains iron-laws.md', () => {
      const filePath = path.join(templatesDir, 'references', 'iron-laws.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('NO BUILD WITHOUT PLAN');
      expect(content).toContain('NO PLAN WITHOUT RESEARCH');
      expect(content).toContain('NO IMPROVEMENT WITHOUT VALIDATION');
      expect(content).toContain('NO COMPLETION CLAIM WITHOUT VERIFICATION');
    });
  });
});

describe('Sub-Skills', () => {
  describe('validation', () => {
    it('has SKILL.md with required sections', () => {
      const filePath = path.join(skillsDir, 'validation', 'SKILL.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('---');
      expect(content).toContain('name:');
      expect(content).toContain('description:');
      expect(content).toContain('## Overview');
      expect(content).toContain('## When to Use');
      expect(content).toContain('## The Process');
      expect(content).toContain('## Red Flags');
      expect(content).toContain('## Report Format');
      expect(content).toContain('## Integration');
    });

    it('references validate.ts script', () => {
      const filePath = path.join(skillsDir, 'validation', 'SKILL.md');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('validate.ts');
    });
  });

  describe('research', () => {
    it('has SKILL.md with required sections', () => {
      const filePath = path.join(skillsDir, 'research', 'SKILL.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('---');
      expect(content).toContain('name:');
      expect(content).toContain('description:');
      expect(content).toContain('## Overview');
      expect(content).toContain('## When to Use');
      expect(content).toContain('## The Process');
      expect(content).toContain('## Red Flags');
      expect(content).toContain('## Report Format');
      expect(content).toContain('## Integration');
    });
  });

  describe('architecture', () => {
    it('has SKILL.md with required sections', () => {
      const filePath = path.join(skillsDir, 'architecture', 'SKILL.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('---');
      expect(content).toContain('name:');
      expect(content).toContain('description:');
      expect(content).toContain('## Overview');
      expect(content).toContain('## When to Use');
      expect(content).toContain('## The Process');
      expect(content).toContain('## Red Flags');
      expect(content).toContain('## Report Format');
      expect(content).toContain('## Integration');
    });
  });

  describe('prompt-engineering', () => {
    it('has SKILL.md with required sections', () => {
      const filePath = path.join(skillsDir, 'prompt-engineering', 'SKILL.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('---');
      expect(content).toContain('name:');
      expect(content).toContain('description:');
      expect(content).toContain('## Overview');
      expect(content).toContain('## When to Use');
      expect(content).toContain('## The Process');
      expect(content).toContain('## Red Flags');
      expect(content).toContain('## Report Format');
      expect(content).toContain('## Integration');
    });
  });

  describe('testing', () => {
    it('has SKILL.md with required sections', () => {
      const filePath = path.join(skillsDir, 'testing', 'SKILL.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('---');
      expect(content).toContain('name:');
      expect(content).toContain('description:');
      expect(content).toContain('## Overview');
      expect(content).toContain('## When to Use');
      expect(content).toContain('## The Process');
      expect(content).toContain('## Red Flags');
      expect(content).toContain('## Report Format');
      expect(content).toContain('## Integration');
    });
  });

  describe('tooling', () => {
    it('has SKILL.md with required sections', () => {
      const filePath = path.join(skillsDir, 'tooling', 'SKILL.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('---');
      expect(content).toContain('name:');
      expect(content).toContain('description:');
      expect(content).toContain('## Overview');
      expect(content).toContain('## When to Use');
      expect(content).toContain('## The Process');
      expect(content).toContain('## Red Flags');
      expect(content).toContain('## Report Format');
      expect(content).toContain('## Integration');
    });
  });
});
