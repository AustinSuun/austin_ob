---
日期: 2026-02-14T20:20:00
作者:
  - Austin
tags:
  - LNN
  - 3D目标检测
  - 点云
draft: false
---

## LV-Net 核心架构：离散与连续的交织

LV-Net 的设计初衷是为了解决 3D 稀疏卷积在处理长尾、稀疏物体时特征容易"坍塌"的问题。其核心架构由 **4 阶段编解码对称结构** 和 **双组件处理层** 构成。

### 1. 宏观拓扑：4 阶段编解码 (4-Stage Encoder-Decoder)

LV-Net 采用了典型的 3D 目标检测骨干网络拓扑，但每一层都注入了液态动力学：

- **Encoder (1-4 阶段)**：空间分辨率逐级减半，特征维度逐级翻倍。负责从精细的几何位置中提取高层语义。
- **Decoder (4-1 阶段)**：通过索引反向映射（Index-map）恢复分辨率。负责将高层语义重新对焦到原始的几何坐标上。

### 2. 核心计算单元：双组件一层 (Dual-Component Layer)

这是 LV-Net 最具识别度的设计。传统的网络每一层只有一个卷积算子，而我们的**一层由两个互补的组件**组成：

**组件 A：稀疏卷积 (SpConv)**

- **角色**：离散特征聚合器。
- **任务**：回答"这里是什么（What）"。
- 利用 $3 \times 3 \times 3$ 的权重矩阵在离散网格中搜集邻域语义。

**组件 B：液态块 (Residual Liquid Block, RLB)**

- **角色**：连续几何校准器。
- **任务**：回答"精确在哪（Where）"。
- 利用亚体素/体素间偏移 $\Delta p$ 驱动 CfC 演化，对卷积输出进行物理轨迹的修正。

### 3. 设计哲学：从网格到场 (From Grid to Field)

- **量化补偿**：传统的体素化会将 0.1m 内的所有点强行抹平。LV-Net 通过 RLB 模块，将这 0.1m 内的偏移量重新定义为"时间"，让特征在体素内部进行二次演化，从而找回丢失的形状。
- **几何一致性**：通过秩-1 投影约束，确保模型在学习时不是杂乱的拟合，而是寻找空间中最优的"几何演化轴"。

### 4. 关键超参数

- **Stage 深度**：每个阶段固定为 2 层（Layer = SpConv + RLB）。
- **初始化**：残差系数 $\alpha$ 默认为 0，遵循 Zero-gamma 策略，确保训练初期的基准稳定性。

<iframe src="/实验/LNN点云识别设计-核心架构" width="100%" height="200" style="border:none;border-radius:12px;overflow:hidden;" scrolling="no"></iframe>

## VFE-Liquid：几何锚点的精准捕获与"延迟演化"

VFE 是 LV-Net 接触原始点云的第一道关口。在我们的设计中，它采用了 **"数据提供者" (Geometry Provider)** 的角色，为后续的液态动力学演化奠定基础。

### 1. 核心任务：几何无损透传

传统的 VFE 在聚合后会丢失点在体素内的精确位置。LV-Net 的 VFE 通过以下方式解决：

- **提取偏移 ($\Delta p$)**：计算每个点相对于体素几何中心的 3D 位移。
- **透传机制**：不立即在 VFE 阶段消耗这些位移，而是将它们与聚合后的体素特征一同传给骨干网 Stage 1。

### 2. 增强型几何感知 (Input Augmentation)

为了让初始特征更具代表性，VFE 显式构建了 **6 维几何特征**：

- **Mean-Offset ($\Delta p_{mean}$)**：点相对于体素内所有点平均中心的偏差，描述局部点簇的分布。
- **Geo-Offset ($\Delta p_{geo}$)**：点相对于体素规则几何中心的偏差，作为后续 LNN 演化的核心驱动力 $t$。

### 3. 延迟演化策略 (Deferred Evolution)

