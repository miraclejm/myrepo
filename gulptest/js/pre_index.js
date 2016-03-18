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