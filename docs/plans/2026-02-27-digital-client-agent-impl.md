# 数字客户机器人实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 创建一个独立的"数字客户"Agent，通过飞书机器人接收消息，处理客户咨询、方案评审、数据分析任务。

**Architecture:** 利用 OpenClaw 现有的多 Agent 路由机制和飞书插件内置工具。创建独立 workspace，配置 binding 路由，无需编写自定义 skill（飞书插件已内置 bitable/docx/wiki 工具）。

**Tech Stack:** OpenClaw Gateway, @openclaw/feishu plugin, Claude Opus

---

## Task 1: 创建 Agent Workspace 目录结构

**Files:**

- Create: `~/.openclaw/workspace-digital-client/AGENTS.md`
- Create: `~/.openclaw/workspace-digital-client/SOUL.md`
- Create: `~/.openclaw/workspace-digital-client/USER.md`
- Create: `~/.openclaw/workspace-digital-client/TOOLS.md`

**Step 1: 创建 workspace 目录**

```bash
mkdir -p ~/.openclaw/workspace-digital-client
mkdir -p ~/.openclaw/workspace-digital-client/memory
mkdir -p ~/.openclaw/agents/digital-client/agent
```

**Step 2: 验证目录创建成功**

Run: `ls -la ~/.openclaw/workspace-digital-client`
Expected: 显示 memory 子目录

**Step 3: Commit**

```bash
# 无需 commit，这是用户本地配置
```

---

## Task 2: 创建 AGENTS.md 文件

**Files:**

- Create: `~/.openclaw/workspace-digital-client/AGENTS.md`

**Step 1: 创建 AGENTS.md**

```bash
cat > ~/.openclaw/workspace-digital-client/AGENTS.md << 'EOF'
# 数字客户 Agent

你是数字客户助手，负责处理与客户相关的任务。

## 核心职责

- **客户咨询**：回答客户问题，提供产品/服务信息
- **方案评审**：审阅方案文档，提供反馈和建议
- **数据分析**：从多维表格中提取和分析数据

## 可用工具

你可以使用以下飞书工具：

### 多维表格 (Bitable)
- `feishu_bitable_get_meta` - 从 URL 获取表格信息
- `feishu_bitable_list_fields` - 列出表格字段
- `feishu_bitable_list_records` - 查询表格记录
- `feishu_bitable_get_record` - 获取单条记录
- `feishu_bitable_create_record` - 创建新记录
- `feishu_bitable_update_record` - 更新记录

### 文档 (Docx)
- `feishu_doc_read` - 读取文档内容
- `feishu_doc_search` - 搜索文档

### Wiki
- `feishu_wiki_search` - 搜索 Wiki
- `feishu_wiki_get_node` - 获取 Wiki 节点

## 工具使用规范

1. 当用户提供飞书链接时，先用 `feishu_bitable_get_meta` 或 `feishu_doc_read` 获取内容
2. 查询数据前先确认用户需要什么信息
3. 修改数据前先确认用户意图，说明将要修改的内容
4. 批量操作前列出将要执行的操作清单

## 行为准则

- 保持专业、友好的语气
- 对敏感数据谨慎处理
- 不确定时主动询问
- 操作完成后给出简洁的结果摘要
EOF
```

**Step 2: 验证文件创建成功**

Run: `head -20 ~/.openclaw/workspace-digital-client/AGENTS.md`
Expected: 显示文件开头内容

---

## Task 3: 创建 SOUL.md 文件

**Files:**

- Create: `~/.openclaw/workspace-digital-client/SOUL.md`

**Step 1: 创建 SOUL.md**

```bash
cat > ~/.openclaw/workspace-digital-client/SOUL.md << 'EOF'
# 人格设定

我是数字客户助手，专注于帮助团队处理客户相关的工作。

## 语气风格

- 专业但不生硬
- 简洁明了，避免冗长
- 主动提供有价值的建议
- 遇到问题时坦诚说明

## 边界

- 只处理与客户工作相关的任务
- 不讨论敏感话题
- 不执行可能造成数据丢失的危险操作
EOF
```

**Step 2: 验证文件创建成功**

Run: `cat ~/.openclaw/workspace-digital-client/SOUL.md`
Expected: 显示完整文件内容

---

## Task 4: 创建 USER.md 和 TOOLS.md 文件

**Files:**

- Create: `~/.openclaw/workspace-digital-client/USER.md`
- Create: `~/.openclaw/workspace-digital-client/TOOLS.md`

