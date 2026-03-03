# PM-Assistant Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy a ToB Product Manager digital assistant (`pm-assistant`) as an independent Docker service with Feishu integration, powered by `requirements-gateway` skill and `self-improving-agent`.

**Architecture:** Independent Docker container running OpenClaw gateway on port 18791, with dedicated workspace, env file, and Feishu bot binding. Skills are symlinked from `randyClaudSkills/skills-src` to the workspace. The `requirements-gateway` skill orchestrates the full requirement lifecycle (Phase 1-6).

**Tech Stack:** OpenClaw gateway, Docker Compose, Feishu WebSocket channel, Claude Opus 4.6 with thinking (medium)

---

### Task 1: Create workspace directory structure

**Files:**

- Create: `workspace-pm-assistant/` (directory)
- Create: `workspace-pm-assistant/skills/` (directory)

**Step 1: Create the workspace directories**

Run:

```bash
cd /Users/mac/Development/openclaw/clawdbot
mkdir -p workspace-pm-assistant/skills
```

**Step 2: Verify structure**

Run:

```bash
ls -la workspace-pm-assistant/
```

Expected: `skills/` directory exists

**Step 3: Commit**

```bash
scripts/committer "feat: create pm-assistant workspace directory" workspace-pm-assistant
```

---

### Task 2: Create AGENTS.md (product manager persona)

**Files:**

- Create: `workspace-pm-assistant/AGENTS.md`

**Step 1: Write AGENTS.md**

Create `workspace-pm-assistant/AGENTS.md` with this content:

```markdown
# PM Assistant

你是"PM Assistant"，一个 ToB 产品经理数字助手，帮助产品经理进行需求分析、产品文档编写和产品规划。

## 核心职责

### 1. 需求收集与分析

- 接收用户发送的文件、图片、URL 或文本描述
- 使用 `requirements-gateway` 进行智能分类和需求提取
- 自动检测冲突和缺口，生成澄清问题
- 管理澄清问题的生命周期

**关键命令：**

- 收到文件 → `/requirements-gateway collect <file>`
- 收到图片 → `/requirements-gateway from-image <path>`
- 收到 URL → `/requirements-gateway from-url <url>`
- 查看待澄清问题 → `/requirements-gateway clarify list`
- 回答澄清 → `/requirements-gateway clarify answer <ID> "answer"`

### 2. 产品文档输出

- 生成业务方案（BIZ）：用户角色矩阵、用例、用户旅程
- 生成产品架构（ARCH）：能力地图、功能架构、模块关系
- 生成产品规格（SPEC）：功能规格、交互规范、数据字典
- 生成版本规划（ROAD）：MVP 范围、迭代计划、优先级矩阵

**关键命令：**

- `/requirements-gateway business` — 业务方案
- `/requirements-gateway product arch` — 产品架构
- `/requirements-gateway product roadmap` — 版本规划
- `/requirements-gateway product spec` — 产品规格

### 3. 飞书同步与追溯

- 同步到飞书五表系统（MOD → REQ → PB → UI → TASK）
- 维护完整的追溯链
- 支持增量对比（Demo vs 需求）

**关键命令：**

- `/requirements-gateway sync` — 全量同步
- `/requirements-gateway trace <id>` — 追溯查询
- `/requirements-gateway from-url <url> --diff` — 增量对比

## 工作模式

1. **收到任何输入时**，首先判断输入类型（文件/图片/URL/文本），然后调用对应的 requirements-gateway 命令
2. **分析完成后**，给出结构化反馈：提取了多少需求/术语/规则，发现了哪些冲突和缺口
3. **有待澄清问题时**，主动列出并引导用户逐一回答
4. **用户请求文档时**，调用对应的 Phase 命令生成

## 工具使用规则

1. 操作飞书多维表格前，先用 `feishu_bitable_get_meta` 解析表格 URL
2. 创建记录前，先用 `feishu_bitable_list_fields` 确认字段名和类型
3. 执行写操作前，告知用户将要执行的操作内容
4. 批量操作前，列出操作清单并获得确认

## 行为准则

- 所有回复使用中文
- 分析结果用结构化格式呈现（表格、列表、状态标记）
- 操作失败时给出具体错误原因和建议
- 不确定用户意图时主动确认
- 不捏造数据，查不到就如实告知
- 遇到错误或用户纠正时，记录学习点（self-improving-agent 自动处理）
```

**Step 2: Verify file**

Run:

```bash
head -5 workspace-pm-assistant/AGENTS.md
```

Expected: `# PM Assistant` header visible

**Step 3: Commit**

```bash
scripts/committer "feat: add pm-assistant AGENTS.md persona" workspace-pm-assistant/AGENTS.md
```

---

### Task 3: Create SOUL.md (communication style)

**Files:**

- Create: `workspace-pm-assistant/SOUL.md`

**Step 1: Write SOUL.md**

Create `workspace-pm-assistant/SOUL.md` with this content:

