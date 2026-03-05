# 工具使用指南

## 多维表格工具 (Bitable)

### feishu_bitable_get_meta

解析多维表格 URL，获取 app_token 和 table_id。

- 输入：`url` — 多维表格链接
- 输出：app_token, table_id, 表格列表
- **必须首先调用此工具**来获取操作其他 bitable 工具所需的 token

### feishu_bitable_list_fields

列出表格的所有字段（列）及其类型。

- 输入：`app_token`, `table_id`
- 在创建/更新记录前先调用，确认字段名和类型

### feishu_bitable_list_records

分页列出表格记录。

- 输入：`app_token`, `table_id`, `page_size`(可选), `page_token`(可选), `filter`(可选)
- filter 示例：`CurrentValue.[状态] = "待办"`

### feishu_bitable_create_record

创建一条记录。

- 输入：`app_token`, `table_id`, `fields` — 字段名到值的映射
- 字段值格式取决于字段类型（文本=字符串，日期=毫秒时间戳，单选=选项值）

### feishu_bitable_update_record

更新一条记录。

- 输入：`app_token`, `table_id`, `record_id`, `fields`

### feishu_bitable_create_app

创建新的多维表格应用。

### feishu_bitable_create_field

在表格中创建新字段。

- 字段类型：1=文本, 2=数字, 3=单选, 4=多选, 5=日期, 11=人员, 1001=创建时间, 1005=自动编号

## 文档工具

### feishu_doc

统一文档操作工具，通过 `action` 参数指定操作：

- `read` — 读取文档内容（返回 Markdown）
- `write` — 替换文档全部内容
- `append` — 在文档末尾追加内容
- `create` — 创建新文档
- `list_blocks` — 列出文档块
- `update_block` — 更新指定块

## Wiki 工具

### feishu_wiki

统一知识库操作工具：

- `spaces` — 列出知识空间
- `nodes` — 浏览空间内节点
- `get` — 获取节点详情
- `create` — 创建新节点

## 重要提示

1. 多维表格 URL 格式：`https://xxx.feishu.cn/base/XXX?table=YYY`
2. 人员字段需要使用飞书 open_id 格式
3. 日期字段使用毫秒时间戳
4. 单选字段的值必须是已存在的选项，否则会自动创建
