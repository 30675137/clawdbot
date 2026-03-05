---
summary: "Clawdbot 中文安装指南：从零开始安装、配置到首次运行"
read_when:
  - 中文用户安装 Clawdbot
  - 需要中文安装说明
---

# Clawdbot 安装指南

Clawdbot 是一个自托管的个人 AI 助手，支持 WhatsApp、Telegram、Slack、Discord、Signal、iMessage 等多种聊天渠道。本文档将引导你从零完成安装与配置。

## 系统要求

| 项目     | 要求                                             |
| -------- | ------------------------------------------------ |
| Node.js  | **>= 22**                                        |
| 操作系统 | macOS、Linux、Windows (WSL2)                     |
| 包管理器 | npm（默认）/ pnpm（源码构建推荐）/ bun（实验性） |
| 磁盘空间 | 约 500MB（含依赖）                               |

> **Windows 用户须知**：强烈建议使用 WSL2 (Ubuntu)。原生 Windows 未经充分测试，工具兼容性较差。请先安装 WSL2，然后在 WSL 内执行 Linux 安装步骤。

---

## 安装方式一览

| 方式                              | 适用场景            | 推荐度 |
| --------------------------------- | ------------------- | ------ |
| [一键安装脚本](#一键安装脚本推荐) | 新用户、快速上手    | ★★★★★  |
| [npm/pnpm 全局安装](#全局安装)    | 已有 Node 环境      | ★★★★   |
| [源码安装](#从源码安装开发者)     | 开发者、贡献者      | ★★★    |
| [Docker 安装](#docker-安装)       | 容器化部署、服务器  | ★★★    |
| [其他方式](#其他安装方式)         | Nix / Ansible / Bun | ★★     |

---

## 一键安装脚本（推荐）

### macOS / Linux

```bash
curl -fsSL https://clawd.bot/install.sh | bash
```

脚本会自动完成：

- 检测并安装 Node.js（如需要）
- 通过 npm 全局安装 `clawdbot`
- 启动引导向导（onboarding）

### Windows (PowerShell)

```powershell
iwr -useb https://clawd.bot/install.ps1 | iex
```

### 常用标志

```bash
# 跳过引导向导
curl -fsSL https://clawd.bot/install.sh | bash -s -- --no-onboard

# 从 GitHub 源码安装
curl -fsSL https://clawd.bot/install.sh | bash -s -- --install-method git

# 非交互模式（CI/自动化）
curl -fsSL https://clawd.bot/install.sh | bash -s -- --no-prompt

# 预演（不做任何修改）
curl -fsSL https://clawd.bot/install.sh | bash -s -- --dry-run

# 查看所有选项
curl -fsSL https://clawd.bot/install.sh | bash -s -- --help
```

### 环境变量（自动化场景）

| 变量                          | 说明                                  |
| ----------------------------- | ------------------------------------- |
| `CLAWDBOT_INSTALL_METHOD`     | `npm`（默认）或 `git`                 |
| `CLAWDBOT_GIT_DIR`            | 源码安装目录（默认 `~/clawdbot`）     |
| `CLAWDBOT_NO_PROMPT`          | 设为 `1` 禁用交互提示                 |
| `CLAWDBOT_NO_ONBOARD`         | 设为 `1` 跳过引导向导                 |
| `CLAWDBOT_DRY_RUN`            | 设为 `1` 仅预演                       |
| `SHARP_IGNORE_GLOBAL_LIBVIPS` | 设为 `1` 跳过系统 libvips（默认开启） |

---

## 全局安装

如果你已有 Node.js >= 22 环境：

```bash
# npm
npm install -g clawdbot@latest

# 或 pnpm
pnpm add -g clawdbot@latest
```

安装完成后运行引导向导：

```bash
clawdbot onboard --install-daemon
```

### sharp 安装问题

如果 macOS 上 Homebrew 安装了 libvips 导致 `sharp` 编译失败：

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g clawdbot@latest
```

---

## 从源码安装（开发者）

```bash
# 1. 克隆仓库
git clone https://github.com/clawdbot/clawdbot.git
cd clawdbot

# 2. 安装依赖
pnpm install

# 3. 构建 UI
pnpm ui:build

# 4. 构建项目
pnpm build

# 5. 运行引导向导
pnpm clawdbot onboard --install-daemon
```

> 提示：在源码目录中，使用 `pnpm clawdbot ...` 替代 `clawdbot ...` 来运行命令。

### 开发模式

```bash
# 自动重载（监听 TS 文件变化）
pnpm gateway:watch

# 前台启动网关
pnpm clawdbot gateway --port 18789 --verbose
```

---

## Docker 安装

适用于容器化部署或不想在本机安装的场景。

### 前置条件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2

### 快速启动

```bash
./docker-setup.sh
```

此脚本自动完成：

- 构建网关镜像
- 运行引导向导
- 生成 Gateway Token 并写入 `.env`
- 通过 Docker Compose 启动网关

启动后访问 `http://127.0.0.1:18789/` 打开控制面板。

### 手动启动

```bash
# 构建镜像
docker build -t clawdbot:local -f Dockerfile .

# 运行引导
docker compose run --rm clawdbot-cli onboard

# 启动网关
docker compose up -d clawdbot-gateway
```

### 可选配置

```bash
# 安装额外系统包
export CLAWDBOT_DOCKER_APT_PACKAGES="ffmpeg build-essential"

# 额外挂载目录
export CLAWDBOT_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro"

# 持久化 home 目录
export CLAWDBOT_HOME_VOLUME="clawdbot_home"

./docker-setup.sh
```

---

## 引导向导（Onboarding）

安装完成后，运行引导向导完成初始配置：

```bash
clawdbot onboard --install-daemon
```

向导会依次配置：

1. **网关模式** — 本地（Local）或远程（Remote）
2. **AI 模型认证** — Anthropic API Key（推荐）/ OpenAI OAuth / API Keys
3. **聊天渠道** — WhatsApp QR 登录、Telegram/Discord Bot Token 等
4. **后台服务** — 安装为 launchd (macOS) / systemd (Linux) 用户服务
5. **工作空间** — 初始化 `~/clawd` 目录及技能

> `--install-daemon` 标志会将网关安装为后台服务，开机自动启动。

---

## 启动与验证

### 检查网关状态

```bash
clawdbot gateway status
```

### 手动前台启动

```bash
clawdbot gateway --port 18789 --verbose
```

### 快速验证

```bash
# 查看整体状态
clawdbot status

# 健康检查
clawdbot health

# 打开 Web 控制面板
clawdbot dashboard
```

### 发送测试消息

```bash
clawdbot message send --target +15555550123 --message "Hello from Clawdbot"
```

### 与 AI 助手对话

```bash
clawdbot agent --message "你好，请介绍一下你自己" --thinking high
```

---

## 连接聊天渠道

### WhatsApp（QR 码登录）

```bash
clawdbot channels login
```

用 WhatsApp → 设置 → 已关联设备 扫描终端中的 QR 码。

### Telegram

```bash
clawdbot channels add --channel telegram --token "<BOT_TOKEN>"
```

### Discord

```bash
clawdbot channels add --channel discord --token "<BOT_TOKEN>"
```

### DM 安全（配对审批）

默认情况下，陌生人发送的私信会收到一个配对码，消息不会被处理，直到你手动审批：

```bash
# 查看待审批列表
clawdbot pairing list whatsapp

# 审批指定配对码
clawdbot pairing approve whatsapp <code>
```

---

## 更新

### 推荐方式：重新运行安装脚本

```bash
curl -fsSL https://clawd.bot/install.sh | bash
```

### 全局安装更新

```bash
npm i -g clawdbot@latest
# 或
pnpm add -g clawdbot@latest
```

### 源码安装更新

```bash
clawdbot update
# 或手动：
git pull && pnpm install && pnpm build && pnpm ui:build
```

### 更新后必做

```bash
clawdbot doctor        # 迁移配置、修复问题
clawdbot gateway restart   # 重启网关
clawdbot health        # 验证健康状态
```

### 切换更新通道

```bash
clawdbot update --channel stable   # 稳定版（推荐）
clawdbot update --channel beta     # 测试版
clawdbot update --channel dev      # 开发版
```

### 版本回滚

```bash
# 安装指定版本
npm i -g clawdbot@<version>

# 恢复后运行
clawdbot doctor
clawdbot gateway restart
```

---

## 卸载

### 快捷方式

```bash
clawdbot uninstall
```

### 手动卸载

```bash
# 1. 停止网关服务
clawdbot gateway stop

# 2. 卸载后台服务
clawdbot gateway uninstall

# 3. 删除配置和状态数据
rm -rf ~/.clawdbot

# 4. 删除工作空间（可选）
rm -rf ~/clawd

# 5. 移除 CLI
npm rm -g clawdbot
```

---

## 其他安装方式

| 方式          | 文档链接                         |
| ------------- | -------------------------------- |
| Nix           | [Nix 安装](/install/nix)         |
| Ansible       | [Ansible 部署](/install/ansible) |
| Bun（实验性） | [Bun 安装](/install/bun)         |

> **Bun 注意事项**：Bun 作为网关运行时存在 WhatsApp/Telegram 兼容性问题，**不推荐**用于生产环境。仅建议用于本地开发时的 TypeScript 直接执行。

---

## 常见问题

### `clawdbot: command not found`

这通常是 PATH 问题。诊断步骤：

```bash
node -v
npm -v
npm prefix -g
echo "$PATH"
```

如果 `$(npm prefix -g)/bin` 不在 PATH 中，添加到 shell 配置文件：

```bash
# ~/.zshrc 或 ~/.bashrc
export PATH="$(npm prefix -g)/bin:$PATH"
```

然后重新打开终端或执行 `source ~/.zshrc`。

### Linux 权限问题 (`EACCES`)

避免使用 `sudo npm install -g`，改为设置用户级全局目录：

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

将 `export PATH=...` 行添加到 shell 配置文件中持久化。

### 网关无法启动

```bash
# 运行诊断工具
clawdbot doctor

# 查看详细日志
clawdbot logs --follow
```

### AI 无响应（`no auth configured`）

重新运行向导配置认证：

```bash
clawdbot onboard
```

或手动配置 API Key。

---

## 重要目录

| 路径                        | 说明                       |
| --------------------------- | -------------------------- |
| `~/.clawdbot/`              | 配置、会话、凭证等状态数据 |
| `~/.clawdbot/clawdbot.json` | 主配置文件                 |
| `~/.clawdbot/credentials/`  | OAuth 凭证                 |
| `~/.clawdbot/agents/`       | Agent 会话与认证           |
| `~/clawd/`                  | 默认工作空间目录           |

---

## 下一步

- [macOS 菜单栏应用 + 语音唤醒](/platforms/macos)
- [iOS/Android 节点（Canvas/相机/语音）](/nodes)
- [远程访问（SSH 隧道 / Tailscale）](/gateway/remote)
- [安全配置](/gateway/security)
- [技能与工具](/tools)
