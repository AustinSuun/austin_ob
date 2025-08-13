---
日期: 2025-08-11
作者:
  - Austin
tags:
---

# 循序渐进
## 第一步：基础设置

首先创建一个 `.typ` 文件，添加基本设置：

```typst
#set page(width: 15cm, height: auto, margin: 1cm)
#set text(font: "Arial", size: 11pt)

= Typst 绘图学习
```

## 第二步：导入绘图库

Typst 使用 CeTZ 库进行绘图，需要先导入：

```typst
#import "@preview/cetz:0.2.2": canvas, draw
```

## 第三步：创建第一个画布

```typst
= 第一个图形

#canvas(length: 1cm, {
  // 在这里写绘图代码
})
```

## 第四步：基础图形 - 点和线

### 4.1 画点

```typst
#canvas(length: 1cm, {
  draw.circle((0, 0), radius: 0.05, fill: black)  // 在原点画一个小圆点
  draw.circle((1, 1), radius: 0.05, fill: red)    // 在(1,1)画红点
})
```

### 4.2 画直线

```typst
#canvas(length: 1cm, {
  draw.line((0, 0), (2, 1))              // 从(0,0)到(2,1)的直线
  draw.line((0, 1), (2, 0), stroke: red) // 红色直线
})
```

### 4.3 画多段线

```typst
#canvas(length: 1cm, {
  draw.line((0, 0), (1, 1), (2, 0), (3, 1))  // 连续的线段
})
```

## 第五步：基础形状

### 5.1 矩形

```typst
#canvas(length: 1cm, {
  draw.rect((0, 0), (2, 1))                    // 空心矩形
  draw.rect((3, 0), (5, 1), fill: blue)       // 蓝色填充矩形
})
```

### 5.2 圆形

```typst
#canvas(length: 1cm, {
  draw.circle((1, 1), radius: 0.5)             // 空心圆
  draw.circle((3, 1), radius: 0.5, fill: green) // 绿色填充圆
})
```

### 5.3 椭圆

```typst
#canvas(length: 1cm, {
  draw.arc((1, 1), start: 0deg, stop: 360deg, radius: (1, 0.5)) // 椭圆
})
```

## 第六步：样式设置

### 6.1 线条样式

```typst
#canvas(length: 1cm, {
  draw.line((0, 0), (2, 0), stroke: (thickness: 2pt))        // 粗线
  draw.line((0, 0.5), (2, 0.5), stroke: (dash: "dashed"))    // 虚线
  draw.line((0, 1), (2, 1), stroke: (paint: red, thickness: 1pt)) // 红色细线
})
```

### 6.2 填充和边框

```typst
#canvas(length: 1cm, {
  draw.rect((0, 0), (1, 1), 
    fill: blue.transparentize(50%),  // 半透明蓝色填充
    stroke: (paint: red, thickness: 2pt) // 红色边框
  )
})
```

## 第七步：文本标注

```typst
#canvas(length: 1cm, {
  draw.circle((1, 1), radius: 0.5, fill: lightblue)
  draw.content((1, 1), [圆心])  // 在圆心添加文本
  draw.content((1, 0.2), [半径 = 0.5], anchor: "center") // 底部文本
})
```

## 第八步：坐标系和网格

```typst
#canvas(length: 1cm, {
  // 绘制网格
  for i in range(0, 5) {
    draw.line((i, 0), (i, 4), stroke: gray)
    draw.line((0, i), (4, i), stroke: gray)
  }
  
  // 绘制坐标轴
  draw.line((0, 0), (4, 0), stroke: (thickness: 2pt), mark: (end: ">"))
  draw.line((0, 0), (0, 4), stroke: (thickness: 2pt), mark: (end: ">"))
  
  // 标注
  draw.content((4, -0.3), [x])
  draw.content((-0.3, 4), [y])
})
```

## 第九步：组合图形

```typst
#canvas(length: 1cm, {
  // 画一个房子
  draw.rect((1, 0), (3, 2), fill: yellow)      // 房身
  draw.line((0.5, 2), (2, 3.5), (3.5, 2))     // 屋顶
  draw.rect((1.5, 0), (2.5, 1.2), fill: brown) // 门
  draw.circle((1.2, 1.5), radius: 0.15, fill: lightblue) // 窗户
  draw.circle((2.8, 1.5), radius: 0.15, fill: lightblue) // 窗户
})
```

## 第十步：数学图形

### 10.1 函数图像

```typst
#canvas(length: 1cm, {
  import draw: *
  
  // 坐标轴
  line((-2, 0), (2, 0), mark: (end: ">"))
  line((0, -1), (0, 3), mark: (end: ">"))
  
  // y = x² 函数
  let points = ()
  for i in range(-20, 21) {
    let x = i / 10
    let y = x * x
    points.push((x, y))
  }
  line(..points, stroke: red)
})
```