```markdown
# 人格档案

你叫"PM Assistant"，是一个专业的 ToB 产品经理数字助手。

## 沟通风格

- 语气：专业、严谨、有条理，像一个资深产品经理
- 长度：简洁高效，重点突出。结构化输出优于长段落
- 格式：善用状态标记和结构化反馈
- 语言：中文

## 反馈格式

### 需求收集确认

📥 **已收到输入** ({input_type})

正在分析中...

### 分析结果反馈

📊 **分析完成**

| 类别            | 数量    | 状态      |
| --------------- | ------- | --------- |
| 需求 (REQ)      | {count} | ✅ 已提取 |
| 术语 (TERM)     | {count} | ✅ 已提取 |
| 业务规则 (RULE) | {count} | ✅ 已提取 |
| 冲突            | {count} | ⚠️ 待确认 |
| 缺口            | {count} | ❓ 待澄清 |

### 澄清问题

❓ **待澄清问题**（共 {total} 条）

1. **Q-001**: {question}
   - 来源：{source}
   - 优先级：{priority}

### 文档生成确认

📄 **文档已生成**

- 文档：{doc_name}
- 路径：{path}
- 包含：{sections}

### 飞书同步确认

🔄 **飞书同步完成**

- 模块 (MOD): {mod_count} 条
- 需求 (REQ): {req_count} 条
- 产品功能 (PB): {pb_count} 条

## 边界

- 专注于产品管理相关工作
- 不代替用户做产品决策，提供分析和建议
- 涉及批量操作或飞书写入时必须确认
- 保持分析的客观性，明确标注推断内容
```

**Step 2: Commit**

```bash
scripts/committer "feat: add pm-assistant SOUL.md communication style" workspace-pm-assistant/SOUL.md
```

---

### Task 4: Create openclaw.json gateway config

**Files:**

- Create: `workspace-pm-assistant/openclaw.json`

**Step 1: Write openclaw.json**

Create `workspace-pm-assistant/openclaw.json` with this content:

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
        "id": "pm-assistant",
        "name": "PM Assistant",
        "workspace": "~/.openclaw/workspace-pm-assistant"
      }
    ]
  },
  "bindings": [
    {
      "agentId": "pm-assistant",
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
        "wiki": true,
        "drive": true,
        "perm": false,
        "scopes": true
      }
    }
  }
}
```

**Step 2: Commit**

```bash
scripts/committer "feat: add pm-assistant openclaw.json config" workspace-pm-assistant/openclaw.json
```

---

### Task 5: Create .env.pm-assistant

**Files:**

- Create: `.env.pm-assistant`

**Step 1: Write .env.pm-assistant**

Create `.env.pm-assistant` with this content:

```env
# PM Assistant 专属配置（不提交到 Git）

# API Keys (独立，不共用 .env)
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY
ANTHROPIC_BASE_URL=YOUR_ANTHROPIC_BASE_URL
DASHSCOPE_API_KEY=YOUR_DASHSCOPE_API_KEY

# Feishu App (新机器人)
FEISHU_APP_ID=YOUR_PM_FEISHU_APP_ID
FEISHU_APP_SECRET=YOUR_PM_FEISHU_APP_SECRET

# Gateway port
PM_GATEWAY_PORT=18791
```

**Step 2: Verify .gitignore includes .env files**

Run:

```bash
grep '\.env' /Users/mac/Development/openclaw/clawdbot/.gitignore
```

Expected: `.env*` or `.env.pm-assistant` pattern present. If not, add it.

**Step 3: Do NOT commit** (contains secrets placeholder; user fills in real values)

---

### Task 6: Create docker-compose.pm-assistant.yml

**Files:**

- Create: `docker-compose.pm-assistant.yml`

**Step 1: Write docker-compose.pm-assistant.yml**

Create `docker-compose.pm-assistant.yml` with this content:

```yaml
# Docker Compose for PM Assistant (pm-assistant)
# Usage: docker compose -f docker-compose.pm-assistant.yml up -d

name: openclaw-pm-assistant

services:
  openclaw-gateway:
    build: .
    container_name: openclaw-pm-assistant
    env_file:
      - .env.pm-assistant
    restart: unless-stopped
    volumes:
      - /Volumes/macpro_data/openclaw_data/pm-assistant:/home/node/.openclaw
    environment:
      - HOME=/home/node
    ports:
      - "${PM_GATEWAY_PORT:-18791}:18791"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "18791"]
```

**Step 2: Verify YAML syntax**

Run:

```bash
python3 -c "import yaml; yaml.safe_load(open('docker-compose.pm-assistant.yml'))" && echo "YAML valid"
```

Expected: `YAML valid`

**Step 3: Commit**

```bash
scripts/committer "feat: add docker-compose.pm-assistant.yml" docker-compose.pm-assistant.yml
```

---

### Task 7: Symlink skills to workspace

**Files:**

- Create: `workspace-pm-assistant/skills/requirements-gateway` (symlink)
- Create: `workspace-pm-assistant/skills/requirements-doc-suite` (symlink)
- Create: `workspace-pm-assistant/skills/v2-requirements-analyzer` (symlink)
- Create: `workspace-pm-assistant/skills/v2-requirements-registry` (symlink)
- Create: `workspace-pm-assistant/skills/lark-project-management` (symlink)

**Step 1: Create symlinks for requirement skills**

```bash
cd /Users/mac/Development/openclaw/clawdbot/workspace-pm-assistant/skills

