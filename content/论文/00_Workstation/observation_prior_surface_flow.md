---
日期: 2026-06-05
作者:
  - Austin
draft: false
---
## 阅读路线

本文档按“动机 → 当前实现 → 目标方法 → 实验与收尾”的顺序组织。

1. **问题与动机**
   `问题背景` 和 `核心动机` 说明为什么 RoI surface flow 不能只当作普通点云补全，也解释 observed regions 与 weakly observed / unobserved regions 为什么需要分开处理。

2. **当前实现与条件输入**
   `当前实现`、`当前条件信息`、`分支 A`、`分支 B` 和 `支撑点上限` 描述已经接入 PG-RCNN 的 surface-flow 主路径、RoI 全局条件、点级 observed-support query，以及 `MAX_POINTS_PER_ROI` 带来的信息压缩问题。

3. **目标方法设计**
   `当前方法的低成本条件注入设计` 和 `方法组件：Class Prior 和 Observation-Prior Gate` 是方法主线。这里定义 RoI-level modulation、动态 observed-support、observation/prior two-branch velocity、point-wise gate，以及 `psi` 记号对应的 additive conditioning。

4. **实现边界与训练目标**
   `当前实现边界`、`Flow 过程中的方法设计点`、`Clean Endpoint Target Parameterization` 和 `Losses` 用来区分“当前已经实现的 gate/statistics/class prior 路径”和“长期备选的 endpoint prediction、额外 loss”。当前主线仍然是 flow matching 的 velocity prediction。

5. **实验、命名与收尾状态**
   `Evaluation 和 Ablation 计划`、`方法命名`、`贡献表述` 和 `当前状态和剩余工作` 用来承接论文写作、框架图、消融排程和下一步执行。

## 1. 问题背景

LiDAR 3D 目标检测面对的是稀疏、视角相关的点云观测。对于一个 proposal RoI 来说，RoI 内已有点通常只覆盖物体的可见表面，不能完整描述物体的真实空间范围。距离较远、遮挡、自遮挡都会让 RoI 内几何信息更加不完整。如果 refinement head 直接使用这些稀疏点，得到的几何信号本身就是不完整的。

点云补全可以增强 RoI 内几何信息，但检测场景中的补全不等同于普通点云补全。普通点云补全主要目标是从 partial point cloud 重建一个合理完整形状；检测中的 RoI-level completion 还必须满足三个条件：

- 生成点要和已有 LiDAR 观测保持一致；
- 生成点要尊重 proposal / RoI 的 canonical 坐标框架；
- 生成点最终要服务于分类和 box refinement，而不是只追求独立的补全质量。

因此，我们更适合把补全看成一个 proposal-conditioned、task-coupled 的中间模块，而不是检测前的独立预处理。

扩散模型和 score-based 点生成方法有很强的生成建模能力，但作为检测网络中间模块时存在实际不匹配：标准 diffusion 训练时通常随机采样一个 timestep，而后续检测 head 需要在同一次 forward 里拿到最终补全点；推理时多步 denoising 也会带来额外计算。Flow matching 的优势是保留从噪声到表面的连续生成建模，同时可以用少步可微 rollout 得到最终点，使检测 loss 能够反传到补全过程。

## 2. 核心动机：观测区域和弱观测区域不应该同等处理

RoI 内 partial points 实际上对应两类区域：

- **Observed regions**：已有稀疏 LiDAR 点支撑的区域。生成点在这些区域附近应该保持观测一致性，不能随意偏离真实测量表面。
- **Weakly observed / unobserved regions**：缺少直接点云支撑的区域。生成点在这些区域应该更多依赖 proposal 上下文、类别形状先验和学习到的物体几何。

很多补全方法会把 partial point cloud 作为一个整体条件输入，这对于普通形状补全是合理的。但在检测任务中，我们希望显式区分：

```text
已有观测区域：更偏向 refinement / consistency
弱观测区域：更偏向 completion / prior
```

因此，我们的方法可以描述为：

```text
observation-prior decoupled surface flow
```

也就是每个正在演化的表面点动态判断自己应该更依赖 sparse observation，还是更依赖 learned shape prior。

方法表述：

```text
虽然 partial-to-complete 点云网络已经展示了较强的补全能力，
但 RoI-level 3D 检测有不同需求：
可见表面应该根据稀疏 LiDAR 观测保持一致，
不可见或弱观测表面则应该从 proposal 和类别先验中推断。
因此，我们显式解耦 observation-guided surface refinement
和 prior-guided surface completion。
```

## 3. 当前实现

当前分支：

```text
feature/pgrcnn-jit-surface-flow
```

当前实现用 surface-flow 分支替换了旧的 PG-RCNN JiT point generator 路径：

```text
RoI proposals
    ↓
RoI grid pooling + Transformer tokens
    ↓
canonical RoI 坐标中的中心高斯初始点 z
    ↓
surface-flow velocity model
    ↓
few-step Euler rollout
    ↓
256 个 RoI-local generated surface points
    ↓
转换到 global xyz
    ↓
rebuilt_points → PG-RCNN SA modules → detection heads
```

flow 在 RoI canonical 坐标中运行：

