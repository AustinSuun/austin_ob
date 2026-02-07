---
Date: 2025-10-02T21:15:00
作者:
  - Austin Suun
tags:
  - 3D目标检测
  - anchor-free
  - Transformer
链接: https://arxiv.org/abs/2104.00678
---

> [!NOTE] 简要介绍
> - 在 3D 检测里非常有代表性，完全抛弃 anchor/proposal，直接用 Transformer 做中心点预测和 box 回归。
>     
> - 是 anchor-free + Transformer 的里程碑方法。

**纯粹基于点的方法**
骨干网络可替换，这里使用 pointnet++

> 感觉是直接加了一个 Transformer 块（很像 pointTr 中的），直接预测除了框的参数





# Scan Net V 2
![image.png](https://cdn.jsdelivr.net/gh/AustinSuun/image/img/20251003130640887.png)



# RGB-D
![image.png](https://cdn.jsdelivr.net/gh/AustinSuun/image/img/20251003130705320.png)
