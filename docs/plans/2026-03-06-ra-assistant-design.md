# RA-Assistant: 需求调研助理设计

## 概述

通过 OpenClaw 创建一个独立的需求调研助理（agentId: `ra-assistant`），以飞书为交互入口，专注于需求调研阶段的工作。核心能力包括调研问卷生成与交互、专题讨论、会议纪要整理、需求整理。通过本地 markdown 文件作为项目知识库，持续积累项目背景知识。

## 与 pm-assistant 的关系

- 完全独立的 agent，独立飞书应用、独立工作区
- pm-assistant 负责需求管理和产品文档（需求分析阶段之后）
- ra-assistant 专注于前期调研阶段（需求分析阶段之前）
- 两者通过本地文件系统共享知识（ra-assistant 的调研成果可作为 pm-assistant 的输入）

## 核心能力

### 1. 调研问卷

**生成模式：** 用户指定项目和调研主题，agent 读取 `knowledge/{project}/` 下的背景文档，分析知识空白点，自动生成问卷文件到 `knowledge/{project}/surveys/YYYY-MM-DD-{topic}.md`。

**交互模式：** 用户在飞书中说"开始调研 {project} {topic}"，agent 逐个提问，收集回答，最终整理成结构化文档保存。

### 2. 专题讨论

- 私聊：用户与 agent 围绕某个专题深入探讨，agent 基于知识库提供背景信息、提出见解
- 群聊：agent 被 @mention 时参与多人讨论，帮助整理讨论要点
- 讨论结束后生成结论文档到 `knowledge/{project}/discussions/`

### 3. 会议纪要整理

用户发送飞书会议纪要的文档链接，agent 通过飞书 MCP 读取内容，结合项目知识库背景，提取：

- 关键决策（DECISION）
- 待办事项（TODO）
- 需求项（REQ）
- 待确认项（TBD）

输出到 `knowledge/{project}/meetings/YYYY-MM-DD-{title}.md`。

### 4. 需求整理

汇总 surveys/discussions/meetings 中提取的需求项，去重合并，生成或更新 `knowledge/{project}/requirements/requirements.md`，包含：

- 需求编号、来源追溯
- 优先级标记
- 状态（已确认/待澄清/有冲突）

## 架构

### 工作区结构

```
workspace-ra-assistant/
├── AGENTS.md              # Agent 定义：需求调研助理
├── SOUL.md                # 交互风格：引导式、结构化
├── openclaw.json          # 独立飞书应用配置
├── knowledge/             # 项目知识库（输入+输出共用）
│   └── {project-name}/    # 按项目组织
│       ├── background.md  # 项目背景
│       ├── surveys/       # 调研问卷及结果
│       ├── discussions/   # 专题讨论记录
│       ├── meetings/      # 会议纪要整理
│       └── requirements/  # 需求清单
└── skills/
    └── ra-commands.md     # 核心命令定义
```

### 部署配置

```json
{
  "gateway": { "mode": "local" },
  "models": {
    "providers": {
      "anthropic": {
        "models": [{ "id": "claude-opus-4-6", "name": "Claude Opus" }]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-6",
      "thinkingDefault": "medium"
    },
    "list": [
      {
        "id": "ra-assistant",
        "name": "RA Assistant",
        "workspace": "~/.openclaw/workspace-ra-assistant"
      }
    ]
  },
  "bindings": [
    {
      "agentId": "ra-assistant",
      "match": { "channel": "feishu" }
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
          "appId": "NEW_APP_ID",
          "appSecret": "NEW_APP_SECRET"
        }
      },
      "tools": { "doc": true, "wiki": true }
    }
  }
}
```

## 命令表

| 命令                         | 说明                   | 示例                                      |
| ---------------------------- | ---------------------- | ----------------------------------------- |
| `生成问卷 {project} {topic}` | 基于知识库生成调研问卷 | `生成问卷 药品追溯 门店需求`              |
| `开始调研 {project} {topic}` | 交互式问答调研         | `开始调研 药品追溯 用户痛点`              |
| `讨论 {project} {topic}`     | 专题讨论模式           | `讨论 药品追溯 数据架构`                  |
| `结束讨论`                   | 结束讨论并生成结论     | `结束讨论`                                |
| `整理纪要 {url}`             | 从飞书文档整理会议纪要 | `整理纪要 https://xxx.feishu.cn/docx/xxx` |
| `整理需求 {project}`         | 汇总所有来源整理需求   | `整理需求 药品追溯`                       |
| `查看项目`                   | 列出已有项目           | `查看项目`                                |
| `新建项目 {name}`            | 创建项目知识库目录     | `新建项目 药品追溯`                       |

## 交互流程

```
飞书消息（私聊/群聊 @mention）
    -> ra-assistant 接收
    -> 识别意图：
        "生成问卷 {project} {topic}" -> 读取知识库 -> 生成问卷文档
        "开始调研 {project} {topic}" -> 进入交互式问答模式
        "讨论 {project} {topic}"    -> 加载知识库 -> 专题讨论模式
        "整理纪要 {feishu-doc-url}" -> 读取飞书文档 -> 提取结构化内容
        "整理需求 {project}"        -> 汇总所有来源 -> 更新需求清单
    -> 输出到 knowledge/{project}/
```

## AGENTS.md 要点

- 角色：需求调研阶段助理
- 核心职责：调研问卷、专题讨论、会议纪要整理、需求整理
- 工作模式：收到消息先识别意图，加载项目知识库，执行对应能力流程
- 知识库读取规则：执行命令前扫描 knowledge/{project}/ 下所有 markdown 文件作为上下文
- 生成问卷时重点关注知识空白点
- 专题讨论时引用已有文档中的信息

## SOUL.md 要点

- 沟通风格：引导式提问，不直接给结论，帮用户思考
- 讨论中主动提出"知识库中提到 X，你怎么看？"
- 调研时一次只问一个问题，等待回答后追问
- 语言：中文
- 格式：结构化输出，善用状态标记

## 不在范围内

- 不修改现有 pm-assistant / ops-agent 配置
- 不修改 OpenClaw 核心代码
- 不引入向量数据库或外部搜索基建
- 飞书应用创建（需用户自行完成）
