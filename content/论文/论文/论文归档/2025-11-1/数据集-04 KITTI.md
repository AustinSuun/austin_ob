---
Date: 2025-11-01T19:50:00
作者:
  - Austin Suun
tags:
  - 数据集
链接:
---

> [!NOTE] 简要介绍
> 

文件结构-KITTI 数据集

```python
data/kitti/
├── ImageSets/
│   ├── train.txt
│   ├── val.txt
│   └── test.txt
│
├── training/
│   ├── image_2/              # 相机RGB图像（可选）
│   │   ├── 000000.png
│   │   ├── 000001.png
│   │   └── ...
│   ├── label_2/              # 标签文件
│   │   ├── 000000.txt
│   │   ├── 000001.txt
│   │   └── ...
│   ├── calib/                # 相机和激光雷达的标定文件
│   │   ├── 000000.txt
│   │   ├── 000001.txt
│   │   └── ...
│   ├── velodyne/             # 点云文件（.bin格式）
│   │   ├── 000000.bin
│   │   ├── 000001.bin
│   │   └── ...
│
├── testing/
│   ├── image_2/
│   ├── calib/
│   └── velodyne/
│
└── kitti_infos_train.pkl     # 用命令生成
└── kitti_infos_val.pkl       # 用命令生成
└── kitti_infos_test.pkl      # 用命令生成
└── gt_database/              # 用命令生成

```


---

## 🧩 一、原始 Waymo TFRecord 格式

下载后每个文件是一个 `.tfrecord`，每个文件包含多帧（每帧含点云、图像、标注等）。

典型结构如下：

```
waymo_open_dataset/
├── training/
│   ├── segment-10061305430875486848_5725_000_5745_000_with_camera_labels.tfrecord
│   ├── segment-10061305430875486848_5800_000_5820_000_with_camera_labels.tfrecord
│   ├── ...
├── validation/
│   ├── segment-10243636817053556597_7620_000_7640_000_with_camera_labels.tfrecord
│   ├── ...
├── testing/
│   ├── segment-10794924331893034030_1080_000_1100_000.tfrecord
│   ├── ...
└── README.md
```

每个 `.tfrecord` 文件内部包含：

- 激光雷达点云（5个 LiDAR 传感器）
    
- 车辆姿态（pose）
    
- 5个相机图像（front, front-left, front-right, side-left, side-right）
    
- 标注（bounding boxes、object type、速度等）
    
- 时间戳信息
    

---

## 📦 二、转换为 KITTI 格式后的结构（OpenPCDet / mmdetection3d 常用）

若使用官方或开源脚本（如 OpenPCDet 的 `waymo_dataset` 工具）转换后，一般会得到如下结构：

```
waymo/
├── images/
│   ├── training/
│   │   ├── 000000.png
│   │   ├── 000001.png
│   │   └── ...
│   ├── validation/
│   │   ├── 000000.png
│   │   └── ...
│   └── testing/
│       ├── 000000.png
│       └── ...
│
├── velodyne/
│   ├── training/
│   │   ├── 000000.bin
│   │   ├── 000001.bin
│   │   └── ...
│   └── validation/
│       └── ...
│
├── label_2/
│   ├── training/
│   │   ├── 000000.txt
│   │   ├── 000001.txt
│   │   └── ...
│
├── calib/
│   ├── training/
│   │   ├── 000000.txt
│   │   └── ...
│
├── ImageSets/
│   ├── train.txt
│   ├── val.txt
│   ├── trainval.txt
│   └── test.txt
│
└── waymo_infos_train.pkl
└── waymo_infos_val.pkl
```

其中：

- `velodyne/` ：点云数据（`.bin`）
    
- `image/` ：图像数据（如选择保留）
    
- `label_2/` ：3D/2D标注
    
- `calib/` ：相机-雷达标定信息
    
- `ImageSets/` ：样本划分文件
    
- `waymo_infos_xxx.pkl` ：数据索引缓存文件（由工具生成）
    

---

## 🧠 补充说明

|项目|描述|
|---|---|
|原始 `.tfrecord`|官方格式，包含所有传感器和时序信息，较大|
|转换 KITTI 格式|为方便训练（如 OpenPCDet），每帧展开为单文件，时序信息丢失|
|数据规模|Waymo v1.4: 798 train + 202 val + 150 test 片段，每片段20s（约200k帧）|

---

如果你正在用 `OpenPCDet` 或 `mmdetection3d` 训练，我可以告诉你**正确的目录摆放方式**（含 `create_data.py` 命令）和 `dataset.yaml` 的写法。  
要我帮你写对应的目录结构和命令吗？



# Db . Pkl 中的信息

```python
db_infos = { 'Vehicle': [
					 { 
				 		'name': 'Vehicle',
				 		 'path': 'gt_database/000000_Vehicle_0.bin', 
				 		 'box3d_lidar': [x, y, z, dx, dy, dz, heading],
				 		  'num_points_in_gt': 100, 
				 		  'image_idx': 0, 
				 		  'gt_idx': 0,
				 		   'difficulty': 0 
				 		}, 
				 		  # ... 更多Vehicle实例 
				  ], 
				 		  
			'Pedestrian': [ 
						# ... Pedestrian实例
						],
			 'Cyclist': 	[
			 				 # ... Cyclist实例 
			 		 		] 
		}
```

```python

"sample_idx":
"points"
"frame_id"
"gt_names":
"gt_boxes"
"num_points_in_gt"
"noise_rot" : 数据增强随机旋转的角度
"noise_scale": 全局坐标缩放的倍率
"use_lead_xyz": true
```