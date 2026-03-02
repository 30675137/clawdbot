# Obsidian Vault Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a dedicated OpenClaw agent ("知识库助手") with独立飞书机器人, automatically saving Feishu messages into an Obsidian vault and syncing via Git to GitHub.

**Architecture:** A standalone agent `obsidian-openclaw` with its own Feishu bot application, workspace, and skill. The `obsidian-vault` skill instructs the agent to analyze incoming messages, convert them to Obsidian-format Markdown with frontmatter, write to the local vault using the `write` tool, and run `git add/commit/push` via the `exec` tool.

**Tech Stack:** OpenClaw agent + skill system (Markdown), Feishu extension (dedicated bot account), agent coding tools (`read`, `write`, `exec`), Git, GitHub.

---

### Task 1: Initialize Obsidian Vault with Git

**Files:**

- Create: `~/obsidian-vault/` (local vault directory)
- Create: `~/obsidian-vault/.obsidian/app.json` (Obsidian config)
- Create: `~/obsidian-vault/inbox/` + subdirectories
- Create: `~/obsidian-vault/.gitignore`

**Step 1: Create vault directory structure**

```bash
mkdir -p ~/obsidian-vault/inbox/docs
mkdir -p ~/obsidian-vault/inbox/web
mkdir -p ~/obsidian-vault/inbox/files
mkdir -p ~/obsidian-vault/assets
mkdir -p ~/obsidian-vault/templates
mkdir -p ~/obsidian-vault/.obsidian
```

**Step 2: Create .gitignore**

```bash
cat > ~/obsidian-vault/.gitignore << 'EOF'
.obsidian/workspace.json
.obsidian/workspace-mobile.json
.trash/
.DS_Store
EOF
```

**Step 3: Create minimal Obsidian config**

```bash
cat > ~/obsidian-vault/.obsidian/app.json << 'EOF'
{
  "showFrontmatter": true,
  "defaultViewMode": "preview"
}
EOF
```

**Step 4: Initialize Git and push to GitHub**

```bash
cd ~/obsidian-vault
git init
git add -A
git commit -m "vault: initial structure"
gh repo create obsidian-vault --private --source=. --remote=origin --push
```

**Step 5: Verify**

```bash
cd ~/obsidian-vault && git remote -v && git log --oneline
```

Expected: remote pointing to GitHub, one initial commit.

---

### Task 2: Write the obsidian-vault Skill

**Files:**

- Create: `workspace/skills/obsidian-vault.md`

Write the skill file that instructs the agent on the full workflow: content type identification, fetching (feishu_doc/web_fetch/exec), Markdown generation with frontmatter, file writing, git sync, dedup, and confirmation replies.

Key skill behaviors:

- Auto-save every incoming message (no command trigger needed)
- Content type priority: feishu doc > web link > file attachment > text note
- Frontmatter fields: title, date, source, source_url, sender, tags, type
- File naming: `YYYY-MM-DD-<slug>.md`
- Git: add + commit + push after each write, with rebase retry and conflict abort
- Dedup: check target directory for existing slug before writing
- Reply: confirm with title or report error

Commit: `scripts/committer "feat: add obsidian-vault skill for knowledge management" workspace/skills/obsidian-vault.md`

---

### Task 3: Create Dedicated Agent Workspace

**Files:**

- Create: `~/.openclaw/workspace-obsidian-openclaw/skills/` (agent workspace)
- Modify: `workspace/openclaw.json.example` (config template)

**Step 1: Create agent workspace and deploy skill**

```bash
mkdir -p ~/.openclaw/workspace-obsidian-openclaw/skills
cp workspace/skills/obsidian-vault.md ~/.openclaw/workspace-obsidian-openclaw/skills/
```

**Step 2: Update `openclaw.json.example`**

Add to `agents.list`:

```json
{
  "id": "obsidian-openclaw",
  "name": "知识库助手",
  "workspace": "~/.openclaw/workspace-obsidian-openclaw"
}
```

Add to `bindings`:

```json
{
  "agentId": "obsidian-openclaw",
  "match": {
    "channel": "feishu",
    "account": "obsidian"
  }
}
```

Add to `channels.feishu.accounts`:

```json
"obsidian": {
  "appId": "YOUR_OBSIDIAN_BOT_APP_ID",
  "appSecret": "YOUR_OBSIDIAN_BOT_APP_SECRET"
}
```

Commit: `scripts/committer "feat: add obsidian-openclaw agent with dedicated feishu account" workspace/openclaw.json.example`

---

### Task 4: Create Feishu Bot Application (Manual)

This task is done in the Feishu developer console, not in code.

**Step 1: Go to Feishu Open Platform**

Open https://open.feishu.cn/app and log in.

**Step 2: Create new application**

- Click "创建自建应用"
- App name: `知识库助手`
- Description: `Obsidian 知识库管理机器人，自动保存消息为笔记`

**Step 3: Enable bot capability**

- Go to "添加应用能力" → enable "机器人"

**Step 4: Configure permissions**

Required scopes:

- `im:message` — receive messages
- `im:message:send_as_bot` — send replies
- `contact:user.id:readonly` — resolve sender names
- `docx:document:readonly` — read Feishu documents (for doc links)
- `wiki:wiki:readonly` — read Wiki pages (for wiki links)

**Step 5: Configure event subscription**

- Enable WebSocket mode (recommended) or Webhook
- Subscribe to event: `im.message.receive_v1`

**Step 6: Publish the application**

- Go to "版本管理" → create version → submit for review
- After approval, the bot is available in Feishu

**Step 7: Record credentials**

Copy `App ID` and `App Secret`, fill into `~/.openclaw/openclaw.json`:

```json
"obsidian": {
  "appId": "<paste App ID>",
  "appSecret": "<paste App Secret>"
}
```

---

### Task 5: Deploy and Test End-to-End

**Step 1: Update live config**

Edit `~/.openclaw/openclaw.json` with real `appId` and `appSecret` from Task 4.

**Step 2: Restart OpenClaw gateway**

```bash
# Via Mac app or:
scripts/restart-mac.sh
```

**Step 3: Verify agent is loaded**

```bash
openclaw channels status --probe
```

Expected: feishu channel shows two accounts (`main` + `obsidian`), both connected.

**Step 4: Test text message**

In Feishu, find "知识库助手" bot and send: `测试知识库保存：这是一条测试笔记`

Expected:

- Bot replies: `📝 已保存: 测试笔记` (or similar)
- File created at `~/obsidian-vault/inbox/YYYY-MM-DD-<slug>.md`
- Git commit and push completed

**Step 5: Verify saved note**

```bash
ls ~/obsidian-vault/inbox/*.md
cat "$(ls -t ~/obsidian-vault/inbox/*.md | head -1)"
git -C ~/obsidian-vault log --oneline -3
```

**Step 6: Test Feishu doc link**

Send a Feishu doc URL to the bot. Verify it reads the doc and saves to `inbox/docs/`.

**Step 7: Test web link**

Send a web URL. Verify it fetches and saves to `inbox/web/`.

**Step 8: Test dedup**

Send the same content again. Expected: `📌 已存在` response, no duplicate file.

**Step 9: Verify on GitHub**

Check the GitHub repo to confirm all notes are pushed.
