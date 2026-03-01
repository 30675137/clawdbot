# 飞书团队数字助手设计文档

> 日期: 2026-03-01
> 方案: B — Agent 工作区 + 自定义 Skills（零代码）
> 模型: Qwen 3.5 (DashScope)
> 部署: Docker Compose 单机

## 概述

通过 OpenClaw Gateway 的 Agent 配置 + 飞书插件内置工具，构建一个飞书群团队助手。核心能力包括会议纪要管理、任务跟踪和文档检索，数据存储在飞书多维表格中。

## 架构

```
飞书用户 (群/私聊)
    │
    ▼ WebSocket (长连接)
┌──────────────────────────────────┐
│   Docker Container               │
│                                  │
│   OpenClaw Gateway               │
│   ├── Feishu Plugin (内置)        │
│   │   ├── feishu_bitable_* 工具   │
│   │   ├── feishu_doc_* 工具       │
│   │   └── feishu_wiki_* 工具      │
│   │                              │
│   └── digital-assistant Agent    │
│       ├── AGENTS.md              │
│       ├── SOUL.md                │
│       ├── TOOLS.md               │
│       └── skills/                │
│           ├── meeting-minutes.md │
│           └── task-management.md │
│                                  │
│   Qwen 3.5 (DashScope API) ◄────┤
└──────────────────────────────────┘
    │
    ▼
飞书多维表格
├── 会议纪要表
└── 任务跟踪表
```

### 关键决策

- **WebSocket 连接飞书**：无需公网 IP 或 webhook 域名
- **Binding 路由**：所有飞书消息路由到 `digital-assistant` agent
- **多维表格作为唯一数据存储**：不引入额外数据库
- **内置工具**：复用 feishu 插件的 bitable/doc/wiki 工具，不写自定义代码

## Agent 工作区

```
~/.openclaw/workspace-digital-assistant/
├── AGENTS.md          # 核心职责
├── SOUL.md            # 人格 & 沟通风格
├── TOOLS.md           # 工具使用指南
└── skills/
    ├── meeting-minutes.md
    └── task-management.md
```

### AGENTS.md — 核心职责

1. **会议纪要管理**：接收会议记录文本，提取决议/待办/负责人，写入多维表格
2. **任务跟踪**：在多维表格中 CRUD 任务，支持按人/状态/日期筛选
3. **文档管理**：搜索和阅读飞书文档/Wiki，回答团队知识问题

### SOUL.md — 人格定义

- 风格：专业友好、简洁明了、中文沟通
- 行为准则：主动确认理解、操作前告知用户、错误时清晰说明

### Skills

#### meeting-minutes.md

触发词：会议纪要 / 会议记录 / 纪要

流程：

1. 解析会议内容文本
2. 提取：日期、参与者、议题、决议、待办事项（含负责人和截止日期）
3. 写入多维表格（一条主记录 + 关联待办行）
4. 回复确认卡片

#### task-management.md

命令模式：

- 创建："创建任务 XXX 负责人 @张三 截止 3月15日"
- 查询："查看我的任务" / "查看所有待办"
- 更新："完成任务 #123" / "更新任务 #123 进度 80%"

## 多维表格 Schema

### 会议纪要表

| 字段   | 类型 | 说明         |
| ------ | ---- | ------------ |
| 日期   | 日期 | 会议日期     |
| 标题   | 文本 | 会议主题     |
| 参与者 | 人员 | 参会人员     |
| 摘要   | 文本 | 会议要点     |
| 决议   | 文本 | 会议决议     |
| 记录人 | 人员 | 提交纪要的人 |

### 任务跟踪表

| 字段     | 类型     | 说明                      |
| -------- | -------- | ------------------------- |
| 任务ID   | 自动编号 | 唯一标识                  |
| 任务名   | 文本     | 任务描述                  |
| 负责人   | 人员     | 执行者                    |
| 状态     | 单选     | 待办/进行中/已完成/已取消 |
| 优先级   | 单选     | 高/中/低                  |
| 截止日期 | 日期     | 期限                      |
| 进度     | 数字     | 0-100%                    |
| 关联会议 | 关联     | 关联到会议纪要表          |
| 创建时间 | 创建时间 | 自动                      |

## 部署

### docker-compose.yml

```yaml
services:
  openclaw-gateway:
    build: .
    container_name: openclaw-digital-assistant
    restart: unless-stopped
    volumes:
      - openclaw-data:/home/node/.openclaw
      - ./workspace:/home/node/.openclaw/workspace-digital-assistant
    environment:
      - DASHSCOPE_API_KEY=${DASHSCOPE_API_KEY}
    ports:
      - "18789:18789"

volumes:
  openclaw-data:
```

### openclaw.json

```json5
{
  gateway: { mode: "local" },
  models: { default: "dashscope/qwen3.5-plus" },
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
      match: { channel: "feishu" },
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
          appId: "${FEISHU_APP_ID}",
          appSecret: "${FEISHU_APP_SECRET}",
        },
      },
    },
  },
}
```

### 部署步骤

1. 飞书开放平台创建企业自建应用，获取 App ID / App Secret，开启机器人能力 + 事件订阅
2. DashScope 注册，获取 API Key
3. 编写 `.env`（DASHSCOPE_API_KEY, FEISHU_APP_ID, FEISHU_APP_SECRET）
4. `docker compose up -d`
5. 在飞书群 @机器人 测试

### 安全

- 容器以 `node` 非 root 用户运行
- API 密钥通过环境变量注入
- WebSocket 连接（无需暴露公网端口）
- `requireMention: true` 避免群里误触发
