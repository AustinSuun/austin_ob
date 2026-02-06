---
日期: 2025-11-08T12:31:00
作者:
  - Austin
tags:
---
下载该工具，在服务器上

使用命令
```
# 映射 SSH
ngrok tcp 22

# 输出类似：
# Forwarding tcp://4.tcp.ngrok.io:12345 -> localhost:22

# 在其他电脑连接：
# ssh username@4.tcp.ngrok.io -p 12345
```

映射