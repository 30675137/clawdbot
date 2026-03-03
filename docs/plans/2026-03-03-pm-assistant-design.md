# PM-Assistant: ToB 产品经理数字人设计

## 概述

通过 OpenClaw 创建一个 ToB 产品经理数字助手（agentId: `pm-assistant`），以飞书为交互入口，以 `requirements-gateway` skill 为核心编排器，具备需求分析与管理、产品文档输出、产品规划与路线图三大核心能力，并通过 `self-improving-agent` 实现持续自我改进。

## 核心能力

1. **需求分析与管理** — 通过 requirement-gateway 处理多格式输入（文件/图片/URL/文本），自动提取需求、术语、业务规则，检测冲突和缺口，管理澄清问题
2. **产品文档输出** — 生成 PRD、业务方案、受理准则、用户旅程、设计规约等标准化文档
3. **产品规划与路线图** — 产品架构、版本规划、优先级矩阵、里程碑管理
4. **自我改进** — 通过 self-improving-agent 捕获错误、用户纠正和能力缺口，持续积累领域经验

## 部署架构

### Docker 部署

新建 `docker-compose.pm-assistant.yml`，独立部署:

- **容器名**: `openclaw-pm-assistant`
- **端口**: 18791（避免与 18789/18790 冲突）
- **环境变量**: `.env.pm-assistant`（独立，不共用 `.env`，包含所有 API key + 飞书凭据）
- **数据卷**: `/Volumes/macpro_data/openclaw_data/pm-assistant:/home/node/.openclaw`
- **构建**: 复用本地 Dockerfile
- **命令**: `node openclaw.mjs gateway --bind lan --port 18791`

### 独立环境变量 `.env.pm-assistant`

```env
# API Keys (独立，不共用 .env)
ANTHROPIC_API_KEY=...
DASHSCOPE_API_KEY=...

# 飞书凭据 (新机器人应用)
FEISHU_APP_ID=...
FEISHU_APP_SECRET=...

# 端口
PM_GATEWAY_PORT=18791
```

### 数据持久化

```
/Volumes/macpro_data/openclaw_data/pm-assistant/
├── openclaw.json               # 网关配置
├── workspace-pm-assistant/     # Agent workspace
│   ├── AGENTS.md               # 产品经理人设
│   ├── SOUL.md                 # 沟通风格
│   ├── LEARNINGS.md            # 自我改进-学习记录 (自动生成)
│   ├── ERRORS.md               # 自我改进-错误记录 (自动生成)
│   ├── FEATURE_REQUESTS.md     # 自我改进-能力缺口 (自动生成)
│   └── skills/                 # 挂载的 skills
├── agents/pm-assistant/        # Agent 状态
└── sessions/                   # 会话历史
```

## Agent 配置

### openclaw.json

```json
{
  "gateway": { "mode": "local" },
  "models": {
    "providers": [
      { "type": "anthropic", "models": ["claude-opus-4-6"] },
      { "type": "dashscope", "models": ["qwen-plus"] }
    ]
  },
  "agents": {
    "defaults": {
      "model": "claude-opus-4-6",
      "thinkingDefault": "medium"
    },
    "list": [
      {
        "id": "pm-assistant",
        "workspace": "~/.openclaw/workspace-pm-assistant",
        "model": "claude-opus-4-6",
        "thinkingDefault": "medium",
        "skills": [
          "requirements-gateway",
          "requirements-doc-suite",
          "v2-requirements-analyzer",
          "v2-requirements-registry",
          "lark-project-management",
          "self-improving-agent"
        ]
      }
    ]
  },
  "bindings": [
    {
      "agentId": "pm-assistant",
      "match": { "channel": "feishu" }
    }
  ],
  "channels": {
    "feishu": {
      "accounts": {
        "main": {
          "appId": "${FEISHU_APP_ID}",
          "appSecret": "${FEISHU_APP_SECRET}"
        }
      },
      "tools": { "doc": true, "wiki": true, "drive": true }
    }
  }
}
```

## Skills 挂载

从 `/Users/mac/Development/develop/randyClaudSkills/skills-src` 复制/symlink:

```
workspace-pm-assistant/skills/
├── requirements-gateway/       # v2.1.0 需求全链路编排
├── requirements-doc-suite/     # 文档套件 (dependency)
├── v2-requirements-analyzer/   # 需求分析器 (dependency)
├── v2-requirements-registry/   # 需求仓库 (dependency)
├── lark-project-management/    # 飞书项目管理 (dependency)
└── self-improving-agent/       # 自我改进 (clawhub install)
```

## 交互流程

```
用户通过飞书发送文件/图片/URL/文本
    → pm-assistant 接收
    → 调用 requirements-gateway collect/from-image/from-url
    → 自动触发 Phase 1b 分析（提取需求、术语、规则）
    → 检测冲突和缺口 → 生成 Q-xxx 澄清问题
    → 结构化反馈给用户（分析摘要 + 待澄清项）
    → 用户回答澄清 → 迭代完善
    → 按需触发后续 Phase:
        Phase 2: 业务方案 (BIZ)
        Phase 3: 产品架构 (ARCH) / 版本规划 (ROAD) / 产品规格 (SPEC)
        Phase 4: UI 设计
        Phase 5: 飞书五表同步
        Phase 6: 增量对比与维护
```

## AGENTS.md 人设要点

- **角色**: ToB 产品经理数字助手
- **核心职责**: 需求收集分析、产品文档编写、产品规划路线图
- **工作模式**: 收到任何输入首先通过 requirements-gateway 进行智能分类和分析
- **沟通风格**: 专业简洁，中文交互，结构化反馈（用表格、列表、状态标记）
- **自我改进**: 遇到错误或用户纠正时，记录到 LEARNINGS.md/ERRORS.md

## 文件清单

| 文件                                   | 动作         | 说明                                               |
| -------------------------------------- | ------------ | -------------------------------------------------- |
| `docker-compose.pm-assistant.yml`      | 新建         | Docker 部署配置                                    |
| `.env.pm-assistant`                    | 新建         | 独立环境变量                                       |
| `workspace-pm-assistant/AGENTS.md`     | 新建         | 产品经理人设                                       |
| `workspace-pm-assistant/SOUL.md`       | 新建         | 沟通风格与反馈格式                                 |
| `workspace-pm-assistant/openclaw.json` | 新建         | 网关配置                                           |
| `workspace-pm-assistant/skills/`       | symlink/复制 | requirements-gateway 及依赖 + self-improving-agent |

## 不在范围内

- 不修改现有 feixiaozhu / obsidian-openclaw 配置
- 不修改 OpenClaw 核心代码
- 飞书应用创建（已完成，用户已有凭据）
