# Obsidian Vault Sync via Feishu — Design

## Summary

Build an OpenClaw skill that automatically saves messages received via Feishu into a local Obsidian vault, then syncs to GitHub via Git. This enables a **Feishu → OpenClaw → Obsidian → Git → multi-device** knowledge management pipeline.

## Data Flow

```
Feishu message → OpenClaw Feishu Agent → obsidian-vault Skill → Local Vault → git commit+push → GitHub → Other devices (git pull)
```

## Approach

**Skill-based** (vs. Plugin or MCP Server): a `.md` skill file loaded into the Feishu agent's system prompt. Claude handles content analysis, tag extraction, and Markdown formatting natively.

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

Stored in agent config or workspace.json:

- `vault_path`: local Obsidian vault path
- `git_remote`: GitHub remote URL
- `git_branch`: branch name (default: `main`)

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

1. Create vault directory with `.obsidian/` config
2. `git init` → create GitHub repo → add remote → initial push
3. Configure `vault_path` in Feishu agent config
4. Load `obsidian-vault` skill into agent
