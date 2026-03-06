# RA Assistant 命令详解

## 问卷与调研命令

### 生成问卷

**触发词：** `生成问卷 {project} {topic}`、`generate survey {project} {topic}`

**功能：** 读取项目知识库，分析知识盲区，生成结构化调研问卷

**参数：**

- `project` - 项目名称（对应 `knowledge/` 下的目录名）
- `topic` - 调研主题

**执行步骤：**

1. 检查 `knowledge/{project}/` 目录是否存在
2. 加载项目知识库（读取目录下所有 markdown 文件）
3. 分析已有知识，识别信息盲区和不确定点
4. 生成结构化问卷（包含分类、问题、选项/开放式）
5. 保存文件到 `knowledge/{project}/surveys/YYYY-MM-DD-{topic}.md`

**输出路径：** `knowledge/{project}/surveys/YYYY-MM-DD-{topic}.md`

**示例：**

```
用户: @ra-assistant 生成问卷 crm-system 用户权限
Agent: ✓ 已接收命令
       正在分析项目知识库...

Agent: ✓ 问卷已生成
       项目: crm-system
       主题: 用户权限
       问题数: 12
       文件: knowledge/crm-system/surveys/2026-03-06-用户权限.md

       识别到以下知识盲区：
       - 角色层级关系未明确
       - 数据权限粒度未定义
       - 审批流程缺失
```

### 开始调研

**触发词：** `开始调研 {project} {topic}`、`start survey {project} {topic}`

**功能：** 进入交互式问答模式，在飞书聊天中逐题提问，收集回答后保存调研结果

**参数：**

- `project` - 项目名称
- `topic` - 调研主题

**执行步骤：**

1. 检查 `knowledge/{project}/surveys/` 下是否存在对应主题的问卷文件
2. 若不存在，先自动生成问卷
3. 进入交互模式，逐题发送问题，等待用户回答
4. 支持用户回答"跳过"以跳过当前问题
5. 用户回答"结束调研"可提前结束
6. 所有问题回答完毕后，整理结果并保存

**输出路径：** `knowledge/{project}/surveys/YYYY-MM-DD-{topic}-results.md`

**示例：**

```
用户: @ra-assistant 开始调研 crm-system 用户权限
Agent: ✓ 已找到问卷，共 12 个问题
       开始调研，回复"结束调研"可提前结束

       问题 1/12：系统需要支持哪些用户角色？请列举所有角色及其职责。

用户: 管理员、普通用户、审计员三个角色。管理员有全部权限，普通用户只能操作自己的数据，审计员只读。

Agent: ✓ 已记录
       问题 2/12：是否需要支持自定义角色？如果需要，自定义角色的权限范围如何界定？

用户: 结束调研

Agent: ✓ 调研已结束
       已回答: 1/12
       文件: knowledge/crm-system/surveys/2026-03-06-用户权限-results.md
```

## 讨论命令

### 讨论

**触发词：** `讨论 {project} {topic}`、`discuss {project} {topic}`

**功能：** 加载项目知识库作为上下文，进入讨论模式，提供背景信息并主动提出探索性问题

**参数：**

- `project` - 项目名称
- `topic` - 讨论主题

**执行步骤：**

1. 检查项目是否存在
2. 加载项目知识库作为上下文
3. 提供主题相关的背景摘要
4. 进入讨论模式，围绕主题展开对话
5. 同时支持私聊和群聊（@提及触发）
6. 讨论持续进行，直到用户发送"结束讨论"

**示例：**

```
用户: @ra-assistant 讨论 crm-system 技术选型
Agent: ✓ 已进入讨论模式
       项目: crm-system
       主题: 技术选型

       根据已有知识库，当前了解到：
       - 系统需支持 3 种用户角色
       - 预计并发用户数 500+
       - 需要与现有 ERP 系统集成

       关于技术选型，有几个方向想和你探讨：
       1. 后端框架偏好？目前团队技术栈是什么？
       2. 是否考虑微服务架构？

用户: 团队主要用 Java，倾向 Spring Boot

Agent: 了解。Spring Boot 是成熟选择，考虑到与 ERP 集成的需求，
       建议关注以下几点：
       - 是否需要消息队列来解耦 ERP 同步？
       - 数据库选型：关系型还是需要混合？
       ...
```

### 结束讨论

**触发词：** `结束讨论`、`end discussion`

**功能：** 结束当前讨论，自动整理讨论要点、关键结论和待解决事项，保存为讨论纪要

**执行步骤：**

1. 汇总讨论中的所有要点
2. 提取关键结论和决策
3. 标记待解决的开放问题
4. 生成讨论纪要并保存

**输出路径：** `knowledge/{project}/discussions/YYYY-MM-DD-{topic}.md`

**示例：**

```
用户: 结束讨论
Agent: ✓ 讨论已结束，正在整理纪要...

Agent: ✓ 讨论纪要已保存
       文件: knowledge/crm-system/discussions/2026-03-06-技术选型.md

       关键结论：
       - 后端采用 Spring Boot
       - 数据库使用 PostgreSQL
       - 引入 RabbitMQ 做 ERP 数据同步

       待解决事项：
       - 前端框架待定
       - 部署方案待评估
```

## 文档处理命令

### 整理纪要

**触发词：** `整理纪要 {url}`、`extract minutes {url}`

**功能：** 读取飞书会议文档，结合项目知识库上下文，提取结构化的会议纪要

**参数：**

- `url` - 飞书文档链接

**执行步骤：**

