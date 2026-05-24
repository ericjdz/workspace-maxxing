# LinkedIn Post Draft

---

## Post Text

Every AI workflow project starts the same way—messy prompts, scattered context, and outputs that are impossible to reproduce.

I built a tool to fix that.

**workspace-maxxing** is an npx command that scaffolds a complete AI workflow workspace with:

→ Numbered stage folders (01-input, 02-process, 03-output)
→ Context contracts for each stage  
→ An invokable agent ready to use
→ Built-in validation & iteration

One command:
```bash
npx workspace-maxxing init
```

Then invoke in your agent harness or CLI:
```
/workspace-maxxing
Create a daily digest workflow for AI news.
```

Now instead of battling prompt drift, I have a reproducible workflow that actually works.

The ICM methodology (Interpretable Context Methodology) provided the framework. The CLI makes it actionable for anyone.

What's your biggest pain point with AI workflows? For me, it was consistency.

---

## Suggested Media

| Type | What to Create |
|------|---------------|
| **Image 1** | CLI output screenshot showing workspace structure created |
| **Image 2** | Before/After: messy prompts vs. structured workspace |
| **Video** | 30s screen recording of running `npx workspace-maxxing init` |
| **Carousel** | 5 slides: Problem → Solution → How it works → Example → CTA |

### Image Concept - Install + Invoke

Create two panels:

**Panel 1 - Install:**
```bash
$ npx workspace-maxxing init
✓ workspace-maxxing skill installed
```

**Panel 2 - Use:**
```
/workspace-maxxing
Create a daily digest workflow for AI news.
```

**Panel 3 - Result:**
The AI builds a complete workflow workspace:

```
workspace/
├── SYSTEM.md          (global rules)
├── CONTEXT.md         (routing)
├── 00-meta/
│   ├── tools.md
│   └── execution-log.md
├── 01-input/
│   └── CONTEXT.md
├── 02-process/
│   └── CONTEXT.md
└── 03-output/
    └── CONTEXT.md

.agencies/skills/daily-digest/
├── SKILL.md
├── config.json
└── prompts/system.md
```

Then it tells you to restart your session to load the new @daily-digest skill.

### Visual Hierarchy Suggestion

If designing a graphic:
- Left side: Terminal with command running
- Right side: File tree diagram showing workspace structure
- Bottom: Key features as icons

---

## Hashtags

#AIWorkflows #Productivity #OpenSource #DeveloperTools #AIEngineering #PromptEngineering #Automation #Tooling #npm