```text
z ~ N(0, sigma^2 I), clipped to [-1, 1]^3
x_t = (1 - t) z + t x_1
v_target = x_1 - z
```

其中 `x_1` 来自 `bm_points` 表面目标点，并被重采样到：

```text
SURFACE_FLOW.NUM_POINTS = 256
```

训练时 flow 模块预测 velocity，并对有效 RoI 使用 MSE velocity loss。检测 forward 时执行少步 Euler rollout：

```text
x_0 = z

for k = 0 ... K-1:
    t_k = k / K
    x_{k+1} = x_k + (1 / K) * v_theta(x_k, t_k, condition)

x_hat = x_K
```

因为这个 rollout 是可微的，后续 detection loss 可以通过生成点反传到 flow 模块。

## 4. 当前条件信息和观测信号

为了让方法结构清楚，flow 网络前的条件信息可以先分成两条主线：

```text
分支 A：RoI 全局静态条件
    RoI grid tokens + class embedding + optional size prior
    ↓
    C_global
    ↓
    每个 flow step 加入 C_time(t_k)
    ↓
    C_mod^k
    ↓
    用于 JiT-style modulation

分支 B：点级动态观测支持条件
    current flow points x_i^k + sparse observed points P_obs
    ↓
    C_obs_i^k
    ↓
    注入每个 generated point token，并辅助 gate 判断观测可靠性
```

这两条分支的角色不同：

```text
RoI 全局静态条件:
    告诉 flow 当前 proposal 的整体上下文、类别先验，以及可选显式尺寸先验。
    每个 RoI 计算一次，rollout 中复用。
    当前代码中，尺寸主要通过 RoI geometry 和 canonical normalization 间接进入；显式 C_size 是设计/消融项。

Flow time:
    不是 RoI 级静态条件。
    每个 flow step 根据 t_k 单独计算 C_time(t_k)，再加到 C_global 上形成 C_mod^k。

类别先验:
    告诉模型当前 proposal 的类别。
    它是 RoI 级静态条件，属于 C_global，并通过 C_mod^k 进入 flow block，不等同于 gate。

点级动态观测支持条件:
    告诉每个生成点当前位置附近有没有原始稀疏点支撑。
    每个 flow step 随 x^k 重新计算。
```

当前 flow 模型已经用到的主要信息可以放入这两条线中：

```text
Flow point state:
    当前点状态 x_i^k
    slot embedding

RoI global branch:
    RoI grid pooling / Transformer 得到的 RoI token context
    roi_labels / predicted class embedding
    RoI size / canonical box scale

Flow-step branch:
    flow timestep embedding

Observed-support branch:
    RoI 内原始 sparse observed points
    multi-scale KNN observed-support features
```

### 4.1 RoI 全局静态条件

RoI 全局静态条件来自 proposal 级别信息。它不依赖每个生成点的当前位置，因此不需要每个 flow step 重新查询 RoI grid token。
当前设计也不再把 RoI token 强行 resample / 对齐到生成点数量。RoI token 只做 proposal-level pooling 后进入调制条件；点级 flow token 只由当前生成点、slot 和 observed support 组成。

```text
RoI grid tokens T_roi
    ↓
Pool + MLP
    ↓
C_roi

class c → C_cls
size s = log(l, w, h) → C_size   # 显式 size prior，可作为设计/消融项

C_global = C_roi + C_cls (+ C_size)
C_mod^k = C_global + C_time(t_k)
```

`C_mod^k` 更适合用于 JiT-style modulation：

```text
FlowBlock(H^k, C_mod^k)
```

`C_global` 提供的是“这个 RoI 整体是什么”的信息，例如 proposal 上下文、类别和尺寸。`C_time(t_k)` 提供当前 flow step 的时间信息。两者相加得到 `C_mod^k`，所以 `C_mod^k` 是 step-dependent modulation condition，不是纯静态条件。

当前 surface-flow 代码还没有单独的 `size_proj(log(l,w,h))` 接到 `C_mod`。RoI 尺寸已经通过 RoI grid geometry、canonical normalization / denormalization 等路径参与计算；若要把尺寸作为显式 prior condition，可在后续消融中加入 `C_size`。

### 4.2 点级动态观测支持条件

observed-support feature 是动态计算的。对每个当前生成点 `x_i^k`，模型会查询 RoI-local sparse observed points，并构造多尺度 KNN 统计：

```text
for K in {4, 8, 16}:
    min distance
    mean KNN distance
    relative vector to nearest observed point
    relative vector to local observed centroid
    local support density
```

这些统计量会通过 MLP 投影，然后加到 flow hidden representation 里。重要的是，这个 support signal 不是固定全局条件，而是随着当前 flow state 变化。

这里的 `local support density` 可以理解成点级的局部占据/观测支撑信息。它不是全局 occupancy map，而是对每个当前生成点 `x_t_i` 判断：

```text
当前点附近有没有 observed sparse points
邻域内 observed points 是否足够密
当前点所在局部区域是否被 LiDAR 观测支撑
```

在当前轻量实现中，它主要由 KNN 的有效邻居比例表示：

```text
support_density_i^K = valid_neighbors / K
```

