---
title: firekylin及服务器搭建过程记录
date: 2016-06-16 14:28:15
tags: ["firekylin", "blog搭建"]
category: ETC
---

断断续续两天的时间，由之前的 wordpress 切换到 firekylin，记录一下配置过程。
大致过分以下几步：

- 安装 CentOS 系统
- 搭建 Nginx（考虑到我的服务器上不只要跑一套网站，这里采用了虚拟主机面板 Wdcp）
- 安装 mysql 数据库（WDCP 面板已涵盖，不做阐述）
- 配置 Ftp 工具（WDCP 面板已涵盖，不做阐述）
- 安装 nodeJS
- 安装 Pm2
- 安装 firekylin
- 配置 PM2
- 配置 nginx

<!--more-->

## 安装 CentOS

由于服务器是阿里云，可在阿里云控制台傻瓜式切换操作系统，我这里选择了公共镜像 CentOS X64

注：其他的主机供应商安装系统可自行百度

## 搭建 nginx

单独搭建 nginx 请自行百度，我这里使用的 wdcp,安装命令如下：

```
wget http://dl.wdlinux.cn:5180/lanmp_laster.tar.gz
tar zxvf lanmp_laster.tar.gz
sh install.sh
```

安装完 wdcp 主机面板，可通过浏览器访问：ip:8080
默认用户名：admin
密码：wdlinux.cn

进入到后台，在 mysql 管理中打开 PHPmyadmin 工具，新建数据库，后边会使用到。

## 安装 nodeJS

安装 nodeJS 的方法有多种，更多方法自行百度，我使用的 yum 安装方法
直接在服务器命令行终端敲入一下命令：

```
yum install nodejs
```

稍等片刻，即可自行安装完毕

```
node -v
```

查看下 node 版本，版本如果过低，需要升级 nodeJS 版本，升级 nodeJS 可使用 npm 安装 n 模块，如果 nodeJS 安装完没有 npm,需要先安装 npm 包管理工具。安装 n 模块，敲入一下命令：

```
npm install -g n
```

升级 nodejs

```
n stable
```

n 后面也可以跟随版本号比如：

```
n v0.10.26
```

或

```
n 0.10.26
```

至此，nodeJS 安装完毕

## 安装 pm2

在服务器上推荐使用 pm2`来管理 Node.js 服务，可以通过以下命令来安装 pm2。

```
sudo npm install -g pm2
```

至此，所有需要的工具软件安装完毕，接下来是配置过程。

## 安装 firekylin

- 安装方式一

下载到本地，下载链接传送门：[firekylin](http://firekylin.org/release/firekylin_0.12.4.tar.gz)，下载完毕后，通过 FTP 工具上传至服务器。

- 安装方式二

通过远程服务器链接终端，直接下载并解压缩，命令如下：

```
wget http://firekylin.org/release/firekylin_0.12.4.tar.gz
tar xvf firekylin_0.12.4.tar.gz
```

`ls -l `查看当前目录，会看到解压缩之后的`firekylin`，`cd firekylin_0.12.4/firekylin`，切换至压缩之后的源码目录，在这个目录下会看到 pakeage.json 文件，通过 npm 安装依赖包，在这个目录下敲入一下命令：

```
npm install
```

等待，等待~~~~
安装完毕后，启动服务，输入命令：

```
npm start
```

服务启动之后，然后访问 127.0.0.1:8360（服务器是 IP，本地是本地的 IP），根据提示填写相关信息进行安装。
注：数据库一栏可填入我们之前的通过 phpMyadmin 创建的数据库名称。

此时，firekylin 便搭建并运行起来了，可通过：IP：8360 进行访问。

## 配置 PM2

在服务器上推荐使用 pm2 来管理 Node.js 服务，将项目下的 pm2_default.json 文件改为 pm2.json，将文件中的 cwd 配置值改为项目的当前路径。

然后通过以下命令来启动项目。

```
pm2 start pm2.json
```

## 配置 nginx

将项目下的 nginx_default.conf 改为 nginx.conf，修改文件中的 `server_name`、`root` 和 `set $node_port` 等配置值，然后将该文件软链到 nginx 的配置目录下。

假设 nginx 的配置目录为` /usr/local/nginx/conf/include`，那么可以通过下面的命令设置软链：

```
sudo ln -s path/to/nginx.conf /usr/local/nginx/conf/include/www.mnzone.com.conf
```

需要将` path.to` 改为当前的项目路径，` www.mnzone.com` 改为对应的域名。

需要注明的是：wdcp 的 nginx 配置目录，在 vhost 目录下。
