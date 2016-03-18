/*native下API实现*/ 
/*以bridge作为命名空间*/
'use strict';
var Bridge = {};

!function (win, doc)
{
	'use strict';

	var
		// 测试地址
		testUrl = {
			// 签名服务
			sign: 'http://wb.amap.com/channel.php?aoscommon=1&',
			// 日志五福
			log: 'http://oss.testing.amap.com/ws/h5_log'
		},
		/* 正式地址*/
		publicUrl = {
			sign: 'http://wb.amap.com/channel.php?aoscommon=1&',
			log: 'http://oss.amap.com/ws/h5_log'
		},
		urlConfig,

		callbackId = 0,

		os = navigator.userAgent.match(/iphone|ipad|ipod/i) ? 'ios' : 'android',

		appBannerUrl,

		handlerQueue = {};


	if(/amap\.com/i.test(location.host) && !/testing/i.test(location.host))
	{
		urlConfig = publicUrl;
	} else
	{
		urlConfig = testUrl;
	}

	function jsonpRequest(urlname, param, callback, data)
	{
		callbackId += 1;
		handlerQueue[callbackId] = function (res)
		{
			callback({ content: res }, data);
		};
		var isWeixinAPI = false;
		for(var i = 0; i < param.length; i++)
		{
			if(param[i].wxAPI == 1)
			{
				isWeixinAPI = true;
				break;
			}
		}
		var url;
		var paramArr = [];
		if(isWeixinAPI)
		{
			for(var i = 0; i < param.length; i++)
			{
				var par = [];
				for(var p in param[i])
				{
					par.push(p + '=' + encodeURIComponent(param[i][p]));
				}
				paramArr.push(par.join('&'));
			}
			url = urlname + ((urlname.indexOf('?') > -1) ? '&' : '?') + 'output=jsonp&callback=jsonpCallback[' + callbackId +
				']&' + paramArr.join('&');
		}
		else
		{

			url = urlConfig.sign + 'callback=jsonpCallback[' + callbackId +
				']&urlname=' + urlname + '&param=' + JSON.stringify(param);
				url;
		}
		addScript(url, callbackId);
	}

	function log(page, key)
	{
		new Image().src = urlConfig.log + '?key=' + encodeURIComponent(page) + '&value=' + encodeURIComponent(key);
	}

	function openApp(bannerUrl)
	{
		appBannerUrl = win.encodeURIComponent(bannerUrl);
		if(os == 'android')
		{
			addScript('http://127.0.0.1:6677/getpackageinfo?callback=foo');
		} else
		{
			loadAmapScheme();
		}
	}
	function foo(data)
	{
		if(data && data.error_code == 0 && data['package'] == 'com.autonavi.minimap')
		{
			if(data.version_code >= 420)
			{
				var action = 'openFeature&featureName=OpenURL&sourceApplication=banner&url=' +
						appBannerUrl + '&urlType=0&contentType=autonavi';
				addScript('http://127.0.0.1:6677/androidamap?&action=' + action);
			} else if(data.version_code >= 400)
			{
				loadAmapScheme();
			}
		}
	}
	function addScript(url, callbackId)
	{
		var script = doc.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script.src = url;
		script.onerror = function() {
			handlerQueue[callbackId]({content: {code: -2}});
		}
		doc.querySelector('head').appendChild(script);
	}

	/**
	 * 呼起高德地图.
	 */
	function loadAmapScheme()
	{
		var schema = os + 'amap://openFeature?featureName=OpenURL&sa=1' +
			'&sourceApplication=banner' +
			'&url=' + appBannerUrl +
			'&urlType=0&contentType=autonavi';
		win.location.href = schema;
	}

	Bridge = {
		os: os,
		send: function (data, callback)
		{
			switch(data.action)
			{
				case 'aosrequest':
					jsonpRequest(data.urlPrefix, data.params, callback);
					break;
				case 'logUserAction':
					var _data = JSON.parse(data.para);
					log(_data.page, _data.click);
					break;
				case 'openApp':
					openApp(data.bannerUrl);
					break;
			}
		}
	};

	win.jsonpCallback = handlerQueue;
}(window, document);

window.define && define('God.Bridge', Bridge);