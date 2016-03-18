/**
 * 高德地图客户端与js交互实现.
 * 此js会生成全局变量 callback
 *    callback 供客户端使用，不能直接调用
 * 支持 AMD 规范调用
 * 非AMD规范下，会为 AmapApp 创建 napi 属性
 * 如果页面中使用了 iframe，则页面和 iframe 不能同时引用此js
 */
(function(factory) {
  'use strict';
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
    bridge = window.amapJsBridge;
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
        if (window.jsInterface) {
          window.jsInterface.invokeMethod('send', param);
        }
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
   * @param {Function} [handler] 可选，回调函数
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
   * @param {Function} handler 回调函数。
   *    参数为对象，如果其属性 userid 为空则登录失败，否则登录成功
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
      action: 'getMapLocation',
      forceReturnValue: '1'
    };
    this.send(param, handler);
  },
  /**
   * 图片预览
   */
  imagePreview : function(module, index, list) {
    var param = {
      action: 'imagePreview',
      module: module || '',
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
   * 打开第三方页面.
   * @param {Object} param 参数对象，属性如下
   *    {String} [iosh] 应用ios schema，用于呼起应用
   *    {String} [andh] 应用android schema，用于呼起应用
   *    {String} [wapUrl] 已第三方网站形式打开页面的url
   *    {String} [isout] 是否使用浏览器打开连接，为1时使用浏览器打开链接
   *    {String} [appName='第三方网站'] 第三方名称，显示为'高德地图正带您去xxx'
   *    {Integer} [loadingTime=1500] loading最短时间，单位毫秒，Android默认0
   *    {Object} [showButton] 可选，打开第三方页面时右上角显示按钮，属性如下
   *      buttonText {String} 按钮显示文字
   *      localFile {String} 点击此按钮打开的本地页面名称
   *      otherUrl {String} 点击此按钮打开的其它页面url
   *      localFile 和 otherUrl 只能一个有值另一个为空字符串
   * @see openThirdUrl
   */
  openAppUrl: function(param) {
    util.extend({
      action    : 'openAppUrl',
      'package' : '',
      version   : '',
      iosh      : '',
      andh      : '',
      wapUrl    : ''
    }, param);
    this.send(param);
  },
  /**
   * 打开第三方在线页面.
   * @see openAppUrl
   * @param {String} url 第三方页面url
   * @param {String} [appName='第三方网站'] 第三方名称，显示为'高德地图正带您去xxx'
   * @param {Integer} [loadingTime=1500] loading最短时间，单位毫秒，Android默认0
   * @param {Object} [button] 右上角按钮
   *    buttonText {String} 按钮显示文字
   *    localFile {String} 点击此按钮打开的本地页面名称
   *    otherUrl {String} 点击此按钮打开的其它页面url
   *    localFile 和 otherUrl 只能一个有值另一个为空字符串
   */
  openThirdUrl: function(url, appName, loadingTime, button) {
    var param = {
      action    : 'openAppUrl',
      'package' : '',
      version   : '',
      iosh      : '',
      andh      : '',
      wapUrl    : url
    };
    if (appName) {
      param.appName = appName;
    }
    if (loadingTime || loadingTime === 0) {
      param.loadingTime = loadingTime;
    }
    if (typeof button === 'object') {
      param.showButton = button;
    }
    this.send(param);
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
   * @param {Object} start 起始poi点
   * @param {Object} end 结束poi点
   */
  searchRoute: function(start, end) {
    var param = {
      action: 'searchRoute'
    };
    if (start) {
      param.startPoi = start;
    }
    if (end) {
      param.endPoi = end;
    }
    this.send(param);
  },
  /**
   * 调起客户端的分享面板.
   *
   * @param {Array.<Object>} content 分享内容
   *    数组元素属性说明：
   *    type 分享渠道： weixin 微信好友，pengyou 微信朋友圈，weibo 新浪微博
   *    url 分享的 url
   *    title 分享信息的标题，type=weibo时不需要
   *    message 分享信息的内容，type=pengyou时不需要
   *    imgUrl 分享信息显示的图片，微信朋友圈建议使用80*80，微博使用300*300的图片
   *    示例：
   *    [
   *      {type: 'weixin', title: '分享标题', message: '分享内容', url: 'http://a.com', imgUrl: 'http://b.jpg'},
   *      {type: 'pengyou', title: '分享信息', url: 'http://a.com', imgUrl: 'http://b.jpg'},
   *      {type: 'weixin', message: '分享信息', url: 'http://a.com', imgUrl: 'http://b.jpg'}
   *    ]
   *    注：数组长度小于3时，将不显示对应的渠道按钮
   * @param {Function} handler 分享后的回调。
   *   参数类型未对象， 属性 type 为用户选择的分享渠道，
   *   属性result=ok 时表示分享成功
   *   注：分享成功后未点击回到高德地图时 result 为 fail
   */
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
   * @param {Integer} step 后退的步数，正整数，默认为1
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
