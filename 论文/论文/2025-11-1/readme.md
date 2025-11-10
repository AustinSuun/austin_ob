---
Date: 2025-11-03T15:46:00
作者:
  - Austin Suun
tags:
  - readme
链接:
---

> [!NOTE] 简要介绍
> 


"settings": {

"comment": "设置默认python解释器",

"python.pythonPath": "/usr/local/bin/python"

}

# LSTM 论文中时序融合相关
- Mppnet: Multi-frame feature intertwining with proxy points for 3 d temporal object detection.
- Offboard 3d object detection from point cloud sequences.
- Lidar-based online 3 d video object detection with graph-based message passing and spatiotemporal transformer attention.~~

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





# 恶劣天气处理的代表方法
好——下面把**“纯点云（LiDAR-only）在恶劣天气下的研究现状”**整理成一张可直接上手的速览：关键数据集/方法、常用思路、代表性论文 & 推荐基线与未来方向。尽量把最重要的结论配上来源，方便你后续查阅和复现。

一句话总结

恶劣天气（雾、雨、雪、路面飞溅等）主要通过两条路线被处理：（A）构建/模拟恶劣天气数据并做数据增强 / 域自适应，和 （B）在输入端做点云去噪 / 可靠性估计，或在模型端做多模态/多时序融合以提高鲁棒性。代表性数据集与方法近几年增长很快。


---

重要数据集 / Benchmark（你先关心这些）

STF / SemanticSTF：实际恶劣天气下的 LiDAR 数据集，SemanticSTF 提供了逐点语义标注，便于研究恶劣天气下的分割与检测鲁棒性与域泛化。

VoD-Fog / VoD 扩展 (Fog simulation)：将现有真实点云用物理/统计方法模拟不同雾浓度，常用于评测雾天检测。

Weather-KITTI / Weather-NuScenes（合成/标注）：近期工作提出的大规模“恶劣天气”仿真数据集（rain/fog/snow）以补足真实数据不足的问题。TripleMixer 等工作同时发布了这些数据作为去噪/鲁棒性研究用。



---

代表性方法与思路（按类别）

1. 物理/统计模拟 + 数据增强

通过对晴天点云施加“雾/雪/雨”的物理模拟（按激光衰减、反射概率、虚假回波等），把清晰数据变成“恶劣天气”数据用于训练/测试（常见工作：雾模拟 ICCV 2021，雪模拟 CVPR 2022）。这是目前最常用的做法，因为真实标注的恶劣天气数据昂贵且稀缺。



2. 点云去噪 / 预处理（denoising）

在输入端先做点云去噪 / 零散点过滤 / 强度修正，再向下游检测器输入。最近出现的模型（如 TripleMixer）专门针对恶劣天气噪声做点云去噪并能提升下游任务表现。



3. 域自适应 / 域泛化（从晴天到恶劣天气）

用自适应学习（unsupervised domain adaptation）或域泛化方法，使在晴天训练的模型在恶劣天气上也稳健（SemanticSTF 等工作有相关研究设置）。



4. 多传感器融合作为对策（虽然你关注纯点云，但这是重要对比）

将 LiDAR 与雷达（4 D radar）融合或者与多帧融合可以显著提升恶劣天气下鲁棒性；有工作报告雷达在雨/雾下更稳健并提出 LiDAR+4 D Radar 的融合策略（CVPR 2024 等）。即便研究纯点云，了解这些 Fusion 基线很有价值。



5. 任务/评价侧改进

对点云检测器的损失、置信度估计与 NMS 策略做修改，使之对因噪声引入的虚假点/虚假检测更鲁棒；以及多帧时间一致性利用（4 D/temporal）来抵抗瞬时噪声。





---

代表性、值得阅读的论文（入门→深入）

Fog Simulation on Real LiDAR Point Clouds for 3 D Object Detection — Hahner et al., ICCV 2021（雾模拟与基准）. 

LiDAR snowfall simulation for robust 3 D object detection — Hahner et al., CVPR 2022（雪模拟机制与实证）. 

3 D Semantic Segmentation in the Wild / SemanticSTF — 数据集与在恶劣天气下分割/泛化的研究（CVPR/ArXiv 2023）。

TripleMixer: 3 D Point Cloud Denoising for Adverse Weather — 提出 Weather-KITTI / Weather-NuScenes 数据集与去噪模型（arXiv 2024/2025 release）。适合做去噪 + 下游检测实验。

Towards Robust 3 D Object Detection with LiDAR and 4 D Radar（CVPR 2024）— 多传感器融合以提升天气鲁棒性（对比意义强）。


（我也找到一个收集该方向论文的 Paper-list repo，方便扫最新工作。）


---

推荐的基线实验（如果你要做课题/复现）

1. 基线 A（模拟数据）：用 Hahner 的雾/雪模拟方法把 KITTI/nuScenes 做多档位天气仿真，训练/测试常见 3 D 检测器（PointPillars、CenterPoint、PV-RCNN），看性能下降曲线。


2. 基线 B（去噪前处理 + 下游）：在输入端加入一个去噪模块（如 TripleMixer）→ 再用同样检测器，比较提升。


3. 基线 C（域自适应）：晴天训练，未标注的恶劣天气数据做 UDA（自监督/对抗等），评估域适应效果。


4. 对比基线（多模态）：如果可能，做 LiDAR vs LiDAR+Radar 的对比（说明纯点云的上限和多模态的提升）。




---

常见挑战与未来方向（可作为论文点）

真实数据稀缺且标注困难 → 需要更真实、更可控的模拟方法或合成-to-real 框架。

噪声类型复杂（雨滴回波 / 路面飞溅 / 雪花群）→ 单一去噪方法难以覆盖所有情况：可能需条件化或可解释模块（例如按天气类型的去噪器）。

鲁棒性评估缺乏统一协议 → 需要标准化的多档位（轻/中/重）天气评价指标与打开源基准（Weather-KITTI/Weather-NuScenes、SemanticSTF 是朝这个方向的努力）。

实时性 vs 精度的权衡：去噪/仿真/融合方法要满足车规级延迟约束。

跨传感器/多模态协同：即便目标是纯点云，也应把多模态作为上限参考或用于联合训练以提高泛化。



---

如果你想继续，我可以帮你做的事（选一项或多项）

给你列出可复现的实验流水线（从数据准备、仿真脚本、训练/评测指标到代码仓推荐）。

帮你把 SemanticSTF / VoD-Fog / Weather-KITTI 的下载 / 使用文档、示例脚本整理成实验手册。

给你写一个简单的点云雾/雪模拟脚本（可直接作用于 KITTI/nuScenes 点云） 的参考实现。

扫一遍 2023–2025 年的最新论文并按“仿真 / 去噪 / 融合 / 域适应 / benchmark”分门别类给你一份阅读清单与实现优先级。


告诉我你优先想做哪项，我立刻给出详细步骤（或直接给脚本/实验计划）。

