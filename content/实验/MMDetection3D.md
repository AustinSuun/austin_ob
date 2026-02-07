---
Date: 2025-11-15T18:10:00
作者:
  - Austin Suun
tags:
链接:
---

> [!NOTE] 简要介绍
> 

# 环境配置
```
sudo apt update
sudo apt install build-essential python3-dev cmake

```

```
conda install gcc_linux-64 gxx_linux-64
```
使用 conda 环境安装即可，先满足 Mamba-ssm 的需求，python 3.11 + torch 2.5.0 + cu 11.8


```
pip install  --timeout 300 \
    --retries 3 \
    -i https://pypi.tuna.tsinghua.edu.cn/simple \
    torch==2.5.0 \
    torchvision==0.20.0 \
    torchaudio==2.5.0 \
    --index-url https://download.pytorch.org/whl/cu118
```

版本是 `mamba-ssm-2.2.6.post3`, 需要确保安装了 CUDA （推荐 11.8）对应版本的 [Nvidia toolkit](https://developer.nvidia.com/cuda-11-8-0-download-archive?target_os=Linux&target_arch=x86_64&Distribution=Ubuntu&target_version=22.04&target_type=runfile_local)（NVCC），推荐使用 runfile 方式安装
```
pip install  --no-build-isolation  mamba-ssm[causal-conv1d]
```

## MMDetection 3 D
[参考手册](https://mmdetection3d.readthedocs.io/zh-cn/latest/get_started.html#id4) 的最佳实践安装

```
pip install -U openmim
mim install 'mmengine>=0.8.0,<1.0.0'
mim install  'mmcv>=2.0.0rc4,<2.2.0'
mim install 'mmdet>=3.0.0rc5,<3.4.0'
```

### 安装 MMDetection3D，-e 代表修改代码库直接生效
安装稀疏卷积
```
pip install cumm-cu118  spconv-cu118
```

降级 pip，或确保版本符合;安装库时会出现环境识别问题
```
pip install pip==23.2
python -m pip install setuptools==61.0.0

```
安装库
```
git clone https://github.com/open-mmlab/mmdetection3d.git -b dev-1.x
# "-b dev-1.x" 表示切换到 `dev-1.x` 分支。
cd mmdetection3d
pip install -v -e .
# "-v" 指详细说明，或更多的输出
# "-e" 表示在可编辑模式下安装项目，因此对代码所做的任何本地修改都会生效，从而无需重新安装。
```


# 自定义安装
使用源码安装，手动安装 torch



```
pip install  --timeout 300 \
    --retries 3 \
    -i https://pypi.tuna.tsinghua.edu.cn/simple \
    torch==2.5.0 \
    torchvision==0.20.0 \
    torchaudio==2.5.0 \
    --index-url https://download.pytorch.org/whl/cu118
```

版本是 `mamba-ssm-2.2.6.post3`, 需要确保安装了 CUDA （推荐 11.8）对应版本的 [Nvidia toolkit](https://developer.nvidia.com/cuda-11-8-0-download-archive?target_os=Linux&target_arch=x86_64&Distribution=Ubuntu&target_version=22.04&target_type=runfile_local)（NVCC），推荐使用 runfile 方式安装
```
pip install  --no-build-isolation  mamba-ssm[causal-conv1d]

python -m pip install --no-cache-dir https://github.com/Dao-AILab/causal-conv1d/releases/download/v1.5.0.post5/causal_conv1d-1.5.0.post5+cu11torch2.1cxx11abiFALSE-cp39-cp39-linux_x86_64.whl

```

```
pip install mmengine
```

## Python 3.10 + torch 2.6.0 + cu 11.8
```
pip install  --timeout 300 \
    --retries 3 \
    -i https://pypi.tuna.tsinghua.edu.cn/simple \
    torch==2.1.0 \
    torchvision==0.16.0 \
    torchaudio==2.1.0 \
    --index-url https://download.pytorch.org/whl/cu118
```

Mamba_ssm 需要使用 `numpy<2` 降级 numpy, opencv-python 同
```
pip uninstall numpy
pip install "numpy<2" "opencv-python<4.12"
```

```
pip install  --no-build-isolation  mamba-ssm[causal-conv1d]
```

```
pip install --no-binary :all: causal-conv1d
```

测试用，查看安装的包是否支持 torch 版本
```
python - <<'PY'
import torch
print("torch:", torch.__version__)
# 再试导入有问题的包
import causal_conv1d, mamba_ssm
print("causal_conv1d:", causal_conv1d.__version__)
print("mamba_ssm:", mamba_ssm.__version__)
print("OK ✔")
PY

```











```
pip install -U openmim
mim install 'mmengine>=0.8.0,<1.0.0'
mim install  'mmcv>=2.0.0rc4,<2.2.0'
mim install 'mmdet>=3.0.0rc5,<3.4.0'
```

查看一下 mmdet 的版本，有 numpy 冲突需要降级
```
pip install "numpy<2" "opencv-python<4.12"
```

```
pip install cumm-cu118  spconv-cu118
```

这个包在 mamba_ssm 中安装的版本过新，与 torch 不匹配，降版本
```
pip uninstall -U transformers
pip install -U "transformers==4.28.0"
```
## 验证安装
下载验证用文件
```
mim download mmdet3d --config pointpillars_hv_secfpn_8xb6-160e_kitti-3d-car --dest .
```

测试
```
python demo/pcd_demo.py demo/data/kitti/000008.bin pointpillars_hv_secfpn_8xb6-160e_kitti-3d-car.py hv_pointpillars_secfpn_6x8_160e_kitti-3d-car_20220331_134606-d42d15ed.pth --show
```