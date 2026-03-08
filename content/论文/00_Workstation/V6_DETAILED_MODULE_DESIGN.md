# SPDMNet v6.0 详细模块设计文档

**文档版本**: v2.3
**创建日期**: 2026-03-07
**最后更新**: 2026-03-08
**架构类型**: Range Image-centric with Conditional Diffusion + HybridMamba Encoder
**目标**: 提供可直接实现的详细技术方案

> **v2.0 变更摘要**: 架构重构为双Mamba设计；扩散模型从潜在特征空间迁移至Range Image像素空间；移除可变形卷积主流程（保留为消融对比项）；检测头更换为CenterPoint Head；训练策略更新为3-Phase渐进式训练；数据集从nuScenes切换至KITTI（前视90° FOV）。

> **v2.1 变更摘要**: Mamba编码器升级为HybridMamba Encoder（卷积+SSM混合，通道分组，互补扫描）；扩散模型条件注入简化为输入层单点注入；训练遮罩策略更新为三类混合遮罩；损失函数分Phase明确；新增速度优化路径（DDIM 5步/MambaUNet蒸馏）；新增恶劣天气鲁棒性分析。

> **v2.2 变更摘要**: 扫描策略从行/列2方向互补升级为4方向EfficientMultiScan（行Z序正向、行Z序反向+偏移W/2、环形对角正向↘、环形反对角反向+偏移↗）；正向方向不使用偏移，反向方向使用偏移W/2（反向与偏移合并）；MambaUNet中HybridMambaBlock调用同步更新，各层按实际下采样尺寸传入H/W参数。

> **v2.3 变更摘要**: 数据集策略从单一KITTI扩展为三数据集方案（KITTI消融 + nuScenes主实验 + Waymo主实验/SOTA对比）；第8章重构为完整数据集策略与配置（含三数据集投影参数、稀疏化、增强、评估协议）；第9章重构为分层实验方案（消融实验在KITTI快速迭代，主实验在nuScenes/Waymo与SOTA对比）；新增CircularConv2d鲁棒性消融（消融F）和nuScenes环形设计优势验证实验。

---

## 目录

