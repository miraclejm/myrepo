/**
 * 高德地图客户端与js交互实现.
 * 此js会生成全局变量 callback
 *    callback 供客户端使用，不能直接调用
 * 支持 AMD 规范调用
 * 非AMD规范下，会为 AmapApp 创建 napi 属性
 * 如果页面中使用了 iframe，则页面和 iframe 不能同时引用此js
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

var document = window.document;

/** js与客户端交互对象 */
var bridge;
/** 存储需要回调的客户端请求的回调函数 */
var handlerMap = {};
/** 存储客户端连接建立前发出的请求 */
var sendQueue = [];
/**
 * 客户端调用js的方法名称.
 * 客户端调用js均通过此方法，此方法会作为全局函数存在
 * 如果不同页面间有跳转关系，则这些页面的此方法名必须一致
 */
var CALLBACK_NAME = 'callback';
/**
 * 开始和客户端建立连接，如果客户端已建立好连接，则直接初始化.
 */
function init() {
  if (window.amapJsBridge) {
    bridge = amapJsBridge;
    return;
  }
  if (util.os.ios) {
    if (window.WebViewJavascriptBridge) {
      connect({bridge: window.WebViewJavascriptBridge});
    }
    else {
      document.addEventListener('WebViewJavascriptBridgeReady', connect, false);
    }
  }
  else if (util.os.android) {
    if (window.jsInterface) {
      connect();
    }
    else {
      document.addEventListener('DOMContentLoaded', connect, false);
    }
  }
}
/**
 * 客户端完成连接工作，js端保持连接对象，完成连接.
 * @param {Object} event iOS 连接成功后的事件对象
 */
function connect(event) {
  if (util.os.ios) {
    document.removeEventListener('WebViewJavascriptBridgeReady', connect, false);
    bridge = event.bridge;
    bridge.init();
    bridge.registerHandler('amapCallWebViewHandler', window[CALLBACK_NAME]);
  }
  else if (util.os.android) {
    document.removeEventListener('DOMContentLoaded', connect, false);
    bridge = {
      send: function(param) {
        param = [JSON.stringify(param)];
        if (arguments[1]) {
          param[1] = arguments[1];
        }
        window.jsInterface.invokeMethod('send', param);
      }
    };
    bridge.send({'action': 'registerCallback'}, CALLBACK_NAME);
  }

  window.amapJsBridge = bridge;
  connectComplete();
}
/**
 * js与客户端连接建立完成.
 */
function connectComplete() {
  // 处理连接建立前发起的请求
  while (sendQueue.length) {
    bridge.send(sendQueue.shift());
  }
}
/**
 * 接收客户端回调的方法.
 * @param {Object} res 客户端传回的数据
 */
function callback(res) {
  if ('string' === typeof res) {
    res = JSON.parse(res);
  }
  var _act = res._action;
  // TODO 处理客户端主动调用的事件
  if ('[object Function]' === Object.prototype.toString.call(handlerMap[_act])) {
    handlerMap[_act](res);
  }
  if (_act && 0 !== _act.indexOf('_HOLD_')) {
    handlerMap[_act] = undefined;
  }
}
window[CALLBACK_NAME] = callback;

/**
 * 客户端与js交互API.
 */
