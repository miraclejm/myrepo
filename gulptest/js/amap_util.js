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
