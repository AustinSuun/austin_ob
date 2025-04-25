---
日期: 2025-04-25
作者:
  - Austin
tags:
  - DataView
---
# 最简单的 DataView

这里三引号 使用 ’  代替
```
’‘’dataview
LIST
‘’‘
```

💡这个查询的意思是「列出所有笔记的文件名」，就这么简单。没指定什么路径、条件、排序，它就会把所有笔记列出来。

__其他参数__
```markdown
''' dataview
LIST [字段]
FROM [路径]
WHERE [条件]
SORT [字段] [升序/降序]
LIMIT [数量]
'''
```

__每个参数的可选项__

1. LIST [字段]
- 不写字段 → 默认显示文件名
- 可选字段：文件内的变量名，比如 `title`, `date`, `tags`, 自定义的 `状态::` 等

📌 例子：

```
'''markdown
LIST date
'''
```
这里筛选出 含有data字段的md文件，字段是文件开头的yaml标记或者文章中间的行内标记

2. FROM [路径]
- 表示从哪个文件夹下查找笔记
- 可以是文件夹名字、tag、甚至嵌套文件夹

📌 示例：
`FROM "读书笔记"`  →   表示只查找 `读书笔记/` 文件夹下的内容
`FROM #任务`    →     表示查找带有 `#任务` 标签的笔记

3. WHERE [条件]
- 用来筛选数据，比如 tag、是否有某个字段、日期范围等等
- 可以用 `!=`、`>`、`<` `contains()` 等条件

📌 示例：
`WHERE date >= date(2025-01-01)`    →     只列出 2025 年以后的笔记
`WHERE contains(tags, "读书")`    →     标签里包含 “读书” 的笔记

4. SORT [字段] 升序/降序

- 按某个字段排序
- 默认升序 (`ASC`)，也可以写 降序(`DESC`)

📌 示例：
`SORT date DESC`    →     按时间从新到旧排序

5. LIMIT [数字]

- 限制显示数量

📌 示例

`LIMIT 10`    →     最多显示 10 条记录


# 完整的例子

```dataview
table 日期
FROM "工具"
WHERE contains(tags, "DataView")
SORT date DESC
LIMIT 5

```
