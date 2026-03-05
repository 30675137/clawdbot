# Ops Agent 命令详解

## 网关管理命令

### 启动网关

**触发词：** `启动网关`、`启动 gateway`、`start gateway`

**功能：** 启动 OpenClaw 网关服务

**执行步骤：**

1. 检查端口可用性（18789）
2. 清理旧进程
3. 启动网关
4. 验证启动成功

**示例：**

```
用户: @ops-agent 启动网关
Agent: ✓ 已接收命令，操作 ID: ops-xxx
       正在启动网关...

Agent: ✓ 网关启动成功
       监听端口: 18789
       状态: 运行中
```

### 停止网关

**触发词：** `停止网关`、`stop gateway`

**功能：** 优雅关闭网关服务

**示例：**

```
用户: @ops-agent 停止网关
Agent: ✓ 已接收命令，操作 ID: ops-xxx
       正在停止网关...

Agent: ✓ 网关已停止
```

### 重启网关

**触发词：** `重启网关`、`restart gateway`

**功能：** 重启网关（停止 → 启动）

**示例：**

```
用户: @ops-agent 重启网关
Agent: ✓ 已接收命令，操作 ID: ops-xxx
       正在重启网关...

Agent: ✓ 网关重启成功
       监听端口: 18789
```

### 查看状态

**触发词：** `查看状态`、`status`、`gateway status`

**功能：** 查看网关运行状态

**输出信息：**

- 运行状态（运行中/已停止）
- 监听端口
- 启动时间
- 连接的渠道

**示例：**

```
用户: @ops-agent 查看状态
Agent: ✓ 已接收命令，操作 ID: ops-xxx

Agent: ✓ 网关状态
       状态: 运行中
       端口: 18789
       启动时间: 2026-03-06 10:30:00
       渠道: Feishu, Telegram, Discord
```

## 版本管理命令

### 检查更新

**触发词：** `检查更新`、`check-update`

**功能：** 检查是否有新版本可用

**示例：**

```
用户: @ops-agent 检查更新
Agent: ✓ 已接收命令，操作 ID: ops-xxx

Agent: ✓ 检查完成
       当前版本: 2026.3.4
       最新版本: 2026.3.5
       更新可用: 是
```

### 更新到最新版本

**触发词：** `更新`、`update`

**功能：** 更新 OpenClaw 到最新版本

**执行步骤：**

1. 检查当前版本
2. 下载最新版本
3. 安装依赖
4. 验证安装
5. 重启网关

**示例：**

```
用户: @ops-agent 更新
Agent: ✓ 已接收命令，操作 ID: ops-xxx
       正在更新...

Agent: ✓ 更新完成
       版本: 2026.3.5
       耗时: 2m 30s
```

### 更新到指定版本

**触发词：** `update-to 版本号`

**功能：** 更新到指定版本

**参数：**

- `版本号` - 目标版本（格式：YYYY.M.D）

**示例：**

```
用户: @ops-agent update-to 2026.3.5
Agent: ✓ 已接收命令，操作 ID: ops-xxx
       正在更新到 2026.3.5...

Agent: ✓ 更新完成
       版本: 2026.3.5
```

## 配置管理命令

### 查看配置

**触发词：** `config get 配置项`

**功能：** 查看指定配置项的值

**参数：**

- `配置项` - 配置项名称（如 gateway.mode）

**示例：**

```
用户: @ops-agent config get gateway.mode
Agent: ✓ 已接收命令，操作 ID: ops-xxx

Agent: ✓ 配置查询完成
       gateway.mode = local
```

### 修改配置

**触发词：** `config set 配置项 值`

**功能：** 修改配置项的值

**参数：**

- `配置项` - 配置项名称
- `值` - 新的值

**示例：**

```
用户: @ops-agent config set gateway.mode local
Agent: ✓ 已接收命令，操作 ID: ops-xxx
       正在修改配置...

Agent: ✓ 配置已修改
       gateway.mode = local
```

### 列出所有配置

**触发词：** `config list`

**功能：** 列出所有配置项

**示例：**

```
用户: @ops-agent config list
Agent: ✓ 已接收命令，操作 ID: ops-xxx

Agent: ✓ 配置列表
       gateway.mode = local
       gateway.port = 18789
       agents.defaults.model = anthropic/claude-opus-4-6
       ...
```

## 诊断命令

### 运行诊断

**触发词：** `诊断`、`diagnose`

**功能：** 运行系统诊断检查

**检查项：**

- 配置文件有效性
- 依赖安装情况
- 端口可用性
- Node 版本
- 权限设置

**示例：**

```
用户: @ops-agent 诊断
Agent: ✓ 已接收命令，操作 ID: ops-xxx
       正在诊断...

Agent: ✓ 诊断完成
       ✓ 配置文件有效
       ✓ 依赖已安装
       ✓ 端口可用
       ✓ Node 版本正确
       ✓ 权限正确
```

### 查看日志

**触发词：** `查看日志`、`logs`、`logs 行数`

**功能：** 查看最近的日志

**参数：**

- `行数` - 显示的日志行数（默认 20）

**示例：**

```
用户: @ops-agent 查看日志 50
Agent: ✓ 已接收命令，操作 ID: ops-xxx

Agent: ✓ 最近 50 行日志
       [2026-03-06 10:30:00] INFO gateway started
       [2026-03-06 10:30:01] INFO feishu adapter connected
       ...
```

## 历史命令

### 查看操作历史

**触发词：** `history`

**功能：** 查看最近的操作历史

**显示信息：**

- 操作 ID
- 命令类型
- 执行时间
- 执行结果

**示例：**

```
用户: @ops-agent history
Agent: ✓ 已接收命令，操作 ID: ops-xxx

Agent: ✓ 操作历史���最近 20 条）
       ops-001 | status | 2026-03-06 10:30:00 | ✓ 成功
       ops-002 | update | 2026-03-06 10:35:00 | ✓ 成功
       ops-003 | config get | 2026-03-06 10:40:00 | ✓ 成功
```

### 清空历史

**触发词：** `history clear`

**功能：** 清空所有操作历史

**示例：**

```
用户: @ops-agent history clear
Agent: ✓ 已接收命令，操作 ID: ops-xxx
       正在清空历史...

Agent: ✓ 历史已清空
```

## 错误处理

### 命令解析失败

```
用户: @ops-agent invalid-command
Agent: ✗ 命令解析失败
       未知命令: invalid-command

       支持的命令:
       - 启动网关
       - 停止网关
       - 重启网关
       - 查看状态
       - 检查更新
       - 更新
       - update-to 版本号
       - config get 配置项
       - config set 配置项 值
       - config list
       - 诊断
       - 查看日志
       - history
       - history clear
```

### 执行失败

```
用户: @ops-agent 启动网关
Agent: ✓ 已接收命令，操作 ID: ops-xxx

Agent: ✗ 启动失败
       错误: 端口 18789 已被占用
       建议: 检查是否有其他进程占用该端口
       命令: lsof -i :18789
```

## 最佳实践

1. **定期检查更新** - 保持系统最新
2. **定期诊断** - 及时发现问题
3. **查看日志** - 了解系统运行情况
4. **保存历史** - 便于审计和故障排查
5. **谨慎修改配置** - 修改前备份当前配置
