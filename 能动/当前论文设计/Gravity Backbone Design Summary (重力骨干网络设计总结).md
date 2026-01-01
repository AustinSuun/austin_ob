

  

这是一个结合了**物理重力场理论**与**Mamba 状态空间模型**的3D点云骨干网络设计。其核心思想是利用点云特征的响应强度模拟“质量”，通过重力场中的相互作用（吸引、汇聚、流线）来指导点云的动态序列化、下采样和拓展，从而克服传统方法（如单纯的空间窗口或 Hilbert 曲线）对点云语义结构感知的不足。

  

## 1. 核心创新点 (Core Innovations)

  

1. **重力流线序列化 (Gravity Streamline Serialization)**:

* **打破僵硬顺序**: 摒弃了仅依赖空间坐标的静态排序。提出“特征质量决定重要性”的观点，根据特征响应强度构建重力场。

* **语义优先机制**: 让 Mamba 优先处理高响应（高语义价值）的关键点（如物体核心），随后处理背景点，使状态空间模型的记忆机制能更有效地捕捉关键结构。

* **流域结构**: 将点云划分为若干个以高响应点为中心的“流域”，在流域内部保持语义连贯性，在流域间保持空间连续性。

  

2. **重力吸附归约 (Gravity Adsorption Merging)**:

* **物理驱动下采样**: 替代传统的 FPS (Farthest Point Sampling) 或 Grid Pooling。利用重力吸附原理，让低响应点（背景/噪声）向高响应点（物体中心）漂移并融合。

* **动态特征聚合**: 通过加权质心计算，在下采样过程中自然地实现了特征的去噪和增强，保留了物体的核心骨架。

  

3. **射线主导拓展 (Ray Dominant Expansion - GGAAC)**:

* **几何与物理的互补**: 结合了激光雷达的射线物理特性（Ray Dominant）和点云的局部几何分布（Geometric Assistant）。

* **柱状生长**: 模拟激光穿透或物体占据，沿射线方向生成柱状点云，增强了稀疏点云的体积表达能力。

  

---

  

## 2. 主要模块设计与公式 (Key Modules & Formulas)

  

### 2.1 重力流线映射 (Gravity Streamline Mapping)

  

该模块负责将无序的稀疏点云转换为有序的序列，供 Mamba 处理。

  

* **质量定义 (Mass Definition)**:

每个体素的特征响应均值被定义为其“质量”。

$$ M_i = \text{mean}(|F_i|) $$

其中 $F_i$ 是第 $i$ 个点的特征向量。

  

* **流域划分 (Basin Division)**:

* **汇聚中心 (Convergence Centers)**: 选取局部邻域内质量最大的点，且质量需大于阈值 $\tau$。

$$ C = \{ p_i \mid M_i = \max_{j \in \mathcal{N}(i)}(M_j) \text{ and } M_i > \tau \} $$

* **势能分数 (Potential Score)**: 对于非中心点 $p_j$，计算其归属于各个中心 $c_k$ 的势能分数，选择分数最高的作为其归属中心。

$$ S_{jk} = \frac{M_{c_k}}{\|p_j - p_{c_k}\|^2 + \epsilon} $$

*物理直觉*: 质量越大（语义越强）、距离越近，吸引力越大。

  

* **序列排序 (Sorting Strategy)**:

1. **流域间 (Inter-Basin)**: 按照中心点的空间坐标 (Z-Y-X) 排序，保证宏观上的空间连续性。

2. **流域内 (Intra-Basin)**: 按照势能分数 $S$ **降序**排列。

$$ \text{Order}: \text{Center} \rightarrow \text{High Potential} \rightarrow \text{Low Potential} $$

  

### 2.2 重力吸附归约 (Gravity Adsorption Merging 3D)

  

该模块作为下采样层，通过模拟重力吸引实现点的聚合。

  

* **重力中心选择 (Gravity Center Selection)**:

选择当前 Batch 中响应强度 (Mass) 最高的 Top-K 个点作为吸附中心。

  

* **加权质心计算 (Weighted Centroid)**:

计算受到吸引的点的目标位置 $P_{target}$。权重由中心点的质量决定（仅在半径 $r$ 内有效）。

$$ P_{target, i} = \frac{\sum_{k \in \text{Centers}} \mathbb{I}(d_{ik} < r) \cdot M_k \cdot P_k}{\sum_{k \in \text{Centers}} \mathbb{I}(d_{ik} < r) \cdot M_k + \epsilon} $$

  

* **位置更新 (Snapping)**:

引入可学习的吸附系数 $\alpha = \sigma(\text{gravity\_coeff})$，控制点向目标质心移动的程度。

$$ P_{new, i} = (1 - \alpha) P_{i} + \alpha P_{target, i} $$

* $\alpha \approx 0$: 保持原位（类似普通下采样）。

* $\alpha \approx 1$: 完全吸附到重力中心（强聚类）。

  

### 2.3 射线主导拓展 (GGAAC / Ray Dominant Expander)

  

该模块作为上采样或特征增强层，用于在稀疏区域生成新的点。

  

* **方向计算**:

1. **射线向量**: 传感器原点 $O$ 指向点 $P$ 的方向。

$$ \vec{v}_{ray} = \text{Normalize}(P - O) $$

2. **几何向量**: 指向局部邻域的重心 $C_{local}$。

$$ \vec{v}_{geo} = \text{Normalize}(C_{local} - P) $$

3. **最终拓展方向**: 几何向量作为修正项，需与射线方向对齐（避免反向抵消）。

$$ \vec{v}_{final} = \text{Normalize}(\vec{v}_{ray} + \beta \cdot \text{sign}(\vec{v}_{ray} \cdot \vec{v}_{geo}) \cdot \vec{v}_{geo}) $$

  

* **柱状生成**:

沿最终方向 $\vec{v}_{final}$，以步长 $\delta$ 生成 $K$ 层新点，并添加随机噪声 $\epsilon$ 和雾状横向扰动。

$$ P_{new}^{(k)} = P + k \cdot \delta \cdot \vec{v}_{final} + \mathcal{N}(0, \sigma^2) $$

  

---

  

## 3. 网络架构 (Network Architecture: Gravity_backbone5)

  

整体采用 U-Net 风格的对称编码-解码结构：

  

1. **Encoder (Stage 0-1)**:

* 由 `GravityBlock` (处理特征) 和 `GravityAdsorptionMerging3D` (下采样) 交替组成。

* **GravityBlock** 内部包含 `GravityStreamlineMapping` 将点云序列化，送入 `GravityMambaBlock` 提取特征，最后还原回稀疏张量。

2. **Bottleneck**:

* 使用 `Transformer` 处理最深层的压缩特征，利用全局注意力机制捕捉长程依赖。

3. **Decoder**:

* 由 `GravityBlock` 和 `PatchExpanding3D` (上采样) 组成。

* 使用 `skip connection` 融合 Encoder 的特征。

  

这种设计确保了网络既能捕捉精细的局部几何结构（通过重力场和射线拓展），又能通过 Mamba 和 Transformer 理解全局的语义上下文。