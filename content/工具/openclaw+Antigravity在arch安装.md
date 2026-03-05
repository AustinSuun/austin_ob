---
日期: 2026-03-02T08:56:00
作者:
  - Austin
tags:
draft: false
---
# Antigravity 安装和更新

```
curl -sSL https://raw.githubusercontent.com/BOTOOM/google-antigravity-bin-arch/main/install_antigravity | bash
```


# Openclaw 安装和更新

```
curl -fsSL https://openclaw.ai/install.sh | bash
```


- 启动
```bash
pkill -f openclaw
openclaw dashboard
```


```
openclaw tui
```
- 打开控制板 (推荐)
```
openclaw dashboard
```

## 使用硅基流动进行配置

- 首先需要修改 json 配置，添加硅基流动的 token 和模型信息等配置
```
sudo gedit ~/.openclaw/openclaw.json
```

- 模型部分配置示例
```json
{
  "meta": {
    "lastTouchedVersion": "2026.2.26"
  },
  "models": {
    "providers": {
      "siliconflow": {
        "baseUrl": "https://api.siliconflow.cn/v1",
        "apiKey": "硅基流动api",
        "api": "openai-completions",
        "models": [
          {
            "id": "Pro/MiniMaxAI/MiniMax-M2.5",
            "name": "MiniMax-M2.5"
          },
          {
            "id": "Pro/zai-org/GLM-5",
            "name": "GLM-5"
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "siliconflow/Pro/MiniMaxAI/MiniMax-M2.5"
      },
      "workspace": "/home/austin/.openclaw/workspace-main"
    },
    "list": [
      {
        "id": "main",
        "model": "siliconflow/Pro/MiniMaxAI/MiniMax-M2.5",
        "workspace": "/home/austin/.openclaw/workspace-main"
      },
      {
        "id": "glm",
        "model": "siliconflow/Pro/zai-org/GLM-5",
        "workspace": "/home/austin/.openclaw/workspace-glm"
      }
    ]
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "token": "openclaw_token"
    }
  }
}
```


## 重新启动
```bash
pkill -f openclaw

sudo chown austin:austin ~/.openclaw/openclaw.json
chmod 644 ~/.openclaw/openclaw.json

openclaw gateway --force
```

- 查看模型
```
openclaw models list
```

- 重新打开
```
openclaw dashboard
```
## 查看模型
```
openclaw models list
```



# Openclaw 多 agent 配置
参考 [https://www.crewclaw.com/blog/openclaw-multi-agent-setup-guide](多agent配置)

##  注册需要每个 agent
```
sudo gedit ~/.openclaw/openclaw.json
```

例如下，三个agent，需要修改你的配置文件，确保每个 Agent 都有唯一的 `id` 和对应的 `workspace` 路径
```
"agents": {
  "list": [
    {
      "id": "innovator",
      "name": "创新点挖掘机",
      "model": "siliconflow/Pro/zai-org/GLM-5",
      "workspace": "/home/austin/project/agents/innovator"
    },
    {
      "id": "coder",
      "name": "实验代码专家",
      "model": "siliconflow/Pro/MiniMaxAI/MiniMax-M2.5",
      "workspace": "/home/austin/project/agents/coder"
    },
    {
      "id": "writer",
      "name": "论文排版员",
      "model": "siliconflow/Pro/MiniMaxAI/MiniMax-M2.5",
      "workspace": "/home/austin/project/agents/writer"
    }
  ]
}
```

## 手动构建物理目录 （一键脚本）
```
# 1. 创建所有目录
mkdir -p ~/project/agents/{innovator,coder,writer}
mkdir -p ~/project/shared/knowledge

# 2. 为每个 Agent 写入user.md

# 3. 注入角色灵魂 (SOUL.md)

# 4. 建立团队名录 (AGENTS.md) 让它们互相认识
echo "- innovator: 找创新点\n- coder: 写实验代码\n- writer: 写论文" > ~/project/agents.md
```

```
# Create workspaces
mkdir -p agents/orion agents/echo agents/radar

# Register all three agents
openclaw agents add orion --workspace ./agents/orion --non-interactive
openclaw agents add echo --workspace ./agents/echo --non-interactive
openclaw agents add radar --workspace ./agents/radar --non-interactive

# Start the gateway
openclaw gateway start

# Send a task to the coordinator
openclaw agent --agent orion --message "Write an SEO-optimized blog post about AI automation"
```