如果 RoI 内 observed points 少于某个 K，例如只存在 5 个点而 K=16，则该尺度的 `support_density` 会小于 1。它表达的是“这个 query 点在该尺度下能找到多少观测支撑”。这个信号可以辅助 flow / gate 区分：

```text
局部观测支撑强:
    更适合贴合 observed surface

局部观测支撑弱:
    更可能需要依赖 class / proposal prior 补全
```

直观解释：

```text
靠近 observed points:
    更强调测量表面一致性

远离 observed points:
    更多依赖 RoI 上下文和学习到的形状先验
```

注意：observed support 当前从 `batch_dict['points']` 读取。后续如果某些 ablation 把 BMP target points 追加到 raw points 里，会导致 target 信息泄漏到条件分支。因此训练配置中应该保证这里读取的是原始稀疏 LiDAR 输入。

### 4.3 支撑点上限与密度信息丢失

当前配置：

```text
SURFACE_FLOW.OBSERVED_SUPPORT.MAX_POINTS_PER_ROI = 128
```

意思是每个 RoI 最多保留 128 个 sparse observed points 作为 KNN 查询支撑点。这个数量不是生成点数量；生成点数量由下面控制：

```text
SURFACE_FLOW.NUM_POINTS = 256
```

支撑点上限控制计算量：

```text
local support cost per RoI per step ≈ NUM_POINTS * MAX_POINTS_PER_ROI
```

对于近距离目标，RoI 内可能有很多点。我们仍然可以把 local support points 下采样到 128 个以控制每步 KNN 计算，但这会丢掉“这个物体本来观测很充分”的全局信息。为此，建议额外加入 RoI-level observation statistics。

这个问题需要单独强调：`MAX_POINTS_PER_ROI` 会让不同观测密度的 RoI 在进入 KNN support query 时看起来相似。例如：

```text
近处目标:
    原始 RoI 内有 500 个 observed points
    downsample 后仍然只保留 128 个 support points

远处目标:
    原始 RoI 内刚好有 128 个 observed points
    不需要 downsample，也保留 128 个 support points
```

如果网络只看到 fixed-size support set，那么这两个 RoI 都表现为“有 128 个支撑点”。它无法知道第一个 RoI 原本是非常密集观测，而第二个 RoI 只是普通或偏稀疏观测。也就是说，fixed-size local support 主要解决每个生成点的局部查询和计算效率，但会抹掉原始点云密度差异。

### 4.4 RoI-level observation statistics

因此，RoI-level observation statistics 必须在 downsample / cap 之前从原始 RoI 点中计算，用来恢复这类全局观测充分性信息。

推荐统计量：

```text
N_obs = RoI 内原始稀疏点数量
N_cap = SURFACE_FLOW.OBSERVED_SUPPORT.MAX_POINTS_PER_ROI
log_count_norm = log(1 + N_obs) / log(1 + N_cap)
density_norm = min(N_obs / N_cap, 1)
coverage_score = occupied canonical grid cells / total canonical grid cells
```

参数含义和计算方法：

```text
输入:
    P_obs_raw^r:
        第 r 个 RoI 内的原始 sparse observed points
        必须在 MAX_POINTS_PER_ROI downsample / cap 之前统计

    box_r = (x, y, z, l, w, h, yaw):
        第 r 个 RoI 的中心、尺寸和朝向

    G:
        canonical coverage grid size，默认可取 G = 4

    N_cap:
        local support cap，例如 MAX_POINTS_PER_ROI = 128
```

计算步骤：

```text
1. 将原始点转换到 RoI local 坐标
   p_local = R(-yaw) * (p_global - center)

2. 归一化到 canonical RoI 空间
   p_norm = p_local / (0.5 * [l, w, h])

3. 只保留 box 内 observed points
   inside = all(abs(p_norm) <= 1)

4. 统计原始观测点数
   N_obs = number of inside observed points

5. 计算归一化点数和 cap-relative density
   log_count_norm = log(1 + N_obs) / log(1 + N_cap)
   density_norm = min(N_obs / N_cap, 1)

6. 计算 coverage_score
   cell_index = floor((p_norm + 1) / 2 * G)
   cell_index = clamp(cell_index, 0, G - 1)
   N_occupied = number of unique occupied cells
   coverage_score = N_occupied / G^3
```

最终得到每个 RoI 一个统计向量：

```text
S_roi^r = [
    log_count_norm,
    density_norm,
    coverage_score
]
```

这些统计量是有意保持轻量的 hand-crafted descriptors。它们不是对 RoI 内 observed points 再跑一个 learned PointNet++ / Transformer encoder，而是用极低成本保留 proposal-level observation reliability，弥补 `MAX_POINTS_PER_ROI` cap 造成的原始观测密度信息丢失。

`coverage_score` 可以在 RoI-normalized `[-1, 1]^3` 空间里用很小的 grid 计算，比如 `4 x 4 x 4`：

```text
normalized observed points
    ↓
cell index = floor((p + 1) / 2 * grid_size)
    ↓
unique occupied cells
    ↓
coverage_score = num_occupied / grid_size^3
```

这样可以区分两种互补信息：

```text
fixed-size local support points:
    告诉每个生成点，它附近有没有 observed evidence

RoI-level observation statistics:
    告诉网络，整个 proposal 的观测是否充分
```

