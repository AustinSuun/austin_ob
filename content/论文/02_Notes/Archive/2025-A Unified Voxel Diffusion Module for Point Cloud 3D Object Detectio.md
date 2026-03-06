---
Date: 2025-11-25T22:03:00
作者:
  - Austin Suun
tags:
  - 3D目标检测
链接: https://arxiv.org/html/2508.16069v2
---

> [!NOTE] 简要介绍
> 性能有提升，主要贡献是体素扩散模块的设计


UVD
**针对问题**

Transformer 和 SSM 的方法处理数据时，不能利用空间扩散的能力，影响了检测精度

**解决方法**
提出 VDM ，在输入到 Transformer 和 SSM 之前，对体素进行拓展。效果如下

![image.png](https://cdn.jsdelivr.net/gh/AustinSuun/image/img/20251126102927944.png)

该文进一步细分了体素大小，同时使用体素扩散，增加了体素的数量

关键洞察，前景体素的数量虽然增多了，但是占比却减少了；即不能只拓展体素，还要去除无用体素，增加前景点的占比，增强信息密度

# 性能对比LION

![image.png](https://cdn.jsdelivr.net/gh/AustinSuun/image/img/20251125221150137.png)


