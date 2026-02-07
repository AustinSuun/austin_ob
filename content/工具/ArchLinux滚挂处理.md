---
日期: 2025-05-22
作者:
  - Austin
tags:
---
系统滚挂了之后紧急修复记录

首先需要一个有系统镜像的 U 盘，装系统的那个就行

主要把系统盘挂载 U 盘系统中，然后更新。要在镜像更新了修复之后才有作用

- 首先查看硬盘信息找到 Linux 系统的根目录分区名称，使用
```
lsblk -f
```
或
```
lsblk 
```

- 挂载根目录到 U 盘镜像的 `/mnt` 目录
```
sudo mount -o subvol=@   /dev/根目录的硬盘分区  /mnt
```

- 进入系统
```
sudo arch-chroot   /mnt
```

- 更新|修复即可
```
sudo pacman -Syu
```