var nativeApi = {
  /**
   * js向客户端发起请求.
   * @param {Object} param 请求参数
   * @param {Function} handler 可选，回调函数
   */
  send: function(param, handler) {
    if (handler) {
      if (!param._action) {
        var _actionStr = '_ACTION_TO_NATIVEAPI_' + Math.random();
        // 注册右上角按钮时，回调不止触发一次，触发后回调函数不删除
        if (param.hasOwnProperty('function')) {
          _actionStr = '_HOLD' + _actionStr;
          (param['function'])._action = _actionStr;
        }
        else {
          param._action = _actionStr;
        }
        handlerMap[_actionStr] = handler;
      }
      else {
        handlerMap[param._action] = handler;
      }
    }
    if (bridge) {
      bridge.send(param);
    }
    else {
      sendQueue.push(param);
    }
  },
  /**
   * aosrequest.
   * 参数为两种形式，分别为 aosrequest(obj, handler) 和
   * aosrequest(url, params, handler, progress, showNetErr, method)
   * 
   * @param {String} url 请求url
   *    此参数为 obj 类型时，此参数为所有参数列表，此时第二个参数为回调方法
   *    此时 obj 的 key 应该和真实接口保持一致：
   *    urlPrefix，method，progress，params，alert，encrypt，goback，showNetErr
   * @param {Array.<Object>} params 请求参数列表
   * @param {Function} handler 回调方法，请求结果会以JSON格式传给方法的第一个参数
   * @param {Integer|String} [progress] 可选，请求时的提示信息，
   *    为数字1时显示默认的提示信息
   * @param {Boolean} [showNetErr=false] 网络异常时是否进行提示，默认不提示
   * @param {String} [method=POST] 可选，请求方式
   */
  aosrequest: function(url, params, handler, progress, showNetErr, method) {
    if (!url) return;
    var obj, self = this;
    // (obj, handler) 形式调用
    if (typeof url === 'object') {
      obj = url;
      handler = params;
      showNetErr = obj.showNetErr;
      delete obj.showNetErr;
    } else { // (url, params, handler, progress, showNetErr, method) 形式
      obj = {
        urlPrefix: url,
        method: method,
        progress: progress,
        params: params
      };
    }
    obj.action = 'aosrequest';
    obj.method = 'string' === typeof obj.method && 'GET' === obj.method.toUpperCase() ? 'GET' : 'POST';
    if (obj.progress) {
      obj.progress = 1 === obj.progress ? '正在加载' : obj.progress;
    } else {
      // ios 下 progress 为空字符串时会显示默认信息
      delete obj.progress;
    }
    this.send(obj, function(res) {
      var result = JSON.parse(res.content);
      if (!result) {
        result = {code: -10};
      } else if (showNetErr && (result.code == -1 || result.code == -2)) {
        self.promptMessage('请检查网络后重试');
      }
      handler.call(this, result);
    });
  },
  /**
   * 获取用户id.
   * @param {Function} handler 回调函数
   * @param {Boolean} onlyGetId 是否只获取id，如果用户未登录则用户id为空字符串
   *    如果值为 false 并且用户未登录时跳转登录面板
   * @param {Boolean} [needRelogin=false] 可选，是否强制重新登录
   */
  getAmapUserId: function(handler, onlyGetId, needRelogin) {
    var param = {
      action: 'getAmapUserId'
    };
    param.onlyGetId = onlyGetId ? '1' : '0';
    param.needRelogin = needRelogin ? '1' : '0';
    this.send(param, handler);
  },
  /**
   * 获取高德地图的基本信息.
   * @param {Function} handler 回调函数
   */
  getExtraUrl: function(handler) {
    this.send({action: 'getExtraUrl'}, handler);
  },
  /**
   * 获取当前用户位置：城市，经纬度.
   * @param {Function} handler 回调方法
   */
  getMapLocation : function(handler) {
    var param = {
      action: "getMapLocation",
      forceReturnValue: "1"
    };
    this.send(param, handler);
  },
  /**
   * 图片预览
   */
  imagePreview : function(module, index, list) {
    var param = {
      action: "imagePreview",
      module: module || "",
      index: index | 0,
      list: list || []
    };
    this.send(param);
  },
  /**
   * 调用 schema.
   * @param {String} url schema值
   */
  loadSchema: function(url) {
    if (!url) {
      return;
    }
    if (util.os.ios) {
      var doc = document,
        schemaIframe = doc.getElementById('loadSchemaIframe');
      // 不存在时创建iframe
      if (!schemaIframe) {
        schemaIframe = doc.createElement('iframe');
        schemaIframe.id = 'loadSchemaIframe';
        schemaIframe.style.cssText = 'display:none;width:0px;height:0px';
        doc.body.appendChild(schemaIframe);
      }
      schemaIframe.src = url;
    } else {
      this.send({
        action: 'loadSchema',
        url: url
      });
    }
  },
  /**
   * 登录并绑定相关账号.
   * @param {String} type 绑定账号类型，phone 手机，taobao 淘宝
   * @param {Function} handler 回调函数
   *    回调函数参数为对象类型，包含以下属性(phone和taobao根据type值对应返回)：
   *    userid {String} 用户id，用户在登录时点击返回此值为空
   *    phone {string} 用户手机号，用户绑定手机后的手机号，未绑定时为空
   *    taobao {String} 用户绑定的淘宝账号，未绑定时为空
   */
  loginBind: function(type, handler) {
    this.send({
      action: 'loginBind',
      type: type
    }, handler);
  },
  /**
   * 打开poi页面.
   * @param {Object} poiInfo poi的基础信息
   * @param {Boolean} [status=false] 状态，默认打开tips形式，值为true时直接打开poi详情
   * @param {String|Integer} status 打开的状态
   *    0 或缺省打开主图显示tip样式
   *    1 直接打开poi详情页
   *    3 打开待tip的主图，但是poi必须为当前poi，用于poi详情页面地址栏点击
   * @param {String} module 打开酒店详情时此值需要为'hotel'
   */
  openPoi: function(poiInfo, status, module) {
    var obj = {
      action: 'openPoi',
      poiInfo: poiInfo
    };
    if (status) {
      obj.status = status + '';
    }
    if (module) {
      obj.module = module;
    }
    this.send(obj);
  },
  /**
   * 使用黑框显示提示信息.
   * @param {String} msg 信息内容
   * @param {Integer} [type=0] 显示类型
   *    0 3s后自动消失的框
   *    1 一直显示的提示框
   *    -1 关闭提示框
   */
  promptMessage: function(msg, type) {
    this.send({action: 'promptMessage', message: msg, type: type || 0});
  },
  /**
   * 执行路线规划.
   * @param {Object} 起始poi点
   * @param {Object} 结束poi点
   */
  searchRoute: function(start, end) {
    var param = {
      action: "searchRoute"
    };
    if (start) {
      param.startPoi = start;
    }
    if (end) {
      param.endPoi = end;
    }
    this.send(param);
  },
  share: function(content, handler) {
    var pageSource = util.getUrlParam(util.PAGE_SOURCE_KEY);
    var param = {};
    param[util.IN_AMAP_KEY] = '0';
    if (pageSource) {
      param[util.PAGE_SOURCE_KEY] = pageSource;
    }
    for (var i = 0, len = content.length; i < len; i++) {
      content[i].url = util.urlAddParam(content[i].url, param);
    }
    this.send({
      action       : 'share',
      urlType      : '1',
      useCustomUrl : '1',
      content      : content
    }, handler);
  },
  /**
   * 显示打电话面板.
   * @param {Array.<Object|String>} list 电话数组
   *    Object 格式： {title: '面板显示内容', content: '实际拨打内容'}
   */
  showPanellist: function(list, poiInfo) {
    if (!list || !list.length) {
      return;
    }
    for (var i = list.length - 1; i >= 0; i--) {
      var item = list[i];
      if (typeof item != 'object') {
        if (typeof item === 'number') {
          item += '';
        }
        list[i] = {title: item, content: item};
      }
    }
    var param = {
      action: 'showPanellist',
      list: list
    };
    if(poiInfo) {
      param.poiInfo = poiInfo;
    }
    this.send(param);
  },
  /**
   * 调用客户端功能.
   * @param {String} feature 功能名称
   *    tuangouList 团购适用分店，需要 poiInfo
   *    calendar ios打开日期控件页面
   *    trainInquiries 7.1.0+ 列车查询
   *    subway AMAP7.2.1+ 呼起地铁页面
   * @param {Object} [poiInfo] 当前点的poi信息
   * @param {Object} [params] 参数
   */
  triggerFeature: function(feature, poiInfo, params) {
    var obj = {
      action: 'triggerFeature',
      feature: feature
    };
    if (poiInfo) {
      obj.poiInfo = poiInfo;
    }
    if (params) {
      obj.params = params;
    }
    this.send(obj);
  },
  /**
   * 记录日志.
   * @param {String} click 事件名称
   * @param {String} [category] 页面名称
   * @param {Object} [otherInfo] 日志的其它数据
   */
  userAction: function(click, category, otherInfo) {
    if ( typeof category == 'object' ){
      otherInfo = category;
      category = '';
    }
    if (category && click) {
      var param = {
        page: category,
        click: click
      };
      if (otherInfo) {
        util.extend(param, otherInfo);
      }
      this.send({
        action: 'logUserAction',
        pageid: '1000',
        buttonid: 1,
        para: JSON.stringify(param)
      });
    }
  },
  /**
   * webview后退接口
   * @param {Integer} 后退的步数，正整数，默认为1
   */
  webviewGoBack: function(step) {
    this.send({
      action: 'webviewGoBack',
      step: Math.abs(step | 0) || 1
    });
  }
};

init();

if ( typeof define === 'function' && define.amd ) {
  return nativeApi;
} else {
  AmapApp.napi = nativeApi;
}

});

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

/**
 * 日志记录方法.
 * 支持 AMD 规范调用
 * 非AMD规范下，会为 AmapApp 创建 log 属性
 * 端内依赖 amap_native
 */
(function(factory) {
  if ( typeof define === 'function' && define.amd ) {
    define(['util', 'native'], factory);
  } else {
    // Browser globals
    factory(AmapApp.util, AmapApp.util.isInAmap() && AmapApp.napi);
  }
})(function(util, napi) {

'use strict';

/** @type {String} 日志url */
var logServer = util.isPublic() ? 'http://oss.amap.com/ws/h5_log' :
    'http://oss.testing.amap.com/ws/h5_log';

/**
 * 记录用户行为日志.
 * @param {String} click 用户操作
 * @param {String} page 页面名称
 */
function logRequest(click, page) {
  new Image().src = logServer + '?key=' + encodeURIComponent(page) +
      '&value=' + encodeURIComponent(click);
}

var logApi = {
  /**
   * 初始化日志页面名称》
   * 页面名称会被拼接为 活动名称_页面名称_平台_端内外_来源
   * @param {String} pageName 活动名称_页面名称
   */
  initLog: function(pageName) {
    var src = util.getUrlParam(util.PAGE_SOURCE_KEY);
    this._logPageName = pageName + '_' + (util.os.ios ? 'ios' : 'android') +
        '_' + (util.isInAmap() ? 'amap' : 'wx') +
        (src ? '_' + src : '');
  },
  /**
   * 记录日志.
   * @param {String} click 用户行为名称
   * @param {String} [page] 页面名称，缺省时为初始化中的页面名称
   */
  log: function(click, page) {
    page = page || this._logPageName;
    logRequest(click, page);
    if (util.isInAmap() && napi) {
      napi.userAction(click, page);
    }
  }
};

if ( typeof define === 'function' && define.amd ) {
  return logApi;
} else {
  AmapApp.log = logApi;
}

});

/**
 * 非业务相关公共方法集合.
 * 非AMD、CMD规范下创建 AmapApp 对象，公用方法命名空间为 AmapApp.util
 */