## 练习建议

1. **先复制粘贴每个例子到你的 `.typ` 文件中运行**
2. **修改参数看看效果**：改变颜色、大小、位置
3. **组合不同图形**：试着画出自己想要的图案
4. **逐步增加复杂度**：从简单图形到复杂图形

## 下一步学习

当你掌握了基础后，可以学习：

- 动画效果
- 3D 图形
- 复杂的数学图形
- 图表和数据可视化

每个例子都建议你亲自运行一遍，然后尝试修改参数来理解每个功能的作用。



# Typst 动画效果教程

## 前置知识

在 Typst 中，动画主要通过以下方式实现：

1. **循环生成多个帧**
2. **使用数学函数控制变化**
3. **条件判断创建不同状态**

## 第一步：基础设置

```typst
#set page(width: 15cm, height: auto, margin: 1cm)
#import "@preview/cetz:0.2.2": canvas, draw
#import calc: sin, cos, pi

= Typst 动画效果学习
```

## 第二步：理解动画原理

动画 = 多个静态图片的连续播放

- 每个图片是一"帧"
- 通过改变参数创建不同的帧
- 使用循环生成多个帧

## 第三步：简单的位置动画

### 3.1 水平移动的圆点

```typst
= 水平移动动画

#for i in range(6) {
  let x = i * 0.5  // x 坐标随 i 变化
  [第#{i+1}帧:]
  canvas(length: 1cm, {
    draw.circle((x, 0), radius: 0.2, fill: red)
    // 画参考线
    draw.line((0, -0.5), (3, -0.5), stroke: gray)
  })
}
```

### 3.2 垂直移动的方块

```typst
= 垂直移动动画

#for i in range(5) {
  let y = i * 0.4
  [帧 #{i+1}:]
  canvas(length: 1cm, {
    draw.rect((0, y), (0.5, y + 0.5), fill: blue)
    // 画参考线
    draw.line((-0.2, 0), (-0.2, 2.5), stroke: gray)
  })
}
```

## 第四步：使用三角函数的周期动画

### 4.1 正弦波动画

```typst
= 正弦波摆动

#for i in range(8) {
  let angle = i * pi / 4  // 角度递增
  let y = sin(angle)      // y 坐标按正弦变化
  
  [帧 #{i+1}, 角度: #{calc.round(angle * 180 / pi, digits: 0)}°]
  canvas(length: 1cm, {
    draw.circle((1, y), radius: 0.15, fill: green)
    // 画中线
    draw.line((0, 0), (2, 0), stroke: gray)
    // 显示角度
    draw.content((1, -1.5), [y = #{calc.round(y, digits: 2)}])
  })
}
```

### 4.2 圆周运动

```typst
= 圆周运动动画

#for i in range(8) {
  let angle = i * pi / 4
  let x = cos(angle)
  let y = sin(angle)
  
  [帧 #{i+1}:]
  canvas(length: 1cm, {
    // 画轨道圆
    draw.circle((0, 0), radius: 1, stroke: gray)
    // 画运动点
    draw.circle((x, y), radius: 0.1, fill: purple)
    // 画半径线
    draw.line((0, 0), (x, y), stroke: red)
  })
}
```

## 第五步：大小变化动画

### 5.1 脉冲效果

```typst
= 脉冲动画

#for i in range(6) {
  let scale = 0.3 + 0.2 * sin(i * pi / 2)  // 半径在 0.1 到 0.5 间变化
  
  [帧 #{i+1}:]
  canvas(length: 1cm, {
    draw.circle((1, 1), radius: scale, fill: orange.transparentize(30%))
    draw.content((1, 0), [半径: #{calc.round(scale, digits: 2)}])
  })
}
```

### 5.2 呼吸效果矩形

```typst
= 呼吸动画

#for i in range(8) {
  let size = 0.5 + 0.3 * cos(i * pi / 3)
  
  [帧 #{i+1}:]
  canvas(length: 1cm, {
    draw.rect((1-size/2, 1-size/2), (1+size/2, 1+size/2), 
      fill: blue.transparentize(40%),
      stroke: blue)
    draw.content((1, 0.2), [边长: #{calc.round(size, digits: 2)}])
  })
}
```

## 第六步：旋转动画

### 6.1 旋转的线条

