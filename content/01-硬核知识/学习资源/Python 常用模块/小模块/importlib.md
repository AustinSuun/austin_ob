---
日期: 2025-06-29
作者:
  - Austin
tags:
---
`import importlib` 导入了 Python 的动态导入模块，用于在运行时动态加载和导入模块。

**主要用途：**

**1. 动态导入模块**

```python
import importlib

# 根据字符串动态导入模块
module_name = "torch"
torch = importlib.import_module(module_name)

# 等价于 import torch
```

**2. 重新加载模块**

```python
import importlib
import my_module

# 修改 my_module.py 后重新加载
importlib.reload(my_module)
```

**3. 根据配置动态选择模块**

```python
import importlib

def get_model(model_name):
    # 根据模型名称动态导入对应模块
    module = importlib.import_module(f"models.{model_name}")
    return module.Model()

# 使用
model = get_model("pointnet")  # 导入 models.pointnet 模块
```

**在深度学习项目中的常见用法：**

```python
import importlib

# 动态导入模型
def load_model(args):
    model_module = importlib.import_module(f"models.{args.model}")
    model = model_module.get_model(args.num_category)
    return model

# 根据参数选择不同模型
# python train.py --model pointnet_cls
# 会动态导入 models.pointnet_cls 模块
```

**优势：**

- 避免硬编码 import 语句
- 支持插件化架构
- 可以根据配置文件或命令行参数选择不同实现
- 便于模块化和扩展

这在机器学习框架中很常见，可以灵活切换不同的模型实现。