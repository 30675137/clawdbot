# Clawdbot 本地开发 FAQ

## 1. Node 版本不满足要求

**错误信息：**

```
clawdbot requires Node >=22.0.0.
Detected: node 20.19.6
```

**解决方案：**

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 22
```

> 系统安装了 v20 和 v22，需要在每次启动 gateway 前切换到 v22。

---

## 2. Gateway 启动报 EPERM lock 文件错误

**错误信息：**

```
Error: EPERM: operation not permitted, unlink '~/.tmp/clawdbot-501/gateway.fc1bd014.lock'
```

**解决方案：**

```bash
rm -f ~/.tmp/clawdbot-501/gateway.fc1bd014.lock
```

> 上次 gateway 非正常退出时遗留的锁文件，删除后重启即可。

---

## 3. No API key found for provider anthropic

**错误信息：**

```
No API key found for provider anthropic
```

**原因：**

- 默认 provider 是 `anthropic`，如果配置了第三方 provider（如 minimax、dashscope）但模型未正确注册到 `models.json`，会 fallback 到 anthropic。
- `src/hooks/llm-slug-generator.ts` 调用 `runEmbeddedPiAgent` 时不传 `provider`/`model`，也会 fallback 到 anthropic。

**解决方案：**

1. 确保 `~/.clawdbot/clawdbot.json` 中 `agents.defaults.model.primary` 设置正确（如 `dashscope/qwen3.5-plus`）
2. 确保 `~/.clawdbot/agents/main/agent/models.json` 中对应 provider 下包含该模型
3. 重新 `pnpm build` 后重启 gateway

---

## 4. MiniMax API 401 认证错误（x-api-key vs Authorization）

**错误信息：**

```
HTTP 401 authentication_error: login fail: Please carry the API secret key in the 'Authorization' field
```

**原因：**

- MiniMax 的 Anthropic 兼容端点 (`https://api.minimax.io/anthropic`) 要求 `Authorization: Bearer` 头
- 但 Anthropic SDK 使用 `x-api-key` 头发送密钥，两者不兼容

**解决方案：**
将 minimax provider 从 `anthropic-messages` 切换到 `openai-completions`：

```json
{
  "baseUrl": "https://api.minimax.io/v1",
  "api": "openai-completions"
}
```

---

## 5. DashScope 报 developer role 不支持

**错误信息：**

```
400 developer is not one of ['system', 'assistant', 'user', 'tool', 'function'] - 'messages.['0].role'
```

**原因：**

- OpenAI 新版 API 使用 `developer` role 替代 `system`，但 DashScope 不支持 `developer` role

**解决方案：**
在模型定义中添加 `compat` 配置，禁用 `developer` role：

```json
{
  "id": "qwen3.5-plus",
  "name": "Qwen 3.5 Plus",
  "compat": {
    "supportsDeveloperRole": false,
    "maxTokensField": "max_tokens"
  }
}
```

> 需要同时修改 `~/.clawdbot/clawdbot.json` 和 `~/.clawdbot/agents/main/agent/models.json` 中的模型定义。

---

## 6. 配置文件说明

| 文件                                               | 用途                                          |
| -------------------------------------------------- | --------------------------------------------- |
| `~/.clawdbot/clawdbot.json`                        | 主配置：默认模型、provider 定义、gateway 认证 |
| `~/.clawdbot/agents/main/agent/models.json`        | Agent 模型注册表：provider + 模型 + apiKey    |
| `~/.clawdbot/agents/main/agent/auth-profiles.json` | 认证凭据存储：各 provider 的 API key          |

---

## 7. Gateway 标准启动流程

```bash
# 1. 切换 Node 版本
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 22

# 2. 构建（修改源码后需要）
cd /Users/lining/qoder/clawdbot && pnpm build

# 3. 启动 gateway
pnpm clawdbot gateway --force

# 4. 访问 Web UI（带 token 认证）
# http://127.0.0.1:18789/chat?session=main&token=<your-token>
```

---

## 8. 添加第三方 OpenAI 兼容 Provider 模板

以阿里百炼 DashScope 为例：

**clawdbot.json：**

```json
{
  "agents": {
    "defaults": {
      "model": { "primary": "dashscope/qwen3.5-plus" }
    }
  },
  "models": {
    "providers": {
      "dashscope": {
        "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "api": "openai-completions",
        "models": [
          {
            "id": "qwen3.5-plus",
            "name": "Qwen 3.5 Plus",
            "reasoning": true,
            "input": ["text"],
            "contextWindow": 131072,
            "maxTokens": 16384,
            "compat": { "supportsDeveloperRole": false, "maxTokensField": "max_tokens" }
          }
        ]
      }
    }
  }
}
```

**models.json** 中还需要额外包含 `apiKey` 字段。

**auth-profiles.json** 中添加：

```json
{
  "dashscope:default": {
    "type": "api_key",
    "provider": "dashscope",
    "key": "sk-xxx"
  }
}
```

---

## 9. `api` 字段有效值

| 值                        | 说明                                                            |
| ------------------------- | --------------------------------------------------------------- |
| `openai-completions`      | OpenAI Chat Completions 兼容（DashScope、MiniMax、Moonshot 等） |
| `openai-responses`        | OpenAI Responses API                                            |
| `anthropic-messages`      | Anthropic Messages API                                          |
| `google-generative-ai`    | Google Generative AI                                            |
| `github-copilot`          | GitHub Copilot                                                  |
| `bedrock-converse-stream` | AWS Bedrock                                                     |
