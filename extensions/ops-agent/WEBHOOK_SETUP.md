# Ops-Agent Webhook 设置指南

## 概述

Ops-Agent 通过 webhook 接收飞书消息，并通过飞书 API 发送回复。

## 环境变量配置

```bash
# 必需
export FEISHU_APP_ID="cli_a9235e9f52745bce"
export FEISHU_APP_SECRET="qDo2JBsYaIf3kUCXAzOcVgfLRw4UI8xN"

# 可选
export WEBHOOK_PORT="3000"              # 默认: 3000
export WEBHOOK_HOST="0.0.0.0"           # 默认: 0.0.0.0
export WEBHOOK_PATH="/feishu/events"    # 默认: /feishu/events
export FEISHU_ENCRYPT_KEY="your_key"    # 可选: 加密密钥
export FEISHU_VERIFICATION_TOKEN="your_token"  # 可选: 验证令牌
```

## 启动服务器

```bash
# 构建
pnpm build

# 启动
pnpm start

# 或直接运行
FEISHU_APP_ID=cli_xxx FEISHU_APP_SECRET=xxx pnpm start
```

## 飞书应用配置

### 1. 在飞书开发者后台配置 Webhook

- 进入应用设置 → 事件订阅
- 配置请求 URL: `http://your-domain:3000/feishu/events`
- 配置验证令牌（可选）
- 配置加密密钥（可选）

### 2. 订阅事件

订阅以下事件类型：

- `im.message.receive_v1` - 接收消息事件

### 3. 权限配置

确保应用有以下权限：

- `im:message:send_as_bot` - 以机器人身份发送消息
- `im:message:get` - 获取消息内容

## 消息流程

```
飞书用户 → 飞书服务器 → Webhook → Ops-Agent → 命令执行 → 飞书 API → 飞书用户
```

## 测试

### 本地测试

```bash
# 启动服务器
FEISHU_APP_ID=cli_test FEISHU_APP_SECRET=test pnpm start

# 在另一个终端测试 webhook
curl -X POST http://localhost:3000/feishu/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "url_verification",
    "challenge": "test_challenge"
  }'

# 预期响应
# {"challenge":"test_challenge"}
```

### 飞书应用测试

1. 在飞书中 @ops-agent 机器人
2. 发送命令，例如：`status`
3. 机器人应该立即回复操作 ID
4. 后台执行完成后发送结果

## 命令示例

```
@ops-agent status
@ops-agent update
@ops-agent config get gateway.mode
@ops-agent config set gateway.mode local
@ops-agent diagnose
@ops-agent logs 50
@ops-agent history
```

## 故障排查

### 连接失败

- 检查 `FEISHU_APP_ID` 和 `FEISHU_APP_SECRET` 是否正确
- 确保服务器可以从飞书服务器访问（检查防火墙）
- 查看服务器日志

### 消息未收到

- 确认事件订阅已启用
- 检查 webhook URL 是否正确
- 验证应用权限

### 回复失败

- 检查应用是否有 `im:message:send_as_bot` 权限
- 查看服务器日志中的错误信息

## 生产部署

### 使用 Docker

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY extensions/ops-agent .

RUN npm install --omit=dev

CMD ["npm", "start"]
```

### 使用 systemd

```ini
[Unit]
Description=OpenClaw Ops-Agent
After=network.target

[Service]
Type=simple
User=openclaw
WorkingDirectory=/opt/ops-agent
Environment="FEISHU_APP_ID=cli_xxx"
Environment="FEISHU_APP_SECRET=xxx"
Environment="WEBHOOK_PORT=3000"
ExecStart=/usr/bin/node dist/cli.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## 安全建议

1. 使用 HTTPS（通过反向代理如 nginx）
2. 配置验证令牌和加密密钥
3. 限制 webhook 访问 IP
4. 定期轮换应用密钥
5. 监控日志和错误
