/*native下API实现*/
/// <reference path="God.js" />
/*以bridge作为命名空间*/
'use strict';
var Bridge = {};

!function ()
{
	var win = window,

        doc = win.document,

        ua = navigator.userAgent,

        CALLBACK_NAME = 'callback',

        os = ua.match(/iphone|ipad|ipod/i) ? "ios" : (ua.match(/msie/i) ? "ms" : "android"),

        bridge = null,

        queueAry = [],

        handlerMap = {},

        connected = function () { },

        connectIOS = function (arg)
        {
        	doc.removeEventListener("WebViewJavascriptBridgeReady", connect, false);
        	bridge = arg.bridge;
        	bridge.init();
        	bridge.registerHandler("amapCallWebViewHandler", win[CALLBACK_NAME]);
        },

        connectMS = function ()
        {
        	doc.removeEventListener("DOMContentLoaded", connect, false);
        	bridge = {
        		send: function (param)
        		{
        			param = JSON.stringify(param);
        			win.external.notify(param);
        		}
        	};
        	bridge.send({ "action": "registerCallback", "callbackname": CALLBACK_NAME });
        },

        connectAndroid = function ()
        {
        	doc.removeEventListener("DOMContentLoaded", connect, false);
        	bridge = {
        		send: function (param)
        		{
        			param = JSON.stringify(param);
        			if(arguments[1])
        			{
        				win.jsInterface.invokeMethod("send", [param, arguments[1]]);
        			} else
        			{
        				win.jsInterface.invokeMethod("send", [param]);
        			}
        		}
        	};
        	bridge.send({ "action": "registerCallback" }, CALLBACK_NAME);
        },

        connect = function (arg)
        {
        	"ios" === os ? connectIOS(arg || { bridge: win.WebViewJavascriptBridge }) : ("android" === os ? connectAndroid() : connectMS());
        	connected.call(null);
        	sendIterator(queueAry);
        },

        sendIterator = function (queue)
        {
        	if("[object Array]" === Object.prototype.toString.call(queue))
        	{
        		while(queue.length)
        		{
        			bridge.send(queue.shift());
        		}
        	}
        },

        callback = function (data)
        {
        	if("string" === typeof (data))
        	{
        		data = JSON.parse(data);
        	}
        	var _act = data._action;
        	delete data._action;
        	if("[object Function]" === Object.prototype.toString.call(handlerMap[_act]))
        	{
        		handlerMap[_act](data);
        	}
        	if(0 !== _act.indexOf("_HOLD_"))
        	{
        		//handlerMap[_act] = null;
        		//delete handlerMap[_act];
        	}
        },

        init = function ()
        {
        	if(bridge)
        	{
        		return;
        	}
        	/*ios下只要有WebViewJavascriptBridge就可以了，否则监听bridgeReady事件*/
        	if(os == 'ios')
        	{
        		if(win.WebViewJavascriptBridge)
        		{
        			connect();
        		}
        		else
        		{
        			doc.addEventListener("WebViewJavascriptBridgeReady",
						connect,
						false
					);
        		}
        	}
        		/*安卓下需要等待domContentLoaded，用interactive模拟一下*/
        	else
        	{
        		if(document.readyState === 'complete')
        		{
        			// 如果引用此js时 onload 已触发，则直接连接
        			connect();
        		} else if(document.readyState === 'interactive')
        		{
        			// 如果引用此js时 DOMContentLoaded 不是是否触发，延时后触发
        			setTimeout(connect, 0);
        		} else
        		{
        			doc.addEventListener("DOMContentLoaded",
						connect,
						false
					);
        		}
        	}
        },

        bridgeObj = {

        	send: function (param, handler)
        	{
        		if(handler)
        		{
        			if(!param._action)
        			{
        				var _actionStr = "_ACTION_TO_NATIVEAPI_" + (Math.random().toString().replace("0.", ""));
        				if(!param.hasOwnProperty("function"))
        				{
        					param._action = _actionStr;
        				} else
        				{
        					_actionStr = "_HOLD" + _actionStr;
        					(param["function"])._action = _actionStr;
        				}
        				handlerMap[_actionStr] = handler;
        			} else
        			{
        				handlerMap[param._action] = handler;
        			}
        		}
        		if(bridge)
        		{
        			bridge.send(param);
        		} else
        		{
        			queueAry.push(param);
        		}
        		if(param.action == 'logUserAction')
        		{
        			var _data = JSON.parse(param.para);
        			log(_data.page, _data.click);
        		}
        	}
        };

	var logService = ''
	if(/amap\.com/i.test(location.host) && !/testing/i.test(location.host))
	{
		logService = 'http://oss.amap.com/ws/h5_log';
	}
	else
	{
		logService = 'http://oss.testing.amap.com/ws/h5_log';
	}
	function log(page, key)
	{
		new Image().src = logService + '?key=' + encodeURIComponent(page) + '&value=' + encodeURIComponent(key);
	}

	win[CALLBACK_NAME] = callback;

	init();

	Bridge = bridgeObj;
	Bridge.InNative = true;
	Bridge.os = os;
}();

window.define && define('God.Bridge', Bridge);
