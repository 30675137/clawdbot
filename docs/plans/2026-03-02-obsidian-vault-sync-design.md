# Obsidian Vault Sync via Feishu — Design

## Summary

Build an OpenClaw skill that automatically saves messages received via Feishu into a local Obsidian vault, then syncs to GitHub via Git. This enables a **Feishu → OpenClaw → Obsidian → Git → multi-device** knowledge management pipeline.

## Data Flow

```
Feishu message → OpenClaw Feishu Agent → obsidian-vault Skill → Local Vault → git commit+push → GitHub → Other devices (git pull)
```

## Approach

**Dedicated agent + skill**: A standalone OpenClaw agent (`obsidian-openclaw`, "知识库助手") with its own Feishu bot application and workspace (`~/.openclaw/workspace-obsidian-openclaw/`). The agent loads an `obsidian-vault` skill that handles content analysis, Markdown formatting, and Git sync.

**Why a separate agent:**

- Clean separation from the general-purpose `feixiaozhu` agent
- Dedicated Feishu bot — users add "知识库助手" to send knowledge items
- Independent workspace, skills, and session history
- Can use a different model or config without affecting other agents

**Architecture:**

```
Feishu Bot "知识库助手" (account: obsidian)
  → OpenClaw Gateway (binding: channel=feishu, account=obsidian)
    → Agent: obsidian-openclaw (workspace: ~/.openclaw/workspace-obsidian-openclaw/)
      → Skill: obsidian-vault.md
        → Write to ~/obsidian-vault/ → git push → GitHub
```

## Supported Content Types

| Source                            | Processing                                  |
| --------------------------------- | ------------------------------------------- |
| Chat text messages                | Direct conversion to Markdown note          |
| Feishu docs/Wiki                  | `feishu_doc read` → Markdown                |
| Web links                         | `web_fetch` → extract + summarize           |
| File attachments (PDF/Word/Excel) | Download to `assets/`, create metadata note |

## Trigger

Automatic: every message received by the Feishu agent triggers the save pipeline. A confirmation reply is sent back: "已保存到 Obsidian: <title>".

## Vault Structure

```
obsidian-vault/
├── inbox/              # All new content lands here
│   ├── docs/           # Feishu documents
│   ├── web/            # Web page clips
│   └── files/          # File attachment notes
├── assets/             # Binary files (PDF, images, etc.)
├── templates/          # Obsidian templates
└── .obsidian/          # Obsidian config
```

## Skill Workflow (per message)

1. Identify content type (text / doc link / web link / file)
2. Fetch content:
   - Feishu doc → `feishu_doc read`
   - Web link → `web_fetch`
   - File → download to `assets/`
3. Claude analyzes content:
   - Generate concise title
   - Extract 3-5 tags
   - Generate frontmatter
4. Convert to Obsidian Markdown
5. Write to vault directory (`inbox/<subdir>/YYYY-MM-DD-<title>.md`)
6. `git add` → `commit` → `push`
7. Reply to Feishu with confirmation

## Frontmatter Template

```yaml
---
title: "Document Title"
date: 2026-03-02
source: feishu # feishu | web | chat | file
source_url: "https://..."
sender: "Name"
tags: [tag1, tag2]
type: doc # doc | note | clip | file
---
```

## Git Commit Format

```
vault: add <type> - <title>
```

## Configuration

In `openclaw.json`:

```jsonc
{
  "agents": {
    "list": [
      // ... existing agents ...
      {
        "id": "obsidian-openclaw",
        "name": "知识库助手",
        "workspace": "~/.openclaw/workspace-obsidian-openclaw",
      },
    ],
  },
  "bindings": [
    // ... existing bindings ...
    {
      "agentId": "obsidian-openclaw",
      "match": { "channel": "feishu", "account": "obsidian" },
    },
  ],
  "channels": {
    "feishu": {
      "accounts": {
        // ... existing accounts ...
        "obsidian": {
          "appId": "YOUR_OBSIDIAN_BOT_APP_ID",
          "appSecret": "YOUR_OBSIDIAN_BOT_APP_SECRET",
        },
      },
    },
  },
}
```

Vault config (stored in agent workspace or skill):

- `vault_path`: `~/obsidian-vault/`
- `git_remote`: GitHub remote URL
- `git_branch`: `main`

## Edge Cases

- **Dedup**: use `source_url + date` as dedup key; skip if already saved
- **Large files**: binaries go to `assets/`, note contains metadata + link only
- **Git conflicts**: single-direction writes (push only); on push failure, pull --rebase then retry once
- **Network down**: commit locally, queue push for retry on reconnect
- **Permission errors**: if Feishu doc is unreadable, save link + error note

## Out of Scope (YAGNI)

- Obsidian → Feishu reverse sync
- Auto-categorization beyond inbox
- Full-text search (Obsidian has built-in search)
- Vector indexing (existing memory-lancedb handles this)

## Initialization Steps

1. Create a new Feishu bot application in Feishu developer console ("知识库助手")
2. Create vault directory with `.obsidian/` config
3. `git init` → create GitHub repo → add remote → initial push
4. Create agent workspace: `~/.openclaw/workspace-obsidian-openclaw/skills/`
5. Place `obsidian-vault` skill in the workspace skills directory
6. Add agent, binding, and feishu account to `openclaw.json`
7. Restart OpenClaw gateway
