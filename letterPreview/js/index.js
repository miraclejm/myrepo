;(function(window){
'use strict';
var fromStr = AmapApp.util.getUrlParam('from'); 
var title = "来高德领红包吧";
var isPublic = /amap\.com/i.test(location.host) && !/testing/i.test(location.host);
var url = {
    public : 'http://wap.amap.com/activity/letter/index.html',
    test : 'http://group.testing.amap.com/jing.chu/activity/letter/index.html'
};
init();
function init(){
    var btn = $('#btn');
    var target;
    if(!isPublic){
            target = url.test; 
        }
        else{
            target = url.public;
    }
    AmapApp.log.initLog('preview_letter_index');
    AmapApp.log.log('pv_letter');
    computeSize();
    bindEvent(fromStr,title,target);
    if(fromStr == "sc_xxgg" || fromStr === "sjkz"){
        btn.style.display = 'none';
    }
    if(fromStr === "cll"){
        var e = document.createEvent("MouseEvents");
        e.initEvent("click", true, true);
        setTimeout(function(){
            btn.dispatchEvent(e);
        },2000);
    }
} 
function bindEvent(str,openTitle,target_url){
    btn.addEventListener('click',function(){
        AmapApp.log.log("letter_" + str);
        AmapApp.bapi.openWeixinPrompt(target_url,openTitle);
    },false);
}
function computeSize(){
    var rate = (document.body.clientWidth*100)/640;
    $('html').style.fontSize = rate + 'px';
}
function $(name){
    return document.querySelector(name);
} 
})(window);