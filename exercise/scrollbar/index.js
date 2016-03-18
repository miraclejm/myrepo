(function($){
    $.fn.scrollBar = function(options){
        var child = "<div class='bar'><div class='mid'></div></div>";
        var scrollIn = this.append(child);
            bar = scrollIn.find('.bar'),
            mid = scrollIn.find('.mid'),
            cont = scrollIn.find('.cont');
        var currentTop = 0,
            contH = cont.height(),
            wrapH = scrollIn.height(),
            midH = mid.height(),
            top_line = 0;
            bottom_line = wrapH - midH;
            delta = 0;
        scrollIn.delegate('div','mousedown',function(e1){
            var pageY = e1.pageY,
                barTop = parseInt($(this).css('top'));
                $(document).mousemove(function(e2){
                    //鼠标按下获取当前的高度barTop.
                    //此时向下滑newPageY只能小于或者等于wrapH-barTop-midH
                    //向上滑newPageY的绝对值只能小于或者等于barTop
                    var newPageY = e2.pageY - pageY;
                    var x = wrapH-barTop-midH;
                    currentTop = barTop + newPageY;
                    if((newPageY > 0 && newPageY > x) || (newPageY < 0 && -newPageY > barTop)){return;}
                    setMidTop();
                    window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
                });
                $(document).mouseup(function(){
                    $(document).unbind();
                });
                return false;
        });
            mousewheelEvent(function(){
                console.log(parseInt(mid.css('top')));
                change = delta > 0 ? -15 : 15;
                currentTop = change + currentTop;
                if(currentTop <= 0){
                    currentTop == 0;
                }
                setMidTop();
            });
        function mousewheelEvent(fun){
            if(document.attachEvent){
                document.attachEvent('onmousewheel',function(){
                    delta = event.wheelDelta;
                    event.returnValue = false;
                    fun();
                });
            }
            else if(document.addEventListener){
                    if(!$.browser.mozilla){
                        scrollIn.on('mousewheel',function(){
                        delta = event.wheelDelta; 
                        fun();
                        });
                    }
                    else{
                        document.addEventListener('DOMMouseScroll', function(e){
                        delta = e.detail > 0 ? -1 : 1;
                        e.preventDefault();
                        fun();
                    });
                    }
            }
        }
        function setMidTop(){
            var contTop = currentTop*contH/wrapH;
            mid.css({'top':currentTop});
            cont.css({'top':-contTop});
        }
    };
})(jQuery);
    $('.wrap').scrollBar();
