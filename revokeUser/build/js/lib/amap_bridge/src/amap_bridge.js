!function(e){"use strict";"function"==typeof define&&define.amd?define(["util"],e):e(AmapApp.util)}(function(e){"use strict";function n(){return window.amapJsBridge?void(a=window.amapJsBridge):void(e.os.ios?window.WebViewJavascriptBridge?t({bridge:window.WebViewJavascriptBridge}):r.addEventListener("WebViewJavascriptBridgeReady",t,!1):e.os.android&&(window.jsInterface?t():r.addEventListener("DOMContentLoaded",t,!1)))}function t(n){e.os.ios?(r.removeEventListener("WebViewJavascriptBridgeReady",t,!1),a=n.bridge,a.init(),a.registerHandler("amapCallWebViewHandler",window[c])):e.os.android&&(r.removeEventListener("DOMContentLoaded",t,!1),a={send:function(e){e=[JSON.stringify(e)],arguments[1]&&(e[1]=arguments[1]),window.jsInterface&&window.jsInterface.invokeMethod("send",e)}},a.send({action:"registerCallback"},c)),window.amapJsBridge=a,i()}function i(){for(;d.length;)a.send(d.shift())}function o(e){"string"==typeof e&&(e=JSON.parse(e));var n=e._action;"[object Function]"===Object.prototype.toString.call(s[n])&&s[n](e),n&&0!==n.indexOf("_HOLD_")&&(s[n]=void 0)}var a,r=window.document,s={},d=[],c="callback";window[c]=o;var p={send:function(e,n){if(n)if(e._action)s[e._action]=n;else{var t="_ACTION_TO_NATIVEAPI_"+Math.random();e.hasOwnProperty("function")?(t="_HOLD"+t,e["function"]._action=t):e._action=t,s[t]=n}a?a.send(e):d.push(e)},aosrequest:function(e,n,t,i,o,a){if(e){var r,s=this;"object"==typeof e?(r=e,t=n,o=r.showNetErr,delete r.showNetErr):r={urlPrefix:e,method:a,progress:i,params:n},r.action="aosrequest",r.method="string"==typeof r.method&&"GET"===r.method.toUpperCase()?"GET":"POST",r.progress?r.progress=1===r.progress?"正在加载":r.progress:delete r.progress,this.send(r,function(e){var n=JSON.parse(e.content);n?!o||-1!=n.code&&-2!=n.code||s.promptMessage("请检查网络后重试"):n={code:-10},t.call(this,n)})}},getAmapUserId:function(e,n,t){var i={action:"getAmapUserId"};i.onlyGetId=n?"1":"0",i.needRelogin=t?"1":"0",this.send(i,e)},getExtraUrl:function(e){this.send({action:"getExtraUrl"},e)},getMapLocation:function(e){var n={action:"getMapLocation",forceReturnValue:"1"};this.send(n,e)},imagePreview:function(e,n,t){var i={action:"imagePreview",module:e||"",index:0|n,list:t||[]};this.send(i)},loadSchema:function(n){if(n)if(e.os.ios){var t=r,i=t.getElementById("loadSchemaIframe");i||(i=t.createElement("iframe"),i.id="loadSchemaIframe",i.style.cssText="display:none;width:0px;height:0px",t.body.appendChild(i)),i.src=n}else this.send({action:"loadSchema",url:n})},loginBind:function(e,n){this.send({action:"loginBind",type:e},n)},openAppUrl:function(n){e.extend({action:"openAppUrl","package":"",version:"",iosh:"",andh:"",wapUrl:""},n),this.send(n)},openThirdUrl:function(e,n,t,i){var o={action:"openAppUrl","package":"",version:"",iosh:"",andh:"",wapUrl:e};n&&(o.appName=n),(t||0===t)&&(o.loadingTime=t),"object"==typeof i&&(o.showButton=i),this.send(o)},openPoi:function(e,n,t){var i={action:"openPoi",poiInfo:e};n&&(i.status=n+""),t&&(i.module=t),this.send(i)},promptMessage:function(e,n){this.send({action:"promptMessage",message:e,type:n||0})},searchRoute:function(e,n){var t={action:"searchRoute"};e&&(t.startPoi=e),n&&(t.endPoi=n),this.send(t)},share:function(n,t){var i=e.getUrlParam(e.PAGE_SOURCE_KEY),o={};o[e.IN_AMAP_KEY]="0",i&&(o[e.PAGE_SOURCE_KEY]=i);for(var a=0,r=n.length;r>a;a++)n[a].url=e.urlAddParam(n[a].url,o);this.send({action:"share",urlType:"1",useCustomUrl:"1",content:n},t)},showPanellist:function(e,n){if(e&&e.length){for(var t=e.length-1;t>=0;t--){var i=e[t];"object"!=typeof i&&("number"==typeof i&&(i+=""),e[t]={title:i,content:i})}var o={action:"showPanellist",list:e};n&&(o.poiInfo=n),this.send(o)}},triggerFeature:function(e,n,t){var i={action:"triggerFeature",feature:e};n&&(i.poiInfo=n),t&&(i.params=t),this.send(i)},userAction:function(n,t,i){if("object"==typeof t&&(i=t,t=""),t&&n){var o={page:t,click:n};i&&e.extend(o,i),this.send({action:"logUserAction",pageid:"1000",buttonid:1,para:JSON.stringify(o)})}},webviewGoBack:function(e){this.send({action:"webviewGoBack",step:Math.abs(0|e)||1})}};return n(),"function"==typeof define&&define.amd?p:void(AmapApp.napi=p)});