- **逻辑**：VFE 负责生成"特征底色"，而真正的"脑补"（几何精修）发生在骨干网络的第一层。
- **优势**：这种设计能够让液态演化算子同时结合 VFE 提供的高精度亚体素位移和卷积层提供的跨体素语义上下文。

### 4. 数据接口规范

| 输出项 | 维度 | 物理意义 |
| --- | --- | --- |
| Voxel Features | $[N, 64]$ | 初始语义特征（体素底色） |
| Geo-Offsets | $[M, 3]$ | 原始亚体素位移（演化种子） |
| Voxel Indices | $[M]$ | 建立点与特征行号的映射锚点 |

<iframe src="/实验/LNN点云识别设计-VFE流程" width="100%" height="200" style="border:none;border-radius:12px;overflow:hidden;" scrolling="no"></iframe>

## RLB (Residual Liquid Block)：连续空间动力学引擎

RLB 是 LV-Net 的灵魂算子。它不通过简单的权重堆叠来"记忆"形状，而是通过解算 **连续常微分方程 (ODE)** 的闭式近似解，实现对几何特征的动态重构。

### 1. 核心数学：CfC 空间映射

RLB 的理论基础是闭式连续时间神经网络 (CfC)。在 3D 空间中，我们将偏移量 $\Delta p$ 定义为驱动演化的参数。其状态转移方程为：

$$h(\Delta p) = h_{base} \odot (1 - g(t)) + h_{geo} \odot g(t)$$

- $h_{base}$ (**语义基调**)：由线性层从输入特征中提取。
- $h_{geo}$ (**几何演变**)：代表系统受到位移冲击后的非线性响应。
- $g(t)$ (**演化门控**)：决定了特征在"初始态"与"演化态"之间的流转程度。

### 2. 空间驱动：秩-1 投影 (Rank-1 Projection)

为了将 3D 的 $\Delta p$ 转化为 CfC 所需的标量演化驱动力，我们设计了参数极简的**秩-1 投影**：

- **方向过滤**：$\text{drive} = \langle \Delta p, \mathbf{u} \rangle$ —— 寻找空间中最敏感的演化轴。
- **通道调制**：$t = \sigma(\text{drive} \cdot \mathbf{v})$ —— 将 1D 信号扩展到 $C$ 个特征通道。
- **优势**：仅需 $3+C$ 个参数，相比全连接层的 $3 \times C$ 大大降低了过拟合风险。

### 3. 自加权积分聚合 (Importance-weighted Pooling)

RLB 在聚合特征时不是简单的平均，而是利用演化强度进行加权：

- **逻辑**：演化越剧烈的点（即位移导致特征剧变的点），通常位于物体的边缘或关键几何转折处。
- **操作**：使用门控信号的范数作为权重进行 `scatter_mean`，使聚合后的体素特征自动聚焦于关键几何细节。

### 4. 训练策略：Zero-gamma 残差连接

为了保证深层网络的稳定性，RLB 采用残差形式：

$$F_{out} = \text{Norm}(F_{conv} + \alpha \cdot F_{liquid})$$

- **初始化**：$\alpha$ 初始为 0。
- **物理意义**：模型首先学会稳定的卷积语义，随后逐步开启液态演化分支，对特征进行"二次对焦"和细节"脑补"。

<iframe src="/实验/LNN点云识别设计-RLB逻辑" width="100%" height="200" style="border:none;border-radius:12px;overflow:hidden;" scrolling="no"></iframe>

## LV-Net：跨尺度几何演化与解码器对焦策略

在 LV-Net 的编解码架构中，分辨率的切换不再是简单的"压缩"与"拉伸"，而是一次物理意义上的**"几何状态迁移"**。

### 1. 液态下采样：几何动量聚合 (Liquid Downsampling)

当 $2 \times 2 \times 2$ 的小体素合并为 1 个大体素时，传统池化会丢失 87.5% 的空间位置信息。

