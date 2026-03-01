# 飞小助 — 飞书团队数字助手部署指南

## 前置条件

1. Docker & Docker Compose
2. 飞书企业自建应用（App ID + App Secret）
3. 通义千问 DashScope API Key

## 飞书应用配置

1. 登录 [飞书开放平台](https://open.feishu.cn)
2. 创建企业自建应用
3. 开启"机器人"能力
4. 在"权限管理"中开启以下权限：
   - `im:message` — 接收和发送消息
   - `im:message.group_at_msg` — 群消息（@机器人）
   - `bitable:app` — 多维表格读写
   - `docx:document` — 文档读写
   - `wiki:wiki` — 知识库访问
5. 发布应用版本
6. 记录 App ID 和 App Secret

## 部署步骤

### 1. 准备环境变量

```bash
cp .env.example .env
# 编辑 .env 填入实际的 App ID、App Secret、DashScope API Key
```

### 2. 准备 Gateway 配置

首次启动前，需要将配置注入到容器中：

```bash
# 启动容器（首次会自动创建 volume）
docker compose -f docker-compose.digital-assistant.yml up -d

# 将配置复制到容器中
docker cp workspace/openclaw.json.example \
  openclaw-feixiaozhu:/home/node/.openclaw/openclaw.json

# 编辑容器内的配置文件，替换 App ID 和 App Secret
docker exec -it openclaw-feixiaozhu sh -c \
  "sed -i 's/YOUR_FEISHU_APP_ID/'$FEISHU_APP_ID'/g; s/YOUR_FEISHU_APP_SECRET/'$FEISHU_APP_SECRET'/g' /home/node/.openclaw/openclaw.json"

# 重启容器使配置生效
docker compose -f docker-compose.digital-assistant.yml restart
```

### 3. 验证

```bash
# 查看日志
docker logs -f openclaw-feixiaozhu

# 应该看到：
# - Gateway started
# - Feishu channel connected (WebSocket)
```

### 4. 测试

1. 在飞书中找到机器人，发送私聊消息测试
2. 将机器人拉入群聊，@机器人 发送消息测试
3. 发送"帮我创建一个任务 测试飞小助 截止明天"测试任务功能

## 多维表格设置

首次使用会议纪要或任务管理功能时，需要：

1. 在飞书中创建一个多维表格
2. 创建"会议纪要"表，字段：日期、标题、参与者、摘要、决议、记录人
3. 创建"任务跟踪"表，字段：任务名、负责人、状态（单选：待办/进行中/已完成/已取消）、优先级（单选：高/中/低）、截止日期、进度、关联会议
4. 将表格链接发送给机器人

## 故障排查

- **机器人无响应**：检查 App ID/Secret 是否正确，应用是否已发布
- **工具调用失败**：检查应用权限是否已开启并审批通过
- **多维表格操作失败**：确认机器人有表格的编辑权限
