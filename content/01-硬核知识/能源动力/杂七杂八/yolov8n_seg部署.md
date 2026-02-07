---
Date: 2025-11-10T20:37:00
作者:
  - Austin Suun
tags:
链接:
---

> [!NOTE] 简要介绍
> 


# 训练模型

直接使用 yolo 提供的工具训练，只需要准备好数据集

# 模型量化
使用 yolo 的工具导出 onnx 格式的模型

```
yolo export model=runs/seg/train/weights/best. Pt  format=onnx  
```

不需要进行**量化训练**（QAT）
# 模型部署

## 硬件支持
可能需要 x 5，在官方文档没有 x 3



# X 3 上部署 yolov 8 n_seg 的可能性

https://www.electroniclinic.com/rdk-x5-high-performance-yolo-model-deployment-on-a-budget/?utm_source=chatgpt.com

X 3:
支持所有传统视觉模型的量化转换和 BPU 加速，包括 YOLOv5 至 YOLOv12、Vision Transformer 等。YOLOv5s(int8)：38 FPS；
YOLOv8n(int8)：34 FPS；
YOLO11n(int8+FP32)：5 FPS




```
import gradio as gr
import cv2
from fastdeploy.vision import segmentation
import fastdeploy as fd

# FastDeploy 模型
runtime_option = fd.RuntimeOption()
runtime_option.use_cpu()  # 或 GPU
model = segmentation.YOLOv8Seg("best.onnx", runtime_option=runtime_option)

def infer(img):
    result = model.predict(img)
    model.visualize(img, result, "out.jpg")
    return cv2.imread("out.jpg")

gr.Interface(fn=infer, inputs="image", outputs="image",
             title="YOLOv8nSeg Demo").launch()

```

```
pyinstaller --onefile app.py

```


```
pyinstaller --onefile --add-data "best.onnx;." app.py

```


```
import sys
import os

if getattr(sys, 'frozen', False):
    # 打包成 exe 后
    model_path = os.path.join(sys._MEIPASS, "best.onnx")
else:
    # 普通运行
    model_path = "best.onnx"

from fastdeploy.vision import segmentation
import fastdeploy as fd

runtime_option = fd.RuntimeOption()
runtime_option.use_cpu()
model = segmentation.YOLOv8Seg(model_path, runtime_option=runtime_option)

```