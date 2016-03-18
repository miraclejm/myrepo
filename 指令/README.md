# 持续更新 

## 一. 安装  
1.  git clone git@gitlab.alibaba-inc.com:amap-lab/gde.git  
2.  cd gde, 进入项目根目录 运行  
```
npm install
npm link
```  

## 二. 基本命令  
```javascript       
gde init 初始化站点结构 
gde start 启动站点   
gde deploy 发布站点
```
#### 1.  初始化站点结构
a. 进入想要生成目录结构的文件夹         
    运行gde init  会在当前运行目录生成特定的目录结构                               
    或者在任意目录下gde init --path=/xx/xx (绝对路径) 会在path目录下生成特定目录结构        
b. 如果已经存在目录结构，想要引入公用组件，在目录的跟目录下编辑widgets.json文件        
(**** 如果存在json文件则不会创建默认的结构，只会引入组件****)。  

c.  类似  
```json  
"dialog":{ 
        "folder":"js/ui",   
        "url":"git@gitlab.alibaba-inc.com:amap-lab/dialog.git", 
        "branch":"wangwei",
        "update"：true 
}  
```
则会在js/ui/dialog下创建git   
folder:生成目录 
url:git地址   
branch:是否适用分支
update:是否强制更新 默认不强制更新


#### 2. 启动站点
a. 进入想要生成目录结构的文件夹 运行gde start
b. --path xx/xx 启动xx站点目录    
c. --port "8000" 监听8000端口

#### 3. 发布
a. 进入想要生成目录结构的文件夹 运行gde deploy   
b. --path=/xx/xx 发布的xx目录的站点 默认当前目录  
c. --model=test daily publish          
    test：将打包文件推送到测试网个人服务器文件下 (必须确保先release)            
    daily:将打包文件推送到测试网公共目录下，并且推送分支到daily（可以不必release）          
    publish：将打包文件推送git 并且推送分支到publish（可以不必release）     
e. --deploy=amap-wap目录（发布到公网必须 ）             

## 三. 扩展命令
```javascript
gde release 打包站点
gde createhtml 创建html文件
gde mirrorhtml 生成html镜像文件
```

#### 1. 打包站点 
a. 进入想要生成目录结构的文件夹 运行gde release   
b. --path xx/xx 打包xx目录的站点   
c. --md5 给静态资源添加md5 
d. --deploy 将js css 压缩  
e. --jshint 进行js语法检查

打包发布规则：      
1.方式1 页面注释： 
```html
<!-- build:css css/index_wx.min.css -->
    <link rel="stylesheet" href="css/timeline.css"/>
    <link rel="stylesheet" href="css/index.css"/>
<!-- endbuild -->

<!-- build:js js/common.min.js -->
<script type="text/javascript" src="js/God.js"></script>
<script type="text/javascript" src="js/browser.js"></script>
<script type="text/javascript" src="js/common.js"></script>
<!-- endbuild -->
```
上面代码将会生成css/index_wx.min.css和js/common.min.js  

2.其他规则
```html
    <link rel="stylesheet" href="css/index.css" inline/>
```

3.方式2 自己提供打包配置    
参考配置（待开发） 
 


#### 2. 生成html文件
a. 进入想要生成目录结构的文件夹 运行gde createhtml  
b. --list 要生成的html文件list 如：index，home  
TODO：根据lib动态生成html  

#### 3. 生成镜像文件  
a. 进入想要生成目录结构的文件夹 运行gde mirrorhtml  
b. --list 要生成镜像的html文件list 如：index，home  
c. --all 是否将当前目录下所有html文件生成镜像  
d. --wx 是否根据wx 生成 非wx  
TODO：注释生成问题。

## 四. 注意       
1. 目前如果配置的是绝对路径的资源 资源名称不要与本地资源路径相同 否则会打上md5！  
2. css目录问题目前不支持多级目录！  
3. html目录问题,目前不支持多级目录！ 

## 五. TODO
1. http开头资源不在处理md5 
2. 目录解析 支持多级目录
3. 异常处理 目前很多处理未了简单直接使用shell 没有流程控制.