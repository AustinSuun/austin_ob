---
Date: 2025-11-09T21:05:00
作者:
  - Austin Suun
tags:
链接:
---

> [!NOTE] 简要介绍
> 

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

运行一下，生成info
```
python -m pcdet.datasets.kitti.kitti_dataset create_kitti_infos tools/cfgs/dataset_configs/kitti_dataset.yaml
```

# Tmux 新会话
```
tmux new -s mysession

tmux ls   # 列出所有会话
tmux attach -t mysession # 重连
exit   # 退出
# 分离会话，后台训练
Ctrl+b 然后按 d

```
# KITTI 单 GPU 训练
```
CUDA_VISIBLE_DEVICES=0 python train.py     --cfg_file ./cfgs/kitti_models/second_with_lion_mamba_64dim.yaml     --extra_tag second_with_lion_mamba_64dim     --batch_size 1     --epochs 5     --max_ckpt_save_num 4     --workers 4     --sync_bn
```

继续训练，设置 ckpt
```
CUDA_VISIBLE_DEVICES=0 python train.py \
    --cfg_file ./cfgs/kitti_models/second_with_lion_mamba_64dim.yaml \
    --extra_tag second_with_lion_mamba_64dim \
    --batch_size 1 \
    --epochs 24 \
    --max_ckpt_save_num 4 \
    --workers 4 \
    --sync_bn \
    --ckpt ../output/

```


# TensorBoard
```
ssh -L 6006:localhost:6006 qdu@10.244.7.19
```

```
tensorboard --logdir=	 --port=6006  --reload_interval 5

```
然后浏览器打开：

http://localhost:6006


（如果你是在远程服务器上跑的，就要用 ` ssh -L 6006:localhost:6006`  来端口转发）
```
ssh -L 6006:localhost:6006
```


# Test
单 gpu
```
python test.py --cfg_file ${CONFIG_FILE} --ckpt ${CKPT}
```

多gpu
```
sh scripts/dist_test.sh ${NUM_GPUS} --cfg_file ${CONFIG_FILE} --ckpt ${CKPT}
```