例如，一个近距离 Car 可能有几百个 observed points。我们可以为了效率只保留 128 个 local support points，同时用 `log_count_norm`、`density_norm`、`coverage_score` 保留它整体观测充分的信息。

注意这里有两个不同尺度的“占据/观测支撑”概念：

```text
point-level local support density:
    针对每个生成点 x_i^k
    描述该点附近局部邻域是否有 observed points 支撑
    每个 flow step 随 x^k 重新计算

RoI-level coverage_score:
    针对整个 proposal RoI
    描述 RoI canonical 空间中有多少网格被 observed points 覆盖
    每个 RoI 计算一次，作为 gate 的全局可靠性条件
```

这一部分已经作为可选静态 RoI-level 条件接入当前代码；只有在 `OBSERVATION_PRIOR_GATE.ROI_STATS_DIM: 3` 时启用：

```text
stats = [log_count_norm, density_norm, coverage_score]
```

### 4.5 Gate injection and ablation placement

默认接入位置是 `gate_input`。`stats` 不直接生成速度，也不单独决定 gate，而是先投影成 RoI 级观测充分性 embedding，再 broadcast 到该 RoI 的所有生成点，与每个点的 flow feature 和 observed-support feature 结合：

```text
stats → roi_obs_stats_proj(stats)

E_stats = roi_obs_stats_proj(stats)          # RoI-level, shape: B x C
E_stats → broadcast to all generated points  # shape: B x M x C

gate_input_i^k = F_i^k
               + observed_support_proj(C_obs_i^k)
               + E_stats

g_i^k = sigmoid(gate_head(gate_input_i^k))
```

加到 `gate_input` 的语义最清楚。因为 `stats` 描述的是“整个 RoI 的观测充分性”，而 gate 的职责正是判断每个生成点应该更依赖 observation branch 还是 prior branch。也就是说：

```text
RoI 整体观测充分:
    gate 更容易信任 observed-support information

RoI 整体观测稀疏:
    gate 更应该允许 prior branch 发挥作用
```

这里的 gate 仍然是逐点的。`stats` 是 RoI 级全局信息，但它会和每个点自己的状态 `F_i^k`、局部观测支持 `C_obs_i^k` 结合，所以最终得到的是：

```text
g_i^k:
    第 k 步中第 i 个生成点的 observation/prior mixing weight
```

也就是说，`stats` 提供“这个 RoI 整体是否观测充分”的背景，`F_i^k` 和 `C_obs_i^k` 决定“当前这个点附近是否观测可靠”。

`stats` 也可以作为消融加到 `C_mod^k`：

```text
C_mod^k = C_global + C_time(t_k) + roi_obs_stats_proj(stats)
```

但这不是主设计。它的解释会弱一些，因为 stats 会影响整个 flow block，而不是专门控制 observation / prior 的权衡。

因此建议实验顺序是：

```text
1. Surface flow + observed support
2. + observation-prior gate
3. + RoI-level observation stats into gate_input  # default method
4. ablation: stats into C_mod^k
5. ablation: stats into both gate_input and C_mod^k
```

当前代码已经通过 `OBSERVATION_PRIOR_GATE.ENABLED` 提供可选 gate，因此主路径应继续把 stats 接到 `gate_input`。把同样的 stats 接到 `C_mod^k` 仍然应作为消融项，因为它影响的是整个 flow block，而不是显式的 observation / prior 权衡。主方法可以写成：

```text
RoI-level observation statistics are injected into the observation-prior gate
to estimate the reliability of sparse observed support at the proposal level.
```

## 5. 当前方法的低成本条件注入设计

前面已经详细说明了两条条件分支。框架图中建议只保留更规整的符号流，避免把支撑点细节全部堆进主图。

### 5.1 模块顺序

每个生成点 `i` 的 flow token 由 point-level 信息组成：

```text
H_i^k = phi_x(x_i^k)
      + phi_slot(i)
      + phi_obs(C_obs_i^k)
```

RoI-level 条件不作为额外 token append 进去，也不对齐到生成点数量，而是调制 flow block：

```text
C_mod^k = phi_roi(Pool(T_roi))
        + phi_cls(c)
        + phi_size(log(l, w, h))
        + phi_t(t_k)

v^k = FlowBlock(H^k, C_mod^k)
```

其中：

```text
H_i^k:
    点级 token，来自当前生成点位置、slot 编码和动态观测支持。

C_mod^k:
    每个 step 的调制条件，由静态 C_global 和当前 C_time(t_k) 相加得到。
    如果启用显式 size prior，C_global 中还包含 C_size。

stats:
    RoI-level observation statistics。
    主方法中接入 gate_input；如果接入 C_mod^k，则作为消融项。
```

Euler 更新为：

```text
t_k = k / K
Delta t = 1 / K

v^k = v_theta(x^k, t_k, condition)
x^{k+1} = x^k + Delta t * v^k
```

最终补全表面点：

```text
P_comp = x^K
```

论文图可以总结成：

