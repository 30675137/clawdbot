# 飞书团队数字助手 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy a Feishu team digital assistant that manages meeting minutes, tasks, and documents via OpenClaw Gateway + Feishu plugin, running in Docker Compose.

**Architecture:** Zero-code approach — configure an OpenClaw Agent workspace with AGENTS.md, SOUL.md, TOOLS.md, and custom Skills (meeting-minutes, task-management). The agent uses built-in feishu plugin tools (`feishu_bitable_*`, `feishu_doc`, `feishu_wiki`) to interact with Feishu Bitable for data storage. Deployed via Docker Compose with Qwen 3.5 (DashScope) as the LLM.

**Tech Stack:** OpenClaw Gateway, Feishu Plugin (WebSocket), DashScope/Qwen 3.5, Docker Compose, Feishu Bitable

**Design Doc:** `docs/plans/2026-03-01-digital-assistant-design.md`

---

### Task 1: Create Agent Workspace Directory Structure

**Files:**

- Create: `workspace/AGENTS.md`
- Create: `workspace/SOUL.md`
- Create: `workspace/TOOLS.md`
- Create: `workspace/skills/meeting-minutes.md`
- Create: `workspace/skills/task-management.md`

The `workspace/` directory at repo root will be bind-mounted into the Docker container at `~/.openclaw/workspace-digital-assistant`.

**Step 1: Create the workspace directory**

```bash
mkdir -p workspace/skills
```

**Step 2: Commit the empty structure**

```bash
git add workspace/
git commit -m "chore: create digital-assistant workspace directory structure"
```

---

### Task 2: Write AGENTS.md — Core Responsibilities

**Files:**

- Create: `workspace/AGENTS.md`

**Step 1: Write AGENTS.md**

```markdown
# 团队助手

你是一个飞书团队数字助手，帮助团队管理会议纪要、任务跟踪和文档检索。

## 核心职责

### 1. 会议纪要管理

- 接收用户发送的会议记录文本
- 提取关键信息：日期、参与者、议题、决议、待办事项（含负责人和截止日期）
- 将结构化纪要写入飞书多维表格
- 将产生的待办事项自动创建为任务

### 2. 任务跟踪

- 在飞书多维表格中创建、更新、查询任务
- 支持按负责人、状态、截止日期筛选
- 支持更新任务进度和状态
- 提供任务摘要和统计

### 3. 文档检索

- 搜索和阅读飞书文档、Wiki 知识库
- 回答团队知识相关的问题
- 提供文档链接和摘要

## 工具使用规则

1. 操作多维表格前，先用 `feishu_bitable_get_meta` 解析表格 URL 获取 app_token 和 table_id
2. 创建记录前，先用 `feishu_bitable_list_fields` 确认字段名和类型
3. 执行写操作前，先告知用户将要执行的操作内容
4. 批量操作前，先列出将要执行的操作清单并获得确认

## 行为准则

- 所有回复使用中文
- 操作成功后给出简洁的确认信息
- 操作失败时给出具体的错误原因和建议
- 不确定用户意图时主动确认
- 不要捏造数据，查不到就如实告知
```

**Step 2: Commit**

```bash
scripts/committer "feat: add AGENTS.md for digital-assistant workspace" workspace/AGENTS.md
```

---

### Task 3: Write SOUL.md — Personality Definition

**Files:**

- Create: `workspace/SOUL.md`

**Step 1: Write SOUL.md**

```markdown
# 人格档案

你叫"小助"，是团队的数字助手。

## 沟通风格

- 语气：专业但友好，像一个靠谱的同事
- 长度：简洁明了，避免啰嗦。列表优于长段落
- 格式：善用 emoji 标记状态（✅ 完成、⏳ 进行中、❌ 失败、📋 任务、📝 纪要）
- 语言：中文

## 回复模板

### 会议纪要确认

📝 **会议纪要已记录**

- 日期：{date}
- 主题：{title}
- 参与者：{participants}
- 决议 {count} 条，待办 {todo_count} 条

### 任务创建确认

📋 **任务已创建**

- 任务：{name}
- 负责人：{assignee}
- 截止：{deadline}

### 任务查询结果

📊 **任务概览**（共 {total} 条）

- ⏳ 进行中：{in_progress} 条
- ✅ 已完成：{completed} 条
- ❌ 待办：{pending} 条

## 边界

- 只处理与工作相关的请求
- 不代替用户做决策，只提供信息和执行操作
- 涉及敏感操作（删除、批量修改）时必须二次确认
```

**Step 2: Commit**

```bash
scripts/committer "feat: add SOUL.md personality definition" workspace/SOUL.md
```

---

### Task 4: Write TOOLS.md — Tool Usage Guide

**Files:**

- Create: `workspace/TOOLS.md`