SKILLS_SRC="/Users/mac/Development/develop/randyClaudSkills/skills-src"

ln -s "$SKILLS_SRC/requirements-gateway" requirements-gateway
ln -s "$SKILLS_SRC/requirements-doc-suite" requirements-doc-suite
ln -s "$SKILLS_SRC/v2-requirements-analyzer" v2-requirements-analyzer
ln -s "$SKILLS_SRC/v2-requirements-registry" v2-requirements-registry
ln -s "$SKILLS_SRC/lark-project-management" lark-project-management
```

**Step 2: Install self-improving-agent**

```bash
cd /Users/mac/Development/openclaw/clawdbot/workspace-pm-assistant/skills
git clone https://github.com/peterskoett/self-improving-agent.git self-improving-agent
```

If `git clone` is not desired in the workspace, alternatively:

```bash
clawhub install self-improving-agent --path /Users/mac/Development/openclaw/clawdbot/workspace-pm-assistant/skills/self-improving-agent
```

**Step 3: Verify all skills**

```bash
ls -la /Users/mac/Development/openclaw/clawdbot/workspace-pm-assistant/skills/
```

Expected: 6 entries (5 symlinks + 1 directory for self-improving-agent)

**Step 4: Verify symlinks resolve**

```bash
ls /Users/mac/Development/openclaw/clawdbot/workspace-pm-assistant/skills/requirements-gateway/SKILL.md
```

Expected: File exists and is readable

**Step 5: Commit** (symlinks only; self-improving-agent may be .gitignored)

```bash
scripts/committer "feat: symlink requirement skills to pm-assistant workspace" workspace-pm-assistant/skills
```

---

### Task 8: Prepare data volume and deploy

**Files:**

- No repo files; host filesystem setup

**Step 1: Create data volume directory**

```bash
sudo mkdir -p /Volumes/macpro_data/openclaw_data/pm-assistant
sudo chown -R $(whoami) /Volumes/macpro_data/openclaw_data/pm-assistant
```

**Step 2: Copy workspace files to data volume**

```bash
# Copy workspace files that the container will use
cp -r /Users/mac/Development/openclaw/clawdbot/workspace-pm-assistant \
  /Volumes/macpro_data/openclaw_data/pm-assistant/workspace-pm-assistant

# Copy openclaw.json to the right location
cp /Users/mac/Development/openclaw/clawdbot/workspace-pm-assistant/openclaw.json \
  /Volumes/macpro_data/openclaw_data/pm-assistant/openclaw.json
```

**Step 3: Fill in real credentials**

Edit `/Volumes/macpro_data/openclaw_data/pm-assistant/openclaw.json`:

- Replace `YOUR_FEISHU_APP_ID` with real App ID
- Replace `YOUR_FEISHU_APP_SECRET` with real App Secret

Edit `.env.pm-assistant`:

- Fill in real `ANTHROPIC_API_KEY`, `FEISHU_APP_ID`, `FEISHU_APP_SECRET`

**Step 4: Build and start container**

```bash
cd /Users/mac/Development/openclaw/clawdbot
docker compose -f docker-compose.pm-assistant.yml up -d --build
```

**Step 5: Verify container is running**

```bash
docker ps | grep pm-assistant
```

Expected: `openclaw-pm-assistant` container running

**Step 6: Check gateway logs**

```bash
docker logs openclaw-pm-assistant --tail 50
```

Expected: Gateway started on port 18791, Feishu channel connected

---

### Task 9: Verify end-to-end

**Step 1: Check gateway health**

```bash
docker exec openclaw-pm-assistant node openclaw.mjs channels status --probe
```

Expected: Feishu channel shows connected

**Step 2: Send test message via Feishu**

Send a simple text message to the PM Assistant bot in Feishu (e.g., "你好，我想整理一份需求文档").

Expected: Bot responds in Chinese with structured feedback

**Step 3: Test file input**

Send a document (e.g., a requirements PDF or image) to the bot.

Expected: Bot uses requirements-gateway to analyze and provide structured feedback (extracted requirements count, terms, conflicts, gaps)

**Step 4: Verify self-improving-agent**

After a few interactions, check if learning files are created:

```bash
docker exec openclaw-pm-assistant ls -la /home/node/.openclaw/workspace-pm-assistant/LEARNINGS.md 2>/dev/null && echo "exists" || echo "not yet"
```

---

## Summary

| Task      | Description                     | Commits       |
| --------- | ------------------------------- | ------------- |
| 1         | Create workspace directory      | 1             |
| 2         | AGENTS.md persona               | 1             |
| 3         | SOUL.md communication style     | 1             |
| 4         | openclaw.json config            | 1             |
| 5         | .env.pm-assistant (no commit)   | 0             |
| 6         | docker-compose.pm-assistant.yml | 1             |
| 7         | Symlink skills                  | 1             |
| 8         | Deploy to Docker                | 0             |
| 9         | End-to-end verification         | 0             |
| **Total** |                                 | **5 commits** |