```text
RoI grid tokens → Pool + MLP → C_roi ┐
class label     → Class Emb. → C_cls ├→ C_global
box size         → Size MLP   → C_size┘
flow time t_k   → Time Emb.  → C_time(t_k)
C_global + C_time(t_k)       → C_mod^k
                                  │
                                  ▼
                         JiT-style modulation

x^k + P_obs → observed-support query → C_obs^k
x^k + slot + C_obs^k → flow tokens H^k

FlowBlock(H^k, C_mod^k) → v^k → x^{k+1}
```

我们主设计中暂时避免 point-to-RoI cross attention。cross-attention 版本可以让 current flow tokens 作为 query、RoI grid tokens 作为 key/value，但因为 `x^k` 每一步都变，flow tokens 也每一步都变，所以 cross-attention 需要每个 flow step 重新计算。低成本版本把 RoI context 作为 proposal-level modulation signal，同时保留 sparse points 的动态 observed-support query。

推荐图中标签：

```text
RoI Grid Tokens                  T_roi
RoI Context Token                C_roi
Class/Size Prior                 C_cls (+ optional C_size), part of C_mod
Global Condition                 C_global
Flow-time Condition              C_time(t_k)
JiT-style Modulation Condition   C_mod^k
Observed-support Descriptors     min distance / mean KNN distance / nearest offset / centroid offset / support density
Observed-support Embedding       C_obs_i^k
Flow Point Tokens                H_i^k
Velocity at step k               v^k
Completed Surface Points         P_comp = x^K
```

图里需要强调这种非对称计算：

```text
C_global:
    每个 RoI 计算一次，rollout 中复用

C_obs_i^k:
    每个 flow step 重算，因为它依赖当前点 x^k
```

## 6. 方法组件：Class Prior 和 Observation-Prior Gate

当前 observed-support injection 提供了点级观测支撑。目标方法中需要显式表达 observation / prior 的分工，因此采用 observation-prior two-branch velocity 和 point-wise gate：

```text
v_obs^k   = f_obs(H^k, C_obs^k, C_mod^k)
v_prior^k = f_prior(H^k, C_mod^k)
g^k       = sigmoid(f_gate(H^k, C_obs^k, C_mod^k))

v^k = g^k * v_obs^k + (1 - g^k) * v_prior^k
```

语义上：

- `v_obs`：observation-guided velocity，鼓励生成点在已有 sparse LiDAR 点附近保持表面一致性；
- `v_prior`：prior-guided velocity，鼓励弱观测区域根据 proposal / class / size 先验补全合理表面；
- `g`：dynamic gate，控制每个点更信任 observation 分支还是 prior 分支。

`v_obs` 和 `v_prior` 不是人工计算的几何向量，而是两个 learned velocity predictions，只是条件路径不同：

```text
v_obs^k:
    接收 current flow tokens 和 observed-support embedding

v_prior^k:
    接收 current flow tokens、RoI/time context 和 class prior
```

gate 是逐点标量：

```text
g_i in [0, 1]
```

高 `g_i` 表示该点更依赖 observation-guided velocity；低 `g_i` 表示该点更依赖 prior-guided velocity。这个 gate 应该是 point-wise 的，而不是 RoI-wise 的，因为同一个物体不同区域的观测支撑强度可能完全不同。

### 6.1 `psi` 记号和 additive conditioning

如果草图公式中写 `psi_obs`、`psi_prior` 或 `psi_stats`，这里的 `psi` 应理解为 learned projection adapter，不是特殊几何算子。它的作用是把不同来源的条件投影到和点级特征 `F_i^k` 相同的 channel 维度，然后才能用加法融合：

```text
psi_obs(C_obs_i^k)     -> observed-support embedding
psi_prior(C_mod^k)     -> prior/context embedding
psi_stats(S_roi)       -> RoI observation-statistics embedding
```

面向实现时，建议少用 `psi`，改成更明确的模块名：

```text
obs_input_i^k =
      F_i^k
    + observed_support_proj(C_obs_i^k)

prior_input_i^k =
      F_i^k
    + prior_context_proj(C_mod^k)

gate_input_i^k =
      F_i^k
    + observed_support_proj(C_obs_i^k)
    + roi_obs_stats_proj(S_roi)
```

这里的加法是 additive conditioning，不是严格的 ResNet-style residual block。残差块通常是 `x_out = x + f(x)`，加回来的分支来自同一条输入流；这里是保留基础点特征 `F_i^k`，再把外部条件投影成 embedding 加进去。它在形式上像 residual，但语义上是条件特征融合。

面向当前实现的 gated 网络结构可写成：

```text
C_mod^k = time_embedding(t_k)
        + roi_context_proj(Pool(T_roi))
        + class_embedding(c)

base_hidden_i^k = state_proj(x_i^k)
                + slot_embedding(i)

F^k = JiTFlowBlock(base_hidden^k, C_mod^k)

obs_input_i^k =
      F_i^k
    + observed_support_proj(C_obs_i^k)

prior_input_i^k =
      F_i^k
    + prior_context_proj(C_mod^k)

gate_input = F^k
           + observed_support_proj(C_obs^k)
           + roi_obs_stats_proj(stats)
g^k = sigmoid(gate_head(gate_input))     # shape: B x M x 1

v_obs^k   = obs_velocity_head(obs_input^k)
v_prior^k = prior_velocity_head(prior_input^k)
v^k = g^k * v_obs^k + (1 - g^k) * v_prior^k
```