**Step 1: Write TOOLS.md**

需要引用飞书内置工具的准确名称和参数。参考 `extensions/feishu/src/bitable.ts`、`docx.ts`、`wiki.ts`。

```markdown
# 工具使用指南

## 多维表格工具 (Bitable)

### feishu_bitable_get_meta

解析多维表格 URL，获取 app_token 和 table_id。

- 输入：`url` — 多维表格链接
- 输出：app_token, table_id, 表格列表
- **必须首先调用此工具**来获取操作其他 bitable 工具所需的 token

### feishu_bitable_list_fields

列出表格的所有字段（列）及其类型。

- 输入：`app_token`, `table_id`
- 在创建/更新记录前先调用，确认字段名和类型

### feishu_bitable_list_records

分页列出表格记录。

- 输入：`app_token`, `table_id`, `page_size`(可选), `page_token`(可选), `filter`(可选)
- filter 示例：`CurrentValue.[状态] = "待办"`

### feishu_bitable_create_record

创建一条记录。

- 输入：`app_token`, `table_id`, `fields` — 字段名到值的映射
- 字段值格式取决于字段类型（文本=字符串，日期=毫秒时间戳，单选=选项值）

### feishu_bitable_update_record

更新一条记录。

- 输入：`app_token`, `table_id`, `record_id`, `fields`

### feishu_bitable_create_app

创建新的多维表格应用。

### feishu_bitable_create_field

在表格中创建新字段。

- 字段类型：1=文本, 2=数字, 3=单选, 4=多选, 5=日期, 11=人员, 1001=创建时间, 1005=自动编号

## 文档工具

### feishu_doc

统一文档操作工具，通过 `action` 参数指定操作：

- `read` — 读取文档内容（返回 Markdown）
- `write` — 替换文档全部内容
- `append` — 在文档末尾追加内容
- `create` — 创建新文档
- `list_blocks` — 列出文档块
- `update_block` — 更新指定块

## Wiki 工具

### feishu_wiki

统一知识库操作工具：

- `spaces` — 列出知识空间
- `nodes` — 浏览空间内节点
- `get` — 获取节点详情
- `create` — 创建新节点

## 重要提示

1. 多维表格 URL 格式：`https://xxx.feishu.cn/base/XXX?table=YYY`
2. 人员字段需要使用飞书 open_id 格式
3. 日期字段使用毫秒时间戳
4. 单选字段的值必须是已存在的选项，否则会自动创建
```

**Step 2: Commit**

```bash
scripts/committer "feat: add TOOLS.md tool usage guide" workspace/TOOLS.md
```

---

### Task 5: Write Meeting Minutes Skill

**Files:**

- Create: `workspace/skills/meeting-minutes.md`

**Step 1: Write the skill**

```markdown
# 会议纪要管理

当用户发送包含"会议纪要"、"会议记录"、"纪要"等关键词的消息时，使用此流程。

## 处理流程

### 第一步：解析会议内容

从用户发送的文本中提取以下信息：

- **日期**：会议日期（如未提及则使用当天日期）
- **标题**：会议主题
- **参与者**：参会人员列表
- **摘要**：3-5 句话的会议要点总结
- **决议**：明确的决定事项
- **待办事项**：需要后续跟进的事项，包含负责人和截止日期

### 第二步：确认提取结果

向用户展示提取的结构化信息，格式如下：

📝 **我提取了以下会议信息，请确认：**

| 项目   | 内容           |
| ------ | -------------- |
| 日期   | {date}         |
| 主题   | {title}        |
| 参与者 | {participants} |

**摘要：** {summary}

**决议：**

1. {decision_1}
2. {decision_2}

**待办事项：**

- [ ] {todo_1} — 负责人：{assignee} 截止：{deadline}
- [ ] {todo_2} — 负责人：{assignee} 截止：{deadline}

确认无误后我将写入多维表格。

### 第三步：写入多维表格

用户确认后：

1. 调用 `feishu_bitable_get_meta` 获取会议纪要表的 app_token 和 table_id
2. 调用 `feishu_bitable_create_record` 创建会议纪要记录
3. 对每条待办事项，调用任务跟踪表的 `feishu_bitable_create_record` 创建任务，关联本次会议

### 第四步：回复确认

📝 **会议纪要已记录**

- 纪要已写入：{bitable_link}
- 自动创建了 {count} 条待办任务

## 注意事项

- 如果用户没有提供多维表格链接，询问用户提供会议纪要表和任务跟踪表的链接
- 首次使用时记住表格链接，后续自动使用
- 如果提取信息不完整，标注缺失项并询问用户补充
- 参与者如能匹配到飞书用户则使用 open_id，否则使用文本
```

**Step 2: Commit**

```bash
scripts/committer "feat: add meeting-minutes skill" workspace/skills/meeting-minutes.md
```

---

### Task 6: Write Task Management Skill

**Files:**

- Create: `workspace/skills/task-management.md`

**Step 1: Write the skill**

```markdown
# 任务管理

