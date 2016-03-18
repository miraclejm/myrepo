/**
 * 高德地图浏览器端通用方法.
 * 此文件的方法均隶属于 AmapApp.browserApi 对象
 * 判断公网测试网方法需要按实际情况调整
 * 支持 AMD 规范调用
 */
(function(factory) {
  if ( typeof define === 'function' && define.amd ) {
    define(['util'], factory);
  } else {
    // Browser globals
    factory(AmapApp.util);
  }
})(function(util) {

'use strict';

var isIos = util.os.ios;

/** @type {Integer} jsonp请求计数器 */
var callbackId = 0;
/** @type {String} jsonp服务回调函数名称前缀 */
var aosJsonpName = '_aosJsonpRequest';
/**
 * 通过wb服务进行签名转发aos请求.
 * @param {String} urlname aos服务url
 * @param {Array.<Objecrt>} param 请求参数，与客户端中请求参数相同
 * @param {Function} callback 回调函数
 * @param {*} [data] 此参数会原封不动的传入回调函数的第二个参数
 */
function aosJsonp(urlname, param, callback, data) {
  callbackId += 1;
  var callbackName = aosJsonpName + callbackId;
  window[callbackName] = function(res) {
    callback(res, data);
  };

  var scriptUrl = 'http://wb.amap.com/channel.php?aoscommon=1&callback=' +
      callbackName + '&urlname=' + encodeURIComponent(urlname) +
      '&param=' + encodeURIComponent(JSON.stringify(param));
  util.addScript(scriptUrl, jsonpComplete, function(script) {
    window[callbackName]({content: {code: -2}});
    jsonpComplete(script);
  });

  function jsonpComplete(script) {
    script.remove();
    window[callbackName] = undefined;
  }
}

/**
 * 创建在高德地图内打开在线地址的schema.
 * @param {String} url 要打开的url
 * @return {String} schema
 */
function createBannerSchema(url) {
  return (isIos ? 'ios' : 'android') + 'amap://openFeature?featureName=OpenURL&sa=1' +
      '&sourceApplication=banner' +
      '&url=' + encodeURIComponent(url) +
      '&urlType=0&contentType=autonavi';
}

var _amapBannerUrl;
var _hasCalledAmap;
/**
 * 使用高德地图打开在线页面.
 * @param {String} url 在线页面url
 */
function openAmapBanner(url) {
  _amapBannerUrl = url;
  if (!isIos) {
    // callback 名称不鞥以 下划线 开头
    util.addScript('http://127.0.0.1:6677/getpackageinfo?callback=amapCallback1');
    setTimeout(function() {
      if (!_hasCalledAmap) {
        window.location.href = createBannerSchema(url);
      }
    }, 400);
  }
  else {
    window.location.href = createBannerSchema(url);
  }
}

window.amapCallback1 = function(data) {
  if (data && data.error_code == '0' && data.version_code >= 420 &&
      data['package'] === 'com.autonavi.minimap') {
    util.addScript('http://127.0.0.1:6677/androidamap?action=openFeature' +
      '&featureName=OpenURL&sourceApplication=banner' +
      '&url=' + encodeURIComponent(_amapBannerUrl) +
      '&urlType=0&contentType=autonavi&callback=amapCallback2');
  }
};
window.amapCallback2 = function() {
  // TODO 呼起失败时也返回 error_code === 0
};

/**
 * 打开带有呼起和提示功能的页面.
 * 页面先尝试呼起高德地图，失败后停留在提示用浏览器打开的页面，并展示下载按钮
 * @param {String} url 呼起高德地图后打开的地址
 * @param {String} title 跳转页面显示title
 */
function openWeixinPrompt(url, title) {
  location.href = 'http://wap.amap.com/callnative/?schema=' +
    encodeURIComponent( createBannerSchema(url) ) +
    '&title=' + encodeURIComponent(title || '');
}

/**
 * 设置微信端分享内容.
 * @param {Array.<Object>} content 分享配置，同native
 * @param {Function} handler 分享成功后的回调函数
 *    参数同native
 */
function weixinShare(content, handler) {
  util.addScript('http://res.wx.qq.com/open/js/jweixin-1.0.0.js', function() {
    util.addScript('http://wb.amap.com/sign.php?r=' + Math.random(), function() {
      weixinShareConfig(content, handler);
    });
  });
}
/**
 * 设置微信端分享内容.
 * @param {Array.<Object>} content 分享配置，同native
 * @param {Function} handler 分享成功后的回调函数
 *    参数同native
 */
function weixinShareConfig(content, handler) {
  wx.ready(function() {
    wx.checkJsApi({
      jsApiList: [
        'onMenuShareTimeline', // 分享到朋友圈
        'onMenuShareAppMessage' // 分享给好友
      ],
      success: function(res) {
        var appParam = {};
        appParam[util.IN_AMAP_KEY] = '0';
        for (var i = content.length - 1; i >= 0; i--) {
          var obj = content[i];
          if (obj.type === 'weixin' && res.checkResult.onMenuShareAppMessage) {
            appParam[util.PAGE_SOURCE_KEY] = 'weixin';
            wx.onMenuShareAppMessage({
              title   : obj.title,
              desc    : obj.message,
              link    : util.urlAddParam(obj.url, appParam),
              imgUrl  : obj.imgUrl,
              success : shareSuccess('weixin')
            });
          }
          else if (obj.type === 'pengyou' && res.checkResult.onMenuShareTimeline) {
            appParam[util.PAGE_SOURCE_KEY] = 'pengyou';
            wx.onMenuShareTimeline({
              title   : obj.title,
              link    : util.urlAddParam(obj.url, appParam),
              imgUrl  : obj.imgUrl,
              success : shareSuccess('pengyou')
            });
          }
        }

        function shareSuccess(type) {
          return function() {
            if (handler) {
              handler({result: 'ok', type: type});
            }
          };
        }
      }
    });
  });
}

var browserApi = {
  aosJsonp: aosJsonp,
  openAmapBanner: openAmapBanner,
  openWeixinPrompt: openWeixinPrompt,
  weixinShare: weixinShare,
  weixinShareConfig: weixinShareConfig
};

if ( typeof define === 'function' && define.amd ) {
  return browserApi;
} else {
  AmapApp.bapi = browserApi;
}

});