在这个结构里，点级 observed support 是在共享 flow feature `F^k`
形成之后进入 `obs_input` 和 `gate_input`，不会直接进入 prior branch。
这样既保留了 `C_obs` 对 observation branch / gate 的作用，也避免把动态观测支撑混入 prior velocity。

### 6.2 当前实现边界

当前 `PGRCNNSurfaceFlow` 代码保留 single-head path 作为默认兼容模式。当 `OBSERVATION_PRIOR_GATE.ENABLED: False` 时，路径仍然是：

```text
hidden = state_proj(current_points) + slot_embedding
hidden = hidden + observed_support_mlp(C_obs)   # observed support 启用时

C_mod = cond_mlp(mean(token_embeddings)) + time_embedding(t)
C_mod = C_mod + class_embedding(roi_labels)   # CLASS_PRIOR.ENABLED 时
F = JiTFlowBlock(hidden, C_mod)
v = velocity_head(F)
```

当 `OBSERVATION_PRIOR_GATE.ENABLED: True` 时，实现使用 observation-prior branch split：

```text
base_hidden = state_proj(current_points) + slot_embedding
C_mod = cond_mlp(mean(token_embeddings)) + time_embedding(t)
C_mod = C_mod + class_embedding(roi_labels)   # CLASS_PRIOR.ENABLED 时
F = JiTFlowBlock(base_hidden, C_mod)

obs_input   = F + observed_support_mlp(C_obs)
prior_input = F + prior_context_mlp(C_mod)
gate_input  = F + observed_support_mlp(C_obs) + roi_obs_stats_mlp(S_roi)

v_obs   = obs_velocity_head(obs_input)
v_prior = prior_velocity_head(prior_input)
g       = sigmoid(gate_head(gate_input))
v       = g * v_obs + (1 - g) * v_prior
```

这样保留了 observation support 和 prior support 的预期分工：`v_prior` 不依赖 `C_obs`，`v_obs` 和 gate 接收 observed-support 信息。class prior 和 gate 不是同一个东西。class embedding 属于 RoI/global modulation condition `C_mod`，所以 prior branch 通过 `prior_context_mlp(C_mod)` 使用类别先验；gate head 本身没有额外的 class embedding 输入，只使用 `F`、`C_obs` 和可选 `S_roi`。由于当前实现是在 branch split 之前共享 `JiTFlowBlock(H, C_mod)`，`v_obs` 和 gate 仍可能通过共享特征 `F` 间接受到 class 调制。若要严格保证 observation branch 完全不吃 class，需要把分支拆到 FlowBlock 之前或内部，这是更大的结构改动，不是当前默认实现。

`S_roi` 是静态 RoI-level observation-statistics vector，包含三个分量：normalized log point count、cap-relative point density 和 canonical grid coverage。当前主训练配置已经启用 observation-prior gate，并设置 `OBSERVATION_PRIOR_GATE.ENABLED: True` 和 `ROI_STATS_DIM: 3`。

训练仍然只需要一个 flow target：

```text
v_target = x_1 - z
L_flow = || v - v_target ||^2
```

不需要分别监督 `v_obs`、`v_prior` 或 `g`。它们的分工来自网络结构和可用条件信息的差异。

直观解释：

```text
near observed sparse points:
    observed support 强，gate 应该学会偏向 v_obs

far from observed sparse points:
    observed support 弱，gate 应该学会偏向 v_prior
```

这个 gate 也可以作为方法诊断信号：把 gate value 渲染在生成点上，检查模型哪些区域依赖观测，哪些区域依赖先验。

### 6.3 训练信号和每步 flow 语义

三个 head 每个 flow step 都会运行一次，而不是 flow 前的一次性预处理，也不是 flow 后的 post-processing：

```text
current state x^k
    ↓
compute observed support around x^k
    ↓
JiT-style flow block with C_mod^k
    ↓
obs_velocity_head   → v_obs^k
prior_velocity_head → v_prior^k
gate_head           → g^k
    ↓
v^k = g^k * v_obs^k + (1 - g^k) * v_prior^k
    ↓
x^{k+1} = x^k + Delta t * v^k
```

### 6.4 Flow 过程中的方法设计点和 class prior 边界

1. **Initialization**

   控制 seed distribution，例如 canonical RoI 坐标中的中心高斯、clip 范围、类别相关 seed variance。

2. **Conditional input**

   将 RoI tokens 聚合成 RoI-level modulation vector；将 observed-support features 注入 point tokens；加入 RoI-level observation statistics、class embedding、RoI size 或其他几何先验。不要把 RoI tokens resample 成生成点数量后加到 `H_i^k`，这是旧版本 generator 思路。

3. **Velocity parameterization**

   采用 observation-prior two-branch velocity。当前主线保持 flow matching 的 velocity prediction，不把 clean endpoint prediction 放进近期默认方案。

4. **Velocity fusion**

   使用 point-wise gate 融合 observation-guided velocity 和 prior-guided velocity。

5. **Rollout schedule**

   选择 Euler step 数、timestep schedule，或训练时用更少步、评估时用更多步。

6. **Training supervision**

   使用 velocity supervision、generated-point Chamfer supervision、point classification，以及通过后续 RoI refinement 反传的 detection loss。endpoint supervision 仅作为以后切换 endpoint parameterization 时的备选项。

