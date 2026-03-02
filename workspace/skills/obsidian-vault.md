# Obsidian 知识库

每次收到用户消息时，你必须将内容保存到 Obsidian vault。这是你的核心行为，不需要用户触发。

## Vault 路径

Vault 位于 `~/obsidian-vault/`。所有写入操作使用 `write` 工具，Git 操作使用 `exec` 工具。

## 处理流程

收到每条消息后，执行以下步骤：

### 1. 识别内容类型

| 类型     | 判断规则                                         | 目标目录     |
| -------- | ------------------------------------------------ | ------------ |
| 飞书文档 | 消息包含 feishu.cn/docx/ 或 feishu.cn/wiki/ 链接 | inbox/docs/  |
| 网页链接 | 消息包含 http(s):// 链接（非飞书）               | inbox/web/   |
| 文件附件 | 消息包含已下载的文件路径                         | inbox/files/ |
| 文字笔记 | 以上都不是                                       | inbox/       |

### 2. 获取内容

- **飞书文档**: 从 URL 中提取 doc_token，调用 `feishu_doc` read 获取内容
- **网页链接**: 调用 `web_fetch` 获取并提取正文
- **文件附件**: 用 `exec` 将文件复制到 `~/obsidian-vault/assets/`，笔记中记录文件路径
- **文字笔记**: 直接使用消息文本

### 3. 分析并生成 Markdown

分析内容，生成：

- **标题**: 简洁、有意义的标题（中文优先）
- **标签**: 3-5 个相关标签
- **正文**: 整理后的 Markdown 内容

### 4. 写入文件

文件名格式: `YYYY-MM-DD-<slug>.md`（slug 为标题的简短英文/拼音，用连字符分隔）

使用 `write` 工具写入文件，内容格式：

```
---
title: "标题"
date: YYYY-MM-DD
source: feishu | web | chat | file
source_url: "原始链接（如有）"
sender: "发送者名称"
tags: [标签1, 标签2, 标签3]
type: doc | note | clip | file
---

# 标题

正文内容...
```

### 5. Git 同步

写入文件后立即执行：

```
cd ~/obsidian-vault && git add -A && git commit -m "vault: add <type> - <title>" && git push
```

如果 push 失败，尝试：

```
cd ~/obsidian-vault && git pull --rebase && git push
```

### 6. 确认回复

保存成功后回复: 📝 已保存: <标题>

如果保存失败，回复: ⚠️ 保存失败: <错误原因>

## 去重规则

写入前先检查是否已存在相同文件：

```
ls ~/obsidian-vault/inbox/**/*<slug>* 2>/dev/null
```

如果找到同名文件，跳过保存并回复: 📌 已存在: <标题>

## 注意事项

- 始终使用 UTF-8 编码
- frontmatter 中的字符串值用双引号包裹
- 标签不要包含空格，使用连字符连接多字词
- 文件附件只保存元信息到笔记，原始文件复制到 assets/
- 每条消息独立处理，不要合并多条消息
