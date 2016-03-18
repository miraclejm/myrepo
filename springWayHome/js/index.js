(function(window) {

'use strict';

var document = window.document;
function $id(id) {
  return document.getElementById(id);
}
function addClass(elem, name) {
  if (elem.classList) {
    elem.classList.add(name);
  }
  else {
    var className = ' ' + elem.className + ' ';
    if (className.indexOf(' ' + name + ' ') === -1) {
      className += name;
      elem.className = className.substr(1);
    }
  }
}
var toastTimeout;
/**
 * 显示提示信息.
 * @param {String} text 信息内容
 */
function showToast(text) {
  var toast = $id('toast');
  toast.innerText = text;
  toast.className = 'toast';
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  toastTimeout = setTimeout(function() {
    toast.className = 'toast none';
    toastTimeout = null;
  }, 3000);
}

var isPublic = /amap\.com/i.test(location.host) && !/testing/i.test(location.host);
var isInAmap = true;
var m5 = isPublic ? 'http://m5.amap.com' : 'http://maps.testing.amap.com';
var aosCity = m5 + '/ws/transfer/auth/way-home/city';

/** 城市信息 */
var cityInfo;

function init() {
  AmapApp.log.initLog('springWayHome_index');
  AmapApp.log.log('pv');
  setPageSize();
  getCityInfo();
  initEvent();

  if (!AmapApp.util.isInAmap()) {
    var url = location.href;
    var imgUrl = 'http://cache.amap.com/h5/activity/springWayHome/shareSmall.jpg';
    var shareCont = [
      {
        type: 'weixin',
        message: "春运正当堵，如何避拥堵？点击查看专属回家攻略",
        title: '春运回家怎么走？点开查看',
        url: url,
        imgUrl: imgUrl
      },
      {
        type: 'pengyou',
        title: "春运正当堵，如何避拥堵？点击查看专属回家攻略",
        url: url,
        imgUrl: imgUrl
      }
    ];
    AmapApp.bapi.weixinShare(shareCont);
  }
}

/**
 * 根据屏幕宽度适配页面.
 */
function setPageSize() {
  var bw = document.body.clientWidth;
  document.querySelector('html').style.fontSize = bw / 640 * 100 + 'px';
}
/**
 * 获取全国城市列表.
 */
function getCityInfo() {
  AmapApp.bapi.aosJsonp(aosCity, [
    {diu: '', sign: 1},
    {div: '', sign: 1}
  ], function(res) {
    cityInfo = res;

    // 创建省份选择滚轮
    var html = '';
    for (var i = 0, len = res.length; i < len; i++) {
      html += '<li data-id="' + i + '">' + res[i].province + '</li>';
    }
    document.querySelector('#provinceList > ul').innerHTML = html;

    easyScroll('#provinceList', {
      snap: true,
      moveto: 0,
      snap_callback: selectProvince
    });
  });
}
/** 城市选择列表滚动控件 */
var cityScroll;
/**
 * 选择省份后切换后面城市列表内容.
 * @param {HTMLElement} elem 选中的元素
 */
function selectProvince(elem) {
  var cityList = cityInfo[ elem.getAttribute('data-id') ].citylist;

  var html = '';
  for (var i = 0, len = cityList.length; i < len; i++) {
    html += '<li data-code="' + cityList[i].adcode + '">' + cityList[i].city + '</li>';
  }
  document.querySelector('#cityList > ul').innerHTML = html;

  if (cityScroll) {
    cityScroll.refresh(true);
  }
  else {
    cityScroll = easyScroll('#cityList', {
      snap: true,
      moveto: 0,
      preventDefault: false
    });
    $id('citySelect').className = 'city-select none';
  }
}

var clickedInput;
function initEvent() {
  // 点击出发点输入框
  $id('cityFrom').addEventListener('click', function(event) {
    event.stopPropagation();
    clickedInput = this;
    $id('citySelect').className = 'city-select';
  });
  // 点击目的地输入框
  $id('cityTo').addEventListener('click', function(event) {
    event.stopPropagation();
    clickedInput = this;
    $id('citySelect').className = 'city-select';
  });
  // 点击其它区域关闭选择城市弹窗
  $id('main').addEventListener('click', function() {
    $id('citySelect').className = 'city-select none';
  });
  $id('citySelect').addEventListener('click', function(event) {
    event.stopPropagation();
  });

  // 点击选择面板的取消按钮
  document.querySelector('#citySelect .cancel').addEventListener('click', function() {
    addClass( $id('citySelect'), 'none' );
    AmapApp.log.log('citySelectCancel');
  });
  // 点击选择面板的确定按钮
  document.querySelector('#citySelect .ok').addEventListener('click', function() {
    var elem = document.querySelector('#cityList .selected');
    selectCity(elem);
    AmapApp.log.log('citySelectOk');
  });

  // 点击城市名称
  $id('cityList').addEventListener('click', function(event) {
    if (event.target.className.trim() !== 'selected') {
      return;
    }
    selectCity(event.target);
    AmapApp.log.log('citySelectClickCity');
  }, false);

  // 点击查看按钮
  $id('viewMyRoute').addEventListener('click', function() {
    var fromCity = $id('cityFrom').getAttribute('data-code');
    var toCity = $id('cityTo').getAttribute('data-code');
    if (!fromCity || !toCity) {
      showToast('请输入完整起终点信息');
      return;
    }
    var param = AmapApp.util.getUrlParam();
    var url = 'wayDetail.html?start=' + fromCity + '&end=' + toCity;
    for (var key in param) {
      url += '&' + key + '=' + encodeURIComponent(param[key]);
    }
    location.href = url;
  });
}

/**
 * 选中城市.
 * @param {Element} elem 选择的城市元素
 */
function selectCity(elem) {
  // 起终点不能选择相同的城市
  var selectedCode = elem.getAttribute('data-code');
  var otherCode;
  if (clickedInput.id === 'cityFrom') {
    otherCode = $id('cityTo').getAttribute('data-code');
  }
  else {
    otherCode = $id('cityFrom').getAttribute('data-code');
  }
  if (selectedCode === otherCode) {
    showToast('起终点城市不能相同');
    return;
  }

  addClass(clickedInput, 'selected');
  clickedInput.innerText = elem.innerText;
  clickedInput.setAttribute('data-code', selectedCode);
  $id('citySelect').className = 'city-select none';
}

init();

})(window);