当前方法里，最有意义的设计点是 **velocity fusion**，因为它直接表达了核心思想：已有观测区域和弱观测区域应该由不同信息源驱动。

类别信息是当前默认 prior signal。实现采用简单 `Car / Pedestrian / Cyclist` class embedding，并把它放入 RoI/global modulation condition：

```text
roi_labels or predicted RoI class
    ↓
class embedding
    ↓
RoI/global modulation C_mod
    ↓
FlowBlock and prior context projection
```

这是合理的，因为 Car、Pedestrian、Cyclist 的 canonical surface distribution 明显不同。类别 embedding 可以帮助模型推断不可见部分，而不是让所有类别共享同一种 completion prior。这里应表述为 class embedding prior，不要写成 template prior 或 explicit shape bank conditioning。

当前实现边界：

```text
1. class embedding 由 roi_labels 提供，类别编号对应 Car / Pedestrian / Cyclist
2. class embedding 加到 C_mod，不挂在 OBSERVATION_PRIOR_GATE 下面
3. v_prior 通过 prior_context_mlp(C_mod) 使用类别先验
4. gate 本身是 observation-vs-prior mixer，不额外直接接 class embedding
5. 当前共享 FlowBlock 下，v_obs / gate 可能通过 F 间接受到 class；严格隔离需要更大分支拆分
6. 当前没有单独的 size_proj 接入 C_mod；显式 C_size 属于后续设计/消融项
7. template-point 或 class-shape-bank conditioning 放到更后面，因为它需要 canonical size、template alignment 和 train/inference consistency 验证
```

## 7. 训练目标和 Losses

### 7.1 Clean Endpoint Target Parameterization

当前代码路径直接预测 velocity，这也是 flow matching 的自然主线。clean surface endpoint prediction 暂时不作为近期默认目标，而是保留为长期备选参数化：网络先预测 clean surface endpoint，再转换成 velocity 做 flow objective。

JiT 的启发是：网络输出目标和 loss target 可以解耦。在图像生成中，当 token 对应高维结构化目标时，预测 clean data 可能比预测 noise / velocity 更稳定。对于我们的 surface flow，可以类比为：

```text
complete object surface points 位于低维表面流形上；
Gaussian seed points 和 intermediate states 分布在 RoI 体积中；
因此预测 clean surface endpoint 可能更容易让输出贴近表面流形。
```

参数化方式：

```text
x1_pred = f_theta(x_t, t, condition)
v_pred = (x1_pred - x_t) / clamp(1 - t)
L_flow = || v_pred - v_target ||^2
```

这里不假设 clean prediction 一定更好，也不应在当前论文主线里提前写成优势。更准确的说法是：clean surface endpoint prediction 是针对 structured RoI surface slots 的一个有动机的长期备选参数化；只有当 velocity-prediction 主线稳定后，才值得单独实验验证。

### 7.2 Losses

当前已有损失：

- flow matching 的 velocity MSE loss；
- 通过 `rebuilt_points` 接入原 PG-RCNN 的 Chamfer-style point reconstruction loss；
- point classification loss；
- box classification / regression losses。

后续可选损失：

- 加 repulsion / uniformity loss，减少局部点塌缩；
- gate diagnostics；只有当 gate 明显塌缩时再加入 gate regularization。
- 如果未来真的启用 endpoint prediction，再考虑对 `x1_pred` 或最终 `x_hat` 加 endpoint Chamfer loss。

暂时不加 box-boundary regularization loss。这个之前已经决定先推迟。

## 8. Evaluation 和 Ablation 计划

检测指标：

- KITTI AP / AP3D / BEV AP；
- Easy / Moderate / Hard；
- Car / Pedestrian / Cyclist 分类别结果。

补全指标：

- Chamfer Distance；
- F-score；
- 如果计算允许，加入 EMD 或 density-aware CD；
- 点分布诊断，尤其是 point collapse 和 out-of-RoI ratio。

消融计划：

```text
PG-RCNN baseline
Surface flow without observed support
Surface flow + observed support
Surface flow + observed support + RoI observation statistics
Surface flow + class embedding
Surface flow + observation-prior velocity gate
Ablation: different rollout steps K = 1, 2, 4, 8
Ablation: MAX_POINTS_PER_ROI = 32, 64, 128
```

`velocity prediction vs clean endpoint prediction` 不放入第一批消融。当前先坚持 flow matching 的速度场预测，等 gate、statistics 和 class prior 路径稳定后，再决定是否单独验证 endpoint parameterization。

预期论述：

- observed support 应该提升可见表面附近的一致性；
- RoI-level observation statistics 在 local support points 被 cap 时保留全局观测充分性；
- class prior 应该提升类别相关的补全能力；
- observation-prior gate 应该改善“保持观测几何”和“补全缺失区域”之间的平衡；
- flow rollout 相比 DDPM-style iterative denoising 更适合检测链路，因为它少步、可微，并能放在 detector forward pass 中。当前论文叙事应围绕 velocity prediction，不提前主张 clean endpoint prediction 的优势。

## 9. 方法命名

备选名称：

