# 高德地图浏览器端通用方法.
此文件的方法均隶属于 AmapApp.browserApi 对象<br/>判断公网测试网方法需要按实际情况调整<br/>支持 AMD 规范调用

## 方法

1. [aosJsonp](#aosJsonp) 通过wb服务进行签名转发aos请求.
1. [openAmapBanner](#openAmapBanner) 使用高德地图打开在线页面.
1. [openWeixinPrompt](#openWeixinPrompt) 打开带有呼起和提示功能的页面.
1. [weixinShare](#weixinShare) 设置微信端分享内容.
1. [weixinShareConfig](#weixinShareConfig) 设置微信端分享内容.

<br/>
### aosJsonp
通过wb服务进行签名转发aos请求.

**概要**

aosJsonp(urlname,param,callback,data)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|urlname|String|是| |aos服务url|
|param|Array.&lt;Objecrt&gt;|是| |请求参数，与客户端中请求参数相同|
|callback|Function|是| |回调函数|
|data|*|否| |此参数会原封不动的传入回调函数的第二个参数|
<br/>
### openAmapBanner
使用高德地图打开在线页面.

**概要**

openAmapBanner(url)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|url|String|是| |在线页面url|
<br/>
### openWeixinPrompt
打开带有呼起和提示功能的页面.

**概要**

openWeixinPrompt(url,title)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|url|String|是| |呼起高德地图后打开的地址|
|title|String|是| |跳转页面显示title|

**描述**

页面先尝试呼起高德地图，失败后停留在提示用浏览器打开的页面，并展示下载按钮
<br/>
### weixinShare
设置微信端分享内容.

**概要**

weixinShare(content,handler)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|content|Array.&lt;Object&gt;|是| |分享配置，同native|
|handler|Function|是| |分享成功后的回调函数<br/>   参数同native|
<br/>
### weixinShareConfig
设置微信端分享内容.

**概要**

weixinShareConfig(content,handler)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|content|Array.&lt;Object&gt;|是| |分享配置，同native|
|handler|Function|是| |分享成功后的回调函数<br/>   参数同native|
