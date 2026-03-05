# OpenClaw Ops Agent

运维自动化 agent，通过飞书接收命令，自动化管理 OpenClaw 的安装、更新、配置和诊断。

## 功能

- **安装管理** - `install`、`install-deps`
- **版本更新** - `update`、`update-to <version>`、`check-update`
- **配置管理** - `config get/set/list`
- **诊断工具** - `diagnose`、`status`、`logs`
- **历史记录** - `history`、`history clear`

## 架构

```
飞书消息 → FeishuOpsAgent → CommandParser → JobQueue → CommandExecutor → 本地命令
                                                ↓
                                          StorageManager (JSONL 历史)
```

## 使用

### 基础命令

```bash
# 查看状态
status

# 更新 OpenClaw
update

# 更新到指定版本
update-to 2026.3.5

# 查看配置
config get gateway.mode

# 修改配置
config set gateway.mode local

# 诊断问题
diagnose

# 查看日志（最后 20 行）
logs

# 查看日志（最后 50 行）
logs 50

# 查看操作历史
history

# 清空历史
history clear
```

### 异步执行

所有命令都在后台异步执行：

1. 用户发送命令
2. Agent 立即返回操作 ID
3. 后台执行任务
4. 完成后推送结果

## 测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试
pnpm test -- src/parser.test.ts

# 查看覆盖率
pnpm test:coverage
```

## 文件结构

```
extensions/ops-agent/
├── src/
│   ├── types.ts                 # 核心类型定义
│   ├── storage.ts               # 状态存储管理
│   ├── parser.ts                # 命令解析器
│   ├── executor.ts              # 命令执行引擎
│   ├── job-queue.ts             # 异步任务队列
│   ├── feishu-integration.ts    # 飞书集成
│   └── index.ts                 # 导出入口
├── src/*.test.ts                # 单元测试
├── package.json
├── vitest.config.ts
└── README.md
```

## 存储

操作历史存储在 `~/.openclaw/ops-agent/`：

```
~/.openclaw/ops-agent/
├── history.jsonl       # 操作历史（JSONL 格式）
└── state.json          # 配置快照
```

## 集成

在飞书中使用：

```
@ops-agent status
@ops-agent update
@ops-agent config get gateway.mode
```

## 开发

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 监视模式
pnpm dev

# 测试
pnpm test
```