- **逻辑**：我们计算 8 个小体素中心相对于大体素中心的位移 $\Delta p_{down}$。
- **演化聚合**：利用 RLB 模块，让这 8 个特征沿着位移场向中心"汇聚"。
- **效果**：下采样后的特征不仅包含了语义，还隐含了这 8 个点原本构成的局部表面曲率和法线动量。

### 2. 索引精准映射 (Index-based Inverse Mapping)

LV-Net 并不使用反卷积进行盲目插值。

- **机制**：利用编码器阶段生成的 `indice_key`，通过 `spconv.SparseInverseConv3d` 将特征 100% 准确地放回它原始的体素坐标中。
- **优势**：保证了 **"位置 (Where)"** 的绝对对齐，消除了传统上采样带来的坐标漂移。

### 3. 解码器几何对焦 (Liquid Focusing)

即便位置找回了，由于经过了深层下采样，特征值在局部往往是"模糊"且"块状"的（同一个 2×2×2 块的特征可能完全相同）。

- **对焦操作**：解码器从"几何元数据栈"中弹出该层原始的亚体素偏移 $\Delta p_{original}$。
- **二次演化**：以 $\Delta p_{original}$ 为驱动，对融合后的特征进行精修。
- **物理意义**：这相当于根据物体的"原始轮廓矢量"对特征进行了一次 **去马赛克（De-blurring）** 处理，重新拉回边缘锐度。

### 4. 几何元数据栈管理 (Metadata Stack)

为了实现这一过程，网络维护了一个轻量级的栈结构：

- **Encoder**：每一层下采样前，将 `(offsets, indices)` 压入栈。
- **Decoder**：对应层级进行 Skip-connection 后，从栈中弹出数据进行液态对齐。

<iframe src="/实验/LNN点云识别设计-跨尺度演化" width="100%" height="200" style="border:none;border-radius:12px;overflow:hidden;" scrolling="no"></iframe>

## LV-Net：亚体素连续动力学全量数学规范

LV-Net 的本质是利用空间偏移量 $\Delta p$ 驱动的闭式连续时间神经网络 (CfC)。以下是系统从点云输入到特征输出的完整数学流。

### 1. 输入增强与特征初始化 (VFE Stage)

对于体素 $j$ 内的点 $i$，输入属性为 $x_i$（如强度 $r$），空间坐标为 $p_i$：

**1.1 亚体素偏移量定义**

- 均值偏移：$\Delta p_{i, mean} = p_i - \frac{1}{n} \sum_{k=1}^n p_k$
- 几何偏移：$\Delta p_{i, geo} = p_i - \text{Center}(\text{Voxel}_j)$

**1.2 初始语义编码**

$$h_{init, i} = \text{MLP}([x_i \oplus \Delta p_{i, mean} \oplus \Delta p_{i, geo}])$$

通过均值聚合得到体素底色：

$$F_{voxel, j} = \text{Mean}(\{h_{init, i} \mid i \in \text{Voxel}_j\})$$

### 2. 空间演化动力学 (RLB Engine)

在骨干网络中，利用 $\Delta p_{geo}$ 驱动特征演化。

**2.1 秩-k 空间驱动映射 (Rank-k Driver)**

将 3D 位移投影至 $k$ 个独立的演化轴 $\mathbf{u}_k$，并由通道权重 $\mathbf{v}_k$ 调制：

$$t_i = \sigma \left( \sum_{m=1}^k \langle \Delta p_{i, geo}, \mathbf{u}_m \rangle \cdot \mathbf{v}_m \right), \quad t_i \in (0, 1)^C$$

**2.2 CfC 空间演化方程**

特征随位移的非线性演化轨迹：

$$h_{evolve, i} = \underbrace{h_{init, i} \cdot \mathbf{W}_1}_{\text{语义基准}} \odot (1 - t_i) + \underbrace{\tanh(h_{init, i} \cdot \mathbf{W}_2)}_{\text{几何畸变}} \odot t_i$$

### 3. 跨尺度状态迁移 (Scaling Logic)

**3.1 下采样聚合 (Downsampling)**

