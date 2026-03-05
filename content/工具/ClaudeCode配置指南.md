---
日期: 2026-03-05T20:00:00
作者:
  - Austin
tags:
draft: false
---
按照以下步骤完成接入，即可使用 **codeflow.asia** 等平台的 Claude 模型调用服务。

---
## 1. 获取访问密钥
1. 在相应平台注册并登录。
2. 进入左侧 **令牌管理** → 点击 **添加令牌**，选择合适的分组后提交。
3. 复制生成的密钥（格式为 `sk-...`），妥善保存。
---
## 2. 配置文件
### ① settings.json
找到并编辑 `settings.json`（不存在则新建），填入以下内容：
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://codeflow.asia",
    "ANTHROPIC_AUTH_TOKEN": "您的密钥"
  }
}
```

**文件路径（按系统选择）：**
- **Windows**: `C:\Users\<用户名>\.claude\settings.json`
- **macOS**: `/Users/<用户名>/.claude/settings.json`
- **Linux**: `~/.claude/settings.json`
---
### ② .claude.json (绕过初始化)
在用户目录下找到 `.claude.json`，搜索 `userID` 字段，在其下方添加以下内容后保存：

```json
"hasCompletedOnboarding": true,
```

**文件路径（按系统选择）：**
- **Windows**: `C:\Users\<用户名>\.claude.json`
- **macOS**: `/Users/<用户名>/.claude.json`
- **Linux**: `~/.claude.json`
---
## 3. 完成
保存所有文件后，重新启动 `claude` 即可直接使用。