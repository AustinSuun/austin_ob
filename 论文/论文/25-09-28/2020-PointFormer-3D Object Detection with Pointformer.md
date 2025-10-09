---
Date: 2025-10-02T18:48:00
作者:
  - Austin Suun
tags:
  - PointNet
  - Transformer
  - 骨干网络
链接: https://arxiv.org/abs/2012.11409
---

> [!NOTE] 简要介绍
> 结合 PointNet++ 层级特征提取 + Transformer，全局上下文建模强，属于 anchor-free 思路。

设计了一种专为点云设计的 Transformer 骨干网络，以有效学习特征。

具体来说，采用==局部 Transformer 模块==建模局部区域内点的交互，学习基于上下文的对象级区域特征。

设计了==全局 Transformer== 以学习场景级的上下文感知表示

为了进一步捕捉多尺度表示间的依赖关系，提出==局部-全局 Transformer==，将局部特征与高分辨率的全局特征融合


**本文贡献**
- 提出了纯 Transformer 模型 Pointformer，作为 3 D 点云的高效特征学习骨干
- 展示了 Pointformer 可以直接作为点云领域最先进的 3 D 目标检测器的直接代替骨干网络
- Pointformer 作为骨干网络，在多个基准测试展现了显著的性能提升

> 只是一个骨干网络





# KITTI

