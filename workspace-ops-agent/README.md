# Ops Agent 工作区

OpenClaw 运维自动化助手的工作区配置。

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
@ops-agent status
@ops-agent update
@ops-agent config get gateway.mode
```

## 文件结构

```
workspace-ops-agent/
├── AGENTS.md           # Agent 定义和职责
├── SOUL.md             # Agent 灵魂和交互风格
├── openclaw.json       # OpenClaw 配置
├── README.md           # 本文件
└── skills/             # 技能定义
    └── ops-commands.md # 运维命令详解
```

## 支持的命令

### 网关管理

- `启动网关` - 启动 OpenClaw 网关
- `停止网关` - 停止网关
- `重启网关` - 重启网关
- `查看状态` - 查看网关状态

### 版本管理

- `检查更新` - 检查可用更新
- `更新` - 更新到最新版本
- `update-to 2026.3.5` - 更新到指定版本

### 配置管理

- `config get gateway.mode` - 查看配置
- `config set gateway.mode local` - 修改配置
- `config list` - 列出所有配置

### 诊断

- `诊断` - 运行诊断检查
- `查看日志` - 查看最近日志
- `history` - 查看操作历史

## 异步执行

所有命令都在后台异步执行：

1. 用户发送命令
2. Agent 立即返回操作 ID
3. 后台执行任务
4. 完成后推送结果

## 存储

操作历史存储在 `~/.openclaw/ops-agent/`：

- `history.jsonl` - 操作历史（JSONL 格式）
- `state.json` - 配置快照

## 配置说明

### openclaw.json

- `gateway.mode` - 网关模式（local/remote）
- `agents.list` - Agent 列表
- `bindings` - Agent 与渠道的绑定
- `channels.feishu` - 飞书渠道配置

## 相关文档

- [AGENTS.md](./AGENTS.md) - Agent 定义
- [SOUL.md](./SOUL.md) - Agent 灵魂
- [skills/ops-commands.md](./skills/ops-commands.md) - 命令详解

## 故障排查

### 连接失败

检查飞书应用凭证是否正确：

```bash
openclaw config get channels.feishu.accounts.main.appId
```

### 命令未响应

查看网关日志：

```bash
tail -f /tmp/openclaw-gateway.log
```

### 操作历史

查看所有操作：

```bash
cat ~/.openclaw/ops-agent/history.jsonl | tail -20
```
