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
                    console.log(data);
                    for(var i in data){
                        html = "<div class='methodList'>" +
                                "<h1>"+data[i].title+"</h1>" +
                                "<h4>"+data[i].name+"<span>("+data[i].time+")</span>"+"</h4>" +
                                "<div>"+data[i].msg+"</div>" +
                                "<div>"+
                                "<div class='btn-info showComment'>展开评论</div>"+
                                "<div class='comment'>";
                                var c = data[i].comment.split('_jm_');
                                var cu = data[i].cuser.split('_jm_');
                                for(var j=0;j<c.length;j++){
                                    if(c[j] != "" && cu[j] != ""){
                                        html += "<div>"+c[j]+"<div>---by"+cu[j]+"</div></div>";
                                    }
                                }
                                html +=  "<div class='publish'>"+
                                        "<textarea name='post' id='post' cols='30' rows='10'></textarea>"+
                                        "<div class='btn-info'>评论</div>"+
                                        "</div>"+
                                        "</div>"+
                                        "</div></div>";
                        method.append(html);
                    }
                    $('.showComment').on('click',function(){
                        var show = $(this).siblings();
                        show.slideToggle();
                    });
                }
        })
    }
})(window);