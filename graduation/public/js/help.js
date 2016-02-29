(function(window){
     $(document).ready(function(){
        var initShow = $('.helpLeft .active').data('type');
        showGift(initShow);
    });
    init();
    function init(){
        addLeftActive();
        fillMethod();
    }
    function addLeftActive(){
        var list = $('.helpLeft div');
        list.on('click',function(){
            $(this).addClass('active').siblings().removeClass('active');
            showGift($(this).data('type'));
        });
    }
    function showGift(type){
        if(type === "method"){
            $('.giveHelp').show();
        }
        else{
            $('.giveHelp').hide();
        }
        var content = $('#'+type);
        content.css('display','block').siblings().css('display','none');
    }
    function fillMethod(){
        var method = $('#method');
        var html;
        
        // return;
        $.ajax({
                url:"./public/php/comment.php",
                dataType:'json',
                method:'POST',
                success:function(data){
                    var current_user = getCookie("name");
                    for(var i in data){
                        var c = data[i].comment.split('_jm_');
                        var cu = data[i].cuser.split('_jm_');
                        var cl = data[i].fireList.split('_jm_');
                        html = "<div class='methodList'>" +
                                "<h1 class='c_title'>"+data[i].title+"</h1>" +
                                "<div class='c_info'><h4 ><span class='c_name'>"+data[i].name+"</span>发布于(<span class='c_time'>"+data[i].time+"</span>)"+"</h4></div>" +
                                "<div class='showMsg'>查看详细内容<i>&#xe902</i></div>" +
                                "<div class='c_msg none'>"+data[i].msg+"</div>" +
                                "<div>"+
                                "<div class='action'>";
                        if(data[i].fireList.indexOf(current_user) >0 ){
                            html += "<span class='fire off'>&#xe901<i class='fire_num'>"+(cl.length-1)+"</i></span>";
                        }
                        else{
                            html += "<span class='fire on'>&#xe901<i class='fire_num'>"+(cl.length-1)+"</i></span>";
                        }       
                                html += "<span class='showComment'>&#xe900<i class='comment_num'>"+(c.length-1)+"</i></span>"+
                                "</div>"+
                                "<div class='comment'>";
                                for(var j=0;j<c.length;j++){
                                    if(c[j] != "" && cu[j] != ""){
                                        html += "<div>"+c[j]+"<span>__by_"+cu[j]+"</span></div>";
                                    }
                                }
                                html +=  "<div class='publish'>"+
                                        "<textarea name='post' id='post' cols='30' rows='10'></textarea>"+
                                        "<div class='btn-info comment_btn'>评论</div>"+
                                        "</div>"+
                                        "</div>"+
                                        "</div></div>";
                        method.append(html);
                    }
                    $('.fire').on('click',function(){
                        if(!getCookie("name")){
                            alert("请返回首页登录/注册!!");
                            location.replace("index.html");
                            return;
                        }
                        else{
                            var _this = $(this);
                            var thisClass= _this.attr('class');
                            var c_user = getCookie("name");
                            var c_time = $(this).parent().parent().parent().find('.c_info').find('.c_time').text();
                            var c_title = $(this).parent().parent().parent().find('.c_title').text();
                            var c_msg = $(this).parent().parent().parent().find('.c_msg').text();
                            var c_name = $(this).parent().parent().parent().find('.c_name').text();
                            if(thisClass.indexOf("on") > 0 ){
                                $.ajax({
                                    url:"./public/php/addFire.php",
                                    dataType:'json',
                                    method:'POST',
                                    data:'username='+c_user+'&time='+c_time+'&title='+c_title+'&msg='+c_msg+'&name='+c_name,
                                    success:function(data){
                                        if(data){
                                            var n = parseInt(_this.find('.fire_num').text());
                                            n++;
                                            _this.find('.fire_num').text(n);
                                            _this.addClass('off');
                                            _this.removeClass('on');
                                           // $(this).parent().hide();
                                           // location.reload("index.html#help");
                                        }else{
                                            alert("评论失败，请重新");
                                        }
                                    }
                                }) 
                            }
                            else{
                                alert("已经表示过关心，十分感谢！");
                            }
                        }
                    });
                    $('.comment_btn').on('click',function(){
                        var _this = $(this);
                        var c_in = $(this).parent().find('#post').val();
                        var c_user = getCookie("name");
                        var c_time = $(this).parent().parent().parent().parent().find('.c_info').find('.c_time').text();
                        var c_title = $(this).parent().parent().parent().parent().find('.c_title').text();
                        var c_msg = $(this).parent().parent().parent().parent().find('.c_msg').text();
                        var c_name = $(this).parent().parent().parent().parent().find('.c_name').text();
                        if(c_in == ""){
                            alert("评论内容不能为空！");
                            return;
                        }
                        $.ajax({
                            url:"./public/php/addComment.php",
                            dataType:'json',
                            method:'POST',
                            data:'username='+c_user+'&comment='+c_in+'&time='+c_time+'&title='+c_title+'&msg='+c_msg+'&name='+c_name,
                            success:function(data){
                                $("<div>"+c_in+"<span>__by_"+c_user+"</span>"+"</div>").insertBefore(_this.parent());
                                if(data){
                                    _this.parent().slideToggle();
                                }else{
                                    alert("评论失败，请重新");
                                }
                            }
                        })
                    });
                    $('.showMsg').on('click',function(){
                        var _this = $(this);
                        _this.parent().find('.c_msg').slideToggle(function(){
                            if(_this.parent().find('.c_msg').attr('class').indexOf("none") >= 0){
                                _this.parent().find('.c_msg').removeClass('none');
                                _this.html("收起详细内容<i>&#xe903</i>");
                                // _this.find('i').html('');
                            }
                            else{
                                _this.parent().find('.c_msg').addClass('none');
                                _this.html("查看详细内容<i>&#xe902</i>");
                                // _this.find('i').html('&#xe902');
                            }
                        });
                    });
                    $('.showComment').on('click',function(e){
                        var show = $(this).parent().parent().find('.comment');
                        $('.comment').not(show).css('display','none');
                        var comment_list = $('.comment');
                        if(!getCookie("name")){
                            alert("请返回首页登录/注册!!");
                            location.replace("index.html");
                        }
                        // var numC = $('.showComment i').text();
                        show.slideToggle();
                    });
                }
        })
        $('.giveHelp').on('click',function(){
            if(!getCookie("name")){
                alert("请返回首页登录/注册!!");
                location.replace("index.html");
                return;
            }
            $('.mask').show();
            $('.publishHelp').show();
        });
        $('.helpSure').on('click',function(){
            var helpTitle = $('.helpTitle').val();
            var helpMsg = $('.helpMsg').val();
            var date = new Date();
            var year = date.getFullYear();
            var month = (date.getMonth()+1) >= 9 ? date.getMonth() : ("0"+(date.getMonth()+1));
            var day = date.getDate() >=9 ? date.getDate() : ("0"+date.getDate());
            var timeStr = year+"-"+month+"-"+day;
            var name = getCookie("name");
            if(helpTitle == "" || helpMsg == ""){
                alert("【求助不能为空】");
                return;
            }
            $.ajax({
                url:"./public/php/addHelp.php",
                dataType:'json',
                method:'POST',
                data:'name='+name+'&time='+timeStr+'&title='+helpTitle+'&msg='+helpMsg,
                success:function(data){
                    if(data){
                        $('.mask').hide();
                        $('.publishHelp').hide();
                    var html = "<div class='methodList'>" +
                                    "<h1 class='c_title'>"+helpTitle+"</h1>" +
                                    "<div class='c_info'><h4 class='c_name'>"+name+"发布于(<span class='c_time'>"+timeStr+"</span>)"+"</h4></div>" +
                                    "<div class='showMsg'>查看详细内容<i>&#xe902</i></div>" +
                                    "<div class='c_msg none'>"+helpMsg+"</div>" +
                                    "<div>"+
                                    "<div class='action'>"+
                                    "<span class='fire on'>&#xe901<i class='fire_num'>0</i></span>"+
                                    "<span class='showComment'>&#xe900<i class='comment_num'>0</i></span>"+
                                "</div>";
                        html += "<div class='comment'>"+ 
                                "<div class='publish'>"+
                                "<textarea name='post' id='post' cols='30' rows='10'></textarea>"+
                                "<div class='btn-info comment_btn'>评论</div>"+
                                "</div>"+
                                 "</div>"+
                                "</div></div>";
                        $('#method').append(html);
                        $('.fire').on('click',function(){
                        if(!getCookie("name")){
                            alert("请返回首页登录/注册!!");
                            location.replace("index.html");
                            return;
                        }
                        else{
                            var _this = $(this);
                            var thisClass= _this.attr('class');
                            var c_user = getCookie("name");
                            var c_time = $(this).parent().parent().parent().find('.c_info').find('.c_time').text();
                            var c_title = $(this).parent().parent().parent().find('.c_title').text();
                            var c_msg = $(this).parent().parent().parent().find('.c_msg').text();
                            var c_name = $(this).parent().parent().parent().find('.c_name').text();
                            if(thisClass.indexOf("on") > 0 ){
                                $.ajax({
                                    url:"./public/php/addFire.php",
                                    dataType:'json',
                                    method:'POST',
                                    data:'username='+c_user+'&time='+c_time+'&title='+c_title+'&msg='+c_msg+'&name='+c_name,
                                    success:function(data){
                                        if(data){
                                            var n = parseInt(_this.find('.fire_num').text());
                                            n++;
                                            _this.find('.fire_num').text(n);
                                            _this.addClass('off');
                                            _this.removeClass('on');
                                           // $(this).parent().hide();
                                           // location.reload("index.html#help");
                                        }else{
                                            alert("评论失败，请重新");
                                        }
                                    }
                                }) 
                            }
                            else{
                                alert("已经表示过关心，十分感谢！");
                            }
                        }
                    });
                    $('.comment_btn').on('click',function(){
                        var _this = $(this);
                        var c_in = $(this).parent().find('#post').val();
                        var c_user = getCookie("name");
                        var c_time = $(this).parent().parent().parent().parent().find('.c_info').find('.c_time').text();
                        var c_title = $(this).parent().parent().parent().parent().find('.c_title').text();
                        var c_msg = $(this).parent().parent().parent().parent().find('.c_msg').text();
                        var c_name = $(this).parent().parent().parent().parent().find('.c_name').text();
                        if(c_in == ""){
                            alert("评论内容不能为空！");
                            return;
                        }
                        $.ajax({
                            url:"./public/php/addComment.php",
                            dataType:'json',
                            method:'POST',
                            data:'username='+c_user+'&comment='+c_in+'&time='+c_time+'&title='+c_title+'&msg='+c_msg+'&name='+c_name,
                            success:function(data){
                                $("<div>"+c_in+"<span>__by_"+c_user+"</span>"+"</div>").insertBefore(_this.parent());
                                if(data){
                                    _this.parent().slideToggle();
                                }else{
                                    alert("评论失败，请重新");
                                }
                            }
                        })
                    });
                    $('.showMsg').on('click',function(){
                        var _this = $(this);
                        _this.parent().find('.c_msg').slideToggle(function(){
                            if(_this.parent().find('.c_msg').attr('class').indexOf("none") >= 0){
                                _this.parent().find('.c_msg').removeClass('none');
                                _this.html("收起详细内容<i>&#xe903</i>");
                                // _this.find('i').html('');
                            }
                            else{
                                _this.parent().find('.c_msg').addClass('none');
                                _this.html("查看详细内容<i>&#xe902</i>");
                                // _this.find('i').html('&#xe902');
                            }
                        });
                    });
                    $('.showComment').on('click',function(e){
                        var show = $(this).parent().parent().find('.comment');
                        $('.comment').not(show).css('display','none');
                        var comment_list = $('.comment');
                        if(!getCookie("name")){
                            alert("请返回首页登录/注册!!");
                            location.replace("index.html");
                        }
                        // var numC = $('.showComment i').text();
                        show.slideToggle();
                    });
                    }
                }
            })
        });
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
    $('.carousel').carousel();
})(window);