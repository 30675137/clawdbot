# 数字客户机器人配置文档

本文档描述如何配置和使用数字客户机器人。

## 概述

数字客户机器人是一个独立的 OpenClaw Agent，通过飞书接收消息，处理客户咨询、方案评审、数据分析等任务，并能够读写飞书文档和多维表格。

## 配置清单

| 项目       | 值                                        |
| ---------- | ----------------------------------------- |
| Agent ID   | `digital-client`                          |
| Agent 名称 | 数字客户                                  |
| Workspace  | `~/.openclaw/workspace-digital-client`    |
| Agent Dir  | `~/.openclaw/agents/digital-client/agent` |
| 模型       | `dashscope/qwen3.5-plus`                  |
| Channel    | feishu                                    |
| DM Policy  | open（开放访问）                          |
| Binding    | 所有飞书消息路由到此 Agent                |

## 目录结构

```
~/.openclaw/
├── openclaw.json                          # Gateway 配置文件
├── workspace-digital-client/              # Agent Workspace
│   ├── AGENTS.md                          # Agent 行为规则
│   ├── SOUL.md                            # 人格设定
│   ├── USER.md                            # 用户信息
│   ├── TOOLS.md                           # 工具使用说明
│   └── memory/                            # 记忆日志目录
└── agents/
    └── digital-client/
        └── agent/                         # Agent 状态目录
```

## Gateway 配置

在 `~/.openclaw/openclaw.json` 中添加以下配置：

```json5
{
  // ... 其他配置 ...

  agents: {
    defaults: {
      // ... 默认配置 ...
    },
    list: [
      {
        id: "digital-client",
        name: "数字客户",
        workspace: "~/.openclaw/workspace-digital-client",
        agentDir: "~/.openclaw/agents/digital-client/agent",
        model: "dashscope/qwen3.5-plus",
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
      appId: "cli_xxx", // 替换为实际 App ID
      appSecret: "xxx", // 替换为实际 App Secret
      enabled: true,
      dmPolicy: "open",
    },
  },
}
```

## Workspace 文件说明

### AGENTS.md

定义 Agent 的核心职责和行为规则：

- 客户咨询：回答客户问题，提供产品/服务信息
- 方案评审：审阅方案文档，提供反馈和建议
- 数据分析：从多维表格中提取和分析数据

### SOUL.md

定义 Agent 的人格和语气风格：

- 专业但不生硬
- 简洁明了，避免冗长
- 主动提供有价值的建议

### USER.md

描述使用此 Agent 的用户信息和使用场景。

### TOOLS.md

提供工具使用的具体说明和注意事项。

## 可用工具

数字客户 Agent 可以使用飞书插件提供的以下工具：

### 多维表格 (Bitable)

| 工具名                         | 功能                |
| ------------------------------ | ------------------- |
| `feishu_bitable_get_meta`      | 从 URL 获取表格信息 |
| `feishu_bitable_list_fields`   | 列出表格字段        |
| `feishu_bitable_list_records`  | 查询表格记录        |
| `feishu_bitable_get_record`    | 获取单条记录        |
| `feishu_bitable_create_record` | 创建新记录          |
| `feishu_bitable_update_record` | 更新记录            |

### 文档 (Docx)

| 工具名              | 功能         |
| ------------------- | ------------ |
| `feishu_doc_read`   | 读取文档内容 |
| `feishu_doc_search` | 搜索文档     |

### Wiki

| 工具名                 | 功能           |
| ---------------------- | -------------- |
| `feishu_wiki_search`   | 搜索 Wiki      |
| `feishu_wiki_get_node` | 获取 Wiki 节点 |

## 启动和验证

### 1. 重启 Gateway

```bash
openclaw gateway restart
```

### 2. 检查 Agent 列表

```bash
openclaw agents list --bindings
```

预期输出应显示 `digital-client` agent 及其 feishu binding。

### 3. 检查 Channel 状态

```bash
openclaw channels status --probe
```

预期：feishu channel 状态正常。

### 4. 查看日志

```bash
openclaw logs --follow
```

预期：无错误日志，显示 feishu channel 已连接。

## 功能测试

### 测试基本对话

在飞书中向机器人发送：

```
你好，请介绍一下你能做什么
```

### 测试多维表格读取

发送一个多维表格链接：

```
请帮我读取这个表格的内容：https://xxx.feishu.cn/base/xxx
```

### 测试文档读取

发送一个飞书文档链接：

```
请帮我读取这个文档：https://xxx.feishu.cn/docx/xxx
```

## 高级配置

### 修改模型

如需使用其他模型，修改 `agents.list` 中的 `model` 字段：

```json5
{
  id: "digital-client",
  model: "anthropic/claude-opus-4-6", // 或其他已配置的模型
}
```

### 限制访问

如需限制访问，修改 `channels.feishu.dmPolicy`：

```json5
{
  channels: {
    feishu: {
      dmPolicy: "pairing", // 需要配对审批
      // 或
      dmPolicy: "allowlist",
      allowFrom: ["ou_xxx", "ou_yyy"], // 只允许特定用户
    },
  },
}
```

### 路由到特定用户/群组

如需将特定用户或群组路由到此 Agent：

```json5
{
  bindings: [
    {
      agentId: "digital-client",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" }, // 特定用户
      },
    },
    {
      agentId: "digital-client",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_xxx" }, // 特定群组
      },
    },
  ],
}
```

## 故障排除

### Agent 不响应

1. 检查 Gateway 是否运行：`openclaw gateway status`
2. 检查日志：`openclaw logs --follow`
3. 确认 binding 配置正确：`openclaw agents list --bindings`

### 无法访问飞书文档/表格

1. 确认飞书应用已配置正确的权限（参考 `docs/channels/feishu.md`）
2. 确认文档/表格对飞书应用可见
3. 检查日志中的错误信息

### 配置不生效

1. 确认 JSON 语法正确
2. 重启 Gateway：`openclaw gateway restart`

## 相关文档

- [飞书 Channel 配置](/channels/feishu)
- [多 Agent 路由](/concepts/multi-agent)
- [Agent Workspace](/concepts/agent-workspace)