1. 解析飞书文档 URL，提取文档 token
2. 通过 MCP 工具读取文档内容
3. 从文档内容中识别关联项目，加载对应知识库
4. 提取结构化条目：DECISION（决策）、TODO（待办）、REQ（需求）、TBD（待定）
5. 保存会议纪要文件

**输出路径：** `knowledge/{project}/meetings/YYYY-MM-DD-{title}.md`

**示例：**

```
用户: @ra-assistant 整理纪要 https://xxx.feishu.cn/docx/abc123
Agent: ✓ 已接收命令
       正在读取飞书文档...
       正在整理会议纪要...

Agent: ✓ 纪要已整理
       会议: CRM 系统需求评审会
       日期: 2026-03-06
       文件: knowledge/crm-system/meetings/2026-03-06-CRM系统需求评审会.md

       提取条目：
       - DECISION: 3 项决策
       - TODO: 5 项待办
       - REQ: 4 项需求
       - TBD: 2 项待定
```

### 整理需求

**触发词：** `整理需求 {project}`、`consolidate requirements {project}`

**功能：** 扫描项目下所有调研结果、讨论纪要、会议纪要，提取需求条目，去重合并，生成统一需求清单

**参数：**

- `project` - 项目名称

**执行步骤：**

1. 扫描 `knowledge/{project}/surveys/`、`discussions/`、`meetings/` 下的所有文件
2. 提取所有需求相关条目（REQ 标记、需求描述等）
3. 去重合并相似需求
4. 分配需求编号 REQ-{NNN}
5. 标注来源文件、优先级（P0/P1/P2）和状态（新建/已确认/已实现）
6. 保存需求清单

**输出路径：** `knowledge/{project}/requirements/requirements.md`

**示例：**

```
用户: @ra-assistant 整理需求 crm-system
Agent: ✓ 已接收命令
       正在扫描项目文件...
       已扫描: surveys/ (3 文件), discussions/ (2 文件), meetings/ (4 文件)
       正在提取和合并需求...

Agent: ✓ 需求清单已生成
       文件: knowledge/crm-system/requirements/requirements.md

       统计：
       - 总需求数: 23
       - 新增: 8（本次新识别）
       - 合并: 3（与已有需求合并）
       - P0: 5 项
       - P1: 10 项
       - P2: 8 项

       来源分布：
       - 调研: 10 项
       - 讨论: 6 项
       - 会议: 7 项
```

## 项目管理命令

### 查看项目

**触发词：** `查看项目`、`list projects`

**功能：** 列出 `knowledge/` 目录下所有项目，显示基本统计信息

**执行步骤：**

1. 扫描 `knowledge/` 目录
2. 统计每个项目的文件数量
3. 获取最后修改时间
4. 格式化输出

**示例：**

```
用户: @ra-assistant 查看项目
Agent: ✓ 项目列表

       项目名称          文件数    最后修改
       ─────────────────────────────────────
       crm-system        15       2026-03-06
       data-platform      8       2026-03-04
       mobile-app         3       2026-02-28
```

### 新建项目

**触发词：** `新建项目 {name}`、`new project {name}`

**功能：** 创建标准项目目录结构，初始化模板文件

**参数：**

- `name` - 项目名称

**执行步骤：**

1. 检查项目名称是否已存在
2. 创建目录结构：
   - `knowledge/{name}/background.md`
   - `knowledge/{name}/surveys/`
   - `knowledge/{name}/discussions/`
   - `knowledge/{name}/meetings/`
   - `knowledge/{name}/requirements/`
3. 生成 `background.md` 模板（包含项目概述、目标、范围、干系人等占位章节）

**输出路径：** `knowledge/{name}/background.md`

**示例：**

```
用户: @ra-assistant 新建项目 payment-gateway
Agent: ✓ 项目已创建
       项目: payment-gateway

       目录结构：
       knowledge/payment-gateway/
       ├── background.md（已创建模板）
       ├── surveys/
       ├── discussions/
       ├── meetings/
       └── requirements/

       下一步：请编辑 background.md 填写项目背景信息，
       然后使用"生成问卷"开始调研。
```

## 错误处理

### 项目不存在

```
用户: @ra-assistant 生成问卷 unknown-project 用户权限
Agent: ✗ 项目不存在
       未找到项目: unknown-project

       现有项目：
       - crm-system
       - data-platform

       建议：使用"新建项目 unknown-project"创建项目
```

### 飞书文档链接无效

```
用户: @ra-assistant 整理纪要 https://invalid-url
Agent: ✗ 文档链接无效
       无法解析飞书文档链接

       正确格式：
       - https://xxx.feishu.cn/docx/{document_token}
       - https://xxx.feishu.cn/wiki/{node_token}

       请检查链接后重试
```

### 知识库为空

```
用户: @ra-assistant 生成问卷 new-project 需求分析
Agent: ✗ 知识库为空
       项目 new-project 下没有找到任何知识文件

       建议：
       1. 先编辑 knowledge/new-project/background.md 填写项目背景
       2. 或使用"讨论 new-project {topic}"通过讨论积累知识
       3. 或使用"整理纪要 {url}"从会议文档中提取信息
```

## 最佳实践

1. **先建项目再调研** - 使用"新建项目"初始化标准结构，填写 background.md
2. **问卷先于访谈** - 先"生成问卷"分析盲区，再"开始调研"定向收集
3. **及时整理纪要** - 会议后尽快使用"整理纪要"，避免信息遗漏
4. **定期整理需求** - 积累足够素材后使用"整理需求"，保持需求清单最新
5. **讨论补充细节** - 对调研中发现的模糊点，使用"讨论"深入探索
