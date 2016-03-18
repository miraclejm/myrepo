;(function(window){
'use strict';
var fromStr = AmapApp.util.getUrlParam('from'); 
var target;
init();
function init(){
    var btn = $('#btn');
    AmapApp.log.initLog('update_bag');
    AmapApp.log.log('pv');
    computeSize();
    bindEvent();
} 
function bindEvent(){
    var os = AmapApp.util.os.ios;
    btn.addEventListener('click',function(){
        console.log("a");
        AmapApp.log.log('update_btn_click');
        if(os){
            location.href = 'http://itunes.apple.com/app/id461703208?ls=1&mt=8';
        }
        else{
            location.href = 'http://mapdownload.autonavi.com/mobileapk/Amap_Android_V7.5.8.2099_GuanWang.apk';
        }
    },false);
}
function computeSize(){
    var bg = $('#bg');
    var hwRate = window.screen.height/window.screen.width;
    if(hwRate <= 1.6){
        $('#bg').style.marginTop = '-1.28rem';
        btn.style.top = '4.5rem';
    }
    if(hwRate >= 1.78){
        $('#bg').style.marginTop = '-0.64rem';
        btn.style.top = '5.2rem';
    }
}
function $(name){
    return document.querySelector(name);
} 
})(window);