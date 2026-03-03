# PM-Assistant 本地部署设计

## 概述

在现有 OpenClaw 网关基础上，添加 pm-assistant agent，通过飞书多账号模式实现与 digital-client 共存。

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenClaw Gateway (18789)                  │
│                     ~/.openclaw/                             │
├─────────────────────────────────────────────────────────────┤
│  feishu channel                                              │
│  ├── account: main (cli_a92a83aeacb85cc0) → digital-client  │
│  └── account: pm   (cli_a92c70d0aef85bd7) → pm-assistant    │
├─────────────────────────────────────────────────────────────┤
│  agents                                                      │
│  ├── digital-client → workspace-digital-client/             │
│  └── pm-assistant   → workspace-pm-assistant/               │
└─────────────────────────────────────────────────────────────┘
```

**关键点**：

- 复用现有网关（端口 18789）
- 两个飞书应用通过 `accounts` 区分
- 通过 `bindings` 按账号路由到对应 agent
- 各 agent 有独立的 workspace 目录

## 配置变更

### 1. ~/.openclaw/openclaw.json

**agents.list 新增：**

```json
{
  "id": "pm-assistant",
  "name": "PM Assistant",
  "workspace": "~/.openclaw/workspace-pm-assistant",
  "model": "dashscope/qwen3.5-plus"
}
```

**channels.feishu 变更：**

```json
"feishu": {
  "enabled": true,
  "dmPolicy": "open",
  "accounts": {
    "main": {
      "appId": "cli_a92a83aeacb85cc0",
      "appSecret": "k77oATbfxD06qJh8L5SHjdRIhK2GqcWx"
    },
    "pm": {
      "appId": "cli_a92c70d0aef85bd7",
      "appSecret": "P2m41RDEN6aZcjpQKNNU2fbxArGRfUEp"
    }
  }
}
```

**bindings 新增：**

```json
{
  "agentId": "pm-assistant",
  "match": { "channel": "feishu", "account": "pm" }
}
```

### 2. 新建 workspace 目录

```
~/.openclaw/workspace-pm-assistant/
├── AGENTS.md                 # 从仓库复制
├── SOUL.md                   # 从仓库复制
└── skills/                   # 符号链接到本地 skills
    ├── requirements-gateway
    ├── requirements-doc-suite
    ├── v2-requirements-analyzer
    ├── v2-requirements-registry
    ├── lark-project-management
    └── self-improving-agent
```

## Skills 路径

所有 skills 位于 `/Users/lining/qoder/skills/randyClaudSkills/skills-src/`：

| Skill                    | 路径                                |
| ------------------------ | ----------------------------------- |
| requirements-gateway     | skills-src/requirements-gateway     |
| requirements-doc-suite   | skills-src/requirements-doc-suite   |
| v2-requirements-analyzer | skills-src/v2-requirements-analyzer |
| v2-requirements-registry | skills-src/v2-requirements-registry |
| lark-project-management  | skills-src/lark-project-management  |
| self-improving-agent     | skills-src/self-improving-agent     |

## 实施步骤

1. 创建 workspace 目录
2. 复制 AGENTS.md 和 SOUL.md
3. 创建 skills 符号链接（6 个）
4. 更新 ~/.openclaw/openclaw.json
5. 重启网关

## 验证方式

| 检查项             | 方法                                                |
| ------------------ | --------------------------------------------------- |
| workspace 目录存在 | `ls ~/.openclaw/workspace-pm-assistant/`            |
| skills 链接有效    | `ls -la ~/.openclaw/workspace-pm-assistant/skills/` |
| 配置语法正确       | `cat ~/.openclaw/openclaw.json \| jq .`             |
| 网关启动正常       | 检查网关日志                                        |
| 飞书消息路由       | 用 pm 机器人发消息，确认由 pm-assistant 响应        |

## 风险与回退

- **风险**：配置错误可能影响现有 digital-client
- **回退**：备份现有 `openclaw.json`，出问题可恢复

## 不在范围内

- 不修改 OpenClaw 核心代码
- 不使用 Docker 部署
- 不创建新的飞书应用（已有凭据）
