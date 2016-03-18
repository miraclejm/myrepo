 console.log($('.b').width());
        // $('.b').css('top',"-"+$('.b').height()+'px');
        $('.btn').click(function(){
            console.log($('.b').height());
            $('.b').css({
                'transform':'translateY('+$('.b').height()+')px',
                'transition':'1000ms'
            });
        });