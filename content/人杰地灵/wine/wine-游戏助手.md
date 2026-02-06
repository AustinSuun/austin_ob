
安装网页
https://winegame.net/games/battlenet/

使用pacman下载安装



建议安装一个 miniforge 环境 单独给 游戏助手，当前支持python版本 3.12 ，但是 linux系统linux是 3.13 会报错



### ✅ 1. 创建干净环境（推荐 Python 3.12）

```bash
conda create -n lutris-py python=3.12
```

然后激活它：

```bash
conda activate lutris-py
```

---
修改 python的路径

```
sudo neovide /opt/apps/net.winegame.client/files/bin/lutris
```
第一行修改为
```
/home/austin/.conda/envs/wine_game/bin/python3
```

### ✅ 2. 安装 Lutris 所需模块

```bash
pip install certifi
conda install -c conda-forge pygobject
```

⚠️ 如果你不确定还缺哪些模块，你可以尝试运行 `/opt/apps/net.winegame.client/files/bin/lutris`，然后根据报错补装依赖模块。

---

### ✅ 3. 让 Lutris 用这个 Python 运行

你可以写一个 wrapper 脚本，比如：

```bash
#!/home/austin/miniforge3/envs/lutris-py/bin/python

from lutris.gui.application import Application

Application().run()
```

或者直接编辑 Lutris 的启动脚本，比如你现在的路径是：

```
/opt/apps/net.winegame.client/files/share/lutris/bin/lutris-wrapper
```

你可以修改它的第一行：

```python
#!/usr/bin/env python3
```


使用这个命令查看报错日志
```
killall python3; WINEDEBUG=+loaddll,+pid,+timestamp /opt/apps/net.winegame.client/files/bin/winegame 2>&1 | tee ~/wine.log
```