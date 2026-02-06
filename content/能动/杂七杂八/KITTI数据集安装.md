https://www.cvlibs.net/datasets/kitti/eval_object.php?obj_benchmark=3d

以上下载数据集，

```
OpenPCDet
├── data
│   ├── kitti
│   │   │── ImageSets
│   │   │── training
│   │   │   ├──calib & velodyne & label_2 & image_2 & (optional: planes) & (optional: depth_2)
│   │   │── testing
│   │   │   ├──calib & velodyne & image_2
├── pcdet
├── tools
```

整理成以上目录
需要下载 calib & velodyne & label_2 & image_2

运行一下，生成 info
```
python -m pcdet.datasets.kitti.kitti_dataset create_kitti_infos tools/cfgs/dataset_configs/kitti_dataset.yaml
```
