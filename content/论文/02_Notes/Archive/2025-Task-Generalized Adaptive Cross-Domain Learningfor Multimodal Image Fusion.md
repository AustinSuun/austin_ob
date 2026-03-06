---
Date: 2025-11-26T14:16:00
作者:
  - Austin Suun
tags:
  - IEEE
链接: https://arxiv.org/abs/2508.15505
---

> [!NOTE] 简要介绍
> 

Task-Generalized Adaptive Cross-Domain Learningfor Multimodal Image Fusion

本文是介绍多图像跨域融合的，这里借鉴其中的小波变换结合 Mamba 构造融合网络的方式

**针对问题**
图像融合的多模态不对齐，高频细节丢失等

**核心贡献**
- 自适应近似小波变换 (AdaWAT)
- 多模态融合的 Mamba 块

把小波变换固定的核参数，变成根据数据自适应学习的核参数
恢复时，使用拼接通道+转置卷积+为每个通道分配权重