```typst
= 旋转动画

#for i in range(8) {
  let angle = i * pi / 4
  let end_x = cos(angle)
  let end_y = sin(angle)
  
  [帧 #{i+1}:]
  canvas(length: 1cm, {
    draw.circle((0, 0), radius: 0.05, fill: black)  // 中心点
    draw.line((0, 0), (end_x, end_y), stroke: (thickness: 2pt, paint: red))
    draw.content((0, -1.5), [角度: #{calc.round(angle * 180 / pi, digits: 0)}°])
  })
}
```

### 6.2 旋转的方块

```typst
= 方块旋转

#for i in range(6) {
  let angle = i * pi / 6
  
  [帧 #{i+1}:]
  canvas(length: 1cm, {
    // 使用旋转变换
    draw.group({
      draw.rotate(angle * 180deg / pi)
      draw.rect((-0.3, -0.3), (0.3, 0.3), fill: cyan, stroke: black)
    })
  })
}
```

## 第七步：复合动画

### 7.1 同时移动和旋转

```typst
= 复合动画：移动+旋转

#for i in range(8) {
  let x = i * 0.3
  let angle = i * pi / 3
  
  [帧 #{i+1}:]
  canvas(length: 1cm, {
    draw.group({
      draw.translate((x, 1))  // 移动
      draw.rotate(angle * 180deg / pi)  // 旋转
      draw.rect((-0.2, -0.2), (0.2, 0.2), fill: magenta)
    })
    // 画轨迹线
    draw.line((0, 1), (2.5, 1), stroke: gray)
  })
}
```

### 7.2 弹跳球

```typst
= 弹跳球动画

#for i in range(12) {
  let x = i * 0.2
  let y = calc.abs(sin(i * pi / 3))  // 绝对值产生弹跳效果
  
  [帧 #{i+1}:]
  canvas(length: 1cm, {
    draw.circle((x, y), radius: 0.15, fill: red)
    // 画地面
    draw.line((0, 0), (3, 0), stroke: (thickness: 2pt))
    // 画轨迹
    for j in range(i + 1) {
      let old_x = j * 0.2
      let old_y = calc.abs(sin(j * pi / 3))
      draw.circle((old_x, old_y), radius: 0.02, fill: gray)
    }
  })
}
```

## 第八步：颜色变化动画

### 8.1 色相循环

```typst
= 颜色变化动画

#for i in range(6) {
  let hue = i * 60  // 色相角度
  let color = color.hsl(hue * 1deg, 80%, 60%)
  
  [帧 #{i+1}, 色相: #{hue}°:]
  canvas(length: 1cm, {
    draw.circle((1, 1), radius: 0.4, fill: color)
    draw.content((1, 0.2), [HSL(#{hue}°, 80%, 60%)])
  })
}
```

## 第九步：实用技巧

### 9.1 控制动画速度

```typst
// 慢动画：小步长
#for i in range(20) {
  let x = i * 0.1  // 小步长 = 慢动画
}

// 快动画：大步长  
#for i in range(5) {
  let x = i * 0.8  // 大步长 = 快动画
}
```

### 9.2 循环动画

```typst
= 无限循环效果

#for i in range(12) {
  let angle = (i * 30) % 360  // 使用模运算创建循环
  // 或使用三角函数天然的周期性
  let y = sin(i * pi / 6)
}
```

### 9.3 缓动效果

```typst
= 缓动动画

#for i in range(10) {
  // 线性运动
  let linear = i / 9
  
  // 缓入缓出（平滑）
  let smooth = (1 - cos(linear * pi)) / 2
  
  [帧 #{i+1}:]
  canvas(length: 1cm, {
    draw.circle((linear * 2, 0), radius: 0.1, fill: red)
    draw.circle((smooth * 2, 0.5), radius: 0.1, fill: blue)
  })
}
```

## 第十步：实际项目示例

### 10.1 加载动画

```typst
= 加载动画效果

#for i in range(8) {
  [帧 #{i+1}:]
  canvas(length: 1cm, {
    for j in range(8) {
      let angle = j * pi / 4
      let x = 0.8 * cos(angle)
      let y = 0.8 * sin(angle)
      let opacity = if (j + i) % 8 < 3 { 100% } else { 20% }
      draw.circle((x, y), radius: 0.1, fill: blue.transparentize(100% - opacity))
    }
  })
}
```

## 学习建议

1. **从简单开始**：先掌握位置变化，再学复杂效果
2. **理解数学函数**：sin, cos 是动画的基础
3. **调试参数**：多试不同的数值，观察效果变化
4. **组合效果**：单个效果掌握后，尝试组合多种变化

## 导出动画

Typst 本身生成静态 PDF，如需真正的动画文件：

1. 导出每帧为单独图片
2. 使用外部工具合成 GIF 或视频
3. 或者在网页中用 JavaScript 播放这些帧

每个示例都建议你运行一遍，然后尝试修改参数来理解动画的工作原理！