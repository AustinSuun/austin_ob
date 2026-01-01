---
Date: 2025-11-10T19:58:00
作者:
  - Austin Suun
tags:
链接:
---
Ls


> [!NOTE] 简要介绍
> 


# Tmux 新会话
安装
```
sudo apt install tmux
```

常用命令
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

**用这个，保存和评估所有的训练模型权重**
```
CUDA_VISIBLE_DEVICES=0 python train.py     --cfg_file ./cfgs/kitti_models/second_with_lion_mamba_64dim.yaml     --extra_tag second_with_lion_mamba_64dim     --batch_size 1     --epochs 36     --max_ckpt_save_num 36    --workers 4     --sync_bn --num_epochs_to_eval 36
```

```
 CUDA_VISIBLE_DEVICES=0 python train.py     --cfg_file ./cfgs/kitti_models/second_with_submambav3_64dim.yaml    --extra_tag v3.0      --batch_size 5     --epochs 36     --max_ckpt_save_num 36    --workers 10     --sync_bn --num_epochs_to_eval 36
```

断点继续训练，设置 ckpt
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
单 gpu，设置断点模型
```
python test.py --cfg_file ${CONFIG_FILE} --ckpt ${CKPT}
```

多 gpu，设置断点模型
```
sh scripts/dist_test.sh ${NUM_GPUS} --cfg_file ${CONFIG_FILE} --ckpt ${CKPT}
```
kk


```
CUDA_VISIBLE_DEVICES=0 python train.py     --cfg_file ./cfgs/kitti_models/second_with_submambav1_64dim.yaml    --extra_tag mamba2_0.1      --batch_size 1     --epochs 40     --max_ckpt_save_num 40    --workers 4     --sync_bn --num_epochs_to_eval 40 --ckpt ../output/cfgs/kitti_models/second_with_submambav1_64dim/mamba2_0.1/ckpt/checkpoint_epoch_6.pth 
```


```
 CUDA_VISIBLE_DEVICES=0 python train.py     --cfg_file ./cfgs/kitti_models/second_with_gravity_64dim.yaml    --extra_tag mamba2_0.1      --batch_size 4     --epochs 80     --max_ckpt_save_num 80    --workers 4     --sync_bn --num_epochs_to_eval 80
```

```
python test.py --cfg ./cfgs/kitti_models/second_with_gravity_64dim.yaml --batch_size 4 --workers 4  --extra_tag mamba2_0.1  --ckpt ../output/cfgs/kitti_models/second_with_gravity_64dim/mamba2_0.1/ckpt/checkpoint_epoch_10.pth --eval_tag mamba2_0.1 --eval_all --save_to_file
```


```
CUDA_VISIBLE_DEVICES=0 python train.py     --cfg_file ./cfgs/kitti_models/second_with_gravity2_64dim copy.yaml    --extra_tag v1.0      --batch_size 4     --epochs 80     --max_ckpt_save_num 80    --workers 4     --sync_bn --num_epochs_to_eval 80
```
