(function(window){
    $('.carousel').carousel({
        interval:2000
    });
    init();
    function init(){
        fillPic();
    }
    function fillPic(){
        var picList = $('.picList div');
        picList.each(function(i){
            $(this).css({
                "backgroundImage":"url(./public/img/pic_" + (i+1) + ".jpg)"
            });
        });
    }
})(window);