当用户发送包含"任务"、"待办"、"进度"等关键词的消息时，使用此流程。

## 命令模式

### 创建任务

触发词：创建任务、新建任务、添加任务

示例：`创建任务 完成需求评审 负责人 @张三 截止 3月15日 优先级 高`

解析规则：

- 任务名：紧跟"创建任务"后的文本
- 负责人：@ 提到的人
- 截止日期：识别日期表达（明天、下周五、3月15日等）
- 优先级：高/中/低（默认：中）
- 状态：默认"待办"

流程：

1. 解析命令提取字段
2. 展示将要创建的任务信息并确认
3. 调用 `feishu_bitable_create_record` 写入任务跟踪表
4. 回复确认：📋 **任务已创建** — {任务名} | {负责人} | 截止 {日期}

### 查询任务

触发词：查看任务、我的任务、所有任务、任务列表、待办列表

解析规则：

- "我的任务" → 按当前发送者筛选
- "所有待办" → 状态="待办"
- "@张三 的任务" → 按指定人筛选
- "本周到期的任务" → 按截止日期筛选

流程：

1. 解析筛选条件
2. 调用 `feishu_bitable_list_records` 带 filter 查询
3. 格式化输出：

📊 **任务列表**（共 {total} 条）

| #   | 任务 | 负责人 | 状态 | 截止日期 |
| --- | ---- | ------ | ---- | -------- |
| 1   | ...  | ...    | ⏳   | ...      |

### 更新任务

触发词：完成任务、更新任务、修改任务

示例：

- `完成任务 完成需求评审`
- `更新任务 完成需求评审 进度 80%`
- `修改任务 完成需求评审 截止 3月20日`

流程：

1. 通过任务名或关键词在表中搜索匹配记录
2. 如果匹配多条，列出候选让用户选择
3. 展示修改内容并确认
4. 调用 `feishu_bitable_update_record` 更新
5. 回复确认：✅ **任务已更新** — {任务名} → {变更内容}

## 注意事项

- 首次使用时需要用户提供任务跟踪表的多维表格链接
- 记住表格链接供后续使用
- 模糊匹配任务名时，列出候选而非猜测
- 日期解析：支持"明天"、"后天"、"下周一"、"3/15"、"3月15日"等格式
```

**Step 2: Commit**

```bash
scripts/committer "feat: add task-management skill" workspace/skills/task-management.md
```

---

### Task 7: Create Docker Compose Configuration

**Files:**

- Create: `docker-compose.digital-assistant.yml`
- Create: `.env.example`

**Step 1: Write docker-compose.digital-assistant.yml**

独立的 compose 文件，不修改已有的 `docker-compose.yml`。

```yaml
# Docker Compose for Digital Assistant
# Usage: docker compose -f docker-compose.digital-assistant.yml up -d

services:
  openclaw-gateway:
    build: .
    container_name: openclaw-digital-assistant
    restart: unless-stopped
    volumes:
      - openclaw-data:/home/node/.openclaw
      - ./workspace:/home/node/.openclaw/workspace-digital-assistant
    environment:
      - HOME=/home/node
      - DASHSCOPE_API_KEY=${DASHSCOPE_API_KEY}
    ports:
      - "${GATEWAY_PORT:-18789}:18789"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "loopback", "--port", "18789", "--force"]

volumes:
  openclaw-data:
