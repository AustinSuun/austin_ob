---
日期: 2025-05-13
作者:
  - Austin
tags:
  - conda
  - miniforge
---
# 安装
首先 AUR 下载 miniforge，下载完之后需要手动广告加一下环境变量，fish 用 set 设置环境变量

先查看一下路径，通常在 opt 中

## 永久添加 PATH

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
    
    ```shell
    set -Ux fish_user_paths /opt/miniforge/bin $fish_user_paths
    
    ```
    

---

## Conda 初始化

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

# 使用
## 打包环境

---

## 完整导出 conda 环境

适合在另一个地方重建完整的 conda 环境：

```bash
conda env export > environment.yml
```

然后在别的机器上可以用以下命令还原环境：

```bash
conda env create -f environment.yml
```

其中的 `environment.yml` 看起来像这样：

```yaml
name: myenv
channels:
  - defaults
dependencies:
  - numpy=1.24.0
  - pandas=1.5.0
  - pip:
    - matplotlib==3.6.0
```

> 包括了 `conda` 安装的包和 `pip` 安装的包，非常完整。

---

## 可选优化（只导出手动安装的包）

如果你不想导出所有包（包括基础依赖），而只导出你自己装的包：

```bash
conda list --explicit > spec-file.txt
```

或者：

```bash
conda env export --from-history > environment.yml
```

这会只列出你用命令安装过的包，而不是环境中的所有依赖。
