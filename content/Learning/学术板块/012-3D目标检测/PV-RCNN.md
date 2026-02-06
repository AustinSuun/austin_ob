---
日期: 2025-09-26
作者:
  - Austin
tags:
---


# 摘要

提出了一种新的高性能的 3 D 物体检测框架。方法融合了 3 D 体素卷积神经网络和基于 PointNet 的集合抽象技术。充分利用了具有高效学习能力和高质量的 3 D 体素 CNN 提议，以及基于 PointNet 的网络的灵活的感受野。

核心原理在，基于体素的操作能高效编码多尺度特征表示并生成高质量 3 D 候选框，基于 PointNet 的集合抽象操作能够通过灵活的感受野保留了精确的位置信息。

## 研究背景


## 论文目的


## 论文主要结论


---
# 前言

## 研究总体背景
**基于网格的方法**
开创性工作是 MV 3 D 将点云投影到 *2 D 鸟瞰图网格*，并*放置大量预定义 3 D 锚框*以生成 3 D 边界框

后续工作开发了多传感器融合网络，提出了更高效的*基于鸟瞰图的表示的框架*

另一些工作把点云划分为 3 D 体素以用 3 DCNN 处理，并引入* 3 D 稀疏卷积*以实现高效的 3 D 体素处理

另一些工作探索了目标部分位置以提高性能。

基于网格的方法通常在精确的 3 D *候选框生成方面效率较高*，但感受野受到 2 D/3 D*卷积核大小限制*

**基于点的方法**


---
# 用于目标检测的 PV-RCNN

### 用于高效特征编码和候选框生成的 3 D 体素CNN

**3 D 体素 CNN**
骨干网络是 3 D 稀疏卷积。输入点首先被划分为空间大小 $L \times W\times H$ 的体素空间，其中非空体素的特征直接用**所有内部点的逐点特征的平均值**。常用特征包括*三维坐标*和*反射强度*。

网络利用一系列 $3\times 3\times 3$ 的稀疏卷积核，将点云转换为具有 $1\times,2\times,4\times,8\times$ 下采样倍率的特征体积空间。每一层的稀疏特征体积可以看作一组体素级特征向量

**3 D 候选生成**
编码后的 $8\times$ 3 D 特征空间被转换成 2 D 鸟瞰特征图，*基于锚点的方法*生成了高质量的 3 D 。具体来说，沿着 Z 轴堆叠 3 D 特征空间，获得 $\frac{L}{8} \times \frac{W}{8}$ 鸟瞰特征图。每个**类别**有 $2\times \frac{L}{8 }\times \frac{W}{8}$ 个 3 D 锚框，这些锚框采用该类别的平均 3 D 物体尺寸，并对鸟瞰特征图的**每个像素评估** $0^{\circ},90^{\circ}$ 两种方向的锚框。

**讨论**
最先进的检测器通常采用两阶段框架。他们需要从生成的 3 D 特征体积或 2 D 图中提取*感兴趣区域*（RoI）特定特征，以进一步的候选框优化。而来自 3 D 体素 CNN 的这些 3 D 特征体积在以下方面存在主要限制：
1. 这些特征体积通常空间分辨率较低，因为他们被下采样了 8 倍，这阻碍了对输入场景中对象的精确定位
2. 即使可以进行上采样以获得更大空间尺寸的特征体积/图，他们仍然*十分稀疏*。在RoIPooling/RoIAlign 操作中常用的三线性插值或双线性插值只能从小邻域中提取特征（双线性插值分别对应 4 和 8 个最近邻）。因此，*传统的池化方法*获取的特征大多为 0，并在第二阶段优化中*浪费大量计算和内存*

另一方面，PointNet 变体中提出的集合抽象操作展现了从任意大小的邻域编码特征点的强大能力。因此，我们将 3 D 体素 CNN 与一系列*集合抽象操作*相结合，以实现准确和鲁棒的*第二阶段提案优化*

直接使用集合抽象操作来池化场景特征体素的简单解决方案是将场景中的多尺度特征体积直接聚合到感兴趣区域（RoI）网格。然而，这种直观策略不仅占用大量内存，而且在实际应用中效率较低。主要原因下采样倍率不能过高，过高了会丢失准确度，这样会导致体素过多，计算量和内存使用增大

为了解决问题，提出一种两步方法，首先整个场景中不同神经层的体素编码为少量关键点，然后关键点特征聚合到感兴趣区域（RoI）网格中以优化锚框提议

### 通过体素集抽象模块实现体素到关键点的场景编码
这个框架将多个神经网络层（3 D 稀疏体素卷积的体素特征空间）中表示整个场景的体素聚合成少量关键点，这些关键点充当了 3 D 体素 CNN 特征编码器与候选框优化网络之间的桥梁。

