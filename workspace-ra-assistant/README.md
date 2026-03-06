# RA Assistant 工作区

OpenClaw 需求分析助手的工作区配置。

## 快速开始

### 1. 配置飞书应用

编辑 `openclaw.json`，填入你的飞书应用凭证：

```json
{
  "channels": {
    "feishu": {
      "accounts": {
        "main": {
          "appId": "your_app_id",
          "appSecret": "your_app_secret"
        }
      }
    }
  }
}
```

### 2. 启动 OpenClaw

```bash
openclaw gateway run
```

### 3. 在飞书中使用

```
@ra-assistant 新建项目 药品追溯
@ra-assistant 生成问卷 药品追溯 用户痛点
```

## 文件结构

```
workspace-ra-assistant/
├── AGENTS.md           # Agent 定义和职责
├── CLAUDE.md           # -> AGENTS.md
├── SOUL.md             # Agent 灵魂和交互风格
├── openclaw.json       # OpenClaw 配置
├── README.md           # 本文件
├── knowledge/          # 项目知识库
│   └── {project}/      # 按项目组织
│       ├── background.md
│       ├── surveys/
│       ├── discussions/
│       ├── meetings/
│       └── requirements/
└── skills/
    └── ra-commands.md  # 命令详解
```

## 支持的命令

### 问卷调研

- `生成问卷` - 根据项目背景生成调研问卷
- `开始调研` - 启动问卷调研流程

### 讨论管理

- `讨论` - 发起或参与主题讨论
- `结束讨论` - 结束当前讨论并生成总结

### 会议纪要

- `整理纪要` - 整理会议纪要，提取关键决策和待办

### 需求管理

- `整理需求` - 从调研和讨论中提炼需求
- `查看项目` - 查看当前项目状态
- `新建项目` - 创建新的调研项目

## 知识库

`knowledge/` 目录既是输入也是输出：

- **输入**：用户可以将项目背景资料、行业文档等放入 `knowledge/{project}/background.md`，Agent 会参考这些资料生成更有针对性的问卷和分析
- **输出**：Agent 在工作过程中会将生成的问卷、讨论记录、会议纪要、需求文档等输出到对应项目目录下

目录按项目组织，每个项目包含：

- `background.md` - 项目背景资料
- `surveys/` - 调研问卷及结果
- `discussions/` - 讨论记录
- `meetings/` - 会议纪要
- `requirements/` - 需求文档

## 相关文档

- [AGENTS.md](./AGENTS.md) - Agent 定义
- [SOUL.md](./SOUL.md) - Agent 灵魂
- [skills/ra-commands.md](./skills/ra-commands.md) - 命令详解
