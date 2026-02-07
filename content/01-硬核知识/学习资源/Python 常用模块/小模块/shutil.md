---
日期: 2025-06-29
作者:
  - Austin
tags:
---
`shutil` 是 Python 的文件和目录操作模块，提供了高级的文件操作功能。

**主要功能：**

**1. 文件复制**

```python
import shutil

# 复制文件
shutil.copy("source.txt", "dest.txt")          # 复制文件
shutil.copy2("source.txt", "dest.txt")         # 复制文件+元数据
shutil.copyfile("source.txt", "dest.txt")      # 只复制文件内容
shutil.copytree("src_dir", "dest_dir")         # 复制整个目录树
```

**2. 文件移动**

```python
# 移动/重命名文件或目录
shutil.move("old_path", "new_path")
```

**3. 删除操作**

```python
# 删除整个目录树
shutil.rmtree("directory_path")
# 比 os.rmdir() 更强大，可以删除非空目录
```

**4. 磁盘空间**

```python
# 获取磁盘使用情况
total, used, free = shutil.disk_usage("/")
print(f"Total: {total}, Used: {used}, Free: {free}")
```

**5. 压缩和解压**

```python
# 创建压缩文件
shutil.make_archive("archive_name", "zip", "directory_to_compress")

# 解压文件
shutil.unpack_archive("archive.zip", "extract_to")
```

**在深度学习项目中的常见用法：**

```python
import shutil
from pathlib import Path

# 保存最佳模型时备份
def save_checkpoint(model, epoch, is_best):
    checkpoint_path = f"checkpoint_epoch_{epoch}.pth"
    torch.save(model.state_dict(), checkpoint_path)
    
    if is_best:
        # 复制最佳模型
        shutil.copy(checkpoint_path, "best_model.pth")

# 清理旧的实验结果
def clean_experiment_dir(exp_dir):
    if Path(exp_dir).exists():
        shutil.rmtree(exp_dir)  # 删除整个实验目录
    Path(exp_dir).mkdir(parents=True)  # 重新创建
```

**优势：**

- 比 `os` 模块更高级、更方便
- 自动处理权限和元数据
- 跨平台兼容性好
- 支持递归操作