**关键点采样**
使用最远点采样算法从点云中采样少来能关键点，在 KITTI 数据集中 n=2048，在 Waymo 数据集中 n=4096

最远点采样策略可以均匀采样到非空体素周围的点，能够代表整个整体场景

**体素集抽象模块**
体素集抽象模块（VSA），将多尺度语义特征从 3 DCNN 特征体编码到关键点上。使用集合抽象操作来聚合体素级的特征体积。关键点周围的点现在是规则体素，其多尺度语义特征有 3 D 体素 CNN 从多个层级编码。而不是 PointNet 学习的邻近原始点特征




## 试验材料


## 试验步骤


## 分析方法


---
# 结果与讨论

## 试验现象与机理


## 他人研究对比


## 不足之处及未来展望


---
# 结论
> 总结凝练之后的内容

## 主要内容


## 主要试验现象和相关机理


## 本轮文的研究意义






# 过程中的一些概念

## 数据集

数据通常是由*LiDAR*采集的，初始数据包含xyz坐标和雷达反射强度（intensity），需要裁剪出一个长方体区域，区域中的点云数据被用于 3 D 目标检测

> LiDAR是一种集激光，全球定位系统(GPS)和惯性导航系统(INS)三种技术于一身的系统，用于获得点云数据并生成精确的数字化三维模型。这三种技术的结合，可以在一致绝对测量点位的情况下获取周围的三维实景 。

数据中的三个维度：x代表前后，y代表左右，z代表上下，范围是： [0, -40, -3, 70.4, 40, 1]

代表当前位置前方70.4米，左右各40米，上下 4米的范围

**数据处理分为三个部分**
1. 去除范围[0, -40, -3, 70.4, 40, 1]之外的点云
2. 训练时随机打乱点云，测试时不打乱
3. 点云数据转换成体素表示

每个体素大小[0.05，0.05， 0.1]，可得到体素网格空间[1408, 1600, 40]
空间中总的体素个数上限，训练时为 16000，测试时为 40000
每个体素网格最多使用体素内 6 个点的数据

生成的体素数据包括：
1. 每个体素中的点的特征 voxel [体素个数，每个体素的点上限，点的特征维度]
2. 体素的坐标 coor [体素个数， 3]
3. 每个体素中点的个数 [体素个数]

