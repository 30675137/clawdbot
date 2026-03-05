# Ops-Agent 端到端测试指南

## 概述

端到端（E2E）测试验证完整的消息流程，从飞书消息接收到命令执行和回复。

## 测试覆盖

### 1. 消息流程测试

- ✓ 完整的消息处理流程
- ✓ 命令解析和验证
- ✓ 异步执行和状态追踪
- ✓ 错误处理和恢复

### 2. 并发测试

- �� 多个并发命令处理
- ✓ 任务队列管理
- ✓ 资源竞争检测

### 3. 用户上下文测试

- ✓ 用户身份保留
- ✓ 聊天 ID 追踪
- ✓ 多用户隔离

### 4. 命令类型测试

- ✓ 配置命令（get/set）
- ✓ 版本命令（update/check）
- ✓ 诊断命令（diagnose/status）
- ✓ 历史命令（history）

## 运行测试

### 单元测试

```bash
# 运行所有测试
pnpm test

# 运行 E2E 测试
pnpm test -- src/e2e.test.ts

# 运行特定测试
pnpm test -- src/e2e.test.ts -t "should handle complete message flow"

# 查看覆盖率
pnpm test:coverage
```

### 集成测试（本地）

```bash
# 启动 webhook 服务器
FEISHU_APP_ID=cli_test FEISHU_APP_SECRET=test pnpm start &

# 测试 webhook 端点
curl -X POST http://localhost:3000/feishu/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "url_verification",
    "challenge": "test_challenge"
  }'

# 测试消息事件
curl -X POST http://localhost:3000/feishu/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "event_callback",
    "event": {
      "message": {
        "message_type": "text",
        "content": "status",
        "chat_id": "chat_test_001"
      },
      "sender": {
        "sender_id": {
          "open_id": "user_test_001"
        }
      }
    }
  }'

# 停止服务器
pkill -f "node dist/cli.js"
```

## 测试场景

### 场景 1: 基础命令执行

```
用户: @ops-agent status
Agent: ✓ 已接收命令，操作 ID: ops-xxx
后台: 执行 openclaw status
Agent: ✓ 操作完成
      输出: [status output]
```

### 场景 2: 配置修改

```
用户: @ops-agent config set gateway.mode local
Agent: ✓ 已接收命令，操作 ID: ops-xxx
后台: 执行 openclaw config set gateway.mode local
Agent: ✓ 操作完成
      输出: Configuration updated
```

### 场景 3: 版本更新

```
用户: @ops-agent update-to 2026.3.5
Agent: ✓ 已接收命令，操作 ID: ops-xxx
后台: 执行 npm install -g openclaw@2026.3.5
Agent: ✓ 操作完成
      输出: [installation output]
```

### 场景 4: 错误处理

```
用户: @ops-agent invalid-command
Agent: ✗ 命令解析失败: Unknown command: invalid-command
```

### 场景 5: 并发执行

```
用户1: @ops-agent status
用户2: @ops-agent diagnose
用户3: @ops-agent config get gateway.mode

Agent:
  ✓ 用户1 操作 ID: ops-001
  ✓ 用户2 操作 ID: ops-002
  ✓ 用户3 操作 ID: ops-003

后台: 并发执行 3 个任务（受 maxConcurrency 限制）
```

## 测试指标

### 覆盖率目标

- 行覆盖率: ≥ 80%
- 分支覆盖率: ≥ 75%
- 函数覆盖率: ≥ 80%

### 性能指标

- 消息处理延迟: < 100ms
- 命令执行超时: 120s
- 并发处理能力: ≥ 3 个任务

## 持续集成

### GitHub Actions 配置

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "22"
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:coverage
```

## 故障排查

### 测试失败

1. 检查依赖是否安装

   ```bash
   pnpm install
   ```

2. 清除缓存

   ```bash
   rm -rf node_modules dist
   pnpm install
   ```

3. 查看详细日志
   ```bash
   pnpm test -- --reporter=verbose
   ```

### 性能问题

1. 检查系统资源

   ```bash
   top -l 1 | head -20
   ```

2. 减少并发数
   ```bash
   # 在 WebhookServer 中修改
   new WebhookServer(config, 1)  // 单个并发
   ```

## 最佳实践

1. **隔离测试** - 每个测试独立运行，不依赖其他测试
2. **清理资源** - 测试后清理创建的资源
3. **模拟外部依赖** - 使用 mock 避免真实 API 调用
4. **记录日志** - 失败时保存详细日志用于调试
5. **定期运行** - 在 CI/CD 中自动运行测试

## 扩展测试

### 添加新的 E2E 测试

```typescript
it("should handle new scenario", async () => {
  const agent = server.getAgent();

  const message = {
    sender: { id: "user_test" },
    text: { content: "your-command" },
    chat_id: "chat_test",
    timestamp: new Date().toISOString(),
  };

  const reply = await agent.handleMessage(message);

  expect(reply).toBeDefined();
  expect(reply.jobId).toBeDefined();
  // Add your assertions
});
```

## 相关文档

- [README.md](./README.md) - 使用指南
- [WEBHOOK_SETUP.md](./WEBHOOK_SETUP.md) - Webhook 配置
