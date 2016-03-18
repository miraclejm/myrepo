(function(window){
     $(document).ready(function(){
        var initShow = $('.helpLeft .active').data('type');
        showGift(initShow);
    });
    init();
    function init(){
        addLeftActive();
    }
    function addLeftActive(){
        var list = $('.helpLeft div');
        list.on('click',function(){
            $(this).addClass('active').siblings().removeClass('active');
            showGift($(this).data('type'));
        });
    }
    function showGift(type){
        var content = $('#'+type);
        content.css('display','block').siblings().css('display','none');
    }
    function setCookie(name,value){ 
            var Days = 30; 
            var exp = new Date(); 
            exp.setTime(exp.getTime() + Days*24*60*60*1000); 
            document.cookie = name + "="+ escape (value) + ";expires=" + exp.toGMTString(); 
    } 
    function getCookie(name) 
    { 
        var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
     
        if(arr=document.cookie.match(reg))
     
            return unescape(arr[2]); 
        else 
            return null; 
    } 
    function delCookie(name) 
    { 
        var exp = new Date(); 
        exp.setTime(exp.getTime() - 1); 
        var cval=getCookie(name); 
        if(cval!=null) 
            document.cookie= name + "="+cval+";expires="+exp.toGMTString(); 
    } 
})(window);