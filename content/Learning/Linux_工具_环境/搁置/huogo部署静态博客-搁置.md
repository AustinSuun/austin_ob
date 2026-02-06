---
日期: 2025-04-25
作者:
  - Austin
tags:
  - hugo
  - blog
  - 搁置
  - 废弃
---
>首先把 md 文件上传到 github，然后 github 使用 Action 自动流程操作把 md 转换成 html ，最后显示在 github-page 中把 hugo 搭建的博客显示出来，也可以使用自定义域名

# 安装 hugo
ArchLinux 使用 AUR 安装即可
```shell
yay -S hugo
```

# 创建一个 hugo 网站
```
hugo new site myblog
cd myblog
```
# 添加一个主题
可以在 [https://themes.gohugo.io/](https://themes.gohugo.io/) 找一个喜欢的主题
我使用 [https://themes.gohugo.io/themes/hugo-theme-cleanwhite/](https://themes.gohugo.io/themes/hugo-theme-cleanwhite/)
安装主题
```
git init
git submodule add https://github.com/zhaohuabing/hugo-theme-cleanwhite.git themes/hugo-theme-cleanwhite
```
# 本地运行网站
```
hugo serve -t  hugo-theme-cleanwhite
```
会提供一个本地网址，打开可以预览


- [ ] 部署到 github，问题出现在使用的博客主题需要使用其他的服务，会增加部署的复杂难度，暂时搁置