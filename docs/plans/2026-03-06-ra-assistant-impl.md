# RA-Assistant Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create the `ra-assistant` workspace — an independent research analysis agent that communicates via Feishu, with local markdown knowledge base for project research, surveys, discussions, meeting minutes, and requirements consolidation.

**Architecture:** Pure workspace configuration (no code). Create AGENTS.md (agent definition), SOUL.md (interaction style), openclaw.json (Feishu binding), skills/ra-commands.md (command reference), and a sample knowledge directory structure. Follows the same pattern as `workspace-ops-agent/` and `workspace-pm-assistant/`.

**Tech Stack:** OpenClaw workspace config (JSON + Markdown), Feishu MCP tools (doc read)

---

### Task 1: Create workspace directory and openclaw.json

**Files:**

- Create: `workspace-ra-assistant/openclaw.json`

**Step 1: Create the directory and config file**

```json
{
  "gateway": {
    "mode": "local"
  },
  "models": {
    "providers": {
      "anthropic": {
        "models": [
          {
            "id": "claude-opus-4-6",
            "name": "Claude Opus"
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-6",
      "thinkingDefault": "medium",
      "models": {
        "anthropic/claude-opus-4-6": {}
      }
    },
    "list": [
      {
        "id": "ra-assistant",
        "name": "RA Assistant",
        "workspace": "~/.openclaw/workspace-ra-assistant"
      }
    ]
  },
  "bindings": [
    {
      "agentId": "ra-assistant",
      "match": {
        "channel": "feishu"
      }
    }
  ],
  "channels": {
    "feishu": {
      "enabled": true,
      "dmPolicy": "open",
      "groupPolicy": "open",
      "requireMention": true,
      "accounts": {
        "main": {
          "appId": "YOUR_FEISHU_APP_ID",
          "appSecret": "YOUR_FEISHU_APP_SECRET"
        }
      },
      "tools": {
        "doc": true,
        "wiki": true
      }
    }
  }
}
```

**Step 2: Commit**

```bash
scripts/committer "feat(ra-assistant): add workspace config" workspace-ra-assistant/openclaw.json
```

---

### Task 2: Create AGENTS.md

**Files:**

- Create: `workspace-ra-assistant/AGENTS.md`

**Step 1: Write the agent definition**

Content should define:

- Role: RA Assistant, a research analysis agent for the pre-requirement-analysis phase
- Four core capabilities: survey generation/interactive, topic discussion, meeting minutes extraction, requirements consolidation
- Command table (8 commands from design doc)
- Knowledge base rules: scan `knowledge/{project}/` markdown files before executing any command
- Survey generation: focus on knowledge gaps
- Discussion mode: reference existing documents, ask one question at a time
- Meeting minutes: extract DECISION/TODO/REQ/TBD from Feishu doc links via MCP
- Requirements consolidation: merge from surveys/discussions/meetings, dedupe, track source
- Feishu interaction: support both DM and group chat (@mention)
- Tool usage rules: use Feishu MCP `docx_v1_document_rawContent` to read meeting docs

Reference: `workspace-pm-assistant/AGENTS.md` for structure and style, `workspace-ops-agent/AGENTS.md` for command table format.

**Step 2: Commit**

```bash
scripts/committer "feat(ra-assistant): add agent definition" workspace-ra-assistant/AGENTS.md
```

---

### Task 3: Create SOUL.md

**Files:**

- Create: `workspace-ra-assistant/SOUL.md`

**Step 1: Write the personality and interaction style**

Content should define:

- Identity: RA Assistant, research analysis facilitator
- Communication style: guided questioning, not direct conclusions; help users think
- Discussion behavior: proactively say "the knowledge base mentions X, what do you think?"
- Survey behavior: one question at a time, wait for answer, then follow up
- Language: Chinese
- Structured output format templates for each capability:
  - Survey generated (project, topic, question count, file path)
  - Survey interactive session start/end
  - Discussion conclusion saved (project, topic, key conclusions count, TBD count, file path)
  - Meeting minutes extracted (DECISION/TODO/REQ/TBD counts, file path)
  - Requirements consolidated (total, confirmed, pending, conflict counts, file path)
