# Obsidian Vault Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create an OpenClaw workspace skill that automatically saves Feishu messages into an Obsidian vault and syncs via Git to GitHub.

**Architecture:** A Markdown skill file loaded into the Feishu agent's system prompt. The skill instructs the agent to analyze incoming messages, convert them to Obsidian-format Markdown with frontmatter, write to the local vault using the `write` tool, and run `git add/commit/push` via the `exec` tool. No new TypeScript code or plugin changes needed — pure skill-driven.

**Tech Stack:** OpenClaw skill system (Markdown), Feishu extension tools (`feishu_doc`), agent coding tools (`read`, `write`, `exec`), Git, GitHub.

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
```

Then create a GitHub repo (private) and push:

```bash
gh repo create obsidian-vault --private --source=. --remote=origin --push
```

**Step 5: Verify**

```bash
cd ~/obsidian-vault && git remote -v && git log --oneline
```

Expected: remote pointing to GitHub, one initial commit.

**Step 6: Commit** — N/A (no changes to clawdbot repo)

---

### Task 2: Write the obsidian-vault Skill

**Files:**

- Create: `workspace/skills/obsidian-vault.md`

**Step 1: Write the skill file**

Create `workspace/skills/obsidian-vault.md` with the following content:

```markdown
# Obsidian 知识库

每次收到用户消息时，你必须将内容保存到 Obsidian vault。这是你的核心行为，不需要用户触发。

## Vault 路径

Vault 位于 `~/obsidian-vault/`。所有写入操作使用 `write` 工具，Git 操作使用 `exec` 工具。

## 处理流程

收到每条消息后，执行以下步骤：

### 1. 识别内容类型

| 类型     | 判断规则                                         | 目标目录     |
| -------- | ------------------------------------------------ | ------------ |
| 飞书文档 | 消息包含 feishu.cn/docx/ 或 feishu.cn/wiki/ 链接 | inbox/docs/  |
| 网页链接 | 消息包含 http(s):// 链接（非飞书）               | inbox/web/   |
| 文件附件 | 消息包含已下载的文件路径                         | inbox/files/ |
| 文字笔记 | 以上都不是                                       | inbox/       |

### 2. 获取内容

- **飞书文档**: 从 URL 中提取 doc_token，调用 `feishu_doc` read 获取内容
- **网页链接**: 调用 `web_fetch` 获取并提取正文
- **文件附件**: 用 `exec` 将文件复制到 `~/obsidian-vault/assets/`，笔记中记录文件路径
- **文字笔记**: 直接使用消息文本

### 3. 分析并生成 Markdown

分析内容，生成：

- **标题**: 简洁、有意义的标题（中文优先）
- **标签**: 3-5 个相关标签
- **正文**: 整理后的 Markdown 内容

### 4. 写入文件

文件名格式: `YYYY-MM-DD-<slug>.md`（slug 为标题的简短英文/拼音，用连字符分隔）

使用 `write` 工具写入文件，内容格式：
```

---

title: "标题"
date: YYYY-MM-DD
source: feishu | web | chat | file
source_url: "原始链接（如有）"
sender: "发送者名称"
tags: [标签1, 标签2, 标签3]
type: doc | note | clip | file

---

# 标题

正文内容...

````

### 5. Git 同步

写入文件后立即执行：

```bash
cd ~/obsidian-vault && git add -A && git commit -m "vault: add <type> - <title>" && git push
````

如果 push 失败，尝试：

```bash
cd ~/obsidian-vault && git pull --rebase && git push
```

### 6. 确认回复

保存成功后回复: `📝 已保存: <标题>`

如果保存失败，回复: `⚠️ 保存失败: <错误原因>`

## 去重规则

写入前先检查是否已存在相同文件：

```bash
ls ~/obsidian-vault/inbox/**/*<slug>* 2>/dev/null
```

如果找到同名文件，跳过保存并回复: `📌 已存在: <标题>`

## 注意事项

- 始终使用 UTF-8 编码
- frontmatter 中的字符串值用双引号包裹
- 标签不要包含空格，使用连字符连接多字词
- 文件附件只保存元信息到笔记，原始文件复制到 assets/
- 每条消息独立处理，不要合并多条消息

````

**Step 2: Verify skill file syntax**

```bash
head -5 workspace/skills/obsidian-vault.md
````

Expected: starts with `# Obsidian 知识库`

**Step 3: Commit**

```bash
scripts/committer "feat: add obsidian-vault skill for knowledge management" workspace/skills/obsidian-vault.md
```

---

### Task 3: Test the Skill End-to-End

This is a manual verification task. Run these checks on the machine where OpenClaw + Feishu agent is running.

**Step 1: Ensure vault is initialized (Task 1)**

```bash
ls ~/obsidian-vault/inbox/ && git -C ~/obsidian-vault status
```

Expected: directories exist, clean git working tree.

**Step 2: Restart the OpenClaw gateway to pick up the new skill**

Follow the standard restart procedure for the Feishu agent.

**Step 3: Send a test text message via Feishu**

Send: `测试知识库保存：这是一条测试笔记`

Expected:

- Agent replies: `📝 已保存: 测试笔记` (or similar)
- File created at `~/obsidian-vault/inbox/YYYY-MM-DD-test-note.md`
- Git commit and push completed

**Step 4: Verify the saved note**

```bash
ls ~/obsidian-vault/inbox/*.md
cat ~/obsidian-vault/inbox/$(ls -t ~/obsidian-vault/inbox/*.md | head -1)
git -C ~/obsidian-vault log --oneline -3
```

Expected: note with frontmatter, pushed to GitHub.

**Step 5: Test Feishu doc link**

Send a Feishu doc URL via Feishu. Verify it reads the doc and saves to `inbox/docs/`.

**Step 6: Test web link**

Send a web URL. Verify it fetches and saves to `inbox/web/`.

**Step 7: Test dedup**

Send the same content again. Expected: `📌 已存在` response, no duplicate file.

**Step 8: Verify on GitHub**

Check the GitHub repo page to confirm all notes are pushed.

---

### Task 4: Document Setup in Agent Config (Optional)

If the Feishu agent uses a dedicated workspace, ensure the skill is accessible.

**Step 1: Check current agent workspace config**

```bash
cat workspace/openclaw.json.example | grep -A5 feixiaozhu
```

**Step 2: If the agent workspace is separate from the repo workspace**

Copy or symlink the skill:

```bash
# If agent workspace is at ~/.openclaw/workspace-feixiaozhu
cp workspace/skills/obsidian-vault.md ~/.openclaw/workspace-feixiaozhu/skills/
```

Or add the repo skills directory to the agent's skill load path in config.

**Step 3: Commit any config changes**

```bash
scripts/committer "docs: add obsidian-vault skill setup notes" <changed-files>
```