```

**Step 2: Write .env.example**

```bash
# Feishu App Credentials (from open.feishu.cn)
FEISHU_APP_ID=cli_xxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# DashScope API Key (from dashscope.aliyuncs.com)
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Gateway port (optional, default 18789)
GATEWAY_PORT=18789
```

**Step 3: Commit**

```bash
scripts/committer "feat: add docker-compose for digital-assistant deployment" docker-compose.digital-assistant.yml .env.example
```

---

### Task 8: Create Gateway Configuration Template

**Files:**

- Create: `workspace/openclaw.json.example`

This is a reference config file. The actual config will be placed at `~/.openclaw/openclaw.json` inside the container (via the `openclaw-data` volume).

**Step 1: Write the config template**

```json5
// OpenClaw Gateway Configuration for Digital Assistant
// Copy this file to ~/.openclaw/openclaw.json (inside container: /home/node/.openclaw/openclaw.json)
// Or mount it via docker volume
{
  gateway: {
    mode: "local",
  },
  models: {
    default: "dashscope/qwen3.5-plus",
  },
  agents: {
    list: [
      {
        id: "digital-assistant",
        name: "团队助手",
        workspace: "~/.openclaw/workspace-digital-assistant",
        model: "dashscope/qwen3.5-plus",
      },
    ],
  },
  bindings: [
    {
      agentId: "digital-assistant",
      match: {
        channel: "feishu",
      },
    },
  ],
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "open",
      groupPolicy: "open",
      requireMention: true,
      accounts: {
        main: {
          appId: "YOUR_FEISHU_APP_ID",
          appSecret: "YOUR_FEISHU_APP_SECRET",
        },
      },
      tools: {
        doc: true,
        wiki: true,
        drive: true,
        perm: false,
        scopes: true,
      },
    },
  },
}
```

**Step 2: Commit**

```bash
scripts/committer "feat: add openclaw.json.example gateway config template" workspace/openclaw.json.example
```

---

### Task 9: Create Setup Guide (README)

**Files:**

- Create: `workspace/README.md`

**Step 1: Write the setup guide**

````markdown
# 飞书团队数字助手 — 部署指南

## 前置条件

1. Docker & Docker Compose
2. 飞书企业自建应用（App ID + App Secret）
3. 通义千问 DashScope API Key

## 飞书应用配置

1. 登录 [飞书开放平台](https://open.feishu.cn)
2. 创建企业自建应用
3. 开启"机器人"能力
4. 在"权限管理"中开启以下权限：
   - `im:message` — 接收和发送消息
   - `im:message.group_at_msg` — 群消息（@机器人）
   - `bitable:app` — 多维表格读写
   - `docx:document` — 文档读写
   - `wiki:wiki` — 知识库访问
5. 发布应用版本
6. 记录 App ID 和 App Secret

## 部署步骤

### 1. 准备环境变量

```bash
cp .env.example .env
# 编辑 .env 填入实际的 App ID、App Secret、DashScope API Key
```
````

### 2. 准备 Gateway 配置

首次启动前，需要将配置注入到容器中：

```bash
# 启动容器（首次会自动创建 volume）
docker compose -f docker-compose.digital-assistant.yml up -d

# 将配置复制到容器中
docker cp workspace/openclaw.json.example \
  openclaw-digital-assistant:/home/node/.openclaw/openclaw.json

# 编辑容器内的配置文件，替换 App ID 和 App Secret
docker exec -it openclaw-digital-assistant sh -c \
  "sed -i 's/YOUR_FEISHU_APP_ID/'$FEISHU_APP_ID'/g; s/YOUR_FEISHU_APP_SECRET/'$FEISHU_APP_SECRET'/g' /home/node/.openclaw/openclaw.json"

# 重启容器使配置生效
docker compose -f docker-compose.digital-assistant.yml restart
```

### 3. 验证

```bash
# 查看日志
docker logs -f openclaw-digital-assistant

# 应该看到：
# - Gateway started
# - Feishu channel connected (WebSocket)
```

### 4. 测试

1. 在飞书中找到机器人，发送私聊消息测试
2. 将机器人拉入群聊，@机器人 发送消息测试
3. 发送"帮我创建一个任务 测试数字助手 截止明天"测试任务功能

## 多维表格设置

首次使用会议纪要或任务管理功能时，需要：

1. 在飞书中创建一个多维表格
2. 创建"会议纪要"表，字段：日期、标题、参与者、摘要、决议、记录人
3. 创建"任务跟踪"表，字段：任务名、负责人、状态（单选：待办/进行中/已完成/已取消）、优先级（单选：高/中/低）、截止日期、进度、关联会议
4. 将表格链接发送给机器人

## 故障排查

- **机器人无响应**：检查 App ID/Secret 是否正确，应用是否已发布
- **工具调用失败**：检查应用权限是否已开启并审批通过
- **多维表格操作失败**：确认机器人有表格的编辑权限

````

**Step 2: Commit**

```bash
scripts/committer "docs: add digital-assistant setup guide" workspace/README.md
````

---

### Task 10: Verify and Test Locally

**Step 1: Verify all workspace files exist**

```bash
ls -la workspace/
ls -la workspace/skills/
```

Expected:

```
workspace/
├── AGENTS.md
├── SOUL.md
├── TOOLS.md
├── README.md
├── openclaw.json.example
└── skills/
    ├── meeting-minutes.md
    └── task-management.md
```

**Step 2: Verify Docker build works**

```bash
docker compose -f docker-compose.digital-assistant.yml build
```

Expected: Build succeeds without errors.

**Step 3: Verify compose file is valid**

```bash
docker compose -f docker-compose.digital-assistant.yml config
```

Expected: Outputs resolved config without errors.

**Step 4: Final commit (if any fixes needed)**

```bash
# Only if changes were made during verification
scripts/committer "fix: address issues found during verification" <changed-files>
```
