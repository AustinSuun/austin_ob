---
Date: 2025-11-21T19:31:00
作者:
  - Austin Suun
tags:
链接:
---

> [!NOTE] 简要介绍
> 


**ToDo**

- [ ] 

---


# Python 3.8+torch 2.1+cuda 11.8
```
pip install  --timeout 300 \
    --retries 3 \
    -i https://pypi.tuna.tsinghua.edu.cn/simple \
    torch==2.1.0 \
    torchvision==0.16.0 \
    torchaudio==2.1.0 \
    --index-url https://download.pytorch.org/whl/cu121
```

# 稀疏卷积
```
pip install cumm-cu118  spconv-cu118
```

# Mamba 2.2
```
pip install  --no-build-isolation  mamba-ssm[causal-conv1d]
```

1.5
```
pip install --no-binary :all: causal-conv1d
```

# Openpcdet
项目文件夹内
```
pip install -e .
```

```
pip install torch_scatter
pip install timm
```

```
pip install "opencv-python<4.12"
```



```
pip install nvidia-ml-py
```
1. 确保步幅为8的倍数


确保 _d_model * expand / headdim_ 是8的倍数。例如，如果 _d_model=192_，_expand=2_，则 _headdim_ 应该设置为48。

**示例：**
```
model = Mamba2(

d_model=192,

d_state=64,

d_conv=4,

expand=2,

headdim=48,

).to("cuda")
```


# 安装 openpcdet

```
pip install -e . -i https://mirrors.aliyun.com/pypi/simple/
```