Dataset 中数据的形状：
![image.png](https://cdn.jsdelivr.net/gh/AustinSuun/image/img/20250902191142847.png)



## 网络结构
### 1. VFE
把初始的体素信息使用 MeanVFE 方法处理，即把每个体素内的点的特征求平均值作为体素的特征

```python 
"module_list": ["VFE":VFE],

"num_rawpoint_features": self.dataset.point_feature_encoder.num_point_features, # 4 原始点维度

"num_point_features": vfe_module.get_output_feature_dim() # 点特征维度 4

"grid_size": self.dataset.grid_size, # [1480, 1600, 40]

"point_cloud_range": self.dataset.point_cloud_range, # [0, -40, -3, 70.4, 40, 1]

"voxel_size": self.dataset.voxel_size, # [0.05, 0.05, 0.1]

"depth_downsample_factor": self.dataset.depth_downsample_factor, # none
```

### 2. 3 D 骨干网络
使用稀疏卷积方法减少计算量，输出网格空间加少 8 被的体素空间，每个体素特征维度 128

```python 
"module_list": [VFE, VoxelBackBone8x],

"num_rawpoint_features": self.dataset.point_feature_encoder.num_point_features, # 4 原始点维度

"num_point_features":128

"grid_size": self.dataset.grid_size, # [1480, 1600, 40]

"point_cloud_range": self.dataset.point_cloud_range, # [0, -40, -3, 70.4, 40, 1]

"voxel_size": self.dataset.voxel_size, # [0.05, 0.05, 0.1]

"depth_downsample_factor": self.dataset.depth_downsample_factor, # none

"backbone_channel": "x_conv1":16 , "x_conv2": 32, "x_conv3":64, "x_conv4":64
```

### MapToBEV
把稀疏表示转换成稠密表示，并把特征通道和高度通道变成一个维度，这样空间被压缩成了 2 D 空间

即 [N, c, z, y, x] => [N, c* z, y, x]
其中 z = D， y = H, x = W 对应代码中字母

```python 
"module_list": [VFE, VoxelBackBone8x],

"num_rawpoint_features": self.dataset.point_feature_encoder.num_point_features, # 4 原始点维度

"num_point_features":128

"grid_size": self.dataset.grid_size, # [1480, 1600, 40]

"point_cloud_range": self.dataset.point_cloud_range, # [0, -40, -3, 70.4, 40, 1]

"voxel_size": self.dataset.voxel_size, # [0.05, 0.05, 0.1]

"depth_downsample_factor": self.dataset.depth_downsample_factor, # none

"backbone_channel": "x_conv1":16 , "x_conv2": 32, "x_conv3":64, "x_conv4":64

"num_bev_features":256
```


### Pfe
需要融合多个阶段的特征

来自BEV 映射的特征，需要把特征映射回，重新采样得到的 2048 个点上

来自原始点的

```python 
"module_list": [VFE, VoxelBackBone8x],

"num_rawpoint_features": self.dataset.point_feature_encoder.num_point_features, # 4 原始点维度

"num_point_features":128

"grid_size": self.dataset.grid_size, # [1480, 1600, 40]

"point_cloud_range": self.dataset.point_cloud_range, # [0, -40, -3, 70.4, 40, 1]

"voxel_size": self.dataset.voxel_size, # [0.05, 0.05, 0.1]

"depth_downsample_factor": self.dataset.depth_downsample_factor, # none

"backbone_channel": "x_conv1":16 , "x_conv2": 32, "x_conv3":64, "x_conv4":64

"num_bev_features":256

"num_point_features_before_fusion": 640

```


### 2 D 骨干网络
使用 2 D 卷积和反卷积来提取体素的特征，包括两个卷积块和两个反卷积块，分成两路，最后拼接两路的特征




```python 
"module_list": [VFE, VoxelBackBone8x],

"num_rawpoint_features": self.dataset.point_feature_encoder.num_point_features, # 4 原始点维度

"num_point_features":128

"grid_size": self.dataset.grid_size, # [1480, 1600, 40]

"point_cloud_range": self.dataset.point_cloud_range, # [0, -40, -3, 70.4, 40, 1]

"voxel_size": self.dataset.voxel_size, # [0.05, 0.05, 0.1]

"depth_downsample_factor": self.dataset.depth_downsample_factor, # none

"backbone_channel": "x_conv1":16 , "x_conv2": 32, "x_conv3":64, "x_conv4":64

"num_bev_features":512

"num_point_features_before_fusion": 640

```

### DenseHead
使用来之 BEV 映射之后的 3 D 体素数据，




```python 
"module_list": [VFE, VoxelBackBone8x],

"num_rawpoint_features": self.dataset.point_feature_encoder.num_point_features, # 4 原始点维度

"num_point_features":128

"grid_size": self.dataset.grid_size, # [1480, 1600, 40]

"point_cloud_range": self.dataset.point_cloud_range, # [0, -40, -3, 70.4, 40, 1]

"voxel_size": self.dataset.voxel_size, # [0.05, 0.05, 0.1]

"depth_downsample_factor": self.dataset.depth_downsample_factor, # none

"backbone_channel": "x_conv1":16 , "x_conv2": 32, "x_conv3":64, "x_conv4":64

"num_bev_features":512

"num_point_features_before_fusion": 640

```

### PointHead

```python 
"module_list": [VFE, VoxelBackBone8x],

"num_rawpoint_features": self.dataset.point_feature_encoder.num_point_features, # 4 原始点维度

"num_point_features":128

"grid_size": self.dataset.grid_size, # [1480, 1600, 40]

"point_cloud_range": self.dataset.point_cloud_range, # [0, -40, -3, 70.4, 40, 1]

"voxel_size": self.dataset.voxel_size, # [0.05, 0.05, 0.1]

"depth_downsample_factor": self.dataset.depth_downsample_factor, # none

"backbone_channel": "x_conv1":16 , "x_conv2": 32, "x_conv3":64, "x_conv4":64

"num_bev_features":512

"num_point_features_before_fusion": 640

```





# Dense_head_loss

## 分配真实框
每个批次单独操作，其中的每个类别单独操作

分配真实框分为两个阶段，

第一个阶段是把预设锚框分配给真实框，按照IoU 大小；把 IoU 最大的预设锚框分配给真实框；然后屏蔽掉 IoU 为 0 的真实框，即没有与任何预设锚框重叠的真实框；以预设锚框为基准，记录其被分配的真实框的索引和对应的类别

第二个阶段是把真实框分配预设锚框，按照 IoU 大小；把 IoU 最大的真实框，会被分配给预设锚框，此时真实框会被重复的分配给预设锚框，

最后堆叠 3 个类别的数据，在把数据按照 Batch 堆叠




每个类别都有 $176*200*1$ 个预设锚框

先计算预设锚框和真实框的 IoU，根据 IoU 把预设锚框分配给真实框

最大 IoU 为 0 的真实框会被屏蔽

记录分配给预设锚框的真实框的类别和索引



# Loss
先分出前景锚框（label=1）和背景锚框（label=0）

前景锚框和背景锚框，用于类别学习（前景背景|正负样本），

前景锚框的目标类别设为 1，背景锚框设为 0

作为 DenseHead 预测的