# 高德地图客户端与js交互实现.
此js会生成全局变量 callback<br/>   callback 供客户端使用，不能直接调用<br/>支持 AMD 规范调用<br/>非AMD规范下，会为 AmapApp 创建 napi 属性<br/>如果页面中使用了 iframe，则页面和 iframe 不能同时引用此js

## 方法

1. [aosrequest](#aosrequest) aosrequest.
1. [getAmapUserId](#getamapuserid) 获取用户id.
1. [getExtraUrl](#getextraurl) 获取高德地图的基本信息.
1. [getMapLocation](#getmaplocation) 获取当前用户位置：城市，经纬度.
1. [imagePreview](#imagepreview) 图片预览
1. [loadSchema](#loadschema) 调用 schema.
1. [loginBind](#loginbind) 登录并绑定相关账号.
1. [openAppUrl](#openappurl) 打开第三方页面.
1. [openPoi](#openpoi) 打开poi页面.
1. [openThirdUrl](#openthirdurl) 打开第三方在线页面.
1. [promptMessage](#promptmessage) 使用黑框显示提示信息.
1. [searchRoute](#searchroute) 执行路线规划.
1. [send](#send) js向客户端发起请求.
1. [share](#share) 调起客户端的分享面板.
1. [showPanellist](#showpanellist) 显示打电话面板.
1. [triggerFeature](#triggerfeature) 调用客户端功能.
1. [userAction](#useraction) 记录日志.
1. [webviewGoBack](#webviewgoback) webview后退接口

<br/>
### aosrequest
aosrequest.

**概要**

aosrequest(url,params,handler,progress,showNetErr,method)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|url|String|是| |请求url<br/>   此参数为 obj 类型时，此参数为所有参数列表，此时第二个参数为回调方法<br/>   此时 obj 的 key 应该和真实接口保持一致：<br/>   urlPrefix，method，progress，params，alert，encrypt，goback，showNetErr|
|params|Array.&lt;Object&gt;|是| |请求参数列表|
|handler|Function|是| |回调方法，请求结果会以JSON格式传给方法的第一个参数|
|progress|Integer&#124;String|否| |可选，请求时的提示信息，<br/>   为数字1时显示默认的提示信息|
|showNetErr|Boolean|否|false|网络异常时是否进行提示，默认不提示|
|method|String|否|POST|可选，请求方式|

**描述**

参数为两种形式，分别为 aosrequest(obj, handler) 和<br/>aosrequest(url, params, handler, progress, showNetErr, method)<br/>
<br/>
### getAmapUserId
获取用户id.

**概要**

getAmapUserId(handler,onlyGetId,needRelogin)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|handler|Function|是| |回调函数。<br/>   参数为对象，如果其属性 userid 为空则登录失败，否则登录成功|
|onlyGetId|Boolean|是| |是否只获取id，如果用户未登录则用户id为空字符串<br/>   如果值为 false 并且用户未登录时跳转登录面板|
|needRelogin|Boolean|否|false|可选，是否强制重新登录|
<br/>
### getExtraUrl
获取高德地图的基本信息.

**概要**

getExtraUrl(handler)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|handler|Function|是| |回调函数|
<br/>
### getMapLocation
获取当前用户位置：城市，经纬度.

**概要**

getMapLocation(handler)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|handler|Function|是| |回调方法|
<br/>
### imagePreview
图片预览

**概要**

imagePreview(module,index,list)
<br/>
### loadSchema
调用 schema.

**概要**

loadSchema(url)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|url|String|是| |schema值|
<br/>
### loginBind
登录并绑定相关账号.

**概要**

loginBind(type,handler)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|type|String|是| |绑定账号类型，phone 手机，taobao 淘宝|
|handler|Function|是| |回调函数<br/>   回调函数参数为对象类型，包含以下属性(phone和taobao根据type值对应返回)：<br/>   userid {String} 用户id，用户在登录时点击返回此值为空<br/>   phone {string} 用户手机号，用户绑定手机后的手机号，未绑定时为空<br/>   taobao {String} 用户绑定的淘宝账号，未绑定时为空|
<br/>
### openAppUrl
打开第三方页面.

**概要**

openAppUrl(param)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|param|Object|是| |参数对象，属性如下<br/>   {String} [iosh] 应用ios schema，用于呼起应用<br/>   {String} [andh] 应用android schema，用于呼起应用<br/>   {String} [wapUrl] 已第三方网站形式打开页面的url<br/>   {String} [isout] 是否使用浏览器打开连接，为1时使用浏览器打开链接<br/>   {String} [appName='第三方网站'] 第三方名称，显示为'高德地图正带您去xxx'<br/>   {Integer} [loadingTime=1500] loading最短时间，单位毫秒，Android默认0<br/>   {Object} [showButton] 可选，打开第三方页面时右上角显示按钮，属性如下<br/>     buttonText {String} 按钮显示文字<br/>     localFile {String} 点击此按钮打开的本地页面名称<br/>     otherUrl {String} 点击此按钮打开的其它页面url<br/>     localFile 和 otherUrl 只能一个有值另一个为空字符串<br/>@see openThirdUrl|
<br/>
### openPoi
打开poi页面.

**概要**

openPoi(poiInfo,status,module)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|poiInfo|Object|是| |poi的基础信息|
|status|Boolean|否|false|状态，默认打开tips形式，值为true时直接打开poi详情|
|status|String&#124;Integer|是| |打开的状态<br/>   0 或缺省打开主图显示tip样式<br/>   1 直接打开poi详情页<br/>   3 打开待tip的主图，但是poi必须为当前poi，用于poi详情页面地址栏点击|
|module|String|是| |打开酒店详情时此值需要为'hotel'|
<br/>
### openThirdUrl
打开第三方在线页面.

**概要**

openThirdUrl(url,appName,loadingTime,button)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|url|String|是| |第三方页面url|
|appName|String|否|'第三方网站'|第三方名称，显示为'高德地图正带您去xxx'|
|loadingTime|Integer|否|1500|loading最短时间，单位毫秒，Android默认0|
|button|Object|否| |右上角按钮<br/>   buttonText {String} 按钮显示文字<br/>   localFile {String} 点击此按钮打开的本地页面名称<br/>   otherUrl {String} 点击此按钮打开的其它页面url<br/>   localFile 和 otherUrl 只能一个有值另一个为空字符串|

**描述**

@see openAppUrl
<br/>
### promptMessage
使用黑框显示提示信息.

**概要**

promptMessage(msg,type)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|msg|String|是| |信息内容|
|type|Integer|否|0|显示类型<br/>   0 3s后自动消失的框<br/>   1 一直显示的提示框<br/>   -1 关闭提示框|
<br/>
### searchRoute
执行路线规划.

**概要**

searchRoute(start,end)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|start|Object|是| |起始poi点|
|end|Object|是| |结束poi点|
<br/>
### send
js向客户端发起请求.

**概要**

send(param,handler)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|param|Object|是| |请求参数|
|handler|Function|否| |可选，回调函数|
<br/>
### share
调起客户端的分享面板.

**概要**

share(content,handler)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|content|Array.&lt;Object&gt;|是| |分享内容<br/>   数组元素属性说明：<br/>   type 分享渠道： weixin 微信好友，pengyou 微信朋友圈，weibo 新浪微博<br/>   url 分享的 url<br/>   title 分享信息的标题，type=weibo时不需要<br/>   message 分享信息的内容，type=pengyou时不需要<br/>   imgUrl 分享信息显示的图片，微信朋友圈建议使用80*80，微博使用300*300的图片<br/>   示例：<br/>   [<br/>     {type: 'weixin', title: '分享标题', message: '分享内容', url: 'http://a.com', imgUrl: 'http://b.jpg'},<br/>     {type: 'pengyou', title: '分享信息', url: 'http://a.com', imgUrl: 'http://b.jpg'},<br/>     {type: 'weixin', message: '分享信息', url: 'http://a.com', imgUrl: 'http://b.jpg'}<br/>   ]<br/>   注：数组长度小于3时，将不显示对应的渠道按钮|
|handler|Function|是| |分享后的回调。<br/>  参数类型未对象， 属性 type 为用户选择的分享渠道，<br/>  属性result=ok 时表示分享成功<br/>  注：分享成功后未点击回到高德地图时 result 为 fail|
<br/>
### showPanellist
显示打电话面板.

**概要**

showPanellist(list,poiInfo)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|list|Array.&lt;Object&#124;String&gt;|是| |电话数组<br/>   Object 格式： {title: '面板显示内容', content: '实际拨打内容'}|
<br/>
### triggerFeature
调用客户端功能.

**概要**

triggerFeature(feature,poiInfo,params)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|feature|String|是| |功能名称<br/>   tuangouList 团购适用分店，需要 poiInfo<br/>   calendar ios打开日期控件页面<br/>   trainInquiries 7.1.0+ 列车查询<br/>   subway AMAP7.2.1+ 呼起地铁页面|
|poiInfo|Object|否| |当前点的poi信息|
|params|Object|否| |参数|
<br/>
### userAction
记录日志.

**概要**

userAction(click,category,otherInfo)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|click|String|是| |事件名称|
|category|String|否| |页面名称|
|otherInfo|Object|否| |日志的其它数据|
<br/>
### webviewGoBack
webview后退接口

**概要**

webviewGoBack(step)

**参数**

|参数名称|参数类型|是否必须|默认值|描述|
|----|----|----|----|----|
|step|Integer|是| |后退的步数，正整数，默认为1|
