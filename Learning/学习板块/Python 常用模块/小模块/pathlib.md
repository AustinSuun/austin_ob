---
日期: 2025-06-29
作者:
  - Austin
tags:
---
现代化的文件路径操作

# Pathlib. Path
## 基本用法
```python
From pathlib import Path

# 创建路径对象
P = Path ("data/models/checkpoint. Pth")
P = Path.Home () / "Documents" / "project"  # 使用 / 操作符连接路径

# 常用属性
print (p.name)        # 文件名
print (p.suffix)      # 文件扩展名
print (p.parent)      # 父目录
print (p.stem)        # 不含扩展名的文件名
```
## 常用用法
```python
# 检查路径
p.exists()           # 是否存在
p.is_file()          # 是否为文件
p.is_dir()           # 是否为目录

# 创建目录
p.mkdir(parents=True, exist_ok=True)

# 遍历目录
for file in p.glob("*.py"):
    print(file)

# 读写文件
content = p.read_text()
p.write_text("hello world")
```