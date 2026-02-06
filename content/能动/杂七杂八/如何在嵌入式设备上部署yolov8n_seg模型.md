---
Date: 2025-11-11T20:53:00
作者:
  - Austin Suun
tags:
链接:
---

> [!NOTE] 简要介绍
> 

在将模型部署到开发版上之前，我们要确定需要识别的目标，训练好能够准确识别的模型

YOLO 手册：
https://docs.ultralytics.com/zh/

Ultralytics YOLO 提供了方便的训练工具，以及yolov 8 、9、11 等预训练模型，针对各种任务提供了不同网络规模的模型

对于嵌入式部署，受边缘设备算力的限制，只能选择最小的模型，通常用 n 作为后缀表示，如 yolov 8n

# 使用 Ultralytics YOLO 进行训练

使用Ultralytics YOLO 进行训练，最重要的工作是准备好数据集，针对识别任务收集真实任务场景下的视频/图片。然后我们在预训练YOLO模型上进行训练

> 安装Ultralytics YOLO ，见手册或 https://github.com/ultralytics/ultralytics


## 数据集制作
有了原始数据，我们就要对图像进行标注。标注工具的选择对标注工作的效率影响非常大

使用图像数据标注工具，我们可以在图片上画框/画出区域来标注数据。标注完成后，标注工具可以自动生成数据集的格式

常见的图像数据标注工具有：
- LabelImg
- LabelMe
- CVAT (Computer Vision Annotation Tool)
- Supervisely
- MakeSense.ai
- VGG Image Annotator (VIA)
- Label Studio
- ....

以上的工具我们都没有使用过，由于我们手动标注也不会标注超过万张图片，这里推荐使用 [ROBOflow](https://app.roboflow.com/)，其中免费的额度已经能够支撑多个较小的项目的消耗，其主要优势有：
- 支持多人在线标注（最多 3 人，网页标注，需要网络比较好）
- 标注过程中有 AI 辅助，降低标注辛苦程度
- 标注好的数据集，可以一见导出 yolo 支持的格式
- 创建好数据集，网站会自动训练一个模型，可以快速查看数据集在模型上的表现（训练约 40 分钟）

> 具体使用流程问 AI，使用很简单


## 训练 yolo模型
创建好数据集之后，就可以直接进行训练了，构建好项目的目录，将数据集对应放入，目录结构如下

```bash
yolov8_project/
├── data/                   # 数据集目录
│       ├── images/
│       ├── train/          # 训练图片
│       ├── val/            # 验证图片
│       └── test/           # 可选，测试图片
├── labels/                 # 可选，YOLOv5分割也可放标签
│   ├── train/
│   ├── val/
│   └── test/
├── yolov8n-seg.pt           # 预训练权重文件（下载的官方模型,这个会自动下载，一开始没有不要紧）
└── train.py                 # 训练脚本（这个是自己需要自己写的训练脚本，下面有）

```

训练脚本参考：
```python

```

测试脚本参考：
```python


```

这样训练好模型之后，就可以得到模型的 `.pt` 权重文件



## 转换模型格式
部署到开发版上的模型权重，需要转换为边缘设备支持的模型格式

通常转换为通用格式 `onnx`

Yolo 工具自带转换量化的工具：注意不要启用动态+   选项
```
yolo export model=runs/seg/train/weights/best.Pt   format=onnx  
```

## 模型量化
部署到开发板上，还要进行模型量化（int 8 量化），才能让模型在性能比较差的开发版上跑起来。同时量化训练可以微调模型，拯救一点因为量化导致的精度损失。量化方式有：

**量化训练 QAT** 是将训练过的模型量化后又再进行重训练。由于定点数值无法用于反向梯度计算，实际操作过程是在某些 op 前插入伪量化节点（fake quantization nodes），用于在训练时获取流经该 op 的数据的截断值，便于在部署量化模型时对节点进行量化时使用。我们需要在训练中通过不断优化精度来获取最佳的量化参数。由于它需要对模型进行训练, 对操作人员技术要求较高。

**训练后量化 PTQ** 是使用一批校准数据对训练好的模型进行校准，将训练过的 FP 32 模型直接转换为定点计算的模型，过程中无需对原始模型进行任何训练。只对几个超参数调整就可完成量化过程，且过程简单快速，无需训练，因此此方法已被广泛应用于大量的端侧和云侧部署场景， **我们优先推荐您尝试 PTQ 方法来查看是否满足您的部署精度和性能要求** 。

通常先使用 PTQ 量化快速部署，这里根据开发板（RDK X3）的手册介绍，使用其提供的 PTQ 工具


[量化操作手册](https://developer.d-robotics.cc/api/v1/fileData/horizon_j5_open_explorer_cn_doc/oe_mapper/source/ptq/ptq_workflow.html#)

这里有 yolov 8 n_seg 的 yaml 配置样例：[yaml 配置](https://github.com/D-Robotics/rdk_model_zoo/tree/main/demos/Seg/YOLOv8-Seg)

生成校准文件的脚本：[校准生成](https://github.com/D-Robotics/rdk_model_zoo/tree/main/demos/tools/generate_calibration_data)

一个在 x 5 上运行的 yolov 8 n_seg 的案例：[案例](https://forum.d-robotics.cc/t/topic/28022)



**反量化技术**(参考案例)

查看可移除的反量化节点（即没有使用量化的计算节点，这里也转换为 int 8 量化，提高计算效率）
```
cd yolov8n_seg_output

hb_model_modifier yolov8n_seg_640x640_nv12.bin
```

在生成的hb_model_modifier.log文件中，找到以下信息。主要是找到大小为[1, 160, 160, 32]、[1, 80, 80, 64]、[1, 80, 80, 32]、[1, 40, 40, 64]、[1, 40, 40, 32]、[1, 20, 20, 64]、[1, 20, 20, 32] 这几个输出的名称(即除了分类以外的所有输出)。当然，也可以通过netron等工具查看onnx模型，获得输出头的名称。 此处的名称为:

```
347_HzDequantize
/model.22/cv2.0/cv2.0.2/Conv_output_0_HzDequantize
/model.22/cv4.0/cv4.0.2/Conv_output_0_HzDequantize
/model.22/cv2.1/cv2.1.2/Conv_output_0_HzDequantize
/model.22/cv4.1/cv4.1.2/Conv_output_0_HzDequantize
/model.22/cv2.2/cv2.2.2/Conv_output_0_HzDequantize
/model.22/cv4.2/cv4.2.2/Conv_output_0_HzDequantize
```

使用以下命令移除上述反量化节点，注意, 量化后导出时这些名称可能不同, 请仔细确认后再移除。
```
hb_model_modifier yolov8n_seg_640x640_nv12.bin -r “347_HzDequantize” -r “/model.22/cv2.0/cv2.0.2/Conv_output_0_HzDequantize” -r “/model.22/cv4.0/cv4.0.2/Conv_output_0_HzDequantize” -r “/model.22/cv2.1/cv2.1.2/Conv_output_0_HzDequantize” -r “/model.22/cv4.1/cv4.1.2/Conv_output_0_HzDequantize” -r “/model.22/cv2.2/cv2.2.2/Conv_output_0_HzDequantize” -r “/model.22/cv4.2/cv4.2.2/Conv_output_0_HzDequantize”
```

移除后会成功显示以下日志