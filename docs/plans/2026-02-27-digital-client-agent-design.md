# 数字客户机器人设计文档

## 概述

创建一个独立的"数字客户"Agent，通过飞书机器人接收内部团队消息，处理客户咨询、方案评审、数据分析等任务，并能够读写飞书文档和多维表格。

## 需求背景

- **使用场景**：内部团队使用
- **用户规模**：少量用户 (1-5人)
- **访问控制**：开放访问
- **数据源**：飞书文档/多维表格（读写权限）
- **模型**：Claude Opus

## 方案选择

选择 **方案 B：独立 Agent + 自定义 Skills**

- 创建独立的 `digital-client` Agent，有自己的 workspace
- 在 workspace 的 `skills/` 目录下编写自定义 skill 调用飞书 API
- 使用 OpenClaw 现有的飞书 channel 接收消息

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      飞书用户                                │
└─────────────────────┬───────────────────────────────────────┘
                      │ 消息
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              OpenClaw Gateway                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Feishu Channel (@openclaw/feishu)                  │   │
│  │  - WebSocket 接收消息                                │   │
│  │  - 路由到 digital-client Agent                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                      │                                      │
│                      ▼ binding 路由                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  digital-client Agent                               │   │
│  │  - Workspace: ~/.openclaw/workspace-digital-client  │   │
│  │  - Model: Claude Opus                               │   │
│  │  - Skills: feishu-docs (自定义)                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                      │                                      │
│                      ▼ skill 调用                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  feishu-docs Skill                                  │   │
│  │  - 读取/搜索飞书文档                                  │   │
│  │  - 读写多维表格记录                                   │   │
│  │  - 使用飞书 Open API                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Agent 配置

### 1. Gateway 配置 (`~/.openclaw/openclaw.json`)

```json5
{
  agents: {
    list: [
      {
        id: "digital-client",
        name: "数字客户",
        workspace: "~/.openclaw/workspace-digital-client",
        agentDir: "~/.openclaw/agents/digital-client/agent",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "digital-client",
      match: { channel: "feishu" },
    },
  ],
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "open",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          botName: "数字客户机器人",
        },
      },
    },
  },
}
```

### 2. Workspace 文件结构

```
~/.openclaw/workspace-digital-client/
├── AGENTS.md          # Agent 行为规则
├── SOUL.md            # 人格和语气
├── USER.md            # 用户信息
├── TOOLS.md           # 工具使用说明
├── skills/            # 自定义 skills
│   └── feishu-docs/   # 飞书文档/多维表格 skill
│       ├── skill.md   # skill 定义
│       └── index.ts   # skill 实现
└── memory/            # 记忆日志
```

### 3. AGENTS.md 内容

```markdown
# 数字客户 Agent

你是数字客户助手，负责处理与客户相关的任务。

## 核心职责

- 客户咨询：回答客户问题，提供产品/服务信息
- 方案评审：审阅方案文档，提供反馈和建议
- 数据分析：从多维表格中提取和分析数据

## 工具使用

- 使用 feishu-docs skill 读写飞书文档和多维表格
- 查询数据前先确认用户需要什么信息
- 修改数据前先确认用户意图

## 行为准则

- 保持专业、友好的语气
- 对敏感数据谨慎处理
- 不确定时主动询问
```

## feishu-docs Skill 设计

### 1. Skill 定义 (`skills/feishu-docs/skill.md`)

```markdown
---
name: feishu-docs
description: 读写飞书文档和多维表格
tools:
  - feishu_doc_read
  - feishu_doc_search
  - feishu_bitable_query
  - feishu_bitable_create
  - feishu_bitable_update
---

# 飞书文档工具

用于访问飞书文档和多维表格的工具集。
```

### 2. 工具列表

| 工具名                  | 功能             | 参数                                           |
| ----------------------- | ---------------- | ---------------------------------------------- |
| `feishu_doc_read`       | 读取文档内容     | `doc_id`                                       |
| `feishu_doc_search`     | 搜索文档         | `query`, `space_id?`                           |
| `feishu_bitable_query`  | 查询多维表格记录 | `app_token`, `table_id`, `filter?`             |
| `feishu_bitable_create` | 创建多维表格记录 | `app_token`, `table_id`, `fields`              |
| `feishu_bitable_update` | 更新多维表格记录 | `app_token`, `table_id`, `record_id`, `fields` |

### 3. 认证方式

Skill 复用飞书 Channel 的 App 凭证（`appId` + `appSecret`），通过 `tenant_access_token` 调用飞书 Open API。无需额外配置认证。

### 4. 实现要点

```typescript
// skills/feishu-docs/index.ts 核心结构
import { defineTool } from "openclaw/plugin-sdk";

// 获取 tenant_access_token
async function getTenantToken(appId: string, appSecret: string): Promise<string> {
  // 调用 https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal
}

// 工具实现示例
export const feishu_bitable_query = defineTool({
  name: "feishu_bitable_query",
  description: "查询飞书多维表格记录",
  parameters: {
    app_token: { type: "string", description: "多维表格 App Token" },
    table_id: { type: "string", description: "数据表 ID" },
    filter: { type: "string", description: "筛选条件（可选）" },
  },
  async execute({ app_token, table_id, filter }) {
    const token = await getTenantToken(appId, appSecret);
    // 调用 GET /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records
    // 返回记录列表
  },
});
```

## 数据流

```
用户发送消息 → 飞书 WebSocket → OpenClaw Gateway
    ↓
Gateway 根据 binding 路由到 digital-client Agent
    ↓
Agent 解析用户意图，决定是否调用 skill
    ↓
[如需访问飞书数据] → 调用 feishu-docs skill 工具
    ↓
Skill 执行飞书 API 调用，返回结果
    ↓
Agent 整合结果，生成回复
    ↓
Gateway 通过飞书 Channel 发送回复
```

## 错误处理

| 错误场景          | 处理方式                               |
| ----------------- | -------------------------------------- |
| 飞书 API 认证失败 | 自动刷新 tenant_access_token，重试一次 |
| 文档/表格不存在   | 返回友好提示，建议用户检查 ID          |
| 权限不足          | 提示用户检查飞书应用权限配置           |
| API 限流          | 等待后重试，最多 3 次                  |
| 网络超时          | 返回错误提示，建议稍后重试             |

## 安全考虑

- Skill 只能访问飞书应用有权限的文档/表格
- 敏感操作（批量删除等）需要用户二次确认
- 不在日志中记录完整的 API 响应数据

## 组件总结

| 组件         | 说明                                   |
| ------------ | -------------------------------------- |
| Agent ID     | `digital-client`                       |
| Workspace    | `~/.openclaw/workspace-digital-client` |
| Model        | Claude Opus                            |
| 飞书 Channel | 开放访问，所有消息路由到此 Agent       |
| Skill        | `feishu-docs`（5 个工具）              |
| 认证         | 复用飞书 Channel 的 App 凭证           |
