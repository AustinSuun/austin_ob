---
Date: 2025-11-10T20:56:00
作者:
  - Austin Suun
tags:
链接:
---

> [!NOTE] 简要介绍
> 
你的系统没有安装 SSH 服务器。让我们安装并配置它：

查看服务器 ip，通常是本地网口 1 中的
```
ip addr
```
## 安装 SSH 服务器

### 1. 安装 OpenSSH 服务器
```bash
sudo apt update
sudo apt install openssh-server
```

### 2. 启动 SSH 服务
```bash
# 启动服务
sudo systemctl start ssh

# 设置开机自启
sudo systemctl enable ssh

# 检查状态
sudo systemctl status ssh
```

### 3. 检查 SSH 是否正在监听
```bash
# 检查 SSH 端口
ss -tlnp | grep :22

# 或者使用
netstat -tlnp | grep :22
```

## 配置 SSH 服务器

### 1. 基本配置（可选）
```bash
# 备份原配置
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# 编辑配置
sudo nano /etc/ssh/sshd_config
```

### 2. 重要的安全配置
```bash
# 确保以下设置（取消注释或添加）：
Port 22
PermitRootLogin no
PasswordAuthentication yes
PubkeyAuthentication yes
AllowUsers <user>
```

### 3. 重启 SSH 服务应用配置
```bash
sudo systemctl restart ssh
```

## 设置 SSH 密钥认证（推荐）

### 1. 生成 SSH 密钥对
```bash
# 在客户端电脑生成密钥
ssh-keygen -t ed25519 -C "<user>@campus"

# 或者使用 RSA
ssh-keygen -t rsa -b 4096 -C "<user>@campus"
```

### 2. 将公钥复制到服务器
```bash
# 方法一：使用 ssh-copy-id（如果知道IP）
ssh-copy-id <user>@<server_ip>

# 方法二：手动复制
cat ~/.ssh/id_ed25519.pub
# 然后手动将输出内容添加到服务器的 ~/.ssh/authorized_keys 文件中
```

## 验证 SSH 服务

### 1. 本地测试连接
```bash
# 从本机连接自己测试
ssh <user>@localhost

# 或者使用环回地址
ssh <user>@127.0.0.1
```

### 2. 从局域网其他设备连接
现在其他设备可以通过以下方式连接你的电脑：
```bash
ssh <user>@<server_ip>
```


安装完成后，从另一台电脑测试：
```bash
ssh <user>@<server_ip>
```

**总结**：先运行安装命令 `sudo apt install openssh-server`，然后启动服务，就可以在校园网内通过 SSH 连接你的电脑了！




**下一节**
[[向服务器传输文件]]