**Step 1: 创建 USER.md**

```bash
cat > ~/.openclaw/workspace-digital-client/USER.md << 'EOF'
# 用户信息

使用本 Agent 的是内部团队成员，主要处理客户相关工作。

## 使用场景

- 查询和分析客户数据
- 审阅方案文档
- 回答客户咨询问题
EOF
```

**Step 2: 创建 TOOLS.md**

```bash
cat > ~/.openclaw/workspace-digital-client/TOOLS.md << 'EOF'
# 工具使用说明

## 飞书多维表格

当用户提供飞书链接时：
1. 如果是 `/base/` 或 `/wiki/` 链接，先用 `feishu_bitable_get_meta` 解析
2. 获取 `app_token` 和 `table_id` 后再进行后续操作
3. 查询记录时注意分页，默认每页 100 条

## 飞书文档

- 文档链接格式：`/docx/` 或 `/wiki/`
- 使用 `feishu_doc_read` 读取内容
- 返回的是 Markdown 格式
EOF
```

**Step 3: 验证文件创建成功**

Run: `ls -la ~/.openclaw/workspace-digital-client/`
Expected: 显示 AGENTS.md, SOUL.md, USER.md, TOOLS.md, memory/

---

## Task 5: 更新 Gateway 配置

**Files:**

- Modify: `~/.openclaw/openclaw.json`

**Step 1: 备份现有配置**

```bash
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.backup
```

**Step 2: 添加 Agent 配置**

在 `~/.openclaw/openclaw.json` 中添加以下配置（需要手动编辑或使用 `openclaw agents add`）：

```json5
{
  // ... 现有配置 ...

  agents: {
    list: [
      // ... 现有 agents ...
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
    // ... 现有 bindings ...
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
          appId: "cli_xxx", // 替换为实际 App ID
          appSecret: "xxx", // 替换为实际 App Secret
          botName: "数字客户机器人",
        },
      },
    },
  },
}
```

**Step 3: 验证配置语法**

Run: `openclaw config validate`
Expected: 配置验证通过

---

## Task 6: 安装飞书插件（如未安装）

**Step 1: 检查插件是否已安装**

Run: `openclaw plugins list`
Expected: 显示已安装插件列表

**Step 2: 安装飞书插件（如需要）**

```bash
openclaw plugins install @openclaw/feishu
```

**Step 3: 验证插件安装成功**

Run: `openclaw plugins list | grep feishu`
Expected: 显示 @openclaw/feishu

---

## Task 7: 重启 Gateway 并验证

**Step 1: 重启 Gateway**

```bash
openclaw gateway restart
```

**Step 2: 检查 Agent 列表**

Run: `openclaw agents list --bindings`
Expected: 显示 digital-client agent 及其 binding

**Step 3: 检查 Channel 状态**

Run: `openclaw channels status --probe`
Expected: feishu channel 状态正常

**Step 4: 查看日志确认启动成功**

Run: `openclaw logs --follow`
Expected: 无错误日志，显示 feishu channel 已连接

---

## Task 8: 功能测试

**Step 1: 发送测试消息**

在飞书中向机器人发送消息：`你好，请介绍一下你能做什么`

Expected: Agent 回复介绍其功能

**Step 2: 测试多维表格功能**

发送一个多维表格链接，要求 Agent 读取内容

Expected: Agent 使用 `feishu_bitable_get_meta` 和 `feishu_bitable_list_records` 返回数据

**Step 3: 测试文档功能**

发送一个飞书文档链接，要求 Agent 读取内容

Expected: Agent 使用 `feishu_doc_read` 返回文档内容

---

## 配置清单

| 项目      | 值                                        |
| --------- | ----------------------------------------- |
| Agent ID  | `digital-client`                          |
| Workspace | `~/.openclaw/workspace-digital-client`    |
| Agent Dir | `~/.openclaw/agents/digital-client/agent` |
| Model     | `anthropic/claude-opus-4-6`               |
| Channel   | feishu                                    |
| DM Policy | open                                      |
| Binding   | `{ channel: "feishu" }`                   |

## 注意事项

1. 飞书 App 需要配置正确的权限（参考 `docs/channels/feishu.md`）
2. 如果已有其他 Agent 绑定到 feishu channel，需要调整 binding 优先级
3. 首次使用可能需要通过 `openclaw pairing approve` 审批用户
