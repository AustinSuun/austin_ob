---
日期: 2025-04-25
作者:
  - Austin
tags:
  - git
---
# 基础使用
第一次使用 git，需要进行一些简单设置，方便提交代码
## 设置邮箱、用户名
```shell
git config --global user.main "邮箱"
git config --global user.main "名字"
```

## 设置 ssh 连接
生成 ssh key
```shell
ssh-keygen -t rsa -b 4096 -C "你的邮箱@example.com"
```
- -C 是注释，通常写邮箱方便识别
生成过程一直回车，不要设置密码

把 key 复制到github，首先查看key
```shell
cat ~/.ssh/id_ed25519.pub
```
打开 https://github.com/settings/keys
添加一下key

测试是否配置成功
```shell
ssh -T git@github.com
```
成功会看到
```shell
Hi 用户名! You've successfully authenticated, but GitHub does not provide shell access.
```

## 设置本地仓库连接到远程
也可以下载仓库的时候使用 ssh 下载，会自动连接到 ssh 连接
如果使用 https 下载会自动连接到 https
```shell
git remote set-url origin git@github.com:用户名/仓库名.git
```



# git pull


# git push

# git merge

# git switch

`git switch 分支名字` ——切换分支
`git switch -c 新分支名称` ——创建并且切换分支