1. [架构总览](#1-架构总览)
2. [模块1: Range Image投影](#2-模块1-range-image投影)
3. [模块2: HybridMamba编码器（卷积+SSM混合设计）](#3-模块2-hybridmamba编码器卷积ssm混合设计)
4. [模块3: 可变形卷积（已移除主流程，保留消融）](#4-模块3-可变形卷积已移除主流程保留消融)
5. [模块4: Diffusion U-Net条件补全](#5-模块4-diffusion-u-net条件补全)
6. [模块5: SECOND-style Neck + CenterPoint Head](#6-模块5-second-style-neck--centerpoint-head)
7. [模块6: 渐进式训练策略](#7-模块6-渐进式训练策略)
8. [数据集策略与配置](#8-数据集策略与配置)
9. [实验方案（消融 + 主实验）](#9-实验方案消融--主实验)
10. [速度优化路径：MambaUNet Student蒸馏](#10-速度优化路径mambaUNet-student蒸馏)
11. [恶劣天气鲁棒性](#11-恶劣天气鲁棒性)
12. [实现路线图](#12-实现路线图)
13. [架构更新日志](#13-架构更新日志)

---

## 1. 架构总览

### 1.1 完整Pipeline（v2.0）

```
稀疏Range Image (64×1024×5, KITTI前视90°)
  ↓
[模块2a] hybridmamba_encoder（卷积+SSM混合编码，提取全局语义）
  ↓
条件特征 (64×1024×256)
  ↓
[模块4] Diffusion U-Net（条件补全Range Image）
  ├─ 训练: 稀疏RI + 噪声 → 预测噪声（GT为真实密集RI）
  └─ 推理: 稀疏RI条件 + DDIM采样 → 密集RI
  ↓
密集Range Image (64×1024×5)
  ↓
[模块2b] hybridmamba_refine（重新编码密集输出）
  ↓
密集特征 (64×1024×256)
  ↓
[模块5a] SECOND-style Neck（BEV特征提取）
  ↓
[模块5b] CenterPoint Head（3D目标检测）
  ↓
3D Bounding Boxes (x, y, z, l, w, h, θ)
```

**关键说明**:
- `hybridmamba_encoder` 和 `hybridmamba_refine` 均采用HybridMamba Block（卷积+SSM混合），参数独立
- 扩散模型在 **Range Image像素空间** 操作，有明确GT（真实密集RI），比特征空间扩散更简单
- 可变形卷积已从主流程移除，由扩散模型承担特征增强职责

### 1.2 关键设计决策（v2.0）

| 决策点 | v1.0选择 | v2.0选择 | v2.1选择 | 变更理由 |
|--------|---------|---------|---------|---------|
| 表示空间 | Range Image | Range Image | Range Image | 不变 |
| 序列建模 | 单Mamba | 双Mamba（独立参数） | 双HybridMamba（卷积+SSM混合） | 局部几何感知+全局序列建模 |
| 几何自适应 | 可变形卷积（主流程） | 移除（消融对比项） | 移除（消融对比项） | 扩散模型承担此职责 |
| 补全方法 | Latent Diffusion（特征空间） | Diffusion U-Net（RI像素空间） | Diffusion U-Net（输入层条件注入） | 简化条件注入，训练更稳定 |
| 检测头 | PCLA + VAR（Range View） | CenterPoint Head（BEV） | CenterPoint Head（BEV） | 与SECOND Neck配合，工程成熟 |
| 数据集 | nuScenes（360°） | KITTI（前视90°） | KITTI（前视90°） | 降低初期实验复杂度 |
| 训练策略 | 四阶段（含独立预训练） | 三Phase渐进式（50 epochs） | 三Phase渐进式（细化损失权重） | 无需单独预训练扩散模型 |

### 1.3 模块参数量

| 模块 | 参数量 | 说明 |
|------|--------|------|
| hybridmamba_encoder | 20M | 卷积+SSM混合编码稀疏RI，提供扩散条件（4个HybridMamba Block） |
| hybridmamba_refine | 20M | 卷积+SSM混合编码密集RI，提取检测特征（4个HybridMamba Block） |
| diffusion U-Net | 30M | 条件补全Range Image |
| SECOND Neck | 5M | BEV特征提取 |
| CenterPoint Head | 2M | 3D目标检测 |
| **总计** | **77M** | 相比v2.0（137M）减少44% |

### 1.4 性能预期（v2.1）

| 模型 | 组件 | 参数量 | 预期mAP（KITTI） | 推理速度 |
|------|------|--------|----------------|---------|
| Baseline 1 | HybridMamba + Head | 40M | 60% | ~25ms |
| Baseline 2 | HybridMamba + SimpleUNet补全 | 50M | 62% | ~50ms |
| Baseline 3 | 双HybridMamba + Diffusion（10步） | 77M | 64% | ~110ms |
| 快速版 | 双HybridMamba + Diffusion（5步） | 77M | 63.5% | ~60ms |
| Student | 双HybridMamba + MambaUNet蒸馏 | 55M | 63% | ~40ms |

---

## 2. 模块1: Range Image投影

### 2.1 功能定义

将3D点云投影到2D Range Image表示,保留深度、强度和3D坐标信息。

**输入**: 点云 (N, 4) - [x, y, z, intensity]
**输出**: Range Image (H, W, 5) - [depth, intensity, x, y, z]

### 2.2 数学原理

#### 球坐标转换

```python
# 3D笛卡尔坐标 → 球坐标
r = sqrt(x² + y² + z²)          # 深度
θ = arctan2(y, x)                # 水平角度 [-π, π]
φ = arcsin(z / r)                # 垂直角度 [-fov_down, fov_up]
```

#### 像素映射

```python
# 球坐标 → Range Image像素坐标
u = (θ / (2π) + 0.5) × W         # 水平像素 [0, W-1]
v = (1.0 - (φ - fov_down) / fov) × H  # 垂直像素 [0, H-1]
```

### 2.3 详细实现

#### 核心算法

```python
import numpy as np
import torch

class RangeImageProjector:
    """Range Image投影器"""

    def __init__(self,
                 height=64,           # 垂直分辨率
                 width=1024,          # 水平分辨率（KITTI前视90°）
                 fov_up=2.0,          # 上视场角(度)，KITTI Velodyne HDL-64E
                 fov_down=-24.9,      # 下视场角(度)，KITTI Velodyne HDL-64E
                 fov_h=90.0,          # 水平FOV(度)，前视90°
                 max_range=80.0):     # 最大检测距离(米)

        self.H = height
        self.W = width
        self.fov_up = fov_up / 180.0 * np.pi
        self.fov_down = fov_down / 180.0 * np.pi
        self.fov = abs(self.fov_up) + abs(self.fov_down)
        self.fov_h = fov_h / 180.0 * np.pi  # 水平FOV（前视90°）
        self.max_range = max_range

    def project(self, points):
        """
        投影点云到Range Image

        Args:
            points: (N, 4) [x, y, z, intensity]

        Returns:
            range_image: (H, W, 5) [depth, intensity, x, y, z]
            pixel_coords: (N, 2) [u, v] 每个点的像素坐标
        """
        # 提取坐标
        x = points[:, 0]
        y = points[:, 1]
        z = points[:, 2]
        intensity = points[:, 3]

        # 计算球坐标
        depth = np.sqrt(x**2 + y**2 + z**2)

        # 过滤超出范围的点
        valid_mask = (depth > 0.1) & (depth < self.max_range)

        # 计算角度（KITTI前视90°：水平范围 -45° ~ +45°）
        theta = np.arctan2(y[valid_mask], x[valid_mask])
        phi = np.arcsin(z[valid_mask] / depth[valid_mask])

        # 过滤前视FOV范围外的点（水平±45°）
        fov_half = self.fov_h / 2
        fov_filter = np.abs(theta) <= fov_half
        theta = theta[fov_filter]
        phi = phi[fov_filter]

        # 映射到像素坐标（前视90°，水平范围 [-fov_h/2, fov_h/2]）
        u = ((theta / self.fov_h + 0.5) * self.W).astype(np.int32)
        v = ((1.0 - (phi - self.fov_down) / self.fov) * self.H).astype(np.int32)

        # 边界裁剪
        u = np.clip(u, 0, self.W - 1)
        v = np.clip(v, 0, self.H - 1)

        # 初始化Range Image
        range_image = np.zeros((self.H, self.W, 5), dtype=np.float32)

        # 填充Range Image (处理重叠:保留最近的点)
        for i in range(len(u)):
            idx = np.where(valid_mask)[0][i]
            if range_image[v[i], u[i], 0] == 0 or depth[idx] < range_image[v[i], u[i], 0]:
                range_image[v[i], u[i], 0] = depth[idx]
                range_image[v[i], u[i], 1] = intensity[idx]
                range_image[v[i], u[i], 2] = x[idx]
                range_image[v[i], u[i], 3] = y[idx]
                range_image[v[i], u[i], 4] = z[idx]

        # 记录像素坐标
        pixel_coords = np.stack([u, v], axis=1)

        return range_image, pixel_coords

    def backproject(self, range_image):
        """
        从Range Image反投影到3D点云

        Args:
            range_image: (H, W, 5) [depth, intensity, x, y, z]

        Returns:
            points: (M, 4) [x, y, z, intensity]
        """
        # 提取有效像素
        valid_mask = range_image[:, :, 0] > 0

        # 直接使用存储的3D坐标
        points = []
        for v in range(self.H):
            for u in range(self.W):
                if valid_mask[v, u]:
                    x = range_image[v, u, 2]
                    y = range_image[v, u, 3]
                    z = range_image[v, u, 4]
                    intensity = range_image[v, u, 1]
                    points.append([x, y, z, intensity])

        return np.array(points, dtype=np.float32)
```

### 2.4 稀疏化策略

#### 超点采样后的Range Image

```python
def create_sparse_range_image(dense_range_image, superpoint_indices):
    """
    根据超点索引创建稀疏Range Image

    Args:
        dense_range_image: (H, W, 5) 密集Range Image
        superpoint_indices: (M,) 超点在原始点云中的索引

    Returns:
        sparse_range_image: (H, W, 5) 稀疏Range Image
        sparse_mask: (H, W) 稀疏位置的mask
    """
    sparse_range_image = np.zeros_like(dense_range_image)
    sparse_mask = np.zeros((dense_range_image.shape[0],
                           dense_range_image.shape[1]), dtype=bool)

    # 将超点投影到Range Image
    for idx in superpoint_indices:
        # 找到该点在Range Image中的位置
        u, v = find_pixel_coords(dense_range_image, idx)
        sparse_range_image[v, u] = dense_range_image[v, u]
        sparse_mask[v, u] = True

    return sparse_range_image, sparse_mask
```

### 2.5 空洞处理

#### 方法1: 最近邻插值 (推理时)

```python
def fill_holes_nn(sparse_range_image, k=3):
    """
    使用k近邻插值填充空洞

    Args:
        sparse_range_image: (H, W, 5)
        k: 近邻数量

    Returns:
        filled_range_image: (H, W, 5)
    """
    from scipy.spatial import cKDTree

    # 提取有效点
    valid_mask = sparse_range_image[:, :, 0] > 0
    valid_coords = np.argwhere(valid_mask)  # (N, 2) [v, u]
    valid_values = sparse_range_image[valid_mask]  # (N, 5)

    # 构建KD树
    tree = cKDTree(valid_coords)

    # 查询空洞位置
    hole_coords = np.argwhere(~valid_mask)
    distances, indices = tree.query(hole_coords, k=k)

    # 加权平均填充
    filled_range_image = sparse_range_image.copy()
    weights = 1.0 / (distances + 1e-6)
    weights = weights / weights.sum(axis=1, keepdims=True)

    for i, (v, u) in enumerate(hole_coords):
        filled_range_image[v, u] = (weights[i:i+1].T @ valid_values[indices[i]]).squeeze()

    return filled_range_image
```

#### 方法2: 学习式补全 (训练时)

由模块4的Latent Diffusion完成,不需要显式插值。

### 2.6 输入输出格式

#### 输入格式

```python
# KITTI点云格式（Velodyne HDL-64E）
points = {
    'xyz': np.ndarray,      # (N, 3) 3D坐标
    'intensity': np.ndarray, # (N,) 反射强度
    'timestamp': float       # 时间戳（可选）
}
```

#### 输出格式

```python
# Range Image格式（KITTI前视90°）
range_image = {
    'data': np.ndarray,     # (64, 1024, 5) [depth, intensity, x, y, z]
    'mask': np.ndarray,     # (64, 1024) 有效像素mask
    'pixel_coords': np.ndarray,  # (N, 2) 点到像素的映射
    'metadata': {
        'fov_up': float,       # 2.0°
        'fov_down': float,     # -24.9°
        'fov_h': float,        # 90.0°（前视）
        'max_range': float     # 80.0m
    }
}
```

### 2.7 关键超参数

| 参数 | 推荐值 | 范围 | 说明 |
|------|--------|------|------|
| height | 64 | [32, 128] | 垂直分辨率，KITTI Velodyne HDL-64E |
| width | 1024 | [512, 2048] | 水平分辨率，前视90° |
| fov_up | 2.0° | [0, 10] | 上视场角，KITTI Velodyne HDL-64E |
| fov_down | -24.9° | [-40, -10] | 下视场角，KITTI Velodyne HDL-64E |
| fov_h | 90.0° | [60, 360] | 水平FOV，前视90° |
| max_range | 80.0m | [50, 100] | 最大检测距离 |

### 2.8 实现难点与解决方案

#### 难点1: 像素重叠

**问题**: 多个3D点可能映射到同一像素

**解决方案**:
```python
# 保留深度最小的点(最近的点)
if depth[i] < range_image[v, u, 0] or range_image[v, u, 0] == 0:
    range_image[v, u] = point_data[i]
```

#### 难点2: 边界环绕

**问题**: 水平角度在-π和π处环绕

**解决方案**:
```python
# 使用模运算处理环绕
u = int((theta / (2 * np.pi) + 0.5) * W) % W
```

#### 难点3: 稀疏性

**问题**: 超点采样后Range Image非常稀疏(~3%填充率)

**解决方案**:
- 训练时: 使用Teacher提供的密集Range Image作为GT
- 推理时: 使用Latent Diffusion补全

### 2.9 性能分析

| 操作 | 时间复杂度 | 实际耗时 | 优化方法 |
|------|-----------|---------|---------|
| 投影 | O(N) | ~5ms (N=100K) | GPU并行化 |
| 反投影 | O(H×W) | ~3ms | 向量化操作 |
| 空洞填充 | O(H×W×log N) | ~10ms | KD树加速 |

#### GPU加速实现

```python
import torch

def project_gpu(points, H=64, W=2048, fov_up=3.0, fov_down=-25.0):
    """GPU加速的Range Image投影"""
    device = points.device

    # 提取坐标
    x, y, z = points[:, 0], points[:, 1], points[:, 2]

    # 计算球坐标
    depth = torch.sqrt(x**2 + y**2 + z**2)
    theta = torch.atan2(y, x)
    phi = torch.asin(z / (depth + 1e-6))

    # 映射到像素
    fov = abs(fov_up) + abs(fov_down)
    u = ((theta / (2 * np.pi) + 0.5) * W).long()
    v = ((1.0 - (phi - fov_down) / fov) * H).long()

    # 边界裁剪
    u = torch.clamp(u, 0, W - 1)
    v = torch.clamp(v, 0, H - 1)

    # 使用scatter操作填充
    range_image = torch.zeros(H, W, 5, device=device)
    indices = v * W + u
    range_image.view(-1, 5).scatter_(0, indices.unsqueeze(1).expand(-1, 5),
                                     points[:, :5])

    return range_image
```

---

## 3. 模块2: HybridMamba编码器（卷积+SSM混合设计）

### 3.1 功能定义

v2.1采用**HybridMamba Encoder设计**，将局部卷积感知与全局SSM序列建模融合在同一Block中。两个编码器结构相同但参数完全独立：

- **hybridmamba_encoder**：编码稀疏Range Image，提取全局语义，为扩散模型提供条件特征
- **hybridmamba_refine**：编码扩散补全后的密集Range Image，提取用于检测的精炼特征

**hybridmamba_encoder 输入/输出**:
- 输入: 稀疏Range Image (B, 5, 64, 1024)
- 输出: 条件特征 (B, 256, 64, 1024)

**hybridmamba_refine 输入/输出**:
- 输入: 密集Range Image (B, 5, 64, 1024)（扩散补全后）
- 输出: 密集特征 (B, 256, 64, 1024)

### 3.2 设计原理

HybridMamba Encoder的核心思想是**卷积与SSM的互补融合**：

| 分支 | 操作 | 感受野 | 职责 |
|------|------|--------|------|
| 卷积分支 | 3×3深度可分离卷积 | 局部 | 局部几何纹理感知 |
| SSM分支（局部） | Mamba（d_state=8） | 中等 | 局部上下文序列建模 |
| SSM分支（全局） | Mamba（d_state=16） | 全局 | 长程依赖序列建模 |

**通道分组策略**：将256通道分为两半，前128通道走局部SSM（d_state=8），后128通道走全局SSM（d_state=16），最后与卷积分支融合。

**扫描互补策略**：采用4方向互补扫描（EfficientMultiScan），每个Block内并行执行4条扫描路径，覆盖水平Z序正向、水平Z序反向+偏移、环形对角正向↘、环形反对角反向+偏移↗，全面捕获Range Image中的长程依赖。

### 3.3 HybridMamba Block设计

#### 核心架构

```python
import torch
import torch.nn as nn
from mamba_ssm import Mamba

class DepthwiseSeparableConv(nn.Module):
    """深度可分离卷积（局部几何感知）"""

    def __init__(self, channels):
        super().__init__()
        self.depthwise = nn.Conv2d(
            channels, channels, kernel_size=3, padding=1, groups=channels
        )
        self.pointwise = nn.Conv2d(channels, channels, kernel_size=1)
        self.norm = nn.BatchNorm2d(channels)
        self.act = nn.SiLU()

    def forward(self, x):
        return self.act(self.norm(self.pointwise(self.depthwise(x))))


class EfficientMultiScan(nn.Module):
    """
    4方向互补扫描模块（用于替换原行/列单向扫描）
    4个方向：
      1. 行Z序正向（Row Z-order, no offset, forward）
      2. 行Z序反向+偏移W/2（Row Z-order, offset=W/2, reverse）
      3. 环形对角正向↘（Circular diagonal, slope=+W//H, no offset）
      4. 环形反对角反向+偏移↗（Circular anti-diagonal, slope=-W//H, offset=W/2）
    正向方向不使用偏移（offset=0），反向方向使用偏移W/2（反向和偏移合并）。
    """

    def __init__(self, H=64, W=1024, channels=256):
        super().__init__()
        slope = W // H  # 16 for 64×1024

        idx_list = [
            self._row_z_indices(H, W, shift=0, reverse=False),        # 行正向
            self._row_z_indices(H, W, shift=W//2, reverse=True),      # 行反向+偏移
            self._circ_diag_indices(H, W, slope=+slope, offset=0),    # 对角正向↘
            self._circ_diag_indices(H, W, slope=-slope, offset=W//2), # 反对角+偏移↗
        ]

        all_idx = torch.tensor(idx_list, dtype=torch.long)  # (4, H*W)
        all_inv = torch.zeros_like(all_idx)
        for i in range(4):
            all_inv[i].scatter_(0, all_idx[i], torch.arange(H*W))

        self.register_buffer('all_idx', all_idx)
        self.register_buffer('all_inv', all_inv)
        self.ssms = nn.ModuleList([MambaLayer(channels) for _ in range(4)])
        self.fusion = nn.Conv2d(channels * 4, channels, 1)

    def _row_z_indices(self, H, W, shift=0, reverse=False):
        indices = []
        rows = range(H-1, -1, -1) if reverse else range(H)
        for i, row in enumerate(rows):
            cols = range(W-1, -1, -1) if i % 2 == 1 else range(W)
            for j in cols:
                w = (j + shift) % W
                indices.append(row * W + w)
        return indices

    def _circ_diag_indices(self, H, W, slope, offset=0):
        visited = set()
        indices = []
        for start_w in range(W):
            sw = (start_w + offset) % W
            if (0, sw) in visited:
                continue
            h, w = 0, sw
            while (h, w) not in visited:
                visited.add((h, w))
                indices.append(h * W + w)
                h = (h + 1) % H
                w = (w + slope) % W
        return indices

    def forward(self, x):
        B, C, H, W = x.shape
        x_flat = x.flatten(2)  # (B, C, H*W)
        outs = []
        for i, ssm in enumerate(self.ssms):
            seq = x_flat[:, :, self.all_idx[i]].transpose(1, 2)  # (B, N, C)
            out = ssm(seq).transpose(1, 2)                         # (B, C, N)
            out = out[:, :, self.all_inv[i]]                       # restore order
            outs.append(out.reshape(B, C, H, W))
        return self.fusion(torch.cat(outs, dim=1)) + x


class MambaLayer(nn.Module):
    """单方向Mamba序列建模层（通道分组：前半局部d_state=8，后半全局d_state=16）"""

    def __init__(self, channels=256):
        super().__init__()
        half = channels // 2
        self.local_ssm = Mamba(d_model=half, d_state=8, d_conv=4, expand=2)
        self.global_ssm = Mamba(d_model=half, d_state=16, d_conv=4, expand=2)

    def forward(self, x):
        # x: (B, N, C)
        x_local = self.local_ssm(x[:, :, :x.shape[-1] // 2])
        x_global = self.global_ssm(x[:, :, x.shape[-1] // 2:])
        return torch.cat([x_local, x_global], dim=-1)


class HybridMambaBlock(nn.Module):
    """
    HybridMamba Block: 卷积局部感知 + 4方向EfficientMultiScan全局建模
    参数量约 5M/Block，4个Block共约20M
    """

    def __init__(self, channels=256, H=64, W=1024):
        """
        Args:
            channels: 特征通道数
            H: Range Image高度（行数）
            W: Range Image宽度（列数）
        """
        super().__init__()
        self.channels = channels

        # Step 1: 局部卷积分支（深度可分离）
        self.local_conv = DepthwiseSeparableConv(channels)

        # Step 2: 4方向互补扫描SSM
        self.multi_scan = EfficientMultiScan(H=H, W=W, channels=channels)

        # Step 3: 融合卷积分支与多扫描分支
        self.fusion = nn.Conv2d(channels * 2, channels, kernel_size=1)
        self.norm = nn.LayerNorm(channels)
        self.dropout = nn.Dropout(0.1)

    def forward(self, x):
        """
        Args:
            x: (B, C, H, W) Range Image特征

        Returns:
            out: (B, C, H, W)
        """
        B, C, H, W = x.shape
        residual = x

        # 1. 局部卷积分支
        conv_out = self.local_conv(x)  # (B, C, H, W)

        # 2. 4方向互补扫描（内部已含残差）
        x_ssm = self.multi_scan(x)  # (B, C, H, W)

        # 3. 融合卷积分支与SSM分支
        x_fused = torch.cat([conv_out, x_ssm], dim=1)  # (B, 2C, H, W)
        x_fused = self.fusion(x_fused)                  # (B, C, H, W)

        # 4. LayerNorm + 残差
        x_fused = x_fused.permute(0, 2, 3, 1)
        x_fused = self.norm(x_fused)
        x_fused = self.dropout(x_fused)
        x_fused = x_fused.permute(0, 3, 1, 2)

        return x_fused + residual
```

### 3.4 完整HybridMamba Encoder

```python
class HybridMambaEncoder(nn.Module):
    """
    HybridMamba Encoder: 4个HybridMamba Block，每Block内置4方向EfficientMultiScan
    用于 hybridmamba_encoder（编码稀疏RI）和 hybridmamba_refine（编码密集RI）
    两者结构相同，实例化时参数独立
    参数量约 20M
    """

    def __init__(self,
                 in_channels=5,      # 输入通道 [depth, intensity, x, y, z]
                 hidden_dim=128,     # 隐藏维度
                 out_dim=256,        # 输出维度
                 num_blocks=4,       # HybridMamba Block数量
                 height=64,
                 width=1024):

        super().__init__()
        self.H = height
        self.W = width

        # Input embedding (2D Conv)
        self.input_embed = nn.Sequential(
            nn.Conv2d(in_channels, hidden_dim, kernel_size=3, padding=1),
            nn.BatchNorm2d(hidden_dim),
            nn.SiLU(),
            nn.Conv2d(hidden_dim, out_dim, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_dim),
            nn.SiLU()
        )

        # HybridMamba Blocks（每Block内置4方向EfficientMultiScan）
        self.blocks = nn.ModuleList([
            HybridMambaBlock(channels=out_dim, H=height, W=width)
            for _ in range(num_blocks)
        ])

    def forward(self, range_image):
        """
        Args:
            range_image: (B, 5, H, W) Range Image

        Returns:
            features: (B, out_dim, H, W) 编码特征
        """
        # 1. Input embedding
        x = self.input_embed(range_image)  # (B, out_dim, H, W)

        # 2. 逐Block处理（每Block内4方向互补扫描）
        for block in self.blocks:
            x = block(x)

        return x
```

### 3.5 双HybridMamba实例化

```python
# 实例化两个独立的HybridMamba编码器
hybridmamba_encoder = HybridMambaEncoder(
    in_channels=5, hidden_dim=128, out_dim=256,
    num_blocks=4, height=64, width=1024
)  # 参数量 ~20M

hybridmamba_refine = HybridMambaEncoder(
    in_channels=5, hidden_dim=128, out_dim=256,
    num_blocks=4, height=64, width=1024
)  # 参数量 ~20M，与 hybridmamba_encoder 完全独立

# 前向传播
cond_features = hybridmamba_encoder(sparse_range_image)   # 提供扩散条件
dense_features = hybridmamba_refine(dense_range_image)    # 提取检测特征
```

### 3.6 关键超参数

| 参数 | 推荐值 | 范围 | 说明 |
|------|--------|------|------|
| hidden_dim | 128 | [64, 256] | 输入嵌入维度 |
| out_dim | 256 | [128, 512] | 输出特征维度 |
| num_blocks | 4 | [2, 8] | HybridMamba Block数量 |
| d_state（局部SSM） | 8 | [4, 16] | 局部SSM状态维度 |
| d_state（全局SSM） | 16 | [8, 32] | 全局SSM状态维度 |
| d_conv | 4 | [2, 8] | SSM内部卷积核大小 |
| expand | 2 | [1, 4] | SSM MLP扩展因子 |

### 3.7 计算复杂度分析（KITTI 64×1024）

#### 时间复杂度

```
Input Embedding: O(H × W × C × k²)  ≈ 64×1024×256×9 = 150M ops
HybridMamba Block × 4:
  - 卷积分支: O(H × W × C) ≈ 64×1024×256 = 16M ops/Block
  - SSM分支: O(L × D²) ≈ 65K×128²×2 = 2.1B ops/Block
  - 融合: O(H × W × C) ≈ 16M ops/Block
总计: ~9B ops ≈ 7ms (GPU)
单个编码器 ~7ms，双HybridMamba合计 ~14ms（相比v2.0双Mamba ~26ms，提速约46%）
```

#### 空间复杂度

```
输入: 64×1024×5 = 328K
嵌入: 64×1024×256 = 16.7M
Block中间: 64×1024×512 = 33.5M（融合前）
总计: ~50M = 200MB (FP32)，双HybridMamba合计 ~400MB
```

### 3.8 实现难点与解决方案

#### 难点1: 4方向扫描的索引预计算与内存效率

**问题**: 4条扫描路径（Z序、对角等）需要非连续内存访问，gather/scatter开销较大

**解决方案**:
```python
# 在__init__中预计算所有索引并注册为buffer，推理时直接查表
# 使用scatter_预计算逆索引，避免forward中的排序操作
all_inv[i].scatter_(0, all_idx[i], torch.arange(H*W))
# forward中使用高效的index_select替代gather
seq = x_flat[:, :, self.all_idx[i]]  # (B, C, N) 直接索引
```

#### 难点2: 通道分组SSM的维度对齐

**问题**: 前后半通道分别经过不同d_state的SSM，需确保维度一致

**解决方案**:
```python
# 确保channels为偶数，分组时各取一半
assert channels % 2 == 0, "channels must be even for channel grouping"
half = channels // 2
```

#### 难点3: 稀疏输入中零值对SSM的影响

**问题**: 稀疏Range Image中大量零值会干扰SSM的状态传递

**解决方案**:
```python
# 在input_embed后对稀疏位置做mask归零
if sparse_mask is not None:
    x = x * sparse_mask  # (B, C, H, W)，稀疏位置保持零值
```

---

## 4. 模块3: 可变形卷积（已移除主流程，保留消融）

> **v2.0 架构变更**: 可变形卷积已从主流程移除。扩散模型在Range Image像素空间进行条件补全，承担了原本由可变形卷积负责的几何自适应特征增强职责。可变形卷积保留为**消融实验对比项**，用于验证扩散模型相对于可变形卷积的性能增益。

### 4.1 移除原因

| 原因 | 说明 |
|------|------|
| 职责重叠 | 扩散模型已在RI像素空间完成密集补全，隐式处理了几何畸变 |
| 参数冗余 | 可变形卷积增加约15M参数，但收益被扩散模型覆盖 |
| 流程简化 | 移除后Pipeline更清晰：稀疏RI → 扩散补全 → 密集RI → 检测 |
| 消融价值 | 保留为对比项，可量化扩散模型 vs 可变形卷积的性能差异 |

### 4.2 消融实验设计

```
消融组A（本文方法）: 双Mamba + Diffusion U-Net → mAP目标 64-66%
消融组B（对比项）:   双Mamba + 可变形卷积    → 预期 mAP 62-63%
消融组C（基础）:     单Mamba + 无补全        → 预期 mAP 60-62%
```

### 4.3 原始设计（保留供参考）

以下为v1.0中可变形卷积的完整设计，供消融实验实现参考。

### 4.2 设计思想

#### Range Image的几何特性

1. **非均匀采样**: 远处物体采样稀疏,近处密集
2. **透视畸变**: 相同大小物体在不同距离上投影大小不同
3. **扫描模式**: 水平方向连续,垂直方向离散

#### Meta-Kernel vs 可变形卷积

| 方法 | 核心思想 | 优势 | 文献 |
|------|---------|------|------|
| Meta-Kernel | 学习Cartesian坐标的动态权重 | 显式建模几何 | RangeDet (2021) |
| 可变形卷积 | 学习采样位置的偏移 | 隐式自适应 | DCNv2 (2019) |

**推荐**: 结合两者,Meta-Kernel引导可变形卷积

### 4.3 详细实现

#### DCNv3实现

```python
import torch
import torch.nn as nn
from ops.modules import MSDeformAttn  # 多尺度可变形注意力

class RangeImageDeformableConv(nn.Module):
    """Range Image可变形卷积模块"""

    def __init__(self,
                 in_channels=256,
                 out_channels=256,
                 kernel_size=3,
                 num_groups=8,
                 use_meta_kernel=True):

        super().__init__()

        self.in_channels = in_channels
        self.out_channels = out_channels
        self.kernel_size = kernel_size
        self.num_groups = num_groups
        self.use_meta_kernel = use_meta_kernel

        # 偏移预测网络
        self.offset_conv = nn.Sequential(
            nn.Conv2d(in_channels, in_channels, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(in_channels, 2 * kernel_size * kernel_size, 1)
        )

        # Mask预测网络 (DCNv2)
        self.mask_conv = nn.Sequential(
            nn.Conv2d(in_channels, in_channels // 2, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(in_channels // 2, kernel_size * kernel_size, 1),
            nn.Sigmoid()
        )

        # Meta-Kernel权重预测
        if use_meta_kernel:
            self.meta_kernel_mlp = nn.Sequential(
                nn.Linear(3, 64),  # 输入: 相对坐标 (Δx, Δy, Δz)
                nn.ReLU(inplace=True),
                nn.Linear(64, kernel_size * kernel_size),
                nn.Softmax(dim=-1)
            )

        # 可变形卷积
        self.deform_conv = nn.Conv2d(
            in_channels,
            out_channels,
            kernel_size=kernel_size,
            padding=kernel_size // 2,
            bias=False
        )

    def forward(self, features, range_image):
        """
        Args:
            features: (B, C, H, W) Range Image特征
            range_image: (B, 5, H, W) 原始Range Image [depth, intensity, x, y, z]

        Returns:
            out: (B, C, H, W) 几何自适应特征
        """
        B, C, H, W = features.shape

        # 1. 预测偏移
        offset = self.offset_conv(features)  # (B, 2*K*K, H, W)

        # 2. 预测mask
        mask = self.mask_conv(features)  # (B, K*K, H, W)

        # 3. Meta-Kernel权重 (可选)
        if self.use_meta_kernel:
            # 提取3D坐标
            xyz = range_image[:, 2:5]  # (B, 3, H, W)

            # 计算相对坐标
            rel_coords = self._compute_relative_coords(xyz, offset)  # (B, K*K, H, W, 3)

            # 预测Meta-Kernel权重
            meta_weights = self.meta_kernel_mlp(rel_coords)  # (B, K*K, H, W)

            # 融合mask和Meta-Kernel权重
            mask = mask * meta_weights

        # 4. 应用可变形卷积
        out = self.deform_conv(features, offset, mask)

        return out

    def _compute_relative_coords(self, xyz, offset):
        """计算采样点的相对3D坐标"""
        B, _, H, W = xyz.shape
        K = self.kernel_size

        # 生成采样网格
        grid_y, grid_x = torch.meshgrid(
            torch.arange(H, device=xyz.device),
            torch.arange(W, device=xyz.device)
        )
        grid = torch.stack([grid_x, grid_y], dim=0).float()  # (2, H, W)

        # 应用偏移
        offset = offset.view(B, 2, K*K, H, W)
        sampling_grid = grid.unsqueeze(0).unsqueeze(2) + offset  # (B, 2, K*K, H, W)

        # 采样3D坐标
        sampling_grid_norm = sampling_grid / torch.tensor([W, H], device=xyz.device).view(1, 2, 1, 1, 1) * 2 - 1
        sampling_grid_norm = sampling_grid_norm.permute(0, 2, 3, 4, 1)  # (B, K*K, H, W, 2)

        sampled_xyz = []
        for i in range(3):
            sampled = F.grid_sample(
                xyz[:, i:i+1],
                sampling_grid_norm.view(B, K*K*H, W, 2),
                align_corners=True
            )
            sampled_xyz.append(sampled.view(B, K*K, H, W))
        sampled_xyz = torch.stack(sampled_xyz, dim=-1)  # (B, K*K, H, W, 3)

        # 计算相对坐标
        center_xyz = xyz.permute(0, 2, 3, 1).unsqueeze(1)  # (B, 1, H, W, 3)
        rel_coords = sampled_xyz - center_xyz  # (B, K*K, H, W, 3)

        return rel_coords
```

#### 简化版Meta-Kernel (RangeDet风格)

```python
class MetaKernelConv(nn.Module):
    """Meta-Kernel卷积 (RangeDet)"""

    def __init__(self, in_channels=256, out_channels=256, kernel_size=3):
        super().__init__()

        self.kernel_size = kernel_size
        K = kernel_size * kernel_size

        # 权重预测MLP
        self.weight_mlp = nn.Sequential(
            nn.Linear(3, 64),  # 输入: 相对坐标
            nn.ReLU(inplace=True),
            nn.Linear(64, 128),
            nn.ReLU(inplace=True),
            nn.Linear(128, in_channels)  # 输出: 每个邻居的权重
        )

        # 特征变换
        self.feature_conv = nn.Conv2d(in_channels, out_channels, 1)

    def forward(self, features, range_image):
        """
        Args:
            features: (B, C, H, W)
            range_image: (B, 5, H, W)

        Returns:
            out: (B, C, H, W)
        """
        B, C, H, W = features.shape
        K = self.kernel_size

        # 提取3D坐标
        xyz = range_image[:, 2:5]  # (B, 3, H, W)

        # Unfold获取邻域
        xyz_unfold = F.unfold(xyz, kernel_size=K, padding=K//2)  # (B, 3*K*K, H*W)
        xyz_unfold = xyz_unfold.view(B, 3, K*K, H, W)

        feat_unfold = F.unfold(features, kernel_size=K, padding=K//2)  # (B, C*K*K, H*W)
        feat_unfold = feat_unfold.view(B, C, K*K, H, W)

        # 计算相对坐标
        center_xyz = xyz.unsqueeze(2)  # (B, 3, 1, H, W)
        rel_coords = xyz_unfold - center_xyz  # (B, 3, K*K, H, W)
        rel_coords = rel_coords.permute(0, 3, 4, 2, 1)  # (B, H, W, K*K, 3)

        # 预测权重
        weights = self.weight_mlp(rel_coords)  # (B, H, W, K*K, C)
        weights = weights.permute(0, 4, 3, 1, 2)  # (B, C, K*K, H, W)

        # 加权聚合
        out = (feat_unfold * weights).sum(dim=2)  # (B, C, H, W)

        # 特征变换
        out = self.feature_conv(out)

        return out
```

### 4.4 完整模块

```python
class GeometricAdaptiveModule(nn.Module):
    """几何自适应模块 (可变形卷积 + Meta-Kernel)"""

    def __init__(self,
                 in_channels=256,
                 num_layers=3,
                 use_deformable=True,
                 use_meta_kernel=True):

        super().__init__()

        self.layers = nn.ModuleList()
        for i in range(num_layers):
            if use_deformable:
                layer = RangeImageDeformableConv(
                    in_channels, in_channels,
                    use_meta_kernel=use_meta_kernel
                )
            else:
                layer = MetaKernelConv(in_channels, in_channels)

            self.layers.append(layer)

        # 残差连接
        self.residual_proj = nn.Conv2d(in_channels, in_channels, 1)

    def forward(self, features, range_image):
        """
        Args:
            features: (B, C, H, W)
            range_image: (B, 5, H, W)

        Returns:
            out: (B, C, H, W)
        """
        residual = self.residual_proj(features)

        x = features
        for layer in self.layers:
            x = layer(x, range_image)
            x = F.relu(x)

        out = x + residual

        return out
```

### 4.5 关键超参数

| 参数 | 推荐值 | 范围 | 说明 |
|------|--------|------|------|
| num_layers | 3 | [1, 5] | 可变形卷积层数 |
| kernel_size | 3 | [3, 5] | 卷积核大小 |
| num_groups | 8 | [4, 16] | 分组数 (DCNv3) |
| use_meta_kernel | True | - | 是否使用Meta-Kernel引导 |

### 4.6 计算复杂度

```
偏移预测: O(H×W×C²) ≈ 64×2048×256² = 8.6B ops
Mask预测: O(H×W×C²/2) ≈ 4.3B ops
Meta-Kernel: O(H×W×K²×C) ≈ 64×2048×9×256 = 301M ops
可变形卷积: O(H×W×C²×K²) ≈ 77B ops
总计: ~90B ops ≈ 15ms (GPU)
```

### 4.7 实现难点

#### 难点1: 可变形卷积的CUDA实现

**解决方案**: 使用MMDetection的DCNv2/DCNv3实现
```bash
pip install mmcv-full
```

#### 难点2: Meta-Kernel的计算效率

**解决方案**: 预计算相对坐标,使用缓存
```python
@torch.no_grad()
def precompute_relative_coords(self, H, W):
    # 预计算所有位置的相对坐标
    self.rel_coords_cache = ...
```

---

## 5. 模块4: Diffusion U-Net条件补全

### 5.1 功能定义

在**Range Image像素空间**进行条件扩散补全，从稀疏Range Image生成密集Range Image。

**与v2.0的核心区别（v2.1更新）**:

| 对比项 | v2.0 | v2.1 |
|--------|------|------|
| 条件注入方式 | Concatenation（266ch输入） | 输入层单点注入（简单有效） |
| 训练遮罩策略 | 随机遮罩 | 三类混合遮罩（随机+距离衰减+天气模拟） |
| 损失函数 | loss_noise + 0.1×loss_recon | Phase 2: loss_noise + 0.1×loss_recon；Phase 3: loss_noise + loss_detection |
| 推理步数 | DDIM 50步（~100ms） | DDIM 10步（~90ms扩散，总~110ms；快速版5步总~60ms） |

**输入**:
- 稀疏Range Image（条件）: (B, 5, 64, 1024)
- hybridmamba_encoder条件特征: (B, 256, 64, 1024)
- 噪声（训练时）: (B, 5, 64, 1024)

**输出**: 密集Range Image (B, 5, 64, 1024)

**GT**: 真实完整Range Image（由完整点云投影得到）

### 5.2 训练数据处理：三类混合遮罩

v2.1引入**三类混合遮罩策略**，在训练时模拟多种稀疏场景，同时赋予模型恶劣天气鲁棒性：

```python
def generate_mixed_mask(dense_ri, H=64, W=1024):
    """
    三类混合遮罩生成器
    - 随机遮罩 40%：模拟雨天随机点云丢失
    - 距离衰减遮罩 30%：模拟雾天远距离点云衰减
    - 天气模拟遮罩 30%：模拟大面积块状遮挡

    Args:
        dense_ri: (B, 5, H, W) 真实密集Range Image

    Returns:
        sparse_ri: (B, 5, H, W) 遮罩后的稀疏RI（作为条件输入）
        mask: (B, 1, H, W) 遮罩位置（1=保留，0=遮罩）
    """
    B = dense_ri.shape[0]
    mask = torch.ones(B, 1, H, W, device=dense_ri.device)

    for b in range(B):
        r = torch.rand(1).item()

        if r < 0.4:
            # 类型1: 随机遮罩（40%概率）≈ 雨天点云丢失
            drop_ratio = torch.rand(1).item() * 0.6 + 0.2  # 20%~80%随机丢弃
            random_mask = torch.rand(H, W, device=dense_ri.device) > drop_ratio
            mask[b, 0] = random_mask.float()

        elif r < 0.7:
            # 类型2: 距离衰减遮罩（30%概率）≈ 雾天远距离丢失
            depth = dense_ri[b, 0]  # (H, W) 深度通道
            max_depth = depth.max().clamp(min=1.0)
            # 距离越远，保留概率越低
            keep_prob = 1.0 - (depth / max_depth) * 0.8
            distance_mask = torch.rand(H, W, device=dense_ri.device) < keep_prob
            mask[b, 0] = distance_mask.float()

        else:
            # 类型3: 块状遮罩（30%概率）≈ 大面积遮挡
            num_blocks = torch.randint(3, 8, (1,)).item()
            for _ in range(num_blocks):
                bh = torch.randint(4, 16, (1,)).item()
                bw = torch.randint(50, 200, (1,)).item()
                by = torch.randint(0, H - bh, (1,)).item()
                bx = torch.randint(0, W - bw, (1,)).item()
                mask[b, 0, by:by+bh, bx:bx+bw] = 0.0

    sparse_ri = dense_ri * mask
    return sparse_ri, mask
```

### 5.3 条件注入方式：输入层单点注入

v2.1将条件注入简化为**输入层单点注入**，避免多层cross-attention的复杂性：

```python
class ConditionalDiffusionUNet(nn.Module):
    """
    条件扩散U-Net（v2.1：输入层单点条件注入）
    条件仅在输入层注入一次，后续U-Net不再注入
    """

    def __init__(self,
                 in_channels=5,          # RI通道数
                 cond_channels=256,      # hybridmamba_encoder条件特征通道
                 base_channels=128,      # U-Net基础通道（v2.1增大）
                 num_timesteps=1000):

        super().__init__()

        # 时间步嵌入（Sinusoidal，告诉网络当前噪声级别）
        self.time_embed = nn.Sequential(
            SinusoidalPositionEmbeddings(base_channels),
            nn.Linear(base_channels, base_channels),
            nn.SiLU()
        )

        # 输入投影：noisy_range → base_channels
        self.input_proj = nn.Conv2d(in_channels, base_channels, 3, padding=1)

        # 条件投影：cond_features → base_channels
        self.cond_proj = nn.Conv2d(cond_channels, base_channels, 1)

        # 输入层融合（条件仅注入一次）
        # x = input_proj(noisy_range) + cond_proj(condition) + t_emb
        # 后续U-Net不再注入条件

        # 编码器（下采样）
        self.enc1 = ResBlock(base_channels, base_channels * 2)
        self.down1 = nn.Conv2d(base_channels * 2, base_channels * 2, 3, stride=2, padding=1)

        self.enc2 = ResBlock(base_channels * 2, base_channels * 4)
        self.down2 = nn.Conv2d(base_channels * 4, base_channels * 4, 3, stride=2, padding=1)

        # Bottleneck
        self.bottleneck = ResBlock(base_channels * 4, base_channels * 4)

        # 解码器（上采样）
        self.up2 = nn.ConvTranspose2d(base_channels * 4, base_channels * 4, 4, stride=2, padding=1)
        self.dec2 = ResBlock(base_channels * 8, base_channels * 2)

        self.up1 = nn.ConvTranspose2d(base_channels * 2, base_channels * 2, 4, stride=2, padding=1)
        self.dec1 = ResBlock(base_channels * 4, base_channels)

        # 输出层：预测噪声
        self.out_conv = nn.Sequential(
            nn.GroupNorm(32, base_channels),
            nn.SiLU(),
            nn.Conv2d(base_channels, in_channels, 3, padding=1)
        )

    def forward(self, noisy_range, t, condition, cond_features):
        """
        Args:
            noisy_range: (B, 5, H, W) 加噪的密集RI（x_t）
            t: (B,) 时间步
            condition: (B, 5, H, W) 稀疏RI（条件，用于cond_proj）
            cond_features: (B, 256, H, W) hybridmamba_encoder输出

        Returns:
            noise_pred: (B, 5, H, W) 预测的噪声
        """
        # 时间步嵌入
        t_emb = self.time_embed(t)  # (B, base_channels)
        t_emb = t_emb[:, :, None, None]  # (B, base_channels, 1, 1)

        # 输入层单点条件注入
        x = self.input_proj(noisy_range)    # (B, 128, H, W)
        cond = self.cond_proj(cond_features) # (B, 128, H, W)
        x = x + cond + t_emb               # 输入层融合，后续不再注入条件

        # 编码器
        e1 = self.enc1(x)
        e2 = self.enc2(self.down1(e1))
        b = self.bottleneck(self.down2(e2))

        # 解码器（skip connections）
        d2 = self.dec2(torch.cat([self.up2(b), e2], dim=1))
        d1 = self.dec1(torch.cat([self.up1(d2), e1], dim=1))

        # 输出噪声预测
        noise_pred = self.out_conv(d1)

        return noise_pred


class ResBlock(nn.Module):
    """简化残差块（无时间步条件，条件已在输入层注入）"""

    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.conv1 = nn.Conv2d(in_ch, out_ch, 3, padding=1)
        self.norm1 = nn.GroupNorm(min(32, out_ch), out_ch)
        self.conv2 = nn.Conv2d(out_ch, out_ch, 3, padding=1)
        self.norm2 = nn.GroupNorm(min(32, out_ch), out_ch)
        self.shortcut = nn.Conv2d(in_ch, out_ch, 1) if in_ch != out_ch else nn.Identity()

    def forward(self, x):
        h = F.silu(self.norm1(self.conv1(x)))
        h = self.norm2(self.conv2(h))
        return F.silu(h + self.shortcut(x))
```

### 5.4 扩散过程

#### 前向扩散（加噪）

```python
class GaussianDiffusion:
    """高斯扩散过程（Range Image像素空间）"""

    def __init__(self, num_timesteps=1000, beta_schedule='cosine'):
        self.num_timesteps = num_timesteps

        if beta_schedule == 'cosine':
            betas = self.cosine_beta_schedule(num_timesteps)
        else:
            betas = torch.linspace(0.0001, 0.02, num_timesteps)

        alphas = 1.0 - betas
        alphas_cumprod = torch.cumprod(alphas, dim=0)

        self.register_buffer('betas', betas)
        self.register_buffer('alphas_cumprod', alphas_cumprod)
        self.register_buffer('sqrt_alphas_cumprod', torch.sqrt(alphas_cumprod))
        self.register_buffer('sqrt_one_minus_alphas_cumprod',
                             torch.sqrt(1.0 - alphas_cumprod))

    def q_sample(self, x_start, t, noise=None):
        """前向扩散: 密集RI → 加噪RI"""
        if noise is None:
            noise = torch.randn_like(x_start)
        sqrt_alpha = extract(self.sqrt_alphas_cumprod, t, x_start.shape)
        sqrt_one_minus = extract(self.sqrt_one_minus_alphas_cumprod, t, x_start.shape)
        return sqrt_alpha * x_start + sqrt_one_minus * noise

    def cosine_beta_schedule(self, timesteps, s=0.008):
        steps = timesteps + 1
        x = torch.linspace(0, timesteps, steps)
        alphas_cumprod = torch.cos(((x / timesteps) + s) / (1 + s) * torch.pi * 0.5) ** 2
        alphas_cumprod = alphas_cumprod / alphas_cumprod[0]
        betas = 1 - (alphas_cumprod[1:] / alphas_cumprod[:-1])
        return torch.clip(betas, 0.0001, 0.9999)
```

### 5.5 完整扩散补全模块

```python
class RangeImageDiffusionCompletion(nn.Module):
    """Range Image空间条件扩散补全模块（v2.1）"""

    def __init__(self, num_timesteps=1000, num_inference_steps=10):
        super().__init__()
        self.unet = ConditionalDiffusionUNet()
        self.diffusion = GaussianDiffusion(num_timesteps)
        self.num_inference_steps = num_inference_steps  # 默认10步（v2.1加速）

    def forward(self, sparse_ri, cond_features, dense_ri_gt=None, mode='train'):
        """
        Args:
            sparse_ri: (B, 5, H, W) 稀疏Range Image（条件）
            cond_features: (B, 256, H, W) hybridmamba_encoder条件特征
            dense_ri_gt: (B, 5, H, W) 真实密集RI（训练时必须提供）
            mode: 'train' or 'inference'

        Returns:
            训练: {'loss_noise': Tensor, 'loss_recon': Tensor}
            推理: dense_ri (B, 5, H, W)
        """
        if mode == 'train':
            B = sparse_ri.shape[0]
            t = torch.randint(0, self.diffusion.num_timesteps, (B,),
                              device=sparse_ri.device)
            noise = torch.randn_like(dense_ri_gt)
            x_t = self.diffusion.q_sample(dense_ri_gt, t, noise)

            # 输入层单点条件注入
            noise_pred = self.unet(x_t, t, sparse_ri, cond_features)

            # 主损失：噪声预测MSE
            loss_noise = F.mse_loss(noise_pred, noise)

            # 辅助损失：RI重建L1（仅有效像素）
            sqrt_alpha = extract(self.diffusion.sqrt_alphas_cumprod, t, x_t.shape)
            sqrt_one_minus = extract(self.diffusion.sqrt_one_minus_alphas_cumprod, t, x_t.shape)
            pred_x0 = (x_t - sqrt_one_minus * noise_pred) / sqrt_alpha.clamp(min=1e-6)
            valid_mask = (dense_ri_gt[:, 0:1] > 0).float()
            loss_recon = F.l1_loss(pred_x0 * valid_mask, dense_ri_gt * valid_mask)

            return {'loss_noise': loss_noise, 'loss_recon': loss_recon}
        else:
            return self.ddim_sample(sparse_ri, cond_features)

    @torch.no_grad()
    def ddim_sample(self, sparse_ri, cond_features, eta=0.0):
        """DDIM采样推理（默认10步，扩散约90ms，端到端总~110ms）"""
        B, C, H, W = sparse_ri.shape
        x = torch.randn(B, C, H, W, device=sparse_ri.device)

        timesteps = torch.linspace(
            self.diffusion.num_timesteps - 1, 0,
            self.num_inference_steps
        ).long()

        for t in timesteps:
            t_batch = torch.full((B,), t, device=sparse_ri.device, dtype=torch.long)
            noise_pred = self.unet(x, t_batch, sparse_ri, cond_features)
            x = self._ddim_step(x, noise_pred, t, eta)

        return x  # 密集Range Image

    def _ddim_step(self, x, noise_pred, t, eta):
        """单步DDIM更新"""
        alpha = extract(self.diffusion.alphas_cumprod, t, x.shape)
        alpha_prev = extract(self.diffusion.alphas_cumprod,
                             torch.clamp(t - 1, min=0), x.shape)
        sigma = eta * torch.sqrt((1 - alpha_prev) / (1 - alpha) * (1 - alpha / alpha_prev))
        pred_x0 = (x - torch.sqrt(1 - alpha) * noise_pred) / torch.sqrt(alpha)
        dir_xt = torch.sqrt(1 - alpha_prev - sigma ** 2) * noise_pred
        noise = sigma * torch.randn_like(x)
        return torch.sqrt(alpha_prev) * pred_x0 + dir_xt + noise
```

### 5.6 关键超参数

| 参数 | 推荐值 | 范围 | 说明 |
|------|--------|------|------|
| num_timesteps | 1000 | [500, 2000] | 扩散步数（训练） |
| num_inference_steps | 10 | [5, 50] | DDIM采样步数（推理，v2.1从50降至10） |
| beta_schedule | cosine | [linear, cosine] | 噪声调度 |
| base_channels | 128 | [64, 256] | U-Net基础通道数（v2.1从64增至128） |
| eta | 0.0 | [0, 1] | DDIM随机性（0=确定性） |

### 5.7 训练损失（分Phase）

v2.1明确区分不同训练阶段的损失函数：

```python
# Phase 2 损失（扩散补全为主）
loss_noise = F.mse_loss(noise_pred, noise)          # 主损失：噪声预测
loss_recon = F.l1_loss(pred_x0 * mask, gt * mask)  # 辅助损失：RI重建
loss_phase2 = loss_noise + 0.1 * loss_recon

# Phase 3 损失（端到端，引入检测监督）
loss_phase3 = loss_noise + loss_detection
# loss_detection = CenterPoint损失（heatmap + regression）
```

**设计说明**：
- Phase 2中`loss_recon`权重0.1，避免过度约束扩散过程
- Phase 3引入`loss_detection`，使扩散补全朝着有利于检测的方向优化
- 不在Phase 2引入检测损失，因为此时mamba_refine尚未充分训练

### 5.8 性能分析

| 操作 | 实际耗时 | 备注 |
|------|---------|------|
| U-Net（1步） | ~2ms | 64×1024分辨率 |
| DDIM（10步） | ~90ms | v2.1默认（端到端总~110ms） |
| DDIM（5步） | ~45ms | 快速版（端到端总~60ms） |
| **总计（10步，端到端）** | **~110ms** | 含encoder+refine+neck+head约20ms |

---

## 6. 模块5: SECOND-style Neck + CenterPoint Head

### 6.1 功能定义

将mamba_refine输出的密集Range Image特征转换为BEV特征，并使用CenterPoint Head进行3D目标检测。

**输入**: 密集特征 (B, 256, 64, 1024)（mamba_refine输出）
**输出**: 3D Bounding Boxes (x, y, z, l, w, h, θ)

### 6.2 SECOND-style Neck

将Range Image特征沿垂直方向压缩，转换为BEV特征图。

```python
class SECONDNeck(nn.Module):
    """
    SECOND-style Neck: Range Image特征 → BEV特征
    参考: SECOND (Sensors 2018), CenterPoint (CVPR 2021)
    """

    def __init__(self, in_channels=256, out_channels=256,
                 bev_h=128, bev_w=128):
        super().__init__()
        self.bev_h = bev_h
        self.bev_w = bev_w

        # 沿垂直方向（H=64）压缩
        self.compress = nn.Sequential(
            nn.Conv2d(in_channels * 64, out_channels * 2, 1),
            nn.BatchNorm2d(out_channels * 2),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels * 2, out_channels, 1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )
        self.refine = nn.Sequential(
            nn.Conv2d(out_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, ri_features):
        """
        Args:
            ri_features: (B, 256, 64, 1024)
        Returns:
            bev_features: (B, 256, bev_h, bev_w)
        """
        B, C, H, W = ri_features.shape
        x = ri_features.reshape(B, C * H, 1, W)
        x = F.interpolate(x, size=(self.bev_h, self.bev_w),
                          mode='bilinear', align_corners=False)
        x = self.compress(x)
        return self.refine(x)
```

### 6.3 CenterPoint Head

基于BEV热力图的anchor-free 3D目标检测头。

**输出分支**:
- `heatmap`: 类别热力图（KITTI 3类：Car/Pedestrian/Cyclist）
- `offset`: 2D中心偏移 (Δx, Δy)
- `height`: z坐标
- `size`: 尺寸 (log l, log w, log h)
- `rotation`: 旋转角 (sin θ, cos θ)

```python
class CenterPointHead(nn.Module):
    """CenterPoint检测头（参考: CenterPoint CVPR 2021）"""

    def __init__(self, in_channels=256, num_classes=3, hidden_channels=64):
        super().__init__()
        self.shared_conv = nn.Sequential(
            nn.Conv2d(in_channels, hidden_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(hidden_channels),
            nn.ReLU(inplace=True)
        )
        self.heatmap_head = self._make_head(hidden_channels, num_classes)
        self.offset_head = self._make_head(hidden_channels, 2)    # Δx, Δy
        self.height_head = self._make_head(hidden_channels, 1)    # z
        self.size_head = self._make_head(hidden_channels, 3)      # log l, log w, log h
        self.rotation_head = self._make_head(hidden_channels, 2)  # sin θ, cos θ

    def _make_head(self, in_ch, out_ch):
        return nn.Sequential(
            nn.Conv2d(in_ch, in_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(in_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(in_ch, out_ch, 1)
        )

    def forward(self, bev_features):
        x = self.shared_conv(bev_features)
        return {
            'heatmap': self.heatmap_head(x).sigmoid(),
            'offset': self.offset_head(x),
            'height': self.height_head(x),
            'size': self.size_head(x),
            'rotation': self.rotation_head(x)
        }
```

### 6.4 损失函数

```python
# Heatmap损失：Gaussian Focal Loss（CenterPoint风格）
def gaussian_focal_loss(pred, gt, alpha=2.0, beta=4.0):
    pos_mask = (gt == 1.0).float()
    neg_mask = (gt < 1.0).float()
    pos_loss = torch.log(pred + 1e-6) * (1 - pred) ** alpha * pos_mask
    neg_loss = torch.log(1 - pred + 1e-6) * pred ** alpha * (1 - gt) ** beta * neg_mask
    num_pos = pos_mask.sum().clamp(min=1)
    return -(pos_loss.sum() + neg_loss.sum()) / num_pos

# 回归损失：L1 Loss（仅正样本位置）
loss_reg = (F.l1_loss(offset_pred[pos], offset_gt[pos]) +
            F.l1_loss(height_pred[pos], height_gt[pos]) +
            F.l1_loss(size_pred[pos], size_gt[pos]) +
            F.l1_loss(rotation_pred[pos], rotation_gt[pos]))

loss = 1.0 * loss_heatmap + 2.0 * loss_reg
```

### 6.5 关键超参数

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| num_classes | 3 | KITTI: Car/Pedestrian/Cyclist |
| bev_h × bev_w | 128×128 | BEV特征图分辨率 |
| hidden_channels | 64 | 检测头隐藏维度 |
| lambda_heatmap | 1.0 | Heatmap损失权重 |
| lambda_reg | 2.0 | 回归损失权重 |
| score_threshold | 0.1 | 检测置信度阈值 |
| nms_iou_threshold | 0.1 | NMS IoU阈值（BEV） |

---

## 7. 模块6: 渐进式训练策略

### 7.1 整体策略（3-Phase，共50 epochs）

v2.1采用**渐进式训练**，无需单独预训练扩散模型，总训练时间约50 epochs。

```
Phase 1（0-10 epochs）：
  训练：HybridMamba Encoder + CenterPoint Head
  冻结：无
  目的：预热编码器，建立基础检测能力

Phase 2（10-40 epochs）：
  训练：Diffusion U-Net
  冻结：HybridMamba Encoder
  损失：loss_noise + 0.1×loss_recon
  目的：扩散补全与检测联合优化

Phase 3（40-50 epochs）：
  训练：全部（小学习率）
  冻结：无
  损失：loss_noise + loss_detection
  目的：端到端微调，全局最优
```

**优势**:
- 不需要单独预训练扩散模型（相比v1.0节省2周训练时间）
- Phase 1快速建立检测基线，为Phase 2提供稳定的检测监督
- Phase 3引入检测损失联合优化，使扩散补全朝着有利于检测的方向收敛

### 7.2 Phase 1: HybridMamba Encoder + Head Warmup（0-10 epochs）

#### 目标

快速训练基础检测能力，验证HybridMamba Encoder + CenterPoint Head的有效性。

#### 训练配置

```python
phase1_config = {
    # 激活模块
    'active_modules': ['hybridmamba_encoder', 'neck', 'head'],
    'frozen_modules': ['hybridmamba_refine', 'diffusion'],

    # 数据流（跳过扩散，直接用稀疏RI特征检测）
    'pipeline': 'sparse_ri → hybridmamba_encoder → neck → head',

    # 训练参数
    'epochs': 10,           # 0-10 epochs
    'batch_size': 4,
    'learning_rate': 1e-3,
    'optimizer': 'AdamW',
    'weight_decay': 0.01,
    'lr_schedule': 'OneCycleLR',

    # 损失
    'loss': 'CenterPointLoss',
    'lambda_heatmap': 1.0,
    'lambda_reg': 2.0,
}
```

#### 训练脚本

```python
def train_phase1(config, train_loader):
    """Phase 1: HybridMamba Encoder + Head Warmup"""

    model = SPDMNet(config).cuda()

    # 冻结扩散相关模块
    for name, param in model.named_parameters():
        if 'hybridmamba_refine' in name or 'diffusion' in name:
            param.requires_grad = False

    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=config['learning_rate'],
        weight_decay=config['weight_decay']
    )
    scheduler = torch.optim.lr_scheduler.OneCycleLR(
        optimizer, max_lr=config['learning_rate'],
        total_steps=config['epochs'] * len(train_loader)
    )

    for epoch in range(config['epochs']):
        for batch in train_loader:
            sparse_ri = batch['sparse_range_image'].cuda()
            gt_boxes = batch['gt_boxes'].cuda()

            # Phase 1: 稀疏RI → hybridmamba_encoder → neck → head
            cond_feat = model.hybridmamba_encoder(sparse_ri)
            bev_feat = model.neck(cond_feat)
            preds = model.head(bev_feat)

            loss, loss_dict = model.criterion(preds, gt_boxes)

            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 10.0)
            optimizer.step()
            scheduler.step()

        if epoch % 2 == 0:
            val_metrics = validate(model, val_loader, phase=1)
            print(f"Phase1 Epoch {epoch}: mAP = {val_metrics['mAP']:.4f}")
```

#### 预期性能

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 训练时间 | ~2天 | 10 epochs |
| mAP | 60% | Baseline 1 |
| 推理速度 | ~25ms | 无扩散，HybridMamba更快 |

### 7.3 Phase 2: Diffusion U-Net训练（10-40 epochs）

#### 目标

在冻结HybridMamba Encoder的基础上，训练扩散补全模块，建立完整的补全流程。

#### 训练配置

```python
phase2_config = {
    # 激活模块
    'active_modules': ['diffusion', 'hybridmamba_refine', 'neck', 'head'],
    'frozen_modules': ['hybridmamba_encoder'],  # 冻结，保持条件特征稳定

    # 数据流
    'pipeline': 'sparse_ri → hybridmamba_encoder(frozen) → diffusion → dense_ri → hybridmamba_refine → neck → head',

    # 训练参数
    'epochs': 30,           # 10-40 epochs
    'batch_size': 4,
    'learning_rate': 5e-4,
    'optimizer': 'AdamW',
    'weight_decay': 0.01,
    'lr_schedule': 'CosineAnnealingLR',

    # 损失权重（Phase 2：扩散为主）
    'lambda_noise': 1.0,    # 噪声预测损失（主）
    'lambda_recon': 0.1,    # RI重建辅助损失
    # 注意：Phase 2不引入检测损失，等hybridmamba_refine稳定后再引入
}
```

#### 训练脚本

```python
def train_phase2(config, model, train_loader):
    """Phase 2: Diffusion U-Net训练"""

    # 冻结hybridmamba_encoder
    for param in model.hybridmamba_encoder.parameters():
        param.requires_grad = False

    # 解冻其余模块
    for name, param in model.named_parameters():
        if 'hybridmamba_encoder' not in name:
            param.requires_grad = True

    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=config['learning_rate'],
        weight_decay=config['weight_decay']
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=config['epochs']
    )

    for epoch in range(config['epochs']):
        for batch in train_loader:
            sparse_ri = batch['sparse_range_image'].cuda()
            dense_ri_gt = batch['dense_range_image'].cuda()  # 真实密集RI
            gt_boxes = batch['gt_boxes'].cuda()

            # 1. hybridmamba_encoder提取条件特征（冻结，无梯度）
            with torch.no_grad():
                cond_feat = model.hybridmamba_encoder(sparse_ri)

            # 2. 扩散补全损失（Phase 2：loss_noise + 0.1×loss_recon）
            diff_losses = model.diffusion(
                sparse_ri, cond_feat, dense_ri_gt, mode='train'
            )
            loss = (config['lambda_noise'] * diff_losses['loss_noise'] +
                    config['lambda_recon'] * diff_losses['loss_recon'])

            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 10.0)
            optimizer.step()

        scheduler.step()

        if epoch % 5 == 0:
            val_metrics = validate(model, val_loader, phase=2)
            print(f"Phase2 Epoch {epoch}: mAP = {val_metrics['mAP']:.4f}, "
                  f"Noise Loss = {val_metrics['loss_noise']:.4f}")
```

#### 预期性能

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 训练时间 | ~1周 | 30 epochs |
| mAP | 62% | Baseline 2 |
| 扩散重建误差 | <0.1 | MSE |

### 7.4 Phase 3: 端到端微调（40-50 epochs）

#### 目标

解冻所有模块，以小学习率进行端到端联合优化，引入检测损失使扩散补全朝着有利于检测的方向收敛。

#### 训练配置

```python
phase3_config = {
    # 激活模块
    'active_modules': ['all'],  # 解冻所有
    'frozen_modules': [],

    # 训练参数
    'epochs': 10,           # 40-50 epochs
    'batch_size': 4,
    'learning_rate': 1e-4,  # 小学习率
    'optimizer': 'AdamW',
    'weight_decay': 0.01,
    'lr_schedule': 'CosineAnnealingLR',

    # 损失权重（Phase 3：引入检测损失）
    'lambda_noise': 1.0,       # 噪声预测损失
    'lambda_detection': 1.0,   # 检测损失（Phase 3新增）
    # 注意：Phase 3不再使用loss_recon，聚焦检测优化
}
```

#### 训练脚本

```python
def train_phase3(config, model, train_loader):
    """Phase 3: 端到端微调（loss_noise + loss_detection）"""

    # 解冻所有参数
    for param in model.parameters():
        param.requires_grad = True

    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=config['learning_rate'],
        weight_decay=config['weight_decay']
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=config['epochs']
    )

    for epoch in range(config['epochs']):
        for batch in train_loader:
            sparse_ri = batch['sparse_range_image'].cuda()
            dense_ri_gt = batch['dense_range_image'].cuda()
            gt_boxes = batch['gt_boxes'].cuda()

            # 完整前向传播（所有模块参与梯度计算）
            cond_feat = model.hybridmamba_encoder(sparse_ri)

            # 扩散损失（Phase 3：仅loss_noise，不含loss_recon）
            diff_losses = model.diffusion(sparse_ri, cond_feat, dense_ri_gt, mode='train')
            loss_noise = diff_losses['loss_noise']

            # 推理密集RI（用于检测）
            dense_ri = model.diffusion(sparse_ri, cond_feat, mode='inference')
            dense_feat = model.hybridmamba_refine(dense_ri)
            bev_feat = model.neck(dense_feat)
            preds = model.head(bev_feat)
            loss_det, _ = model.criterion(preds, gt_boxes)

            # Phase 3 总损失：loss_noise + loss_detection
            loss = config['lambda_noise'] * loss_noise + config['lambda_detection'] * loss_det

            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 10.0)
            optimizer.step()

        scheduler.step()

        val_metrics = validate(model, val_loader, phase=3)
        print(f"Phase3 Epoch {epoch}: mAP = {val_metrics['mAP']:.4f}")

    torch.save(model.state_dict(), 'spdmnet_v6_final.pth')
    return model
```

#### 预期性能

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 训练时间 | ~3天 | 10 epochs |
| mAP | 64% | Full Model |
| 推理速度 | ~110ms | 含10步DDIM（完整版） |

### 7.5 训练总览

| Phase | Epochs | 激活模块 | 冻结模块 | 损失函数 | 目标 |
|-------|--------|---------|---------|---------|------|
| Phase 1 | 0-10 | hybridmamba_encoder + neck + head | hybridmamba_refine, diffusion | CenterPoint Loss | 建立检测基线 |
| Phase 2 | 10-40 | diffusion + hybridmamba_refine + neck + head | hybridmamba_encoder | loss_noise + 0.1×loss_recon | 扩散补全训练 |
| Phase 3 | 40-50 | 全部 | 无 | loss_noise + loss_detection | 端到端微调 |

### 7.6 训练技巧

#### 混合精度训练

```python
from torch.cuda.amp import autocast, GradScaler
scaler = GradScaler()

with autocast():
    loss = model(inputs)

scaler.scale(loss).backward()
scaler.step(optimizer)
scaler.update()
```

#### 梯度累积（显存不足时）

```python
accumulation_steps = 4
for i, batch in enumerate(train_loader):
    loss = model(batch) / accumulation_steps
    loss.backward()
    if (i + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()
```

#### EMA（Phase 2/3推荐）

```python
# 使用EMA稳定扩散模型训练
ema_model = copy.deepcopy(model)
for ema_p, p in zip(ema_model.parameters(), model.parameters()):
    ema_p.data.mul_(0.9999).add_(p.data, alpha=0.0001)
```

---

## 8. 数据集策略与配置

### 8.0 数据集总览与实验分工

SPDMNet采用三数据集策略，覆盖消融验证、主实验对比和泛化性测试：

| 数据集 | 角色 | FOV | Range Image分辨率 | 主要指标 | 用途 |
|--------|------|-----|-------------------|---------|------|
| KITTI | 消融实验 | ~90°（前视） | 64×1024 | AP (Easy/Mod/Hard) | 快速迭代，模块有效性验证，非环形鲁棒性 |
| nuScenes | 主实验 | 360° | 32×1024 | mAP, NDS | 10类检测，环形设计主战场 |
| Waymo Open | 主实验/对比 | 360° | 64×2650 | mAPH (L1/L2) | 高分辨率全景，SOTA对比基准 |

**设计逻辑**：
- CircularConv2d 和4方向扫描（含偏移跨边界）在360°数据（nuScenes/Waymo）上体现核心优势
- KITTI（90° FOV）用于消融实验快速迭代，同时验证非环形场景下的鲁棒性
- 三数据集覆盖不同LiDAR线数（32/64）和分辨率，验证架构泛化能力

---

### 8.1 KITTI（消融实验数据集）

#### 8.1.1 数据集概述

| 属性 | 值 | 说明 |
|------|-----|------|
| LiDAR型号 | Velodyne HDL-64E | 64线激光雷达 |
| 水平FOV | ~90°（前视） | 水平±45°，非环形 |
| 垂直FOV | -24.9° ~ +2.0° | 共26.9° |
| Range Image分辨率 | 64×1024 | 前视90°裁剪 |
| 点云密度 | ~120K点/帧（全景）；前视约30K | — |
| 检测类别 | 3类 | Car, Pedestrian, Cyclist |
| 训练集 | 3712帧 | KITTI train split |
| 验证集 | 3769帧 | KITTI val split |
| 评估指标 | AP@IoU=0.7(Car), 0.5(Ped/Cyc) | 3D AP / BEV AP，Easy/Moderate/Hard |

#### 8.1.2 Range Image投影参数

```python
KITTI_RANGE_IMAGE_CONFIG = {
    'height': 64,           # 垂直分辨率（64线LiDAR）
    'width': 1024,          # 水平分辨率（前视90°裁剪）
    'fov_up': 2.0,          # 上视场角（度）
    'fov_down': -24.9,      # 下视场角（度）
    'fov_h': 90.0,          # 水平FOV（度），前视±45°
    'max_range': 80.0,      # 最大检测距离（米）
    'channels': 5,          # [depth, intensity, x, y, z]
    'circular': False,      # 非环形，左右边界不连续
}
```

**非环形处理说明**：KITTI前视90°裁剪后左右边界不连续，CircularConv2d在此数据集上退化为普通padding（`padding_mode='zeros'`），用于验证环形设计在非环形场景下不引入负面影响。

#### 8.1.3 稀疏化策略

```python
KITTI_SUPERPOINT_CONFIG = {
    'method': 'FPS',        # Farthest Point Sampling
    'num_points': 2048,     # 采样点数（前视约30K → 2048）
    'min_distance': 0.1,    # 最小采样间距（米）
}
# 稀疏化后填充率约 2048 / (64×1024) ≈ 3.1%
```

#### 8.1.4 数据增强

```python
KITTI_AUGMENTATION_CONFIG = {
    'random_flip_x': 0.5,           # 水平翻转
    'random_rotation': [-0.785, 0.785],  # 随机旋转（±45°）
    'random_scale': [0.95, 1.05],    # 随机缩放
    'random_translation': 0.2,       # 随机平移（米）
    'random_drop_points': 0.1,       # 随机丢弃10%点
    'intensity_jitter': 0.1,         # 强度抖动
}
```

#### 8.1.5 GT密集Range Image生成

```python
def generate_dense_range_image_kitti(point_cloud):
    """
    生成GT密集Range Image（扩散模型训练目标）
    Args:
        point_cloud: (N, 4) 完整前视点云 [x, y, z, intensity]
    Returns:
        dense_ri: (64, 1024, 5) 密集Range Image
    """
    projector = RangeImageProjector(**KITTI_RANGE_IMAGE_CONFIG)
    dense_ri, _ = projector.project(point_cloud)
    return dense_ri
```

#### 8.1.6 评估协议

```python
KITTI_EVAL_CONFIG = {
    'difficulty': ['Easy', 'Moderate', 'Hard'],
    'iou_threshold': {'Car': 0.7, 'Pedestrian': 0.5, 'Cyclist': 0.5},
    'min_height': [40, 25, 25],
    'max_occlusion': [0, 1, 2],
    'max_truncation': [0.15, 0.3, 0.5],
    'primary_metric': 'AP_3D_Moderate',  # 主要汇报指标
}
```

---

### 8.2 nuScenes（主实验数据集）

#### 8.2.1 数据集概述

| 属性 | 值 | 说明 |
|------|-----|------|
| LiDAR型号 | Velodyne HDL-32E | 32线激光雷达 |
| 水平FOV | 360°（全景） | 环形，CircularConv2d完整生效 |
| 垂直FOV | -30.67° ~ +10.67° | 共41.34° |
| Range Image分辨率 | 32×1024 | 全景360° |
| 点云密度 | ~34K点/帧 | — |
| 检测类别 | 10类 | car, truck, bus, trailer, construction_vehicle, pedestrian, motorcycle, bicycle, traffic_cone, barrier |
| 训练集 | 28130帧 | nuScenes train split |
| 验证集 | 6019帧 | nuScenes val split |
| 测试集 | 6008帧 | nuScenes test split（无GT） |
| 评估指标 | mAP, NDS | nuScenes Detection Score |

**NDS计算**：
```
NDS = (1/5) × (mAP + mATE + mASE + mAOE + mAVE + mAAE)
```
其中 mATE（平移误差）、mASE（尺寸误差）、mAOE（朝向误差）、mAVE（速度误差）、mAAE（属性误差）均为越低越好，取倒数后加权。

#### 8.2.2 Range Image投影参数

```python
NUSCENES_RANGE_IMAGE_CONFIG = {
    'height': 32,           # 垂直分辨率（32线LiDAR）
    'width': 1024,          # 水平分辨率（360°全景）
    'fov_up': 10.67,        # 上视场角（度）
    'fov_down': -30.67,     # 下视场角（度）
    'fov_h': 360.0,         # 水平FOV（度），全景
    'max_range': 50.0,      # nuScenes检测范围（米）
    'channels': 5,          # [depth, intensity, x, y, z]
    'circular': True,       # 环形，左右边界连续
}
```

#### 8.2.3 稀疏化策略

```python
NUSCENES_SUPERPOINT_CONFIG = {
    'method': 'FPS',
    'num_points': 1024,     # 32线点云较稀疏，采样点数适当减少
    'min_distance': 0.1,
}
# 稀疏化后填充率约 1024 / (32×1024) ≈ 3.1%
```

#### 8.2.4 数据增强

```python
NUSCENES_AUGMENTATION_CONFIG = {
    'random_flip_x': 0.5,
    'random_rotation': [-3.14159, 3.14159],  # 全角度旋转（360°数据）
    'random_scale': [0.9, 1.1],
    'random_translation': 0.5,
    'random_drop_points': 0.1,
    'intensity_jitter': 0.1,
    # nuScenes特有：多帧点云融合（可选）
    'multi_sweep': False,   # 单帧训练，消融时可开启
}
```

#### 8.2.5 评估协议

```python
NUSCENES_EVAL_CONFIG = {
    'dist_thresholds': [0.5, 1.0, 2.0, 4.0],  # 匹配距离阈值（米）
    'iou_threshold': None,                      # nuScenes使用中心距离而非IoU
    'primary_metric': 'NDS',                    # 主要汇报指标
    'secondary_metric': 'mAP',
    'classes': [
        'car', 'truck', 'bus', 'trailer', 'construction_vehicle',
        'pedestrian', 'motorcycle', 'bicycle', 'traffic_cone', 'barrier'
    ],
}
```

---

### 8.3 Waymo Open Dataset（主实验/SOTA对比数据集）

#### 8.3.1 数据集概述

| 属性 | 值 | 说明 |
|------|-----|------|
| LiDAR型号 | Waymo 64线 | 64线激光雷达 |
| 水平FOV | 360°（全景） | 环形，CircularConv2d完整生效 |
| 垂直FOV | -17.6° ~ +2.4° | 共20° |
| Range Image分辨率 | 64×2650 | 全景360°，高水平分辨率 |
| 点云密度 | ~177K点/帧 | 高密度 |
| 检测类别 | 3类 | Vehicle, Pedestrian, Cyclist |
| 训练集 | 158361帧 | Waymo train split |
| 验证集 | 39987帧 | Waymo val split |
| 评估指标 | mAPH (L1/L2) | Level 1（易）/ Level 2（难） |

**mAPH说明**：Heading-weighted mAP，在mAP基础上加入朝向精度权重，对朝向估计要求更严格。

#### 8.3.2 Range Image投影参数

```python
WAYMO_RANGE_IMAGE_CONFIG = {
    'height': 64,           # 垂直分辨率（64线LiDAR）
    'width': 2650,          # 水平分辨率（360°全景，Waymo原生分辨率）
    'fov_up': 2.4,          # 上视场角（度）
    'fov_down': -17.6,      # 下视场角（度）
    'fov_h': 360.0,         # 水平FOV（度），全景
    'max_range': 75.0,      # Waymo检测范围（米）
    'channels': 5,          # [depth, intensity, x, y, z]
    'circular': True,       # 环形，左右边界连续
}
```

**注意**：Waymo原生提供Range Image格式（64×2650），可直接使用，无需重新投影。

#### 8.3.3 稀疏化策略

```python
WAYMO_SUPERPOINT_CONFIG = {
    'method': 'FPS',
    'num_points': 4096,     # Waymo点云密度高，采样点数适当增加
    'min_distance': 0.1,
}
# 稀疏化后填充率约 4096 / (64×2650) ≈ 2.4%
```

#### 8.3.4 数据增强

```python
WAYMO_AUGMENTATION_CONFIG = {
    'random_flip_x': 0.5,
    'random_rotation': [-3.14159, 3.14159],  # 全角度旋转
    'random_scale': [0.95, 1.05],
    'random_translation': 0.3,
    'random_drop_points': 0.1,
    'intensity_jitter': 0.1,
    'gt_sampling': True,    # GT采样增强（Waymo常用）
}
```

#### 8.3.5 评估协议

```python
WAYMO_EVAL_CONFIG = {
    'difficulty': ['L1', 'L2'],             # Level 1 / Level 2
    'iou_threshold': {
        'Vehicle': 0.7,
        'Pedestrian': 0.5,
        'Cyclist': 0.5
    },
    'primary_metric': 'mAPH_L2',           # 主要汇报指标（SOTA对比用L2）
    'secondary_metric': 'mAPH_L1',
    'classes': ['Vehicle', 'Pedestrian', 'Cyclist'],
}
```

---

### 8.4 三数据集对比总结

| 属性 | KITTI | nuScenes | Waymo Open |
|------|-------|----------|------------|
| 水平FOV | ~90°（非环形） | 360°（环形） | 360°（环形） |
| LiDAR线数 | 64 | 32 | 64 |
| Range Image | 64×1024 | 32×1024 | 64×2650 |
| 点云密度/帧 | ~30K（前视） | ~34K | ~177K |
| 检测类别数 | 3 | 10 | 3 |
| 训练集规模 | 3712帧 | 28130帧 | 158361帧 |
| 主要指标 | AP (Mod) | mAP + NDS | mAPH (L2) |
| CircularConv2d | 退化为零填充 | 完整生效 | 完整生效 |
| 实验角色 | 消融/鲁棒性 | 主实验 | 主实验/SOTA对比 |

---

## 9. 实验方案（消融 + 主实验）

### 9.1 实验分层策略

```
消融实验（KITTI）：快速迭代，验证每个模块的独立贡献
    ↓ 确认有效模块后
主实验（nuScenes + Waymo）：完整方案，与SOTA对比
```

**分层原因**：
- KITTI训练集仅3712帧，单卡训练一个epoch约5分钟，消融迭代成本低
- nuScenes/Waymo规模大（28K/158K帧），仅在确认设计后跑完整实验
- KITTI非环形特性额外验证CircularConv2d的鲁棒性（不引入负面影响）

---

### 9.2 消融实验（KITTI）

#### 9.2.1 渐进式Baseline设计

采用渐进式消融策略，逐步添加组件，量化每个模块的贡献：

```
Baseline 1 → Baseline 2 → Baseline 3 → Student
  +SimpleUNet补全  +Diffusion    蒸馏加速
```

**Baseline 1: HybridMamba + Head（最小基线）**

```
稀疏RI → hybridmamba_encoder → SECOND Neck → CenterPoint Head → 3D Boxes
```

| 属性 | 值 |
|------|-----|
| 参数量 | 40M |
| 预期mAP (Mod) | 60% |
| 推理速度 | ~25ms |
| 目的 | 验证HybridMamba编码器基础能力 |

**Baseline 2: HybridMamba + SimpleUNet补全（确定性补全）**

```
稀疏RI → hybridmamba_encoder → SimpleUNet（非扩散，单步） → hybridmamba_refine → Neck → Head
```

| 属性 | 值 |
|------|-----|
| 参数量 | 50M |
| 预期mAP (Mod) | 62% |
| 推理速度 | ~50ms |
| 目的 | 验证补全模块增益（+2%），作为扩散模型的快速替代 |

**Baseline 3: 双HybridMamba + Diffusion（完整方案）**

```
稀疏RI → hybridmamba_encoder → Diffusion U-Net（10步DDIM） → hybridmamba_refine → Neck → Head
```

| 属性 | 值 |
|------|-----|
| 参数量 | 77M |
| 预期mAP (Mod) | 64% |
| 推理速度 | ~110ms（10步DDIM） |
| 目的 | 最终性能上限 |

**Student: 双HybridMamba + MambaUNet蒸馏（速度优化）**

```
稀疏RI → hybridmamba_encoder → MambaUNet（单步，蒸馏自Diffusion） → hybridmamba_refine → Neck → Head
```

| 属性 | 值 |
|------|-----|
| 参数量 | 55M |
| 预期mAP (Mod) | 63% |
| 推理速度 | ~40ms |
| 目的 | 速度-精度平衡，接近Baseline 3性能但速度更快 |

#### 9.2.2 渐进式实验对比表（KITTI val）

| 模型 | hybridmamba_encoder | hybridmamba_refine | 补全模块 | 参数量 | 预期mAP (Mod) | 推理速度 |
|------|:---:|:---:|:---:|--------|---------|---------|
| Baseline 1 | ✓ | ✗ | ✗ | 40M | 60% | ~25ms |
| Baseline 2 | ✓ | ✓ | SimpleUNet | 50M | 62% | ~50ms |
| Baseline 3 | ✓ | ✓ | Diffusion（10步） | 77M | 64% | ~110ms |
| Student | ✓ | ✓ | MambaUNet（蒸馏） | 55M | 63% | ~40ms |
| +可变形卷积（消融） | ✓ | ✗ | DCN | ~55M | 62% | ~35ms |

#### 9.2.3 消融实验设计

```
消融A: 扩散 vs 可变形卷积
  Baseline 3（Diffusion）vs Baseline+DCN → 量化扩散模型增益

消融B: HybridMamba vs 纯Mamba
  Baseline 1（HybridMamba）vs 纯Mamba编码器 → 量化卷积+SSM混合增益

消融C: 扩散步数影响
  DDIM 5步 vs 10步 vs 20步 → 速度-精度权衡

消融D: 条件注入方式
  输入层单点注入 vs 多层cross-attention → 验证简化设计的有效性

消融E: 遮罩策略
  单一随机遮罩 vs 三类混合遮罩 → 验证混合遮罩对鲁棒性的贡献

消融F: CircularConv2d鲁棒性（KITTI专项）
  CircularConv2d（零填充退化）vs 标准Conv2d → 验证非环形场景无负面影响
```

#### 9.2.4 速度优化路径对比（KITTI）

| 配置 | 结构 | 速度 | 预期mAP (Mod) | 适用场景 |
|------|------|------|---------|---------|
| 完整版 | Diffusion 10步 | ~110ms | 64% | 精度优先 |
| 快速版 | DDIM 5步 | ~60ms | 63.5% | 速度-精度平衡 |
| 蒸馏版 | MambaUNet单步 | ~40ms | 63% | 部署优先 |

---

### 9.3 主实验（nuScenes）

#### 9.3.1 实验配置

使用完整SPDMNet方案（Baseline 3 + Student），在nuScenes val上评估：

```python
NUSCENES_MAIN_EXP_CONFIG = {
    'model': 'SPDMNet_Full',        # 双HybridMamba + Diffusion 10步
    'epochs': 20,                   # nuScenes标准训练轮数
    'batch_size': 4,                # 单卡batch size
    'optimizer': 'AdamW',
    'lr': 1e-4,
    'lr_schedule': 'cosine',
    'warmup_epochs': 1,
    'weight_decay': 0.01,
    'training_phases': 3,           # 三Phase渐进式训练
}
```

#### 9.3.2 SOTA对比表（nuScenes val）

| 方法 | 输入 | mAP | NDS | 参数量 | 速度 |
|------|------|-----|-----|--------|------|
| CenterPoint [Yin et al., 2021] | Voxel | 50.3 | 60.3 | 6.4M | 66ms |
| TransFusion-L [Bai et al., 2022] | Voxel | 65.5 | 70.2 | 32M | — |
| BEVFusion [Liu et al., 2023] | Voxel+Img | 70.2 | 72.9 | — | — |
| RangeDet [Fan et al., 2021] | Range Image | 43.1 | 53.6 | — | — |
| RangeFormer [Kong et al., 2023] | Range Image | 52.6 | 62.1 | — | — |
| **SPDMNet (Ours)** | Range Image | **~58** | **~65** | 77M | ~110ms |
| **SPDMNet-Fast (Ours)** | Range Image | **~57** | **~64** | 55M | ~40ms |

*注：SOTA数据来自原论文，SPDMNet数值为预期值，待实验验证。*

#### 9.3.3 环形设计优势验证

在nuScenes上专项验证CircularConv2d的贡献：

```
实验设置：
  SPDMNet（CircularConv2d）vs SPDMNet（标准Conv2d，零填充）
  重点关注：远距离目标（>30m）、边界区域目标的检测性能
  预期增益：mAP +1~2%，边界区域AP +3~5%
```

---

### 9.4 主实验（Waymo Open Dataset）

#### 9.4.1 实验配置

```python
WAYMO_MAIN_EXP_CONFIG = {
    'model': 'SPDMNet_Full',
    'epochs': 36,                   # Waymo标准训练轮数（CenterPoint协议）
    'batch_size': 2,                # Waymo帧较大，减小batch size
    'optimizer': 'AdamW',
    'lr': 3e-4,
    'lr_schedule': 'one_cycle',
    'weight_decay': 0.01,
    'training_phases': 3,
    # Waymo特有：Range Image原生格式，无需重新投影
    'use_native_range_image': True,
}
```

#### 9.4.2 SOTA对比表（Waymo val，L2 mAPH）

| 方法 | 输入 | Veh L2 | Ped L2 | Cyc L2 | mAPH L2 | 速度 |
|------|------|--------|--------|--------|---------|------|
| CenterPoint [Yin et al., 2021] | Voxel | 63.8 | 64.5 | 65.7 | 64.7 | — |
| PV-RCNN++ [Shi et al., 2022] | Voxel | 67.0 | 67.7 | 69.7 | 68.1 | — |
| SST [Fan et al., 2022] | Voxel | 65.1 | 74.2 | 71.4 | 70.2 | — |
| RangeDet [Fan et al., 2021] | Range Image | 67.6 | 63.9 | 65.7 | 65.7 | — |
| **SPDMNet (Ours)** | Range Image | **~68** | **~65** | **~67** | **~67** | ~110ms |

*注：Waymo实验计算资源需求较高，优先在nuScenes完成验证后再跑Waymo。*

#### 9.4.3 高分辨率Range Image处理

Waymo的64×2650分辨率显著大于KITTI/nuScenes，需要特殊处理：

```python
# 内存优化：分块处理或降采样
WAYMO_RESOLUTION_STRATEGY = {
    'option_a': {
        'name': '原生分辨率',
        'width': 2650,
        'memory': '~8GB/sample',
        'note': '需要大显存GPU（A100 80GB）'
    },
    'option_b': {
        'name': '降采样至1024',
        'width': 1024,
        'memory': '~3GB/sample',
        'note': '与nuScenes/KITTI统一分辨率，轻微精度损失'
    },
    'default': 'option_b',  # 初期实验使用降采样，后期验证原生分辨率
}
```

---

### 9.5 实验实施顺序

```
Phase 1（Week 1-2）: KITTI消融 - Baseline 1
  目标：验证HybridMamba编码器基础能力，建立代码框架

Phase 2（Week 3）: KITTI消融 - Baseline 2
  目标：验证SimpleUNet补全增益，确认补全模块设计方向

Phase 3（Week 4-6）: KITTI消融 - Baseline 3 + 消融A~F
  目标：完整方案验证，量化各模块贡献，确认最终设计

Phase 4（Week 7）: KITTI消融 - Student蒸馏
  目标：验证速度优化路径

Phase 5（Week 8-10）: nuScenes主实验
  目标：完整方案在nuScenes上的SOTA对比，环形设计优势验证

Phase 6（Week 11-13）: Waymo主实验（可选，视资源情况）
  目标：高分辨率全景数据验证，补充SOTA对比

Phase 7（Week 14）: 整理实验结果，撰写论文
```

---

## 10. 速度优化路径：MambaUNet Student蒸馏

### 10.1 设计动机

Diffusion U-Net即使使用DDIM 10步推理，端到端总推理时间仍需约110ms。对于实时部署场景（目标<50ms总推理时间），需要一个更快的替代方案。MambaUNet通过**知识蒸馏**将扩散模型的补全能力压缩为单步推理。

### 10.2 MambaUNet结构

MambaUNet采用**HybridMamba Block + 多尺度跳跃连接**的U-Net结构，单步完成Range Image补全：

```
输入（稀疏RI）→ HybridMamba Enc1 → skip1
                  ↓ 下采样（stride=2）
               HybridMamba Enc2 → skip2
                  ↓ 下采样（stride=2）
               HybridMamba Bottleneck
                  ↓ 上采样（bilinear）
               HybridMamba Dec2 ← skip2（concat）
                  ↓ 上采样（bilinear）
               HybridMamba Dec1 ← skip1（concat）
                  ↓
               输出（密集RI，单步，无时间嵌入）
```

**关键设计**：
- 多尺度跳跃连接保留细节信息（类似U-Net）
- HybridMamba Block保持全局序列建模能力
- 无时间嵌入（单步推理，不需要噪声级别信息）

```python
class MambaUNet(nn.Module):
    """
    MambaUNet: 单步Range Image补全（蒸馏自Diffusion U-Net）
    参数量约 15M，推理速度约 40ms（含hybridmamba_encoder + hybridmamba_refine + neck + head）
    """

    def __init__(self, in_channels=5, base_channels=64):
        super().__init__()
        C = base_channels

        # 编码器
        self.enc1 = HybridMambaBlock(C, H=64, W=1024)
        self.enc_proj1 = nn.Conv2d(in_channels, C, 3, padding=1)
        self.down1 = nn.Conv2d(C, C * 2, 3, stride=2, padding=1)

        self.enc2 = HybridMambaBlock(C * 2, H=32, W=512)
        self.down2 = nn.Conv2d(C * 2, C * 4, 3, stride=2, padding=1)

        # Bottleneck
        self.bottleneck = HybridMambaBlock(C * 4, H=16, W=256)

        # 解码器
        self.up2 = nn.ConvTranspose2d(C * 4, C * 2, 4, stride=2, padding=1)
        self.dec2 = HybridMambaBlock(C * 4, H=32, W=512)  # C*4 = C*2 + skip C*2
        self.dec_proj2 = nn.Conv2d(C * 4, C * 2, 1)

        self.up1 = nn.ConvTranspose2d(C * 2, C, 4, stride=2, padding=1)
        self.dec1 = HybridMambaBlock(C * 2, H=64, W=1024)  # C*2 = C + skip C
        self.dec_proj1 = nn.Conv2d(C * 2, C, 1)

        # 输出
        self.out_conv = nn.Conv2d(C, in_channels, 3, padding=1)

    def forward(self, sparse_ri):
        """
        Args:
            sparse_ri: (B, 5, H, W) 稀疏Range Image

        Returns:
            dense_ri: (B, 5, H, W) 补全后的密集Range Image（单步）
        """
        # 编码器
        x = self.enc_proj1(sparse_ri)  # (B, C, H, W)
        skip1 = self.enc1(x)           # (B, C, H, W)
        x = self.down1(skip1)          # (B, 2C, H/2, W/2)

        skip2 = self.enc2(x)           # (B, 2C, H/2, W/2)
        x = self.down2(skip2)          # (B, 4C, H/4, W/4)

        # Bottleneck
        x = self.bottleneck(x)         # (B, 4C, H/4, W/4)

        # 解码器（多尺度跳跃连接）
        x = self.up2(x)                # (B, 2C, H/2, W/2)
        x = self.dec_proj2(torch.cat([x, skip2], dim=1))  # (B, 2C, H/2, W/2)
        x = self.dec2(x)

        x = self.up1(x)                # (B, C, H, W)
        x = self.dec_proj1(torch.cat([x, skip1], dim=1))  # (B, C, H, W)
        x = self.dec1(x)

        return self.out_conv(x)        # (B, 5, H, W)
```

### 10.3 蒸馏训练策略

```python
def train_student_distillation(teacher_diffusion, student_mambaunet, train_loader):
    """
    MambaUNet蒸馏训练
    Teacher: 训练好的Diffusion U-Net（10步DDIM输出）
    Student: MambaUNet（单步输出）
    """
    optimizer = torch.optim.AdamW(student_mambaunet.parameters(), lr=1e-3)

    for batch in train_loader:
        sparse_ri = batch['sparse_range_image'].cuda()
        dense_ri_gt = batch['dense_range_image'].cuda()

        # Teacher推理（无梯度）
        with torch.no_grad():
            cond_feat = hybridmamba_encoder(sparse_ri)
            teacher_output = teacher_diffusion.ddim_sample(sparse_ri, cond_feat)

        # Student单步推理
        student_output = student_mambaunet(sparse_ri)

        # 蒸馏损失：对齐Teacher输出 + GT监督
        loss_distill = F.l1_loss(student_output, teacher_output)  # 对齐Teacher
        loss_gt = F.l1_loss(student_output * valid_mask, dense_ri_gt * valid_mask)  # GT监督
        loss = loss_distill + 0.5 * loss_gt

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
```

### 10.4 速度-精度权衡总结

| 配置 | 结构 | 推理速度 | 预期mAP | 参数量 | 适用场景 |
|------|------|---------|---------|--------|---------|
| 完整版 | Diffusion 10步 | ~110ms | 64% | 77M | 精度优先 |
| 快速版 | DDIM 5步 | ~60ms | 63.5% | 77M | 速度-精度平衡 |
| 蒸馏版 | MambaUNet单步 | ~40ms | 63% | 55M | 部署优先 |

---

## 11. 恶劣天气鲁棒性

### 11.1 设计原理

训练时的**三类混合遮罩策略**自然赋予模型恶劣天气鲁棒性，无需额外的天气增强模块：

| 遮罩类型 | 模拟场景 | 物理对应 |
|---------|---------|---------|
| 随机遮罩（40%） | 雨天点云丢失 | 雨滴散射导致随机点云缺失 |
| 距离衰减遮罩（30%） | 雾天远距离丢失 | 雾气吸收导致远距离回波衰减 |
| 块状遮罩（30%） | 大面积遮挡 | 建筑物/车辆遮挡、传感器污染 |

### 11.2 鲁棒性验证方案

```python
# 测试时模拟不同天气条件
WEATHER_TEST_CONFIGS = {
    'clear': {'mask_type': None, 'drop_ratio': 0.0},
    'light_rain': {'mask_type': 'random', 'drop_ratio': 0.2},
    'heavy_rain': {'mask_type': 'random', 'drop_ratio': 0.5},
    'fog_near': {'mask_type': 'distance', 'max_range': 40.0},  # 雾天近距离
    'fog_far': {'mask_type': 'distance', 'max_range': 20.0},   # 浓雾
    'occlusion': {'mask_type': 'block', 'num_blocks': 5},
}

def evaluate_weather_robustness(model, val_loader, weather_configs):
    """评估不同天气条件下的检测性能"""
    results = {}
    for weather, config in weather_configs.items():
        mAP = evaluate_with_weather(model, val_loader, config)
        results[weather] = mAP
        print(f"{weather}: mAP = {mAP:.4f}")
    return results
```

### 11.3 预期鲁棒性结果

| 天气条件 | 预期mAP | 相对清晰天气下降 |
|---------|---------|--------------|
| 清晰天气 | 64% | - |
| 轻度雨天（20%丢失） | 62% | -2% |
| 重度雨天（50%丢失） | 59% | -5% |
| 近距离雾天（40m） | 61% | -3% |
| 浓雾（20m） | 56% | -8% |
| 大面积遮挡 | 60% | -4% |

**对比基线（无混合遮罩训练）**：重度雨天下降约15%，本方法通过混合遮罩训练将下降幅度控制在5%以内。

### 11.4 消融：遮罩策略对鲁棒性的贡献

| 训练策略 | 清晰天气mAP | 重度雨天mAP | 鲁棒性提升 |
|---------|-----------|-----------|---------|
| 无遮罩 | 64% | 49% | - |
| 仅随机遮罩 | 63.5% | 57% | +8% |
| 三类混合遮罩 | 64% | 59% | +10% |

---

## 12. 实现路线图（v2.1）

### 12.1 实现优先级

| 优先级 | 模块 | 时间 | 对应Baseline | 风险 |
|--------|------|------|-------------|------|
| P0 | Range Image投影（KITTI前视90°） | 2天 | 必需 | 低 |
| P0 | HybridMamba Encoder | 3天 | Baseline 1 | 中 |
| P0 | SECOND Neck + CenterPoint Head | 3天 | Baseline 1 | 低 |
| P0 | HybridMamba Refine（复用encoder代码） | 1天 | Baseline 2 | 低 |
| P1 | SimpleUNet补全（非扩散，快速验证） | 3天 | Baseline 2 | 低 |
| P1 | Diffusion U-Net（条件补全，输入层注入） | 1周 | Baseline 3 | 中 |
| P1 | 3-Phase渐进式训练流程 | 3天 | Baseline 3 | 低 |
| P1 | MambaUNet蒸馏 | 3天 | Student | 低 |
| P2 | 可变形卷积（消融对比） | 1周 | 消融实验 | 中 |
| P2 | DDIM步数消融（5/10/20步） | 2天 | 消融实验 | 低 |

### 12.2 里程碑

| 里程碑 | 时间 | 目标 | 验收标准 |
|--------|------|------|---------|
| M1: Baseline 1 | Week 2 | HybridMamba Encoder + Head可运行 | mAP 60% |
| M2: Baseline 2 | Week 4 | SimpleUNet补全完成 | mAP 62% |
| M3: Baseline 3 | Week 6 | Diffusion训练完成（10步DDIM） | mAP 64% |
| M4: Student | Week 7 | MambaUNet蒸馏完成 | mAP 63%, 速度<50ms |
| M5: 消融实验 | Week 8 | 所有消融完成 | 完整对比表 |
| M6: 论文提交 | Week 9 | 实验结果整理 | 完整实验报告 |

### 12.3 关键文件

```
spdmnet/
├── models/
│   ├── hybrid_mamba_encoder.py   # HybridMambaBlock + HybridMambaEncoder（共用）
│   ├── diffusion_unet.py         # Diffusion U-Net条件补全（输入层注入）
│   ├── mamba_unet.py             # MambaUNet（Student蒸馏）
│   ├── second_neck.py            # SECOND-style Neck
│   ├── centerpoint_head.py       # CenterPoint Head
│   └── spdmnet.py                # 完整模型
├── datasets/
│   ├── kitti_dataset.py          # KITTI数据加载
│   ├── range_image_projector.py  # Range Image投影（前视90°）
│   └── mixed_mask.py             # 三类混合遮罩生成器
├── training/
│   ├── train_phase1.py           # Phase 1训练脚本
│   ├── train_phase2.py           # Phase 2训练脚本
│   ├── train_phase3.py           # Phase 3训练脚本
│   ├── train_student.py          # MambaUNet蒸馏训练
│   └── progressive_trainer.py    # 统一渐进式训练入口
└── configs/
    ├── kitti_baseline1.yaml
    ├── kitti_baseline2.yaml
    ├── kitti_baseline3.yaml
    └── kitti_student.yaml
```

---

## 13. 架构更新日志

### v2.1（2026-03-08）

**本次更新基于最新架构讨论，对v2.0进行了以下变更：**

#### 变更1: Mamba编码器升级为HybridMamba Encoder

- **变更前**: 纯Mamba编码器（Hilbert曲线扫描，单一SSM分支）
- **变更后**: HybridMamba Encoder（卷积+SSM混合，通道分组，4方向EfficientMultiScan）
- **理由**: 卷积分支补充局部几何感知能力，通道分组SSM兼顾局部和全局依赖，4方向扫描（行Z序正向/反向+偏移、环形对角/反对角）全面覆盖Range Image长程依赖
- **影响**: 单编码器参数量从~50M降至~20M（共4个HybridMamba Block），总参数量从137M降至77M；推理速度提升约46%

#### 变更2: 扩散模型条件注入简化为输入层单点注入

- **变更前**: Concatenation方式（266ch输入，x_t + sparse_ri + cond_features）
- **变更后**: 输入层单点注入（x = input_proj(noisy_range) + cond_proj(condition) + t_emb）
- **理由**: 简单有效，避免多层条件注入的复杂性；条件信息在输入层充分融合后，后续U-Net专注去噪
- **影响**: U-Net结构简化，ResBlock无需携带时间步条件

#### 变更3: 训练遮罩策略升级为三类混合遮罩

- **变更前**: 单一随机遮罩
- **变更后**: 三类混合遮罩（随机遮罩40% + 距离衰减遮罩30% + 块状遮罩30%）
- **理由**: 混合遮罩自然模拟雨天/雾天/遮挡等恶劣天气，赋予模型天气鲁棒性
- **影响**: 无需额外天气增强模块，重度雨天mAP下降从~15%控制到~5%

#### 变更4: 损失函数分Phase明确

- **变更前**: Phase 2/3使用相同损失（loss_diffusion + lambda×loss_det）
- **变更后**: Phase 2使用loss_noise + 0.1×loss_recon；Phase 3使用loss_noise + loss_detection
- **理由**: Phase 2专注扩散补全质量，Phase 3引入检测损失使补全朝有利于检测的方向优化
- **影响**: 训练更稳定，避免Phase 2过早引入检测损失导致的优化冲突

#### 变更5: 推理步数从50步降至10步

- **变更前**: DDIM 50步推理（~100ms）
- **变更后**: DDIM 10步推理（端到端~110ms），快速版5步（端到端~60ms）
- **理由**: 10步DDIM在Range Image补全任务上精度损失可忽略（<0.5% mAP）
- **影响**: 扩散推理速度提升5×，总推理时间从~130ms降至~110ms（10步DDIM）

#### 变更6: 新增MambaUNet Student蒸馏路径

- **新增**: MambaUNet（HybridMamba Block + 多尺度跳跃连接，单步推理）
- **理由**: 为实时部署场景提供更快的替代方案（~40ms vs ~110ms）
- **影响**: 新增Student模型（55M参数），预期mAP 63%（相比Baseline 3的64%仅损失1%）

---

### v2.0（2026-03-08）

**本次更新基于架构讨论，对v1.0进行了以下重大变更：**

#### 变更1: 双Mamba设计

- **变更前**: 单个Mamba编码器，同时承担条件提取和特征精炼
- **变更后**: 两个独立Mamba编码器（`mamba_encoder` + `mamba_refine`），参数独立
- **理由**: 职责分离，编码稀疏RI的条件语义与编码密集RI的检测特征是不同任务
- **影响**: 参数量从~50M增加到~100M（双Mamba部分）

#### 变更2: 扩散模型从特征空间迁移至Range Image像素空间

- **变更前**: Latent Diffusion在特征空间操作（无直接GT，需VAE预训练）
- **变更后**: Diffusion U-Net在RI像素空间操作（有明确GT：真实密集RI）
- **理由**: 像素空间有明确GT，训练更稳定；无需VAE预训练，简化训练流程
- **影响**: 移除VAE Encoder/Decoder（节省~20M参数），扩散模型参数从~50M降至~30M

#### 变更3: 移除可变形卷积主流程

- **变更前**: 可变形卷积作为主流程的几何自适应模块
- **变更后**: 移除主流程，保留为消融实验对比项
- **理由**: 扩散模型在RI像素空间的条件补全已隐式处理几何畸变
- **影响**: 主流程参数量减少~15M，Pipeline更简洁

#### 变更4: 检测头从Range View换为CenterPoint Head

- **变更前**: PCLA + VAR（Range View检测，透视中心标签分配）
- **变更后**: SECOND-style Neck + CenterPoint Head（BEV检测）
- **理由**: CenterPoint工程成熟，与SECOND Neck配合良好；BEV检测精度更高
- **影响**: 检测头参数量从~10M降至~2M，但增加了SECOND Neck（~5M）

#### 变更5: 训练策略从四阶段改为三Phase渐进式

- **变更前**: 四阶段（Teacher训练 → VAE+Diffusion → Student蒸馏 → 端到端微调），需5-6周
- **变更后**: 三Phase渐进式（Warmup → 联合训练 → 端到端微调），共50 epochs，约2周
- **理由**: 无需单独预训练扩散模型（像素空间有GT），无需蒸馏（直接端到端）
- **影响**: 训练时间大幅缩短，流程更简洁

#### 变更6: 数据集从nuScenes切换至KITTI

- **变更前**: nuScenes（360° FOV，64×2048分辨率，10类）
- **变更后**: KITTI（前视90° FOV，64×1024分辨率，3类）
- **理由**: 降低初期实验复杂度，KITTI评估体系成熟，序列长度减半（65536 vs 131072）
- **影响**: 计算量降低约50%，评估指标改为KITTI AP

---

**文档完成日期**: 2026-03-07
**最后更新日期**: 2026-03-08
**文档版本**: v2.1
**适用项目**: SPDMNet v6.0
**预计实现时间**: 9周（Baseline 1: 2周，Full Model: 6周，消融+论文: 1周）

