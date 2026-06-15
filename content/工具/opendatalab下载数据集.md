---
日期: 2026-02-14T14:48:00
作者:
  - Austin
tags:
draft: false
---
> [!简短介绍]
> OpenDataLab 是由上海人工智能实验室（Shanghai AI Lab）打造的 **AI 数据集“中央大仓库”**，它把各种散落在海外、难下的顶会数据集都进行了标准化整理，让你能通过一行命令实现极速搬运，堪称炼丹师们的“数据集直达特快”。
# KITTI 下载

[KITTI](https://opendatalab.com/OpenDataLab/KITTI_Object/cli/main)

```shell
pip install openxlab #安装

pip install -U openxlab #版本升级

openxlab login # 进行登录，输入对应的AK/SK，可在[个人中心](https://opendatalab.com/datasets/#)添加AK/SK

openxlab dataset info --dataset-repo OpenDataLab/KITTI_Object # 数据集信息及文件列表查看

openxlab dataset get --dataset-repo OpenDataLab/KITTI_Object #数据集下载

openxlab dataset download --dataset-repo OpenDataLab/KITTI_Object --source-path /README.md --target-path /path/to/local/folder #数据集文件下载
```

该数据集大小 110 G 左右，在 openpcdet 中使用的 KITTI 数据集不需要这么多的数据，只需要其中一部分数据

1. 先登录
```bash
# 1. 安装 openxlab
python -m pip install openxlab
# 2. 如果需要升级版本（这一步可以跳过，如果你刚装完就是最新版）
python -m pip install -U openxlab
openxlab login # 进行登录，输入对应的AK/SK，可在[个人中心](https://opendatalab.com/datasets/#)添加AK/SK
```

2. 下载只需要的数据
```bash
# 定义需要下载的文件列表（基于 OpenDataLab 的 /raw/ 路径）
FILES=(
  "/raw/data_object_velodyne.zip" 
  "/raw/data_object_calib.zip" 
  "/raw/data_object_label_2.zip"
)

# 循环按序下载
for FILE in "${FILES[@]}"
do
  echo "----------------------------------------------------"
  echo "正在启动下载: $FILE"
  openxlab dataset download --dataset-repo OpenDataLab/KITTI_Object \
                            --source-path "$FILE" \
                            --target-path /gemini/data/
done
```

3. 解压
```bash
cd /gemini/data/
mkdir -p kitti

# 1. 处理点云 (最大，约 26.8G)
unzip data_object_velodyne.zip -d kitti/ && rm data_object_velodyne.zip

# 2. 处理标定
unzip data_object_calib.zip -d kitti/ && rm data_object_calib.zip

# 3. 处理标签
unzip data_object_label_2.zip -d kitti/ && rm data_object_label_2.zip
```




# Kaggle

```
export KAGGLE_API_TOKEN=<your_kaggle_api_token>

kaggle competitions list
```



# 解压测试集图片
7 z e image_testing. Zip -o./kitti/testing/image_2 'testing/image_2/*' -y

# 解压训练集点云分卷 (1-3)
7 z e velodyne_training_1. Zip -o./kitti/training/velodyne 'training/velodyne/*' -y
7 z e velodyne_training_2. Zip -o./kitti/training/velodyne 'training/velodyne/*' -y
7 z e velodyne_training_3. Zip -o./kitti/training/velodyne 'training/velodyne/*' -y

# 解压测试集点云分卷 (1-3)
7 z e velodyne_testing_1. Zip -o./kitti/testing/velodyne 'testing/velodyne/*' -y
7 z e velodyne_testing_2. Zip -o./kitti/testing/velodyne 'testing/velodyne/*' -y
7 z e velodyne_testing_3. Zip -o./kitti/testing/velodyne 'testing/velodyne/*' -y


```
# 解压所有 training 分卷到同一个目录
7z e 'velodyne_training_*.zip' -o./kitti/training/velodyne -y

# 解压所有 testing 分卷到同一个目录
7z e 'velodyne_testing_*.zip' -o./kitti/testing/velodyne -y
```
