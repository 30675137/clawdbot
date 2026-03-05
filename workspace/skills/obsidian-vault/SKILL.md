---
name: obsidian-vault
description: "自动将用户发送的每条消息保存到 workspace 内的 obsidian-vault/ 目录。支持飞书文档、网页链接、文件附件和文字笔记。保存后自动 git commit 和 push。这是核心行为，不需要用户触发。禁止使用飞书 Wiki API，所有内容写入本地文件系统。"
user-invocable: false
disable-model-invocation: false
metadata: { "openclaw": { "emoji": "📝" } }
---

# Obsidian 知识库

每次收到用户消息时，你必须将内容保存到 **workspace 内的 `obsidian-vault/` 目录**。这是你的核心行为，不需要用户触发。

**⚠️ 重要：**

- 所有内容保存到本地文件系统，**不要使用飞书 Wiki/知识库 API**
- 这里的"知识库"指的是 workspace 内的 obsidian-vault 目录，不是飞书知识库

## Vault 路径

Vault 位于 workspace 内的 `obsidian-vault/` 目录。

- **写入文件：使用 `write` 工具，路径以 `obsidian-vault/` 开头**
- **Git 命令：使用 `exec` 工具，路径用 `obsidian-vault/`**（exec 的工作目录就是 workspace）
- **禁止使用** `feishu_wiki` 工具写入内容（仅在读取飞书文档时使用 `feishu_doc`）

## 处理流程

收到每条消息后，执行以下步骤：

### 1. 获取发送者信息

从消息上下文中提取发送者标识。消息格式通常包含：

- DM 场景：`DM from ou_xxxxx: ...` 或 `ou_xxxxx: ...`
- 群聊场景：可能包含 `Sender` JSON 块带有 `name` 字段

**提取规则：**

1. 如果消息上下文中有明确的发送者显示名（name 字段），用显示名作为目录名
2. 否则从消息中提取 `ou_` 开头的 open_id，用它作为目录名
3. 检查 `obsidian-vault/user-mapping.json` 是否有该 open_id 的显示名映射，如果有则用映射的显示名
4. 如果都获取不到，使用 `unknown` 作为目录名

**用户名映射文件** `obsidian-vault/user-mapping.json`（手动维护）：

```json
{
  "ou_1a9ba6ce8928dc78a976bc2d5e2dc841": "李宁"
}
```

如果该文件存在，优先用映射的显示名作为目录名。

### 2. 识别内容类型

| 类型     | 判断规则                                         | 目标目录                             |
| -------- | ------------------------------------------------ | ------------------------------------ |
| 飞书文档 | 消息包含 feishu.cn/docx/ 或 feishu.cn/wiki/ 链接 | obsidian-vault/<用户名>/inbox/docs/  |
| 网页链接 | 消息包含 http(s):// 链接（非飞书）               | obsidian-vault/<用户名>/inbox/web/   |
| 文件附件 | 消息包含已下载的文件路径（含 .md 文档附件）      | obsidian-vault/<用户名>/inbox/files/ |
| 文字笔记 | 以上都不是                                       | obsidian-vault/<用户名>/inbox/       |

**优先级规则：** 如果消息同时包含多种内容类型，按表格从上到下的优先级处理，只选择最高优先级的类型。

### 3. 获取内容

- **飞书文档**: 从 URL 中提取 doc_token（如 `https://xxx.feishu.cn/docx/ABC123def` → token 为 `ABC123def`），调用 `feishu_doc` 的 `read` action 获取内容。如果读取失败，保存链接并注明：⚠️ 无法读取文档内容
- **网页链接**: 调用 `web_fetch` 获取网页内容，提取正文（去除导航、广告等无关元素）
- **文件附件**: 使用 `read` 工具读取文件内容，然后**直接原样保存**，见步骤 5
- **文字笔记**: 直接使用消息文本

### 4. 分析并生成 Markdown（仅限飞书文档、网页链接、文字笔记）

**⚠️ 文件附件跳过此步骤，直接到步骤 5。**

对飞书文档、网页链接、文字笔记，生成：

- **标题**: 简洁、有意义的标题（中文优先）
- **标签**: 3-5 个相关标签
- **正文**: 整理后的 Markdown 内容

### 5. 写入文件

**⚠️ 文件附件规则（最高优先级）：**

- **必须保留原始文件名**，例如上传的文件叫 `UI及流程修改_V1.1.md`，保存路径就是 `obsidian-vault/<用户名>/inbox/files/UI及流程修改_V1.1.md`
- **禁止重命名**：不要加日期前缀、不要改成 slug、不要翻译文件名
- **禁止修改内容**：不要添加 frontmatter、不要重新格式化、不要修改任何内容
- 直接用 `write` 工具将原始内容写入 `obsidian-vault/<用户名>/inbox/files/<原始文件名>`

**飞书文档/网页链接/文字笔记的文件名格式**: `YYYY-MM-DD-<slug>.md`（slug 为标题的简短英文/拼音）

路径示例：`obsidian-vault/李宁/inbox/2026-03-02-test-note.md`

```
---
title: "测试笔记"
date: 2026-03-02
source: chat
sender: "用户名"
tags: [测试, 笔记]
type: note
---

# 测试笔记

笔记正文内容...
```

### 6. Git 同步

写入文件后立即执行：

```bash
cd obsidian-vault && git add -A && git commit -m "vault: add <type> - <title>" && git push
```

如果 push 失败，尝试：

```bash
cd obsidian-vault && git pull --rebase && git push
```

如果 rebase 出现冲突，执行 `git rebase --abort` 并回复用户：⚠️ Git 同步冲突，请手动解决。

### 7. 确认回复

保存成功后回复: 📝 已保存: <标题>

如果保存失败，回复: ⚠️ 保存失败: <错误原因>

## 去重规则

写入前先检查目标目录中是否已存在相同 slug 的文件：

```bash
ls obsidian-vault/<用户名>/<目标子目录>/*<slug>* 2>/dev/null
```

如果找到同名文件，跳过保存并回复: 📌 已存在: <标题>

## 注意事项

- 始终使用 UTF-8 编码
- frontmatter 中的字符串值用双引号包裹
- 标签不要包含空格，使用连字符连接多字词
- 文件附件必须保留原始文件名和内容，不做任何修改
- 每条消息独立处理，不要合并多条消息
- **所有路径必须以 `obsidian-vault/` 开头**
