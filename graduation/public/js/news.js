(function(window){
     $(document).ready(function(){
        var initShow = $('.helpLeft .active').data('type');
        showGift(initShow);
    });
    init();
    function init(){
        fillnewsList();
    }
    function fillnewsList(){
            $.ajax({
                url:"./public/php/showNews.php",
                dataType:'json',
                method:'POST',
                success:function(){
                    
                }
            })
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