;(function(window) {

'use strict';

/**
 * 获取系统信息.
 * @return {Object} 存放系统信息，属性值如下
 *    version {String} 系统版本号
 *    android {Boolean} 是否为 Android 系统
 *    ios {Boolean} 是否为 iOS 系统
 *    iphone {Boolean} 是否为 iphone
 *    ipad {Boolean} 是否为 ipad
 *    ipod {Boolean} 是否为 ipod
 */
function getOSInfo() {
  var os = {};
  var ua = navigator.userAgent;
  var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
  var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
  var ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
  var iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/);
  if (android) {
    os.android = true;
    os.version = android[2];
  }
  if (iphone && !ipod) {
    os.ios = os.iphone = true;
    os.version = iphone[2].replace(/_/g, '.');
  }
  if (ipad) {
    os.ios = os.ipad = true;
    os.version = ipad[2].replace(/_/g, '.');
  }
  if (ipod) {
    os.ios = os.ipod = true;
    os.version = ipod[3] ? ipod[3].replace(/_/g, '.') : null;
  }
  return os;
}

/** @type {Boolean} 是否在高德地图内 */
var isInAmap;

var util = {
  PAGE_SOURCE_KEY: 'gd_from',
  IN_AMAP_KEY: 'isInAmap',
  os: getOSInfo(),
  /**
   * 添加script.
   * @param {String} url js url
   * @param {Function} [onload] 加载成功回调
   * @param {Function} [onerror] 加载失败回调
   * @return {HTMLElement} script引用
   */
  addScript: function(url, onload, onerror) {
    var script = document.createElement('script');
    if (onload) {
      script.onload = function() {
        onload(script);
      };
    }
    if (onerror) {
      script.onerror = function() {
        onerror(script);
      };
    }
    script.src = url;
    document.head.appendChild(script);
    return script;
  },
  /**
   * 复制对象属性.
   * @param {Object} toObj 复制到此对象
   * @param {Object} fromObj 要复制的对象
   */
  extend: function(toObj, fromObj) {
    for (var key in fromObj) {
      if (fromObj[key] !== 'undefined') {
        toObj[key] = fromObj[key];
      }
    }
  },
  /**
   * 获取url参数.
   * @param {String} [name] 参数名称，无此参数时返回所有参数
   * @return {String|Object} name存在时返回相应的值，否则返回所有参数
   */
  getUrlParam: function(name) {
    var url = window.location.search.substr(1);
    if (!url) {
      return '';
    }
    url = decodeURI(url);
    if (name) {
      var value = new RegExp('(?:^|&)' + name + '=([^&]*)(&|$)', 'g').exec(url);
      return value && window.decodeURIComponent(value[1]) || '';
    }
    var result = {};
    var reg = /(?:^|&)([^&=]+)=([^&]*)(?=(&|$))/g;
    var item;
    // jshint boss: true
    while (item = reg.exec(url)) {
      result[item[1]] = window.decodeURIComponent(item[2]);
    }
    return result;
  },
  /**
   * 判断是否在高德地图内.
   * 默认根据html名称判断，不带 _wx 后缀的为高德内，可通过 setIsInAmap 修改
   * @return {Boolean} 在高德地图内返回true
   */
  isInAmap: function() {
    return isInAmap;
  },
  /**
   * 判断是否在微信中.
   * @return {Boolean} 在微信中返回true
   */
  isInWeixin: function() {
    return /MicroMessenger/i.test(navigator.userAgent);
  },
  /**
   * 获取当前是否为公网环境.
   * @return {Boolean} 公网环境返回 true
   */
  isPublic: function() {
    return /amap\.com/i.test(location.host) && !/testing/i.test(location.host);
  },
  /**
   * 设置是否在高德地图客户端内，默认根据页面名称是否有 _wx 判断.
   * @param {Boolean} isInAmap 端内传true
   */
  setIsInAmap: function(isInAmap) {
    isInAmap = isInAmap;
  },
  /**
   * 为url添加变量.
   * @param {String} url
   * @param {String|Object} name
   *    为字符串类型时参数作为新增参数的名称，第三个参数不能缺省
   *    为对象类型时参数为要增加的参数集合，属性为参数名称，值为参数值
   * @param {String} value 变量值
   * @return {String} 新的url
   */
  urlAddParam: function(url, name, value) {
    // 分割url，arr[1] 为头部，arr[2]为参数，arr[3]为hash
    var arr = url.match(/([^\?#]*\??)([^#]*)?(#.*)?/);
    var prefix = arr[1];
    var param = arr[2];

    if (param) {
      prefix += param + '&';
    }
    else if (arr[1].indexOf('?') === -1) {
      prefix += '?';
    }
    var newParam = '';
    if (typeof name === 'object') {
      for (var key in name) {
        newParam += '&' + key + '=' + encodeURIComponent(name[key]);
      }
      newParam = newParam.substr(1);
    }
    else {
      newParam = name + '=' + encodeURIComponent(value);
    }
    return prefix + newParam + (arr[3] || '');
  }
};

// html名字带有 _wx 的或者 url 参数中 isInAmap === 0 的为端外
isInAmap = !(/_wx\.html?($|[#?])/.test(location.href) ||
    util.getUrlParam(util.IN_AMAP_KEY) === '0');

// 兼容 AMD CMD commonJS
/* globals module */
if (typeof module !== 'undefined' && typeof exports === 'object') {
  module.exports = util;
} else if (typeof define === 'function' && (define.amd || define.cmd)) {
  define(util);
} else {
  window.AmapApp = {util: util};
}

})(window);

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
/**
 * 预热页面用到的API
 */
;!function(Bridge,win){
		/**
		 * 分享.
		 * @param {Array.<Object>} cont
		 *    [{type: "weibo", message: "", title: "", url: ""},
		 *    {type: "weixin", message: "", title: "", url: ""},
		 *    {type: "pengyou", message: "", title: "", url: ""}]
		 * @param {Object} poiInfo 
		 *    poiid 或 lon和lat 至少一方存在
		 */
		Bridge.share = function(cont, urlType, poiInfo){
            var param = {
                action: "share",
                content: cont,
                useCustomUrl: "1",
                urlType: urlType ? "" + urlType : "1"
            };
            if(poiInfo) {
                param.poiInfo = poiInfo;
            }
            Bridge.send(param);	
       }
		/**
		 * aosrequest.
		 * 参数为两种形式，分别为 aosrequest(obj, handler) 和
		 * aosrequest(url, params, handler, progress, showNetErr, 	method)
		 * 
		 * @param {String} url 请求url	
		 *    此参数为 obj 类型时，此参数为所有参数列表，此时第二个参数为回调方法
		 *    此时 obj 的 key 应该和真实接口保持一致：
		 *    urlPrefix，method，progress，params，alert，encrypt，goback，showNetErr
		 * @param {Array.<Object>} params 请求参数列表
		 * @param {Function} handler 回调方法，请求结果会以JSON格式传给方法的第一个参数
		 * @param {Integer|String} [progress] 可选，请求时的提示信息，
		 *    为数字1时显示默认的提示信息
		 * @param {Boolean} [showNetErr=false] 网络异常时是否进行提示，默认不提示
		 * @param {String} [method=POST] 可选，请求方式
		 */
       Bridge.aosrequest = function(url, params, handler, progress, showNetErr, method) {
            if (!url) return;
            var obj;
            // (obj, handler) 形式调用
            if (typeof url === 'object') {
                obj = url;
                handler = params;
                showNetErr = obj.showNetErr;
                delete obj.showNetErr;
            } else { // (url, params, handler, progress, showNetErr, method) 形式
                obj = {
                    urlPrefix: url,
                    method: method,
                    progress: progress,
                    params: params
                };
            }
            obj.action = 'aosrequest';
            obj.method = 'string' === typeof obj.method && 'GET' === obj.method.toUpperCase() ? 'GET' : 'POST';
            if (obj.progress) {
                obj.progress = 1 === obj.progress ? '正在加载' : obj.progress;
            } else {
                // ios 下 progress 为空字符串时会显示默认信息
                delete obj.progress;
            }
            Bridge.send(obj, function(res) {
                var result = JSON.parse(res.content);
                if (!result) {
                    result = {code: -10};
                } else if (showNetErr && (result.code == -1 || result.code == -2)) {
                    Bridge.promptMessage('请检查网络后重试');
                }
                handler(result);
            });
       }
       /**客户端交互的相关参数*/
		Bridge.getExtraUrl = function(handler) {
			var param = {
			    action : "getExtraUrl"
			};
			Bridge.send(param, handler);
		}
		/*登录bind*/
		Bridge.loginBind = function(handler){
			var param = {
				action:'loginBind',
				type: 'phone'
			}
			Bridge.send(param, handler);
		}
		/*客户端的toast*/
		Bridge.promptMessage = function(message, type, handler) {
            var param = {
                action: "promptMessage",
                message: message,
                type: "" + type
            };
            Bridge.send(param, handler);
        }
		/**
		 * 播放音乐
		 *@param url  播放地址 mp3 url
		 *@param act  播放状态 play pause stop
		 *@param loop 是否循环播放 1 循环
		 *@param isShort  0短音频 1长音频
		 * */
		Bridge.audioCtr = function(url, act, loop, isShort) {
			var obj = {
		        "action": 'webAudio',
		        "url": url,
		        "act": act,
		        "loop": loop ? "1" : "0",
		        "short": isShort ? "1" : "0"
		    };
		    Bridge.send(obj);
		}
		 /**
		 * 获取当前用户位置：城市，经纬度.
		 * @param {Function} handler 回调方法
		 */
		Bridge.getMapLocation=function(handler) {
		    var param = {
		        action: "getMapLocation",
		        forceReturnValue: 1
		    };
		    Bridge.send(param, handler);
		}
}(Bridge,window);
/**
 * @update time 2015/7/16
 */
if (typeof Component === 'undefined'){
	var Component = {};	
}
/**
 * @description 页面加载loading,所有图片预先加载其他都为component 的组件
 * @version 0.1
 * @constructor
 * @param {Object} options{ 
 * 		<b>imgList</b>     <array>  - 需要加载的imglist.</br>
 *		<b>processing</b>  <Function> - 正在加载中的状态显示， 返回加载百分比 .</br>
 *		<b>afterFun</b>    <Function> - 加载完毕后需要初始化的 .</br>
 * }
 */
Component.Loading = function(options){
	this.options = {
		imgList       : [], //需要加载的imglist
        audioHtmlList : [], //需要加载的audio标签类list
		processing    : function(idx) {}, //正在加载中的状态显示， 返回加载百分比
		afterFun      : function() {}  //加载完毕后需要初始化的
	};
	for(var p in options) {
		if(options.hasOwnProperty(p)) {
			this.options[p] = options[p];
		}
	}	
	this._init();
}
/**
 * Component.Loading.
 * @namespace
 */
Component.Loading.prototype	= {
	/**		
	 * Loading#_init
	 * loading入口
	 * documented asLoading#_init
	 **/
	_init:function(){
		var _this = this;
		this.total = this.options.imgList.length;// + this.options.audioHtmlList.length;
		this.loadedNum = 0;
        var _callback = function(){
			_this.loadedNum++;
			var percent = _this.loadedNum / _this.total;
			_this.options.processing.call(_this.options.processing, Math.round(percent * 100));
			if(percent === 1){
				setTimeout(function(){
					_this.options.afterFun.call(_this.options.afterFun);
				},500);
                //document.body.removeEventListener("canplaythrough", _this.audioLoadedCB, true);
                //document.body.removeEventListener("error", _this.audioLoadedCB, true);
			}
		};
		_this._imgLoader(_callback);
        if(this.options.audioHtmlList.length) {
            _this._audioHtmlLoader(_callback);
        }
	},
	/** 
	 * Loading#_imgLoader
	 * @param {Function} callback 回调方法
	 * 
	 * */
	_imgLoader:function(callback){
		var imgList = this.options.imgList;
		for(var i = 0,len = imgList.length;i<len;i++){	
			this._load(imgList[i],(i+1),callback);
		}
	},
	/**Loading#_load
	 * @param {String} link
	 * @param {Number} count
	 * @param {Function}  callback
	 * */
	_load:function(link,count,callback){
		var img = new Image();
		img.onload = function(){
			callback();		
		};
		img.onerror = function(){	
			callback();
		}
		img.src= link;
	},
    
    _audioHtmlIdCache : "",
    
    /** 
	 * Loading#_audioHtmlLosder
     * @param {Function}  callback
	 * */
    _audioHtmlLoader:function(callback) {
        var _this = this;
        //_this.audioLoadedCB = function(e) {
        //    var ele = e.target;
        //    var id = ele.id;
        //    if("audio" === ele.nodeName.toLowerCase() && id) {
        //        if(-1 === _this._audioHtmlIdCache.indexOf("[" + id + "]")) {
        //            _this._audioHtmlIdCache += "[" + id + "]";
        //            callback();
        //        }
        //    }
        //};
        //document.body.addEventListener("canplaythrough", _this.audioLoadedCB, true);
        //document.body.addEventListener("error", _this.audioLoadedCB, true);
        var audioList = this.options.audioHtmlList;
        var audioDom = null;
        for(var i = 0, len = audioList.length, item = null; i < len; i++) {
            item = audioList[i];
            audioDom = document.createElement("audio");
            audioDom.id = item.id;
            audioDom.setAttribute("preload", "auto");
            audioDom.setAttribute("src", item.src);
            document.body.appendChild(audioDom);
        }
    }
}
;!(function(window){
	var Logs = {
		_hasInitParam:false,
		_initParam: function(){
			this.mobile = Bridge.os;
			this.duan = Bridge.InNative?"":"_wx";
			this.source = this.getQuery()["gd_from"] || "wabao";
		},
		/*
		* 发送pv
		* */
		sendLog: function(page,key){
			if(!this._hasInitParam){
				this._initParam();
				this._hasInitParam = true;
			}
			if (key) {
				this.page = 'wabao_' + page + this.duan + '_' + this.mobile + "_" + this.source;
			} else {
				key = page;
			}
			this.log(key);
		},
		log:function(click){
			var data={};
			click = click||"";
			data.action = 'logUserAction';
			var param = {page:this.page,click:click};
			data.para = JSON.stringify(param);
			Bridge.send(data,function(){});	
		},
		/**
		 * 获得URL Query
		 */
		getQuery: function (url) {
			url = url ? url : window.location.search;
			if (url.indexOf("?") < 0) return {};
			var queryParam = url.substring(url.indexOf("?") + 1, url.length).split("&"),
				queryObj = {};
			var i = 0;
			var j = "";
			for (i = 0; j = queryParam[i]; i++) {
				queryObj[j.substring(0, j.indexOf("=")).toLowerCase()] = j.substring(j.indexOf("=") + 1, j.length);
			}
			return queryObj;
		}
	}
	window.Logs = Logs;
})(window)

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

;(function(window){
'use strict';
var time = new Date(dp_shd_sys_time).getDate();
var fromStr = AmapApp.util.getUrlParam('from'); 
var title = "来高德领红包吧";
var isPublic = /amap\.com/i.test(location.host) && !/testing/i.test(location.host);
var url = {
    public : 'http://wap.amap.com/activity/letter/index.html',
    test : 'http://group.testing.amap.com/jing.chu/activity/letter/index.html'
};
init();
function init(){
    AmapApp.log.initLog('preview_letter_index');
    AmapApp.log.log('pv');
    AmapApp.log.log('pv_' + fromStr);
    var btn = $('#btn');
    var target;
    if(!isPublic){
            target = url.test; 
        }
        else{
            target = url.public;
    }
    bindEvent(fromStr,title,target);
    if((fromStr === 'sc_xxgg' && time < 28) || fromStr === 'sjkz'){
        btn.style.display = 'none';
    }
    if(fromStr === 'cll'){
        var e = document.createEvent('MouseEvents');
        e.initEvent('click', true, true);
        setTimeout(function(){
            AmapApp.log.log('auto_click');
            btn.dispatchEvent(e);
        },1000);
    }
} 
function bindEvent(str,openTitle,target_url){
    btn.addEventListener('click',function(){
        AmapApp.log.log('click_btn');
        AmapApp.bapi.openWeixinPrompt(target_url,openTitle);
    },false);
}
function $(name){
    return document.querySelector(name);
} 
})(window);
/* Zepto v1.1.3 - zepto event ajax form ie - zeptojs.com/license */
var Zepto=function(){function L(t){return null==t?String(t):j[T.call(t)]||"object"}function Z(t){return"function"==L(t)}function $(t){return null!=t&&t==t.window}function _(t){return null!=t&&t.nodeType==t.DOCUMENT_NODE}function D(t){return"object"==L(t)}function R(t){return D(t)&&!$(t)&&Object.getPrototypeOf(t)==Object.prototype}function M(t){return"number"==typeof t.length}function k(t){return s.call(t,function(t){return null!=t})}function z(t){return t.length>0?n.fn.concat.apply([],t):t}function F(t){return t.replace(/::/g,"/").replace(/([A-Z]+)([A-Z][a-z])/g,"$1_$2").replace(/([a-z\d])([A-Z])/g,"$1_$2").replace(/_/g,"-").toLowerCase()}function q(t){return t in f?f[t]:f[t]=new RegExp("(^|\\s)"+t+"(\\s|$)")}function H(t,e){return"number"!=typeof e||c[F(t)]?e:e+"px"}function I(t){var e,n;return u[t]||(e=a.createElement(t),a.body.appendChild(e),n=getComputedStyle(e,"").getPropertyValue("display"),e.parentNode.removeChild(e),"none"==n&&(n="block"),u[t]=n),u[t]}function V(t){return"children"in t?o.call(t.children):n.map(t.childNodes,function(t){return 1==t.nodeType?t:void 0})}function U(n,i,r){for(e in i)r&&(R(i[e])||A(i[e]))?(R(i[e])&&!R(n[e])&&(n[e]={}),A(i[e])&&!A(n[e])&&(n[e]=[]),U(n[e],i[e],r)):i[e]!==t&&(n[e]=i[e])}function B(t,e){return null==e?n(t):n(t).filter(e)}function J(t,e,n,i){return Z(e)?e.call(t,n,i):e}function X(t,e,n){null==n?t.removeAttribute(e):t.setAttribute(e,n)}function W(e,n){var i=e.className,r=i&&i.baseVal!==t;return n===t?r?i.baseVal:i:void(r?i.baseVal=n:e.className=n)}function Y(t){var e;try{return t?"true"==t||("false"==t?!1:"null"==t?null:/^0/.test(t)||isNaN(e=Number(t))?/^[\[\{]/.test(t)?n.parseJSON(t):t:e):t}catch(i){return t}}function G(t,e){e(t);for(var n in t.childNodes)G(t.childNodes[n],e)}var t,e,n,i,C,N,r=[],o=r.slice,s=r.filter,a=window.document,u={},f={},c={"column-count":1,columns:1,"font-weight":1,"line-height":1,opacity:1,"z-index":1,zoom:1},l=/^\s*<(\w+|!)[^>]*>/,h=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,p=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,d=/^(?:body|html)$/i,m=/([A-Z])/g,g=["val","css","html","text","data","width","height","offset"],v=["after","prepend","before","append"],y=a.createElement("table"),x=a.createElement("tr"),b={tr:a.createElement("tbody"),tbody:y,thead:y,tfoot:y,td:x,th:x,"*":a.createElement("div")},w=/complete|loaded|interactive/,E=/^[\w-]*$/,j={},T=j.toString,S={},O=a.createElement("div"),P={tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},A=Array.isArray||function(t){return t instanceof Array};return S.matches=function(t,e){if(!e||!t||1!==t.nodeType)return!1;var n=t.webkitMatchesSelector||t.mozMatchesSelector||t.oMatchesSelector||t.matchesSelector;if(n)return n.call(t,e);var i,r=t.parentNode,o=!r;return o&&(r=O).appendChild(t),i=~S.qsa(r,e).indexOf(t),o&&O.removeChild(t),i},C=function(t){return t.replace(/-+(.)?/g,function(t,e){return e?e.toUpperCase():""})},N=function(t){return s.call(t,function(e,n){return t.indexOf(e)==n})},S.fragment=function(e,i,r){var s,u,f;return h.test(e)&&(s=n(a.createElement(RegExp.$1))),s||(e.replace&&(e=e.replace(p,"<$1></$2>")),i===t&&(i=l.test(e)&&RegExp.$1),i in b||(i="*"),f=b[i],f.innerHTML=""+e,s=n.each(o.call(f.childNodes),function(){f.removeChild(this)})),R(r)&&(u=n(s),n.each(r,function(t,e){g.indexOf(t)>-1?u[t](e):u.attr(t,e)})),s},S.Z=function(t,e){return t=t||[],t.__proto__=n.fn,t.selector=e||"",t},S.isZ=function(t){return t instanceof S.Z},S.init=function(e,i){var r;if(!e)return S.Z();if("string"==typeof e)if(e=e.trim(),"<"==e[0]&&l.test(e))r=S.fragment(e,RegExp.$1,i),e=null;else{if(i!==t)return n(i).find(e);r=S.qsa(a,e)}else{if(Z(e))return n(a).ready(e);if(S.isZ(e))return e;if(A(e))r=k(e);else if(D(e))r=[e],e=null;else if(l.test(e))r=S.fragment(e.trim(),RegExp.$1,i),e=null;else{if(i!==t)return n(i).find(e);r=S.qsa(a,e)}}return S.Z(r,e)},n=function(t,e){return S.init(t,e)},n.extend=function(t){var e,n=o.call(arguments,1);return"boolean"==typeof t&&(e=t,t=n.shift()),n.forEach(function(n){U(t,n,e)}),t},S.qsa=function(t,e){var n,i="#"==e[0],r=!i&&"."==e[0],s=i||r?e.slice(1):e,a=E.test(s);return _(t)&&a&&i?(n=t.getElementById(s))?[n]:[]:1!==t.nodeType&&9!==t.nodeType?[]:o.call(a&&!i?r?t.getElementsByClassName(s):t.getElementsByTagName(e):t.querySelectorAll(e))},n.contains=function(t,e){return t!==e&&t.contains(e)},n.type=L,n.isFunction=Z,n.isWindow=$,n.isArray=A,n.isPlainObject=R,n.isEmptyObject=function(t){var e;for(e in t)return!1;return!0},n.inArray=function(t,e,n){return r.indexOf.call(e,t,n)},n.camelCase=C,n.trim=function(t){return null==t?"":String.prototype.trim.call(t)},n.uuid=0,n.support={},n.expr={},n.map=function(t,e){var n,r,o,i=[];if(M(t))for(r=0;r<t.length;r++)n=e(t[r],r),null!=n&&i.push(n);else for(o in t)n=e(t[o],o),null!=n&&i.push(n);return z(i)},n.each=function(t,e){var n,i;if(M(t)){for(n=0;n<t.length;n++)if(e.call(t[n],n,t[n])===!1)return t}else for(i in t)if(e.call(t[i],i,t[i])===!1)return t;return t},n.grep=function(t,e){return s.call(t,e)},window.JSON&&(n.parseJSON=JSON.parse),n.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(t,e){j["[object "+e+"]"]=e.toLowerCase()}),n.fn={forEach:r.forEach,reduce:r.reduce,push:r.push,sort:r.sort,indexOf:r.indexOf,concat:r.concat,map:function(t){return n(n.map(this,function(e,n){return t.call(e,n,e)}))},slice:function(){return n(o.apply(this,arguments))},ready:function(t){return w.test(a.readyState)&&a.body?t(n):a.addEventListener("DOMContentLoaded",function(){t(n)},!1),this},get:function(e){return e===t?o.call(this):this[e>=0?e:e+this.length]},toArray:function(){return this.get()},size:function(){return this.length},remove:function(){return this.each(function(){null!=this.parentNode&&this.parentNode.removeChild(this)})},each:function(t){return r.every.call(this,function(e,n){return t.call(e,n,e)!==!1}),this},filter:function(t){return Z(t)?this.not(this.not(t)):n(s.call(this,function(e){return S.matches(e,t)}))},add:function(t,e){return n(N(this.concat(n(t,e))))},is:function(t){return this.length>0&&S.matches(this[0],t)},not:function(e){var i=[];if(Z(e)&&e.call!==t)this.each(function(t){e.call(this,t)||i.push(this)});else{var r="string"==typeof e?this.filter(e):M(e)&&Z(e.item)?o.call(e):n(e);this.forEach(function(t){r.indexOf(t)<0&&i.push(t)})}return n(i)},has:function(t){return this.filter(function(){return D(t)?n.contains(this,t):n(this).find(t).size()})},eq:function(t){return-1===t?this.slice(t):this.slice(t,+t+1)},first:function(){var t=this[0];return t&&!D(t)?t:n(t)},last:function(){var t=this[this.length-1];return t&&!D(t)?t:n(t)},find:function(t){var e,i=this;return e="object"==typeof t?n(t).filter(function(){var t=this;return r.some.call(i,function(e){return n.contains(e,t)})}):1==this.length?n(S.qsa(this[0],t)):this.map(function(){return S.qsa(this,t)})},closest:function(t,e){var i=this[0],r=!1;for("object"==typeof t&&(r=n(t));i&&!(r?r.indexOf(i)>=0:S.matches(i,t));)i=i!==e&&!_(i)&&i.parentNode;return n(i)},parents:function(t){for(var e=[],i=this;i.length>0;)i=n.map(i,function(t){return(t=t.parentNode)&&!_(t)&&e.indexOf(t)<0?(e.push(t),t):void 0});return B(e,t)},parent:function(t){return B(N(this.pluck("parentNode")),t)},children:function(t){return B(this.map(function(){return V(this)}),t)},contents:function(){return this.map(function(){return o.call(this.childNodes)})},siblings:function(t){return B(this.map(function(t,e){return s.call(V(e.parentNode),function(t){return t!==e})}),t)},empty:function(){return this.each(function(){this.innerHTML=""})},pluck:function(t){return n.map(this,function(e){return e[t]})},show:function(){return this.each(function(){"none"==this.style.display&&(this.style.display=""),"none"==getComputedStyle(this,"").getPropertyValue("display")&&(this.style.display=I(this.nodeName))})},replaceWith:function(t){return this.before(t).remove()},wrap:function(t){var e=Z(t);if(this[0]&&!e)var i=n(t).get(0),r=i.parentNode||this.length>1;return this.each(function(o){n(this).wrapAll(e?t.call(this,o):r?i.cloneNode(!0):i)})},wrapAll:function(t){if(this[0]){n(this[0]).before(t=n(t));for(var e;(e=t.children()).length;)t=e.first();n(t).append(this)}return this},wrapInner:function(t){var e=Z(t);return this.each(function(i){var r=n(this),o=r.contents(),s=e?t.call(this,i):t;o.length?o.wrapAll(s):r.append(s)})},unwrap:function(){return this.parent().each(function(){n(this).replaceWith(n(this).children())}),this},clone:function(){return this.map(function(){return this.cloneNode(!0)})},hide:function(){return this.css("display","none")},toggle:function(e){return this.each(function(){var i=n(this);(e===t?"none"==i.css("display"):e)?i.show():i.hide()})},prev:function(t){return n(this.pluck("previousElementSibling")).filter(t||"*")},next:function(t){return n(this.pluck("nextElementSibling")).filter(t||"*")},html:function(t){return 0===arguments.length?this.length>0?this[0].innerHTML:null:this.each(function(e){var i=this.innerHTML;n(this).empty().append(J(this,t,e,i))})},text:function(e){return 0===arguments.length?this.length>0?this[0].textContent:null:this.each(function(){this.textContent=e===t?"":""+e})},attr:function(n,i){var r;return"string"==typeof n&&i===t?0==this.length||1!==this[0].nodeType?t:"value"==n&&"INPUT"==this[0].nodeName?this.val():!(r=this[0].getAttribute(n))&&n in this[0]?this[0][n]:r:this.each(function(t){if(1===this.nodeType)if(D(n))for(e in n)X(this,e,n[e]);else X(this,n,J(this,i,t,this.getAttribute(n)))})},removeAttr:function(t){return this.each(function(){1===this.nodeType&&X(this,t)})},prop:function(e,n){return e=P[e]||e,n===t?this[0]&&this[0][e]:this.each(function(t){this[e]=J(this,n,t,this[e])})},data:function(e,n){var i=this.attr("data-"+e.replace(m,"-$1").toLowerCase(),n);return null!==i?Y(i):t},val:function(t){return 0===arguments.length?this[0]&&(this[0].multiple?n(this[0]).find("option").filter(function(){return this.selected}).pluck("value"):this[0].value):this.each(function(e){this.value=J(this,t,e,this.value)})},offset:function(t){if(t)return this.each(function(e){var i=n(this),r=J(this,t,e,i.offset()),o=i.offsetParent().offset(),s={top:r.top-o.top,left:r.left-o.left};"static"==i.css("position")&&(s.position="relative"),i.css(s)});if(0==this.length)return null;var e=this[0].getBoundingClientRect();return{left:e.left+window.pageXOffset,top:e.top+window.pageYOffset,width:Math.round(e.width),height:Math.round(e.height)}},css:function(t,i){if(arguments.length<2){var r=this[0],o=getComputedStyle(r,"");if(!r)return;if("string"==typeof t)return r.style[C(t)]||o.getPropertyValue(t);if(A(t)){var s={};return n.each(A(t)?t:[t],function(t,e){s[e]=r.style[C(e)]||o.getPropertyValue(e)}),s}}var a="";if("string"==L(t))i||0===i?a=F(t)+":"+H(t,i):this.each(function(){this.style.removeProperty(F(t))});else for(e in t)t[e]||0===t[e]?a+=F(e)+":"+H(e,t[e])+";":this.each(function(){this.style.removeProperty(F(e))});return this.each(function(){this.style.cssText+=";"+a})},index:function(t){return t?this.indexOf(n(t)[0]):this.parent().children().indexOf(this[0])},hasClass:function(t){return t?r.some.call(this,function(t){return this.test(W(t))},q(t)):!1},addClass:function(t){return t?this.each(function(e){i=[];var r=W(this),o=J(this,t,e,r);o.split(/\s+/g).forEach(function(t){n(this).hasClass(t)||i.push(t)},this),i.length&&W(this,r+(r?" ":"")+i.join(" "))}):this},removeClass:function(e){return this.each(function(n){return e===t?W(this,""):(i=W(this),J(this,e,n,i).split(/\s+/g).forEach(function(t){i=i.replace(q(t)," ")}),void W(this,i.trim()))})},toggleClass:function(e,i){return e?this.each(function(r){var o=n(this),s=J(this,e,r,W(this));s.split(/\s+/g).forEach(function(e){(i===t?!o.hasClass(e):i)?o.addClass(e):o.removeClass(e)})}):this},scrollTop:function(e){if(this.length){var n="scrollTop"in this[0];return e===t?n?this[0].scrollTop:this[0].pageYOffset:this.each(n?function(){this.scrollTop=e}:function(){this.scrollTo(this.scrollX,e)})}},scrollLeft:function(e){if(this.length){var n="scrollLeft"in this[0];return e===t?n?this[0].scrollLeft:this[0].pageXOffset:this.each(n?function(){this.scrollLeft=e}:function(){this.scrollTo(e,this.scrollY)})}},position:function(){if(this.length){var t=this[0],e=this.offsetParent(),i=this.offset(),r=d.test(e[0].nodeName)?{top:0,left:0}:e.offset();return i.top-=parseFloat(n(t).css("margin-top"))||0,i.left-=parseFloat(n(t).css("margin-left"))||0,r.top+=parseFloat(n(e[0]).css("border-top-width"))||0,r.left+=parseFloat(n(e[0]).css("border-left-width"))||0,{top:i.top-r.top,left:i.left-r.left}}},offsetParent:function(){return this.map(function(){for(var t=this.offsetParent||a.body;t&&!d.test(t.nodeName)&&"static"==n(t).css("position");)t=t.offsetParent;return t})}},n.fn.detach=n.fn.remove,["width","height"].forEach(function(e){var i=e.replace(/./,function(t){return t[0].toUpperCase()});n.fn[e]=function(r){var o,s=this[0];return r===t?$(s)?s["inner"+i]:_(s)?s.documentElement["scroll"+i]:(o=this.offset())&&o[e]:this.each(function(t){s=n(this),s.css(e,J(this,r,t,s[e]()))})}}),v.forEach(function(t,e){var i=e%2;n.fn[t]=function(){var t,o,r=n.map(arguments,function(e){return t=L(e),"object"==t||"array"==t||null==e?e:S.fragment(e)}),s=this.length>1;return r.length<1?this:this.each(function(t,a){o=i?a:a.parentNode,a=0==e?a.nextSibling:1==e?a.firstChild:2==e?a:null,r.forEach(function(t){if(s)t=t.cloneNode(!0);else if(!o)return n(t).remove();G(o.insertBefore(t,a),function(t){null==t.nodeName||"SCRIPT"!==t.nodeName.toUpperCase()||t.type&&"text/javascript"!==t.type||t.src||window.eval.call(window,t.innerHTML)})})})},n.fn[i?t+"To":"insert"+(e?"Before":"After")]=function(e){return n(e)[t](this),this}}),S.Z.prototype=n.fn,S.uniq=N,S.deserializeValue=Y,n.zepto=S,n}();window.Zepto=Zepto,void 0===window.$&&(window.$=Zepto),function(t){function l(t){return t._zid||(t._zid=e++)}function h(t,e,n,i){if(e=p(e),e.ns)var r=d(e.ns);return(s[l(t)]||[]).filter(function(t){return!(!t||e.e&&t.e!=e.e||e.ns&&!r.test(t.ns)||n&&l(t.fn)!==l(n)||i&&t.sel!=i)})}function p(t){var e=(""+t).split(".");return{e:e[0],ns:e.slice(1).sort().join(" ")}}function d(t){return new RegExp("(?:^| )"+t.replace(" "," .* ?")+"(?: |$)")}function m(t,e){return t.del&&!u&&t.e in f||!!e}function g(t){return c[t]||u&&f[t]||t}function v(e,i,r,o,a,u,f){var h=l(e),d=s[h]||(s[h]=[]);i.split(/\s/).forEach(function(i){if("ready"==i)return t(document).ready(r);var s=p(i);s.fn=r,s.sel=a,s.e in c&&(r=function(e){var n=e.relatedTarget;return!n||n!==this&&!t.contains(this,n)?s.fn.apply(this,arguments):void 0}),s.del=u;var l=u||r;s.proxy=function(t){if(t=j(t),!t.isImmediatePropagationStopped()){t.data=o;var i=l.apply(e,t._args==n?[t]:[t].concat(t._args));return i===!1&&(t.preventDefault(),t.stopPropagation()),i}},s.i=d.length,d.push(s),"addEventListener"in e&&e.addEventListener(g(s.e),s.proxy,m(s,f))})}function y(t,e,n,i,r){var o=l(t);(e||"").split(/\s/).forEach(function(e){h(t,e,n,i).forEach(function(e){delete s[o][e.i],"removeEventListener"in t&&t.removeEventListener(g(e.e),e.proxy,m(e,r))})})}function j(e,i){return(i||!e.isDefaultPrevented)&&(i||(i=e),t.each(E,function(t,n){var r=i[t];e[t]=function(){return this[n]=x,r&&r.apply(i,arguments)},e[n]=b}),(i.defaultPrevented!==n?i.defaultPrevented:"returnValue"in i?i.returnValue===!1:i.getPreventDefault&&i.getPreventDefault())&&(e.isDefaultPrevented=x)),e}function T(t){var e,i={originalEvent:t};for(e in t)w.test(e)||t[e]===n||(i[e]=t[e]);return j(i,t)}var n,e=1,i=Array.prototype.slice,r=t.isFunction,o=function(t){return"string"==typeof t},s={},a={},u="onfocusin"in window,f={focus:"focusin",blur:"focusout"},c={mouseenter:"mouseover",mouseleave:"mouseout"};a.click=a.mousedown=a.mouseup=a.mousemove="MouseEvents",t.event={add:v,remove:y},t.proxy=function(e,n){if(r(e)){var i=function(){return e.apply(n,arguments)};return i._zid=l(e),i}if(o(n))return t.proxy(e[n],e);throw new TypeError("expected function")},t.fn.bind=function(t,e,n){return this.on(t,e,n)},t.fn.unbind=function(t,e){return this.off(t,e)},t.fn.one=function(t,e,n,i){return this.on(t,e,n,i,1)};var x=function(){return!0},b=function(){return!1},w=/^([A-Z]|returnValue$|layer[XY]$)/,E={preventDefault:"isDefaultPrevented",stopImmediatePropagation:"isImmediatePropagationStopped",stopPropagation:"isPropagationStopped"};t.fn.delegate=function(t,e,n){return this.on(e,t,n)},t.fn.undelegate=function(t,e,n){return this.off(e,t,n)},t.fn.live=function(e,n){return t(document.body).delegate(this.selector,e,n),this},t.fn.die=function(e,n){return t(document.body).undelegate(this.selector,e,n),this},t.fn.on=function(e,s,a,u,f){var c,l,h=this;return e&&!o(e)?(t.each(e,function(t,e){h.on(t,s,a,e,f)}),h):(o(s)||r(u)||u===!1||(u=a,a=s,s=n),(r(a)||a===!1)&&(u=a,a=n),u===!1&&(u=b),h.each(function(n,r){f&&(c=function(t){return y(r,t.type,u),u.apply(this,arguments)}),s&&(l=function(e){var n,o=t(e.target).closest(s,r).get(0);return o&&o!==r?(n=t.extend(T(e),{currentTarget:o,liveFired:r}),(c||u).apply(o,[n].concat(i.call(arguments,1)))):void 0}),v(r,e,u,a,s,l||c)}))},t.fn.off=function(e,i,s){var a=this;return e&&!o(e)?(t.each(e,function(t,e){a.off(t,i,e)}),a):(o(i)||r(s)||s===!1||(s=i,i=n),s===!1&&(s=b),a.each(function(){y(this,e,s,i)}))},t.fn.trigger=function(e,n){return e=o(e)||t.isPlainObject(e)?t.Event(e):j(e),e._args=n,this.each(function(){"dispatchEvent"in this?this.dispatchEvent(e):t(this).triggerHandler(e,n)})},t.fn.triggerHandler=function(e,n){var i,r;return this.each(function(s,a){i=T(o(e)?t.Event(e):e),i._args=n,i.target=a,t.each(h(a,e.type||e),function(t,e){return r=e.proxy(i),i.isImmediatePropagationStopped()?!1:void 0})}),r},"focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select keydown keypress keyup error".split(" ").forEach(function(e){t.fn[e]=function(t){return t?this.bind(e,t):this.trigger(e)}}),["focus","blur"].forEach(function(e){t.fn[e]=function(t){return t?this.bind(e,t):this.each(function(){try{this[e]()}catch(t){}}),this}}),t.Event=function(t,e){o(t)||(e=t,t=e.type);var n=document.createEvent(a[t]||"Events"),i=!0;if(e)for(var r in e)"bubbles"==r?i=!!e[r]:n[r]=e[r];return n.initEvent(t,i,!0),j(n)}}(Zepto),function(t){function l(e,n,i){var r=t.Event(n);return t(e).trigger(r,i),!r.isDefaultPrevented()}function h(t,e,i,r){return t.global?l(e||n,i,r):void 0}function p(e){e.global&&0===t.active++&&h(e,null,"ajaxStart")}function d(e){e.global&&!--t.active&&h(e,null,"ajaxStop")}function m(t,e){var n=e.context;return e.beforeSend.call(n,t,e)===!1||h(e,n,"ajaxBeforeSend",[t,e])===!1?!1:void h(e,n,"ajaxSend",[t,e])}function g(t,e,n,i){var r=n.context,o="success";n.success.call(r,t,o,e),i&&i.resolveWith(r,[t,o,e]),h(n,r,"ajaxSuccess",[e,n,t]),y(o,e,n)}function v(t,e,n,i,r){var o=i.context;i.error.call(o,n,e,t),r&&r.rejectWith(o,[n,e,t]),h(i,o,"ajaxError",[n,i,t||e]),y(e,n,i)}function y(t,e,n){var i=n.context;n.complete.call(i,e,t),h(n,i,"ajaxComplete",[e,n]),d(n)}function x(){}function b(t){return t&&(t=t.split(";",2)[0]),t&&(t==f?"html":t==u?"json":s.test(t)?"script":a.test(t)&&"xml")||"text"}function w(t,e){return""==e?t:(t+"&"+e).replace(/[&?]{1,2}/,"?")}function E(e){e.processData&&e.data&&"string"!=t.type(e.data)&&(e.data=t.param(e.data,e.traditional)),!e.data||e.type&&"GET"!=e.type.toUpperCase()||(e.url=w(e.url,e.data),e.data=void 0)}function j(e,n,i,r){return t.isFunction(n)&&(r=i,i=n,n=void 0),t.isFunction(i)||(r=i,i=void 0),{url:e,data:n,success:i,dataType:r}}function S(e,n,i,r){var o,s=t.isArray(n),a=t.isPlainObject(n);t.each(n,function(n,u){o=t.type(u),r&&(n=i?r:r+"["+(a||"object"==o||"array"==o?n:"")+"]"),!r&&s?e.add(u.name,u.value):"array"==o||!i&&"object"==o?S(e,u,i,n):e.add(n,u)})}var i,r,e=0,n=window.document,o=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,s=/^(?:text|application)\/javascript/i,a=/^(?:text|application)\/xml/i,u="application/json",f="text/html",c=/^\s*$/;t.active=0,t.ajaxJSONP=function(i,r){if(!("type"in i))return t.ajax(i);var f,h,o=i.jsonpCallback,s=(t.isFunction(o)?o():o)||"jsonp"+ ++e,a=n.createElement("script"),u=window[s],c=function(e){t(a).triggerHandler("error",e||"abort")},l={abort:c};return r&&r.promise(l),t(a).on("load error",function(e,n){clearTimeout(h),t(a).off().remove(),"error"!=e.type&&f?g(f[0],l,i,r):v(null,n||"error",l,i,r),window[s]=u,f&&t.isFunction(u)&&u(f[0]),u=f=void 0}),m(l,i)===!1?(c("abort"),l):(window[s]=function(){f=arguments},a.src=i.url.replace(/\?(.+)=\?/,"?$1="+s),n.head.appendChild(a),i.timeout>0&&(h=setTimeout(function(){c("timeout")},i.timeout)),l)},t.ajaxSettings={type:"GET",beforeSend:x,success:x,error:x,complete:x,context:null,global:!0,xhr:function(){return new window.XMLHttpRequest},accepts:{script:"text/javascript, application/javascript, application/x-javascript",json:u,xml:"application/xml, text/xml",html:f,text:"text/plain"},crossDomain:!1,timeout:0,processData:!0,cache:!0},t.ajax=function(e){var n=t.extend({},e||{}),o=t.Deferred&&t.Deferred();for(i in t.ajaxSettings)void 0===n[i]&&(n[i]=t.ajaxSettings[i]);p(n),n.crossDomain||(n.crossDomain=/^([\w-]+:)?\/\/([^\/]+)/.test(n.url)&&RegExp.$2!=window.location.host),n.url||(n.url=window.location.toString()),E(n),n.cache===!1&&(n.url=w(n.url,"_="+Date.now()));var s=n.dataType,a=/\?.+=\?/.test(n.url);if("jsonp"==s||a)return a||(n.url=w(n.url,n.jsonp?n.jsonp+"=?":n.jsonp===!1?"":"callback=?")),t.ajaxJSONP(n,o);var j,u=n.accepts[s],f={},l=function(t,e){f[t.toLowerCase()]=[t,e]},h=/^([\w-]+:)\/\//.test(n.url)?RegExp.$1:window.location.protocol,d=n.xhr(),y=d.setRequestHeader;if(o&&o.promise(d),n.crossDomain||l("X-Requested-With","XMLHttpRequest"),l("Accept",u||"*/*"),(u=n.mimeType||u)&&(u.indexOf(",")>-1&&(u=u.split(",",2)[0]),d.overrideMimeType&&d.overrideMimeType(u)),(n.contentType||n.contentType!==!1&&n.data&&"GET"!=n.type.toUpperCase())&&l("Content-Type",n.contentType||"application/x-www-form-urlencoded"),n.headers)for(r in n.headers)l(r,n.headers[r]);if(d.setRequestHeader=l,d.onreadystatechange=function(){if(4==d.readyState){d.onreadystatechange=x,clearTimeout(j);var e,i=!1;if(d.status>=200&&d.status<300||304==d.status||0==d.status&&"file:"==h){s=s||b(n.mimeType||d.getResponseHeader("content-type")),e=d.responseText;try{"script"==s?(1,eval)(e):"xml"==s?e=d.responseXML:"json"==s&&(e=c.test(e)?null:t.parseJSON(e))}catch(r){i=r}i?v(i,"parsererror",d,n,o):g(e,d,n,o)}else v(d.statusText||null,d.status?"error":"abort",d,n,o)}},m(d,n)===!1)return d.abort(),v(null,"abort",d,n,o),d;if(n.xhrFields)for(r in n.xhrFields)d[r]=n.xhrFields[r];var T="async"in n?n.async:!0;d.open(n.type,n.url,T,n.username,n.password);for(r in f)y.apply(d,f[r]);return n.timeout>0&&(j=setTimeout(function(){d.onreadystatechange=x,d.abort(),v(null,"timeout",d,n,o)},n.timeout)),d.send(n.data?n.data:null),d},t.get=function(){return t.ajax(j.apply(null,arguments))},t.post=function(){var e=j.apply(null,arguments);return e.type="POST",t.ajax(e)},t.getJSON=function(){var e=j.apply(null,arguments);return e.dataType="json",t.ajax(e)},t.fn.load=function(e,n,i){if(!this.length)return this;var a,r=this,s=e.split(/\s/),u=j(e,n,i),f=u.success;return s.length>1&&(u.url=s[0],a=s[1]),u.success=function(e){r.html(a?t("<div>").html(e.replace(o,"")).find(a):e),f&&f.apply(r,arguments)},t.ajax(u),this};var T=encodeURIComponent;t.param=function(t,e){var n=[];return n.add=function(t,e){this.push(T(t)+"="+T(e))},S(n,t,e),n.join("&").replace(/%20/g,"+")}}(Zepto),function(t){t.fn.serializeArray=function(){var n,e=[];return t([].slice.call(this.get(0).elements)).each(function(){n=t(this);var i=n.attr("type");"fieldset"!=this.nodeName.toLowerCase()&&!this.disabled&&"submit"!=i&&"reset"!=i&&"button"!=i&&("radio"!=i&&"checkbox"!=i||this.checked)&&e.push({name:n.attr("name"),value:n.val()})}),e},t.fn.serialize=function(){var t=[];return this.serializeArray().forEach(function(e){t.push(encodeURIComponent(e.name)+"="+encodeURIComponent(e.value))}),t.join("&")},t.fn.submit=function(e){if(e)this.bind("submit",e);else if(this.length){var n=t.Event("submit");this.eq(0).trigger(n),n.isDefaultPrevented()||this.get(0).submit()}return this}}(Zepto),function(t){"__proto__"in{}||t.extend(t.zepto,{Z:function(e,n){return e=e||[],t.extend(e,t.fn),e.selector=n||"",e.__Z=!0,e},isZ:function(e){return"array"===t.type(e)&&"__Z"in e}});try{getComputedStyle(void 0)}catch(e){var n=getComputedStyle;window.getComputedStyle=function(t){try{return n(t)}catch(e){return null}}}}(Zepto);