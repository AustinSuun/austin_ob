---
日期: 2025-08-18
作者:
  - Austin
tags:
---
**核心挑战**

传统序列建模有一个根本挑战：如何有效的记忆和利用长期历史信息？

**HiPPO 的核心思想**

HiPPO 提供了一个数学框架，通过讲历史信息投影到正交多项基上来压缩和记忆长期依赖

正交基就是空间的基底向量，可以用来表示多维空间向量的基底，类似二维空间的单位 1 的 x，y 方向


# 正交多项基解释

**正交多项式**
数学定影：两个函数 $p_{i}(x)$ 和 $p_{j}$ 在某个区间 $[a,b]$ 上关于权重函数 $w(x)$ 正交，当且仅当：
$$
\int p_{i}(x) p_{j}(x)w(x)dx = 0 \space\ \ \  当i\neq j
$$

**常见的正交多项式族**
勒让德多项式
- 区间 $[-1,1]$
- 权重 $w(x)=1$
- 前几项
	- $P_{0}(x)=1$
	- $P_{1}(x)=x$
	- $P_{2}(x)=\frac{1}{2}(3x^2-1)$
	- $P_{3}(x)=\frac{1}{2}(5x^3-3x)$

正交验证，$p(0),p(1)$ 为例
$$
\int_{-1}^1P_{0}(x)P_{1}(x)dx=\int_{-1}^11\cdot xdx=\left[\frac{x^2}{2}\right]_{-1}^1=\frac{1}{2}-\frac{1}{2}=0
$$
结果为 0。两个基底是正交的

这样样解可以选择这种正交多项式族，作为空间向量的基底，来保存历史记忆信息

不同的基底可以代表不同的变化，叠加之后可以形成类似傅里叶曲线画图的效果

正交多项式基让我们能够用**有限的状态维度**来**无损地**压缩**任意长**的历史信息，这正是HiPPO解决长期依赖问题的数学基础。



非常好！现在我们进入HiPPO的核心部分：如何利用正交多项式基来构建状态空间模型。

## 第二阶段：HiPPO的核心数学原理

### 1. 从正交多项式到序列记忆

**核心问题：** 如何用有限维的状态来记住无限长的历史？

**HiPPO的巧妙思路：** 不直接存储历史序列 $f(s)$，而是存储它在正交多项式基上的**投影系数**！

### 2. 数学表述

**历史函数：** 设当前时间为 $t$，历史函数为 $f_t(s) = u(s)$ for $s \in [0,t]$

**投影系数：** $$c_n(t) = \int_0^t f_t(\theta) \cdot p_n\left(\frac{2\theta}{t} - 1\right) \frac{d\theta}{t}$$

其中：

- $c_n(t)$ 是第 $n$ 个基函数的系数
- $p_n$ 是第 $n$ 个正交多项式
- $\frac{2\theta}{t} - 1$ 将 $[0,t]$ 映射到 $[-1,1]$

### 4. 关键洞察：投影系数的时间演化

**问题：** 当新的输入 $u(t)$ 到来时，这些系数 $c_n(t)$ 如何更新？

**答案：** HiPPO推导出了一个美妙的**线性微分方程系统**！

$$\frac{dc(t)}{dt} = A \cdot c(t) + B \cdot u(t)$$

其中：

- $c(t) = [c_0(t), c_1(t), ..., c_{N-1}(t)]^T$ 是系数向量
- $A$ 是状态转移矩阵
- $B$ 是输入矩阵

### 5. HiPPO矩阵的具体形式

对于**LegT**（Translated Legendre）测度，HiPPO矩阵为：

$$A_{nk} = \begin{cases} (2n+1)^{1/2}(2k+1)^{1/2} & \text{if } n > k \ n+1 & \text{if } n = k \ 0 & \text{if } n < k \end{cases}$$

$$B_n = (2n+1)^{1/2}$$

### 6. 具体例子：3×3的HiPPO矩阵

```python
# 3维状态的HiPPO矩阵
A = [[ 1,    0,    0   ],
     [ 3,    3,    0   ],
     [√15,  √45,   5   ]]

B = [1, √3, √5]
```

### 7. 美妙的性质

**1. 近似重建：** 可以通过系数重建原始函数： $$\hat{f}(s) = \sum_{n=0}^{N-1} c_n(t) \cdot p_n\left(\frac{2s}{t}-1\right)$$

**2. 最优逼近：** 用N个系数得到的是N维空间中的最优逼近

**3. 计算效率：** 只需要维护N个实数，而不是整个历史序列

### 9. 实际工作流程

```
时间步 t=0: c = [0, 0, 0]
输入 u=1:   c = A*c + B*1 = [1, √3, √5]

时间步 t=1: c = [1, √3, √5]  
输入 u=2:   c = A*c + B*2 = [新的系数...]

# 每一步都保持了对整个历史的最优压缩表示！
```

### 10. 为什么这样设计有效？

**数学角度：**

- 正交基保证无信息冗余
- 线性更新保证计算效率
- 最优投影保证表示质量

**直观角度：**

- 低阶系数捕捉历史的主要趋势
- 高阶系数捕捉细节和变化
- 系数向量就是历史的"DNA"

---

**核心突破：** HiPPO将"记忆历史"这个看似需要无限存储的问题，转化为维护有限个投影系数的线性动力学系统！

## 第三阶段：从HiPPO到状态空间模型的实现

### 1. 连续时间到离散时间的转换

**问题：** HiPPO给出的是连续时间微分方程： $$\frac{dc(t)}{dt} = A \cdot c(t) + B \cdot u(t)$$

**解决：** 需要离散化处理实际的序列数据。

### 2. 离散化方法：双线性变换

使用**双线性变换（Bilinear Transform）**进行离散化：

