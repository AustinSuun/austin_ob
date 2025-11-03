---
Date:
作者:
  - Austin Suun
tags:
  - readme
链接:
---

> [!NOTE] 简要介绍
> 


# 时序融合相关的论文

简短回答：有。在纯点云（LiDAR）时序融合做 3 D 目标检测的文献里，确实存在把“递增式隐状态（incremental hidden state）”／循环记忆（RNN/LSTM/GRU/状态器件）作为时间融合机制的工作 —— 这是一个常见且自然的思路。下面把代表性论文、思想、优缺点和实践建议给你汇总起来，便于你选基线或设计新方法。


---

代表性论文（读这些能快速上手）

1. An LSTM Approach to Temporal 3 D Object Detection in LiDAR Point Clouds — ECCV 2020（Huang 等）。
用 sparse-conv 提取每帧特征，然后把特征和上一帧的 LSTM 隐状态一起输入，输出当前帧检测并传递新的隐状态。说明了“把隐状态从帧到帧传递/累积”的基本做法与效果。


2. MSF: Motion-Guided Sequential Fusion for Efficient 3 D Object Detection — CVPR 2023（He 等）。
提出一种序列融合机制（sequential fusion），利用运动引导（motion）来选择/变换历史信息用于当前帧，属于增量式/序列式融合的高效实现。


3. Late-to-Early Temporal Fusion for LiDAR 3 D Object Detection — arXiv 2023（He 等）。
提出“late→early”的递归特征融合：先在较高层（late）融合得到时序 embedding，再以递归方式注入到检测器的早期层，保持逐帧增量更新。适合希望把时序信息注入 backbone 早期层的场景。


4. 基于 GRU / Ada-GRU 的方法与工业/期刊式实现（多篇，含 2023 年期刊/会议文章），例如提出用 GRU 逐帧传递隐藏特征并联合回归的工作。此类工作通常把 GRU 放在 backbone 与检测头之间。


5. State-space / 线性递归方法在近年得到关注（2024–2025）：有工作尝试用 state-space / 线性 RNN（或 SSM）学习长程时序表示以替代传统 RNN/Transformer，同时兼顾效率（例如 2025 的 DySS 等工作把 state-space 学习用于视频/多模态时序建模并扩展到 3 D 场景）。这些方法在处理长序列、低延迟增量更新方面有潜力。




---

这些方法的核心思路（通用模式）

每帧用一个点云 backbone（sparse conv / point-pillar / voxelnet / transformer encoder）抽取空间特征。

通过递增式隐状态（LSTM/GRU/线性 RNN / SSM）把前帧的压缩时序表示与当前帧特征结合，输出并用于检测头回归 box/类别/速度。

隐状态只保留压缩信息（小维度），因此是计算与内存友好的“在线”增量融合方式——适合实时系统。相关实现见 ECCV 2020、MSF、Late-to-Early 等。



---

优缺点比较（RNN/LSTM/GRU / SSM / Transformer）

RNN/LSTM/GRU（递增式隐状态）
优点：在线/增量友好、低延迟、内存占用小，容易在已有检测器上接入（plug-in）。
缺点：长时依赖可能衰减（梯度 / 信息遗失），并且对非平稳运动或快速场景变化的鲁棒性有限。

State-Space Models（SSM / 线性递归）
优点：最近工作显示对长序列更稳健且能在低复杂度下表现好（适合长时程）；可做在线增量更新。
缺点：实现/调参比传统 RNN 复杂一些，文献与开源实现较新。

Transformer / Attention-based
优点：能建模长程全局依赖，表示能力强。
缺点：计算/内存昂贵，在线增量实现需要特殊设计（滑动窗口、匿踪缓存等）。



---

实践建议（选基线 + 实现要点）

1. Baseline（简单可行）：先用 ECCV 2020 的 LSTM 思路做基线：

Backbone：sparse conv 或 voxel encoder（同单帧检测器）；

在 backbone-to-head 之间加入一个 LSTM/GRU，输入为 frame feature（全局池化后的压缩向量或 ROI/anchor-level embedding），隐状态维度可从 256、512 试起。



2. 效率/选择性融合：如果担心把全部历史信息都带入，可参考 MSF（motion-guided）：使用运动场景引导只融合与当前相关的历史特征（节省计算，减少噪声）。


3. 把时序信息注入早期层：若想改善形状/点稀疏处的表示，参考 Late-to-Early 的思想，把从上层得到的时序 embedding 递归注入 backbone 的早层（提高静态/遮挡物体的形状恢复）。


4. 尝试 SSM / LION / DySS：当需要长序列（>几十帧）或对延迟敏感时，尝试 state-space 风格方法（近期 workshop/papers 有把 SSM 应用于视频/多模态，并延伸到 3 D）。这条路可能带来性能与效率的平衡。


5. 训练细节：联合训练检测与时序模块；loss 在检测 loss 的同时加对隐状态预测（如 future flow / velocity 回归）会帮助稳定训练。使用 track/velocity ground truth（Waymo/nuScenes 都有）来监督时序输出更好。

---

给你的快速阅读 / 实验清单（按优先级）

1. 阅读 ECCV 2020 的 LSTM 论文（基础）。


2. 看 CVPR 2023 MSF（实用且高效的序列融合实现）。


3. 阅读 Late-to-Early（如何把时序信息注入 backbone 早期层）。


4. 若想做前沿尝试，查阅 2024–2025 年关于 state-space / LION / DySS 的工作（SSM 在长序列/在线场景的优势）。

---

如果你想，我可以立刻做两件事（任选其一）：

给你把 ECCV 2020 LSTM 方法的伪代码 + 在 OpenPCDet / PyTorch 框架中如何插入隐状态模块的具体实现步骤写出来；或者

帮你把 MSF / Late-to-Early 的关键模块（feature-fusion block）画成流程图并列出训练超参建议。


你选哪个？或者直接把你现在用的单帧检测器/代码库发来（例如 OpenPCDet 的配置），我就按你的代码做具体改法。