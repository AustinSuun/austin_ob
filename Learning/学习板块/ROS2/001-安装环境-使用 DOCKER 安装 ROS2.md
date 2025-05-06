---
日期: 2025-04-25
作者: 
tags:
  - DOCKER
  - ROS2
  - 执行权限
---
## 🐳 Docker 是个啥？

Docker 就像个“**虚拟环境管理器**”，每个“容器”就是一个可以运行的迷你系统，里边可以装 ROS、Python、网页服务器，啥都行。你可以随时启动、停止、删掉，和你的主系统完全分开。

---
## ✅ 第一步：安装 Docker（Arch）

打开终端，输：

```bash
sudo pacman -S docker
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

|命令|作用|
|---|---|
|`sudo systemctl enable --now docker`|启用并启动 Docker 服务|
|`sudo usermod -aG docker $USER`|让当前用户可以不用 sudo 使用 Docker|

然后 **退出重新登录** 或者直接重启（让 docker 权限生效）。

ps:如果安装时失败，可以更新一下软件仓库 `sudo pacman -Syy`

---
## ✅ 第二步：拉 ROS 2 Jazzy 镜像

jazzy 是最新的长期支持版本
镜像来源，使用指定的 tag 拉取，下载 jazzy-full，最新的长期支持版的完整包
[https://hub.docker.com/r/althack/ros2/tags?name=ja](https://hub.docker.com/r/althack/ros2/tags?name=ja)

```bash
docker pull althack/ros2:jazzy-full-2025-04-01
```

这个镜像就是：**官方发布的 ROS 2 Jazzy 环境**，干净稳定，适合开发。
ps：拉取镜像超时，打开 代理 tun 模式 再拉取
下载完 运行 `docker images` 查看镜像

---

## ✅ 第三步：运行 ROS 2 容器

现在来跑一个最基本的容器：

```bash
docker run -it --rm ros2:jazzy-full-2025-04-01
```

你会看到进了一个终端，提示符是 `root@xxxxx`，然后你可以试试：

```bash
ros2 --help
```

说明你已经在容器里跑 ROS 2 了！

---

## ✅ 第四步：挂载你自己的代码（更实用）

假设你有个 ROS 2 项目在本地 `/home/zhengma/dev_ws`，你可以这样挂进去：

```bash
docker run -it --rm \\
  -v /home/zhengma/dev_ws:/root/dev_ws \\
  ros2:jazzy-full-2025-04-01
```

容器内就能看到 `/root/dev_ws`，等于把你的项目文件挂进去了。

---

## ✅ 第五步：退出容器

只要敲：

```bash
exit
```

容器就关了（因为我们用的是 `--rm`，自动清理），一点不占资源。

---

## 🧙 小魔法（可选）

加一个快捷命令，以后用：

```bash
alias ros2jazzy='docker run -it --rm ros:jazzy-ros-base'
```

然后你只要敲：

```bash
ros2jazzy
```

就能直接进入环境！

---

# Docker 显示GUI界面配置

需要使用 xhost 来显示到屏幕上

在 Arch Linux 上安装 `xhost` 非常简单，它是 `xorg-xhost` 软件包的一部分。

---

### ✅ 安装命令如下：

```bash
sudo pacman -S xorg-xhost
```

---

### 然后授权 Docker 使用 X11：

```bash
xhost +si:localuser:root
```

> 这条命令告诉 X11：“允许本地的 root 用户（比如你的 Docker 容器）访问图形界面”。

---

### 🐢 接下来就可以运行 Docker GUI 了，例如：

```bash
docker run -it \\
  --env DISPLAY=$DISPLAY \\
  --env QT_X11_NO_MITSHM=1 \\
  --env QT_QPA_PLATFORM=xcb \\
  --volume /tmp/.X11-unix:/tmp/.X11-unix \\
  ros:humble
```

然后在容器里运行：

```bash
ros2 run turtlesim turtlesim_node
```

---

下面是一个完整的一键脚本，名叫 `run_turtlesim.sh`，适用于你当前的 Arch Linux + Wayland + Docker 环境，自动设置好图形显示并启动小乌龟：

---

## 🐢 `run_turtlesim.sh` 脚本内容：

```bash
#!/bin/bash

# 🐧 设置图形显示权限（只需执行一次，但重复执行也没问题）
echo "📢 授权 root 用户访问 X11..."
xhost +si:localuser:root

# 🐳 启动 ROS 2 容器（使用软件渲染）
echo "🚀 启动 ROS 2 turtlesim 容器..."

docker run -it --rm \\
  --env DISPLAY=$DISPLAY \\
  --env LIBGL_ALWAYS_SOFTWARE=1 \\
  --env QT_X11_NO_MITSHM=1 \\
  --env QT_QPA_PLATFORM=xcb \\
  --volume /tmp/.X11-unix:/tmp/.X11-unix \\
  --name ros2_container \\
  -v $(pwd):/root/ros2_ws
  althack/ros2:jazzy-full-2025-04-01 \\
  # bash -c "ros2 run turtlesim turtlesim_node"
```

---

## ✅ 使用方法：

1. **保存为脚本文件**（比如 `run_turtlesim.sh`）：
    
    ```bash
    nano run_turtlesim.sh
    # 粘贴脚本内容，然后 Ctrl+O 保存，Ctrl+X 退出
    
    ```
    
2. **加执行权限**：
    
 ```bash
	chmod +x run_turtlesim.sh
 
  ```

3. **运行！**
 
```bash
	./run_turtlesim.sh
```


---

这脚本会自动：

- 授权容器访问图形界面
- 启动 ROS 2 容器
- 使用软件渲染解决 OpenGL 问题
- 挂载当前文件夹到镜像
- 启动小乌龟节点显示窗口

---

如果你后续想支持 `teleop` 或用 `rviz2`、`rqt`，我也可以帮你扩展进去！

# 开多终端的方法

例如，如果你的容器名字叫做 `ros2_container`，那么命令会是这样的：

```bash
docker exec -it ros2_container bash
```

这将在 `ros2_container` 容器中打开一个新的 bash 终端，允许你在其中执行命令和操作。



# VS code 中写代码
安装插件-dev-RemoteContainer

用脚本打开镜像容器，挂载文件夹到镜像中（脚本中已经设置）

点击 VS 左下角蓝色连接按钮，选择附加到容器打开|attach  这个选项，选择容器
会打开一个新的窗口，在里面可以访问挂载的文件夹 $ros2\_ws$, 修改的代码可以直接同步到本地文件夹