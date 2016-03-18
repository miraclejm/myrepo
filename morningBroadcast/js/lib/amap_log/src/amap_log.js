/**
 * 日志记录方法.
 * 支持 AMD 规范调用
 * 非AMD规范下，会为 AmapApp 创建 log 属性
 * 端内依赖 amap_native
 */
(function(factory) {
  'use strict';
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
  },
  /**
   * 记录日志并延迟执行跳转.
   * 因为记录日志为网络请求，如果记录日志后立即进行页面跳转可能造成记录失败，
   * 对于记录日志后发生跳转的问题，对跳转进行延迟处理
   * @param {String} click 用户行为名称
   * @param {String} [page] 页面名称，默认为初始化的页面名称
   * @param {String|Function} url 跳转的url或执行的方法
   */
  logJump: function(click, page, url) {
    if (!url) {
      url = page;
      page = this._logPageName;
    }
    this.log(click, page);
    setTimeout(function() {
      if (typeof url === 'function') {
        url();
      }
      else {
        location.href = url;
      }
    }, 200);
  }
};

if ( typeof define === 'function' && define.amd ) {
  return logApi;
} else {
  AmapApp.log = logApi;
}

});
