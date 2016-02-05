(function(window){
    var logBtn = $('#login');
    var registBtn = $('#regist');
    $(document).ready(function(){
        if(getCookie("name")){
            logBtn.css('display','none');
            registBtn.css('display','none');
            $('.identify').append("<span class='welcome'>欢迎你," + getCookie("name") + "<a id='signOut'>注销</a></span>");      
            $('#signOut').on('click',function(){
                delCookie("name");
                $('.welcome').remove();
                logBtn.css('display','inline-block');
                registBtn.css('display','inline-block');
            });
        }
    });
    init();
    function init(){
        bindEvent();
        fillActivity();
    }
    function fillActivity(){
        var acList = $('.activity ul');
        var activityJson = [
            {
                "flag":"beijing",
                "name":"西北大学北京校友会2014年年会暨第四届理事会在京召开",
                "time":"2014-06-30"
            },
            {
                "flag":"big",
                "name":"西北大学校友总会2014届年级理事聘任大会",
                "time":"2014-06-20"
            },
            {
                "flag":"dead",
                "name":"悼孙绳武兄",
                "time":"2014-06-16 "
            },
            {
                "flag":"year",
                "time":"2014-04-21",
                "name":"西北大学大庆2013年年会顺利召开"
            },
            {
                "flag":"reward",
                "name":"我校设立“何炼成奖”",
                "time":"2014-01-16"
            }/*,
            {
                "flag":"friend",
                "name":"校友赵文智、崔鹏分别当选中国工程院院士、中国科学院院士",
                "time":"2013-12-20 "
            },
            {
                "flag":"resource",
                "time":"2014-01-16 ",
                "name":"中国西部资源利用、生态建设与灾害防治研讨会在我校召开"
            },
            {
                "flag":"person",
                "time":"2014-02-25 ",
                "name":"我校校友龚全珍老人当选感动中国2013年度人物"
            }*/
        ];
        for(var i in activityJson){
            var html = '<li><a href="activity.html">'+activityJson[i].name+'('+activityJson[i].time+')</a></li>'
            acList.append(html);
        }
    }
    function bindEvent(){
        var mask = $('#mask');
        var login = $('.login');
        var regist = $('.regist');
        $('.innews').on('click',function(){
            $('.innews').addClass('active').siblings().removeClass('active');
            $('.snews').removeClass('none').siblings('.news-show').addClass('none');
        });
        $('.spread').on('click',function(){
            $('.spread').addClass('active').siblings().removeClass('active');
            $('.publish').removeClass('none').siblings('.news-show').addClass('none');
        });
        logBtn.on('click',function(){
            var account = $('#logAccount').val("");
            var password = $('#pass').val("");
            mask.fadeIn();
            login.fadeIn();
        });
        $('.log_close').on('click',function(){
            mask.fadeOut();
            login.fadeOut();
            regist.fadeOut();
        });
        registBtn.on('click',function(){
            mask.fadeIn();
            regist.fadeIn();
        });
        $('.signIn').on('submit',function(e){
            e.preventDefault();
            var account = $('#logAccount').val();
            var password = $('#pass').val();
            $.ajax({
                url:"./public/php/login.php",
                dataType:'json',
                method:'POST',
                data:'account='+account+'&password='+password,
                success:function(data){
                    if(data){
                        mask.fadeOut();
                        login.fadeOut();
                        $('.identify').append("<span class='welcome'>欢迎你," + data[0].name + "<a id='signOut'>注销</a></span>");
                        $('#signOut').on('click',function(){
                            delCookie("name");
                            $('.welcome').remove();
                            logBtn.css('display','inline-block');
                            registBtn.css('display','inline-block');
                        });
                        logBtn.css('display','none');
                        registBtn.css('display','none');
                        setCookie("name",data[0].name); 
                        //这里做登录成功的处理
                    }else{
                        $('.loginForm').append("<div class='loginTips'>账号或密码错误</div>");
                    }
                }
            })
        });
        $('#logIn').on('click',function(){
           $('.singIn').submit();
        });
        $('.registIn').on('submit',function(e){
            if($('#passSure').val() != $('#registPass').val()){
                $('.warning').show();
                return;
            }
            e.preventDefault();
            var account = $('#registAccount').val();
            var password = $('#registPass').val();
            var name = $('#name').val();
            $.ajax({
                url:"./public/php/regist.php",
                dataType:'json',
                method:'POST',
                data:'name='+name+'&account='+account+'&password='+password,
                success:function(flag){
                    if(flag){
                        mask.fadeOut();
                        regist.fadeOut();
                        $('.identify').append("<span class='welcome'>欢迎你," + name + "<a id='signOut'>注销</a></span>");
                        $('#signOut').on('click',function(){
                            $('.welcome').remove();
                            logBtn.css('display','inline-block');
                            registBtn.css('display','inline-block');
                        });
                        logBtn.css('display','none');
                        registBtn.css('display','none');
                        setCookie("name",name); 
                        //这里做登录成功的处理
                    }else{
                        $('.loginForm').append("<div class='loginTips'>账号或密码错误</div>");
                    }
                }
            })
        });
        $('#registIn').on('click',function(){
            $('.registIn').submit();
        });
        $('#passSure').blur(function(){
            if($('#passSure').val() != $('#registPass').val()){
                $('.warning').show();
            }
        });
    }
    function setCookie(name,value) 
    { 
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
    $('.carousel').carousel();
})(window);