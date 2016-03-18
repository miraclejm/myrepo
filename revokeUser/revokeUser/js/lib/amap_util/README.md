# 非业务相关公共方法集合.
非AMD、CMD规范下创建 AmapApp 对象，公用方法命名空间为 AmapApp.util

## 方法

1. [addScript](#addScript) 添加script.
1. [extend](#extend) 复制对象属性.
1. [getUrlParam](#getUrlParam) 获取url参数.
1. [isInAmap](#isInAmap) 判断是否在高德地图内.
1. [isInWeixin](#isInWeixin) 判断是否在微信中.
1. [isPublic](#isPublic) 获取当前是否为公网环境.
1. [setIsInAmap](#setIsInAmap) 设置是否在高德地图客户端内，默认根据页面名称是否有 _wx 判断.
1. [urlAddParam](#urlAddParam) 为url添加变量.

<br/>
### addScript
添加script.

**概要**

addScript(url,onload,onerror)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|url|String|是| |js url|
|onload|Function|否| |加载成功回调|
|onerror|Function|否| |加载失败回调|

**返回值**

{HTMLElement} script引用
<br/>
### extend
复制对象属性.

**概要**

extend(toObj,fromObj)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|toObj|Object|是| |复制到此对象|
|fromObj|Object|是| |要复制的对象|
<br/>
### getUrlParam
获取url参数.

**概要**

getUrlParam(name)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|name|String|否| |参数名称，无此参数时返回所有参数|

**返回值**

{String|Object} name存在时返回相应的值，否则返回所有参数
<br/>
### isInAmap
判断是否在高德地图内.

**概要**

isInAmap()

**返回值**

{Boolean} 在高德地图内返回true

**描述**

默认根据html名称判断，不带 _wx 后缀的为高德内，可通过 setIsInAmap 修改
<br/>
### isInWeixin
判断是否在微信中.

**概要**

isInWeixin()

**返回值**

{Boolean} 在微信中返回true
<br/>
### isPublic
获取当前是否为公网环境.

**概要**

isPublic()

**返回值**

{Boolean} 公网环境返回 true
<br/>
### setIsInAmap
设置是否在高德地图客户端内，默认根据页面名称是否有 _wx 判断.

**概要**

setIsInAmap(isInAmap)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|isInAmap|Boolean|是| |端内传true|
<br/>
### urlAddParam
为url添加变量.

**概要**

urlAddParam(url,name,value)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|url|String|是| | |
|name|String&#124;Object|是| |<br/>   为字符串类型时参数作为新增参数的名称，第三个参数不能缺省<br/>   为对象类型时参数为要增加的参数集合，属性为参数名称，值为参数值|
|value|String|是| |变量值|

**返回值**

{String} 新的url
