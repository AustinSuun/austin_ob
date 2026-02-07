---
日期: 2025-11-04T16:40:00
作者:
  - Austin
tags:
---



# Docker

##  安装 Docker

### 更新系统和依赖

```bash
sudo apt-get update
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
```

### 添加 Docker 官方 GPG key

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

### 添加 Docker 仓库

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 安装 Docker Engine

```bash
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
```

### 测试 Docker 是否安装成功

```bash
sudo docker run hello-world
```

---

## 安装 Docker Compose

### 方法 1：Ubuntu 官方包（推荐）

```bash
sudo apt-get install -y docker-compose
```

### 方法 2：下载官方二进制（最新版本）

```bash
DOCKER_COMPOSE_VERSION=2.22.0
sudo curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```
---

## 4️⃣ Docker 基本使用

### 拉取镜像

```bash
docker pull pytorch/pytorch:2.9.0-cuda12.8-cudnn9-devel
```

### 运行容器

```bash
docker run -it --gpus all pytorch/pytorch:2.9.0-cuda12.8-cudnn9-devel /bin/bash
```

### 查看容器

```bash
docker ps -a
```

### 进入运行中容器

```bash
docker exec -it <容器ID或名字> /bin/bash
```

### 停止容器

```bash
docker stop <容器ID或名字>
```

---

## 5️⃣ Docker Compose 基本使用

### 创建 `docker-compose.yml`

示例：

```yaml
version: "3.9"
services:
  lion:
    image: my-lion:latest
    build:
      context: .
      dockerfile: Dockerfile
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    volumes:
      - ./LION:/workspace/LION
      - ./data:/workspace/data
    working_dir: /workspace/LION
    command: /bin/bash
    tty: true
```

### 启动服务

```bash
docker-compose up -d
```

### 查看日志

```bash
docker-compose logs -f
```

### 停止服务

```bash
docker-compose down
```

---

💡 总结：

1. **Docker** → 安装容器引擎，拉取镜像，启动容器
    
2. **Docker Compose** → 管理多服务容器，挂载卷、配置环境、GPU 支持
    
3. **结合 NVIDIA Container Toolkit** → GPU 可以被容器识别
    

---

## Docker 状态查看
Docker 作为守护进程运行，需要 **Docker 服务启动**，才能管理和运行容器。
### 1️⃣ 查看 Docker 服务状态

```bash
sudo systemctl status docker
```

### 2️⃣ 启动 Docker 服务

```bash
sudo systemctl start docker
```

### 3️⃣ 开机自启（可选）

```bash
sudo systemctl enable docker
```

---

💡 注意事项：

- 如果 Docker 服务没启动，运行 `docker run` 或 `docker-compose up` 会报错
    
- Linux 下 Docker 是通过守护进程管理容器的，所以必须先启动服务
    
- Windows / Mac 安装 Docker Desktop 时，它会自动启动 Docker 服务

## 

# 宿主机



Docker 使用 GPU，除了需要在镜像中安装 toolkit，在宿主机中需要安装 container-toolkit 工具

https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html


安装 **NVIDIA Container Toolkit** 让 Docker 能识别 GPU，一般步骤如下（以 Ubuntu 为例）：

---

### 1️⃣ 准备

确保宿主机已经安装 **Docker** 并且 GPU 驱动可用：

```bash
nvidia-smi
```

能看到 GPU 信息才可以继续。

---

### 2️⃣ 添加 NVIDIA Docker 存储库

```bash
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update
```
因为 apt 库中没有这个包，这里手动添加，使能够识别到该包

---

### 3️⃣ 安装 NVIDIA Container Toolkit

```bash
sudo apt-get install -y nvidia-docker2
```

---

### 4️⃣ 重启 Docker 服务

```bash
sudo systemctl restart docker
```

---

### 5️⃣ 测试 GPU 是否可用

```bash
docker run --rm --gpus all nvidia/cuda:12.1.1-base-ubuntu22.04 nvidia-smi
```

- 如果输出 GPU 信息 → 安装成功
    

---

💡 注意事项

- Ubuntu 18.04 / 20.04 / 22.04 都支持
    
- Docker Compose 也能使用 GPU，只需要在服务里加：
    

```yaml
runtime: nvidia
environment:
  - NVIDIA_VISIBLE_DEVICES=all
```

> 总结：  
> 安装流程就是：**添加仓库 → 安装 nvidia-docker2 → 重启 Docker → 测试 GPU**

# VS_CODE 获取权限
使用如下设置权限
```
# 检查权限
ls -l /var/run/docker.sock

# 如果权限不对，修复
sudo chmod 666 /var/run/docker.sock
# 或者
sudo chown root:docker /var/run/docker.sock
sudo chmod 660 /var/run/docker.sock
```



## 在 VS Code 远程终端中执行：

```bash
# 1. 将当前用户添加到 docker 组
sudo usermod -aG docker $USER

# 2. 验证添加成功
getent group docker

# 3. 立即测试权限（临时生效）
newgrp docker
docker ps
```

## 关键步骤：重新连接 VS Code

**执行完上述命令后，必须重新连接 VS Code**：

1. **完全关闭当前的 VS Code 窗口**
2. **重新打开 VS Code**
3. **重新 SSH 连接到 matcloud 服务器**
4. **在新的会话中测试**：
   ```bash
   docker ps
   ```