- Boundaries: focus on research phase only; don't make decisions for user; be objective

Reference: `workspace-pm-assistant/SOUL.md` for format template style.

**Step 2: Commit**

```bash
scripts/committer "feat(ra-assistant): add agent personality" workspace-ra-assistant/SOUL.md
```

---

### Task 4: Create CLAUDE.md symlink

**Files:**

- Create: `workspace-ra-assistant/CLAUDE.md` (symlink to AGENTS.md)

**Step 1: Create symlink**

```bash
ln -s AGENTS.md workspace-ra-assistant/CLAUDE.md
```

**Step 2: Commit**

```bash
scripts/committer "feat(ra-assistant): add CLAUDE.md symlink" workspace-ra-assistant/CLAUDE.md
```

---

### Task 5: Create skills/ra-commands.md

**Files:**

- Create: `workspace-ra-assistant/skills/ra-commands.md`

**Step 1: Write the command reference**

Document each command with:

- Trigger words (Chinese + English)
- Function description
- Parameters
- Execution steps (what agent does internally)
- Example interaction (user message -> agent response)
- Output file path convention

Commands to document:

1. `生成问卷 {project} {topic}` / `generate survey` — reads knowledge base, identifies gaps, generates survey markdown
2. `开始调研 {project} {topic}` / `start survey` — enters interactive Q&A mode
3. `讨论 {project} {topic}` / `discuss` — loads knowledge base context, enters discussion mode
4. `结束讨论` / `end discussion` — generates conclusion document
5. `整理纪要 {url}` / `extract minutes` — reads Feishu doc via MCP, extracts structured items
6. `整理需求 {project}` / `consolidate requirements` — merges all sources, dedupes
7. `查看项目` / `list projects` — lists directories under knowledge/
8. `新建项目 {name}` / `new project` — creates knowledge/{name}/ directory structure

Reference: `workspace-ops-agent/skills/ops-commands.md` for structure.

**Step 2: Commit**

```bash
scripts/committer "feat(ra-assistant): add command reference" workspace-ra-assistant/skills/ra-commands.md
```

---

### Task 6: Create sample knowledge directory with README

**Files:**

- Create: `workspace-ra-assistant/knowledge/.gitkeep`
- Create: `workspace-ra-assistant/README.md`

**Step 1: Create knowledge directory placeholder**

Create an empty `.gitkeep` in `workspace-ra-assistant/knowledge/` so the directory is tracked by git.

**Step 2: Write README.md**

Quick-start guide covering:

- File structure overview
- How to configure Feishu app credentials
- How to start OpenClaw gateway
- Example Feishu interactions
- Link to AGENTS.md, SOUL.md, skills/ra-commands.md

Reference: `workspace-ops-agent/README.md` for structure.

**Step 3: Commit**

```bash
scripts/committer "feat(ra-assistant): add knowledge directory and README" workspace-ra-assistant/knowledge/.gitkeep workspace-ra-assistant/README.md
```

---

### Task 7: Verify workspace completeness

**Step 1: Check all files exist**

```bash
ls -la workspace-ra-assistant/
ls -la workspace-ra-assistant/skills/
ls -la workspace-ra-assistant/knowledge/
```

Expected:

```
workspace-ra-assistant/
├── AGENTS.md
├── CLAUDE.md -> AGENTS.md
├── SOUL.md
├── openclaw.json
├── README.md
├── knowledge/
│   └── .gitkeep
└── skills/
    └── ra-commands.md
```

**Step 2: Validate openclaw.json is valid JSON**

```bash
python3 -c "import json; json.load(open('workspace-ra-assistant/openclaw.json'))"
```

Expected: no output (success)
