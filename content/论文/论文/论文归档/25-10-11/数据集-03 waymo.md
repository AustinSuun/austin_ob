---
Date: 2025-10-11T20:52:00
作者:
  - Austin Suun
tags:
  - 数据集
链接:
---

> [!NOTE] 简要介绍
> 


在 **Waymo Open Dataset (WOD)** 的点云中，每个点的特征维度确实常常是 **6 维**（有时也称为「6 通道特征」），这 6 个特征的含义如下👇：

---

### 🚘 Waymo 点云的基本特征格式（6 维）

一个点通常包含：

|特征名|含义|说明|
|---|---|---|
|`x`|空间坐标 X|单位：米，激光雷达坐标系下|
|`y`|空间坐标 Y|单位：米|
|`z`|空间坐标 Z|单位：米|
|`intensity`|反射强度|表示激光反射信号强度，和材质/距离有关|
|`elongation`|回波宽度|激光脉冲持续时间相关特征（物体表面粗糙度、倾斜角影响）|
|`timestamp`|相对时间戳|当前帧内每个点相对于帧采样时间的偏移（微秒级）|

---

### 🧠 小总结：

也就是：  
[  
\text{每个点} = [x, y, z, intensity, elongation, time]  
]

其中：

- 前 3 维是几何信息；
    
- 后 3 维是传感器测量属性；
    
- 某些论文或预处理代码（如 MMDetection3D 或 OpenPCDet）会去掉部分维度，只保留 `[x, y, z, intensity]` 四维输入；
    
- 但在 Waymo 官方 `.tfrecord` 原始格式中是 **6 维点特征**。
    

---

### 🧩 补充：

- 数据来源：`lidar/laser_name/ri_returnX.range_image_compressed`
    
- 解码后得到每个激光线的 `(range, intensity, elongation)`，再结合标定文件投影到 3D 坐标，就形成 `[x, y, z, intensity, elongation, time]`
    
- 不同返回（return 1、return 2）会合并成完整点云。
    

---