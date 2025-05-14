---
日期: 2025-05-13
作者:
  - Austin
tags:
  - conda
  - miniforge
---

首先 AUR 下载 miniforge，下载完之后需要手动广告加一下环境变量，fish 用 set 设置环境变量

先查看一下路径通常在 opt 中

### 永久添加 PATH（以 Bash 为例）

把那条 `export PATH=...` 写进你的 shell 配置文件：

- 如果用的是 **Bash**：
    
    ```bash
    echo 'export PATH=/opt/miniforge/bin:$PATH' >> ~/.bashrc
    source ~/.bashrc
    ```
    
- 如果用的是 **Zsh**：
    
    ```bash
    echo 'export PATH=/opt/miniforge/bin:$PATH' >> ~/.zshrc
    source ~/.zshrc
    ```
    
- 如果你用的是 **Fish shell**：
    
    ```fish
    set -Ux fish_user_paths /opt/miniforge/bin $fish_user_paths
    
    ```
    

---

### ✅ 4. Conda 初始化

PATH 设置好之后，运行：

```bash
conda init
```

然后重新打开终端。

Fish 需要额外添加一个环境变量
```
echo 'source /opt/miniforge/etc/fish/conf.d/conda.fish' >> ~/.config/fish/config.fish

```
或者手动添加到配置文件
![image.png](https://cdn.jsdelivr.net/gh/AustinSuun/image/img/20250513205958899.png)