当分辨率从 $L$ 变为 $L+1$ 时，大体素特征由 8 个小体素特征演化而来：

$$\Delta p_{down} = \text{Pos}_{small} - \text{Pos}_{large\_center}$$

$$F_{L+1} = \text{ScatterMean}(\text{CfC}(F_L, \Delta p_{down}))$$

**3.2 解码器对焦 (Decoder Focusing)**

上采样后的模糊特征 $F_{up}$ 利用原始偏移量进行"重聚焦"：

$$F_{refined} = \text{RLB}(F_{up} \oplus F_{skip}, \Delta p_{original})$$

### 4. 优化目标与约束 (Optimization)

**4.1 几何一致性损失（可选）**

为了确保 LNN 学习到真实的物理形状，可以增加局部平滑约束：

$$\mathcal{L}_{geo} = \sum_{i, j \in \mathcal{N}} \|t_i - t_j\|_2^2$$

含义：空间邻近的点应当具有相似的演化步长。

**4.2 零增益残差 (Zero-gamma)**

$$F_{layer\_out} = F_{conv} + \alpha \cdot F_{liquid}, \quad \alpha \to 0 \text{ at start}$$

<iframe src="/实验/LNN点云识别设计-数学引擎" width="100%" height="200" style="border:none;border-radius:12px;overflow:hidden;" scrolling="no"></iframe>

## LV-Net 训练技巧与工程优化指南

本部分旨在解决 LV-Net 在实际训练过程中可能遇到的稳定性与收敛性问题。

### 1. 学习率调度 (Learning Rate Strategy)

液态模块（RLB）中的参数 $\mathbf{u}, \mathbf{v}$ 与卷积层的权重具有不同的梯度尺度。

- **分采策略**：建议为 RLB 分支设置独立的基础学习率。通常 RLB 的参数对梯度较为敏感，建议初始学习率设为卷积层的 0.1x ~ 0.5x。
- **线性热身 (Warm-up)**：配合 Zero-gamma 初始化，建议前 10 个 Epoch 保持 $\alpha=0$，让网络先学习稳定的空间体素分布。

### 2. 几何增强一致性 (Geometric Augmentation Consistency)

点云训练中常用的数据增强（如全局旋转、缩放）会直接改变偏移量 $\Delta p$。

- **坐标同步更新**：在执行 Rotate 或 Scale 变换后，必须同步更新传给 VFE 和 RLB 的 offsets。
- **归一化建议**：将 $\Delta p$ 限制在 $[-0.5, 0.5]$ 的体素网格相对空间内，这能显著增强模型对不同体素分辨率的泛化能力。

### 3. 辅助损失函数：几何平滑约束 (Geometric Smoothness)

为了引导 LNN 学习到真实的几何流场，可以引入一个轻量级的辅助 Loss：

$$\mathcal{L}_{smooth} = \sum_{j} \sum_{i \in \text{Voxel}_j} \|t_i - \text{mean}(t_j)\|^2$$

- **目的**：鼓励同一个体素内部的演化门控 $t$ 具有一定的空间连续性，防止产生高频噪声。

### 4. 显存优化：延迟梯度 (Gradient Checkpointing)

由于我们需要在"几何元数据栈"中存储多层偏移量，显存占用会随着网络深度增加。

- **策略**：在 Stage 1 和 Stage 2 这种点数极多的层，如果显存告急，可以开启 PyTorch 的 `checkpoint` 功能，用计算换取空间。

### 5. 推理加速：算子融合 (Op Fusion)

- **部署建议**：在导出 TensorRT 或部署到 Orin 时，将 `(Δp · u) · v` 这个秩-1 投影逻辑编写为单一的 CUDA Kernel。
- **效率提升**：这能减少中间张量的访存开销，使 LV-Net 的推理速度几乎逼近纯卷积网络。

<iframe src="/实验/LNN点云识别设计-训练演变" width="100%" height="200" style="border:none;border-radius:12px;overflow:hidden;" scrolling="no"></iframe>