**连续系统：** $$\dot{x} = Ax + Bu$$ $$y = Cx + Du$$

**离散系统：** $$x_k = \bar{A}x_{k-1} + \bar{B}u_k$$ $$y_k = \bar{C}x_k + \bar{D}u_k$$

其中： $$\bar{A} = (I - \frac{\Delta}{2}A)^{-1}(I + \frac{\Delta}{2}A)$$ $$\bar{B} = (I - \frac{\Delta}{2}A)^{-1}\Delta B$$ $$\bar{C} = C$$ $$\bar{D} = D$$

### 3. 具体计算示例

让我们以3维HiPPO矩阵为例，设 $\Delta = 1$：

**原始HiPPO矩阵：**

```python
A = [[ 1,    0,    0   ],
     [ 3,    3,    0   ],
     [√15,  √45,   5   ]]

B = [[1], [√3], [√5]]
```

**离散化后：**

```python
# 计算 I - Δ/2 * A
I_minus_half_A = [[0.5,   0,    0   ],
                  [-1.5,  -0.5,  0   ],
                  [-√15/2, -√45/2, -1.5]]

# 计算 I + Δ/2 * A  
I_plus_half_A = [[1.5,   0,     0   ],
                 [1.5,   4.5,   0   ],
                 [√15/2, √45/2, 6.5]]

# Ā = (I - Δ/2*A)^(-1) * (I + Δ/2*A)
A_bar = solve(I_minus_half_A, I_plus_half_A)
```

### 4. 高效计算：避免矩阵求逆

**问题：** 每次都计算矩阵求逆很昂贵！

**解决方案：** 利用HiPPO矩阵的特殊结构

**关键观察：** HiPPO矩阵具有特殊的低秩结构，可以写成： $$A = -\frac{1}{2}(nk + kn^T)$$

其中 $n, k$ 是特殊向量。

### 5. 卷积视角：神奇的等价性

**重大发现：** 状态空间模型在某种条件下等价于卷积！

**卷积核公式：** $$\mathcal{K} = C\bar{B}, C\bar{A}\bar{B}, C\bar{A}^2\bar{B}, ..., C\bar{A}^{L-1}\bar{B}$$

**卷积计算：** $$y = \mathcal{K} * u$$

其中 $*$ 表示卷积运算。

### 6. 实际计算流程

```python
# 方法1：递归计算（RNN风格）
def ssm_recurrent(u_sequence, A_bar, B_bar, C, D):
    x = zeros(state_size)
    outputs = []
    
    for u_t in u_sequence:
        x = A_bar @ x + B_bar @ u_t  # 状态更新
        y_t = C @ x + D @ u_t        # 输出计算
        outputs.append(y_t)
    
    return outputs

# 方法2：卷积计算（CNN风格）
def ssm_convolution(u_sequence, kernel_K):
    return convolve(u_sequence, kernel_K)
```

### 7. 关键优化：核计算

**预计算卷积核：**

```python
def compute_kernel(A_bar, B_bar, C, L):
    kernel = []
    A_power = eye(state_size)
    
    for i in range(L):
        k_i = C @ A_power @ B_bar
        kernel.append(k_i)
        A_power = A_power @ A_bar
    
    return kernel
```

**问题：** 对于长序列，$A^L$ 会数值爆炸！

### 8. 数值稳定性：对角化

**解决方案：** 将矩阵对角化 $$A = V\Lambda V^{-1}$$

其中 $\Lambda$ 是对角矩阵，包含特征值。

**稳定计算：**

```python
def stable_kernel_computation(A, B, C, L):
    # 对角化
    eigenvals, eigenvecs = eig(A)
    
    # 稳定的幂计算
    powers = eigenvals ** arange(L)
    
    # 重构核
    kernel = real(eigenvecs @ (powers * (eigenvecs.T @ B)) @ C.T)
    
    return kernel
```

### 9. 并行化的优势

**递归计算：** 必须串行

```
x₁ = A*x₀ + B*u₁
x₂ = A*x₁ + B*u₂  # 依赖x₁
x₃ = A*x₂ + B*u₃  # 依赖x₂
```

**卷积计算：** 可以完全并行

```
y = K * u  # 整个序列同时处理！
```

### 10. 完整的神经网络层

```python
class HiPPOSSMLayer(nn.Module):
    def __init__(self, d_model, d_state):
        super().__init__()
        # 初始化HiPPO矩阵
        self.A = hippo_matrix(d_state)
        self.B = nn.Parameter(torch.randn(d_state, 1))
        self.C = nn.Parameter(torch.randn(1, d_state))
        self.D = nn.Parameter(torch.randn(1, 1))
        
        # 预计算离散化矩阵
        self.A_bar, self.B_bar = discretize(self.A, self.B, dt=1.0)
    
    def forward(self, u, use_convolution=True):
        if use_convolution and self.training:
            # 训练时用卷积（并行）
            K = compute_kernel(self.A_bar, self.B_bar, self.C, len(u))
            return F.conv1d(u, K)
        else:
            # 推理时用递归（内存效率）
            return self.recurrent_forward(u)
```

### 11. 关键洞察总结

**数学优雅性：**

- HiPPO提供理论基础
- 离散化保证数值稳定
- 卷积等价性实现并行

**工程实用性：**

- 训练时用卷积（快速）
- 推理时用递归（省内存）
- 特殊结构优化计算

**为Mamba铺路：**

- S4建立了完整框架
- Mamba进一步优化选择性机制
- 核心数学基础来自HiPPO

---

**核心突破：** HiPPO不仅提供了数学理论，还给出了实际可计算的算法！这个理论到实现的桥梁，正是S4和Mamba成功的关键。

下一阶段我们将看到这些理论如何在实验中展现出色的长序列建模能力。准备好了吗？