- Observation-Prior Guided Surface Flow
- Observation-Prior Decoupled Surface Flow
- RoI Surface Flow
- Detection-Oriented Surface Flow

当前使用名称：

```text
Observation-Prior Guided RoI Surface Flow
```

图中短模块名：

```text
Surface Flow Completion
```

## 10. 贡献表述

```text
We propose a detection-oriented RoI surface flow that evolves Gaussian surface slots into dense object surface points in canonical proposal coordinates, enabling end-to-end optimization with downstream RoI refinement.
```

```text
We introduce observed-support conditioning, which dynamically queries sparse LiDAR evidence for each evolving surface point and provides multi-scale geometric support for surface flow prediction.
```

```text
We further decouple surface evolution into observation-guided and prior-guided velocities, allowing the model to preserve visible surfaces while inferring unobserved regions from proposal and category priors.
```

中文理解：

- 我们提出 detection-oriented RoI surface flow，把 Gaussian surface slots 演化为 canonical proposal 坐标中的 dense object surface points；
- 我们引入 observed-support conditioning，为每个演化中的 surface point 动态查询稀疏 LiDAR 观测证据；
- 我们将 surface evolution 解耦成 observation-guided velocity 和 prior-guided velocity，使模型既能保持可见表面一致性，又能从 proposal / category prior 推断弱观测区域。

## 11. 当前状态和剩余工作

### 11.1 最后状态（2026-06-04）

当前中文笔记已经把方法主线收敛为：

```text
PG-RCNN RoI surface flow
    + dynamic observed-support conditioning
    + optional observation-prior velocity gate
    + optional RoI-level observation statistics
```

代码侧已经具备以下状态：

- 固定 256 点 `bm_points` target 已经位于 KITTI `train_mirror_target/*_fps256` 目录，surface-flow 配置已经指向这些固定顺序 target。
- `pgrcnn_jit_surface_flow.yaml` 是当前 surface-flow gate 主配置：启用 surface flow、observed support、observation-prior gate 和 RoI stats。
- 不再保留单独的 `pgrcnn_jit_surface_flow_gate.yaml` 并行入口，避免主配置和 gate 配置漂移。
- class prior 已通过 `SURFACE_FLOW.CLASS_PRIOR` 接入，class embedding 加到 RoI/global modulation condition `C_mod`，不挂在 observation-prior gate 配置下面。
- `PGRCNNSurfaceFlow` 已保留 single-head velocity path 作为默认兼容路径。
- observation-prior gate 已作为可选路径实现，包含 `obs_velocity_head`、`prior_velocity_head`、`gate_head` 和可选 `roi_obs_stats_mlp`。
- RoI-level observation statistics 已接入为轻量 hand-crafted descriptors：从 cap 前 raw RoI observed points 计算 `log_count_norm`、cap-relative `density_norm` 和 canonical grid `coverage_score`。
- 单元测试已经覆盖 gate 输出形状、`v_obs / v_prior / gate` 诊断、`roi_obs_stats` 梯度回传、`v_prior` 不依赖 observed support、RoI token 只作为全局 modulation、以及 256 generated points / 216 RoI tokens 的形状组合。

论文叙事上，当前应坚持以下边界：

- observed-support feature 是 lightweight multi-scale KNN statistics，不是 learned PointNet++ encoder。
- `S_roi` 是 RoI-level observation reliability signal，不是点级 occupancy map。
- observation-prior gate 是 observation vs prior 的混合器；class prior 是 RoI/global prior condition，二者不是同一个东西。
- template / shape-bank conditioning 不应写成当前主方法，它属于更重的后续增强。

### 11.2 剩余工作

1. **目标环境验证**
   在真实 OpenPCDet / CUDA / KITTI 环境中跑完整 forward smoke test 和短训练 smoke test，确认 gate 配置不只是 isolated unit test 可用。

2. **Gate 诊断可视化**
   渲染 generated surface points 上的 gate value，检查近 observed sparse points 的区域是否更偏向 `v_obs`，弱观测区域是否更偏向 `v_prior`。

3. **第一批消融**
   优先比较：
   - surface flow + observed support
   - surface flow + observation-prior gate，不加 RoI stats
   - surface flow + observation-prior gate + RoI stats

4. **Class prior 消融**
   比较 `SURFACE_FLOW.CLASS_PRIOR.ENABLED: False/True`，验证 class embedding 放入 `C_mod` 是否改善类别相关的补全能力。当前共享 FlowBlock 下不要声称 `v_obs` 严格不含 class 信息；若要验证严格隔离，需要单独设计更大的分支拆分。

5. **长期备选：Endpoint 参数化**
   暂时不做 clean endpoint prediction。当前主线保持 flow matching 的 velocity prediction；只有当 gate/statistics/class prior 的主实验稳定后，再考虑是否单独比较 velocity prediction 与 clean endpoint prediction。

6. **论文图和方法章节同步**
   框架图应突出两条条件路径：
   - `C_global`：每个 RoI 计算一次，作为静态 RoI/global prior condition；
   - `C_mod^k`：每个 flow step 由 `C_global + C_time(t_k)` 得到，用于 JiT-style modulation；
   - `C_obs_i^k`：每个 flow step 动态重算，用于 observed-support 和 gate。
