(function(window){
    init();
    function init(){
        var ele = document.querySelector('#slideCon');
        var slide = new PicSlide(ele,{"isLoop":false});
        var btn = document.querySelector('.bottom_btn');
        var url = "androidamap://rootmap?sourceApplication=revokeUser";
        AmapApp.log.initLog('revokeUser');
        AmapApp.log.log('pv_professional');
        btn.addEventListener('click',function(){
            AmapApp.log.log('btn_click');
            AmapApp.napi.loadSchema(url);
        },false);
    }
})(window);