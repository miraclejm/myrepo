(function(window){
    'use strict';

    var isPublicEnv = /amap\.com/i.test(location.host) && !/testing/i.test(location.host);
    var m5 = isPublicEnv ? 'http://m5.amap.com' : 'http://maps.testing.amap.com';
    var aosRoute = m5 + '/ws/transfer/auth/way-home/route';
    var testUrl = {
        log: 'http://oss.testing.amap.com/ws/h5_log',
        SHARE: 'http://group.testing.amap.com/public/activity/springWayHome/index.html',
    };
    var publicUrl = {
        log: 'http://oss.amap.com/ws/h5_log',
        SHARE: 'http://wap.amap.com/activity/springWayHome/index.html'
    };
    var url = {
        log: getUrl('log'),
        SHARE: getUrl('SHARE'),
        SHARE_IMG: 'http://cache.amap.com/h5/activity/springWayHome/shareSmall.jpg',//分享小图
        SHARE_BIGIMG: 'http://cache.amap.com/h5/activity/springWayHome/shareBig.jpg',//分享大图
    };

    var shareCont;
    var protect_url = "http://wb.amap.com/driving/index.php?id=151";
    var inapp = AmapApp.util.isInAmap();
    var data = "";
    getRouteInfo();
    //获取起终点信息返回值赋给data
    function getRouteInfo(){
        var start = getRequest('start'),
            end = getRequest('end');

        // 无法获取起终点信息时回首页
        if (!start || !end) {
            location.replace('index.html?' + AmapApp.util.IN_AMAP_KEY + '=0&' +
                AmapApp.util.PAGE_SOURCE_KEY + '=error');
            return;
        }
        AmapApp.bapi.aosJsonp(aosRoute,[
                {start : start},
                {end : end}
            ],function(res){
                data = res;
                init();
            });
    }
    function init(){
        AmapApp.log.initLog('springWayHome_wayDetail');
        var urlParam = AmapApp.util.getUrlParam();
        AmapApp.log.log('pv_' + urlParam.start + '_' + urlParam.end);
        var pageName = '',
            hour = data.duration/60,
            share = $('.share_con'),
            count = 0;
        computeSize();

        var shareMsg = '我的春节回家路超过了' + judgePercent() + '的人，不服来比！';
        shareCont = [
            {
                type: 'weibo',
                title: shareMsg,
                url: url.SHARE,
                imgUrl: url.SHARE_BIGIMG
            },
            {
                type: 'weixin',
                message: shareMsg,
                title: '春运回家怎么走？点开查看',
                url: url.SHARE,
                imgUrl: url.SHARE_IMG
            },
            {
                type: 'pengyou',
                title: shareMsg,
                url: url.SHARE,
                imgUrl: url.SHARE_IMG
            }
        ];
        // 自定义微信分享文案
        if (!inapp) {
            AmapApp.bapi.weixinShare(shareCont);
        }
        fillData();
        drawMap();
        addRules();
        fillDetail();
        $('.plane').on('click',function(){
            AmapApp.log.log('gotoAmap');
            location.href = 'http://wap.amap.com/';
        });
        $('.red_bag').on('click',function(){
            AmapApp.log.log('gotoPerson');
            location.href = 'http://a.app.qq.com/o/simple.jsp?pkgname=com.peopledailychina.activity&g_f=991706';
        });
        $('.protect_btn').on('click',function(){
            setTimeout(function(){
                location.href = protect_url;
            }, 200);
        });
        if(inapp){
            share.on('click',inShare);
        }
        else{
            $('.share_con').on('click', function() {
                AmapApp.log.log('compareFriend');
                $('#shareNotice').show();
            }).text('跟小伙伴比比');
            // share.on('click',outShare);
        }

        $('#shareNotice').on('touchstart', function() {
            $(this).hide();
        });

        function addRules(){
            var rule = {};
            if((data.max_road_length/1000) > 200){
                insertStrategy("max");
                rule.max = "max";
            }
            if(data.highway_incident_road){
                insertStrategy("hincident");
                rule.hincident = "hincident";
            }
            if(data.city_congest_road){
                insertStrategy("city");
                rule.city = "city";
            }
            if(data.highway_congest_road){
                insertStrategy("hcongest");
                rule.hcongest = "hcongest";
            }
            if(data.custom_notice){
                insertStrategy("notice");
            }
            if((data.distance/1000) > 500){
                insertStrategy("distance");
                rule.distance = "distance";
            }
            addStrategy(count,rule);
            if(data.city_congest_city){
                $('.bottom').css('background-size','contain');
            }
        }
        //绘制折现地图
        function drawMap(){
            var arr = data.polyline.split(';');
            var len = arr.length;
            var linearr = new Array();
            var zoom = setZoom(data.distance/1000);
            for(var i = 0;i < len; i++){
                var x = parseFloat(arr[i].split(',')[0]);
                var y = parseFloat(arr[i].split(',')[1]);
                linearr[i] = [x,y];
            }
            var centerX = (linearr[0][0] + linearr[len-1][0])/2,
                centerY = (linearr[0][1] + linearr[len-1][1])/2;
            var map = new AMap.Map('container', {
                resizeEnable : true,
            });
            var polyline = new AMap.Polyline({
                path : linearr,
                strokeColor : "#3366ff",
                strokeOpacity : 1,
                strokeWeight : 5,
                strokeStyle : 'solid'
            });
            polyline.setMap(map);
            map.setZoomAndCenter(zoom,[centerX,centerY]);
            var markers = [
                {
                    icon : "http://webapi.amap.com/theme/v1.3/markers/n/start.png",
                    position : linearr[0]
                },
                {
                    icon : "http://webapi.amap.com/theme/v1.3/markers/n/end.png",
                    position : linearr[arr.length-1]
                }
            ];
            markers.forEach(function(marker){
                new AMap.Marker({
                    map : map,
                    icon : marker.icon,
                    position : marker.position
                });
            });
            function setZoom(disRate){
                var rate = parseInt(disRate);
                if(rate < 250){
                    return 8;
                }else if(rate < 1000){
                    return 6;
                }else if(rate < 1250){
                    return 5;
                }else if(rate < 1750){
                    return 4;
                }else{
                    return 3;
                }
            }
            //给眼睛绑定事件取消全览
            $('#eye').on('click',function(){
                AmapApp.log.log('click_watch_all');
                map.setZoomAndCenter(zoom,[centerX,centerY]);
            });
        }
        //计算数据并且显示对应的标示
        function fillData(){
            /*
                根据行驶的综合判断填充星星
            */
            $('.showDetail').on('click',showLineDetail);
            var ystarNum = starJudge();
            var wstarNum = 5 - ystarNum;
            var per = judgePercent();
            for(var i = 1;i <= ystarNum;i++){
                var star = document.createElement('img');
                star.src = "./img/yellowStar.png";
                $('.star').append(star);
            }
            for(var i = 1;i <= wstarNum;i++){
                var star = document.createElement('img');
                star.src = "./img/whiteStar.png";
                $('.star').append(star);
            }
            /*
                计算吃饭睡觉的时间并且进行填充
            */
            var sleep = hour >= 12 ? Math.floor(hour/12)*7.5 : 0;
            var wc = hour >= 4 ? Math.floor(hour/4)*15/60 : 0;
            var eat = hour >= 6 ? Math.floor(hour/6)*0.75 : 0;
            var sum = hour + sleep + eat + wc;
            var minute = Math.round((sum-parseInt(sum))*60);
            var dm = Math.floor((hour - parseInt(hour))*60);//开车的分钟
            if(parseInt(sum) == 0){
                minute = minute >= 10 ? minute : '0'+minute;
                $('.hour').html(minute+"<span class='hm'>分钟</span>");
            }
            else{
                if(minute == 0){
                    sum = sum >= 10 ? sum : '0'+sum;
                    $('.hour').html(parseInt(sum) + "<span class='hh'>小时</span>");
                }
                else{
                    sum = Math.floor(parseInt(sum)) >= 10 ? parseInt(sum) : '0'+parseInt(sum);
                    minute = minute >= 10 ? minute : '0'+minute;
                    $('.hour').html(sum + "<span class='hh'>小时</span>"+minute+"<span class='hm'>分钟</span>");
                }
            }
            //填充页面的静态html内容
            $('.pre').html("以上为预估总时长 仅供参考哦亲");
            $('.changdu').html("超过了全国<span class='percent'>" +per+ "</span>的回家大军");
            $('.showDetail').html("展开查看路线详情<img src='./img/down.png' alt='angle' class='angle'>");
            $('#container').append('<div id="eye"><img src="./img/eye.png" alt="eye" />全览</div>');
            var uc = '<div class="drive icon-list">' +
                         '<img src="./img/time_drive.png" class="icon">' +
                         '<img src="./img/timebar.png" class="timebar">' +
                     '</div>' +
                     '<div class="eat icon-list">' +
                         '<img src="./img/time_eat.png" class="icon">' +
                         '<img src="./img/timebar.png" class="timebar">' +
                     '</div>' +
                     '<div class="wc icon-list">' +
                         '<img src="./img/time_wc.png" class="icon">' +
                         '<img src="./img/timebar.png" class="timebar">' +
                     '</div>' +
                     '<div class="sleep icon-list">' +
                         '<img src="./img/time_sleep.png" class="icon">' +
                         '<img src="./img/timebar.png" class="timebar">' +
                     '</div>';
            $('.upList').append(uc);
            $('.share_con').text('分享');
            $('body').append('<div id="mask" class="layout"><div class="mask_btn">点击查看具体路线</div></div>');
            $('.mask_btn').on('click',function(){
                AmapApp.log.log('click_mask_btn');
                $('#mask').css('display','none');
            });
            //插入开车的按钮和时间
            insertIcon("drive",hour);
            if(eat){
                insertIcon("eat",eat);
            }else{
                insertHTML("eat");
            }
            if(wc){
                insertIcon("wc",wc);
            }else{
                insertHTML("wc");
            }
            if(sleep){
                insertIcon("sleep",sleep);
            }else{
                insertHTML("sleep");
            }
        }
        //匹配固定的上方列表文案
        //接受一个参数,标示对应的基本字段
        function insertHTML(name){
            var div =document.createElement('div');
            div.className = "tips";
            if(name == "eat"){
                div.innerHTML = "出发前别忘了备点小零食哦";
            }
            if(name == "wc"){
                div.innerHTML = "回家路上要记得及时方便哈";
            }
            if(name == "sleep"){
                div.innerHTML = "休息好才能保证安全到家哟";
            }
            $('.'+name).append(div);
        }
        //插入上方吃饭睡觉等时间列表
        //接受2个参数，为对应的name列表添加对应的tHour时间
        function insertIcon(name,tHour){
            var timehour = tHour.toString().split('.')[0],
                timeMinute = Math.round(Math.round((tHour - parseInt(tHour))*1000)/1000*60);
            timehour = parseInt(timehour) >= 10 ? parseInt(timehour) : "0"+parseInt(timehour);
            timeMinute = parseInt(timeMinute) >= 10 ? parseInt(timeMinute) : "0"+parseInt(timeMinute);
            var dh = document.createElement('div');
            dh.className = 'timebarHour';
                if(timehour == 0){
                    timehour = "00";
                }
                if(timeMinute == 0){
                    timeMinute = "00";
                }
            dh.innerHTML = "约<span class='th'>" + timehour + "</span>小时<span class='tm'>" + timeMinute + "</span>分钟";
            $('.'+name).append(dh);
        }
        //插入匹配规则
        //约定key值 max匹配最长道路策略 distance匹配保养策略 city匹配城市拥堵策略 
        // hCongest匹配高速拥堵策略 hIncident匹配高速事故策略
        //改变count值
        function insertStrategy(key){
            var downList = $('.downList');
            var div = document.createElement('div'),
                img = document.createElement('img'),
                html = document.createElement('div');
            var content;
            div.className = "list";
                if(key == "max"){
                    content  = "<span class='red'>"+data.max_road+"</span>"+
                                "会连续行驶<span class='red'>"+Math.round(data.max_road_length/1000)+"</span>公里,"+
                                "请提前做好相应准备";
                    insertList(content,"max");
                    count ++;
                }
                if(key == "hincident"){
                    content  = "<span class='red'>"+data.highway_incident_road+"</span>名列春节事故高发路段排行榜第<span class='red'>"+data.highway_incident_rank+"</span>位, 路过的时候一定要小心再小心哦~";
                    insertList(content,"hincident");
                    count ++;
                }
                 if(key == "hcongest"){
                    content  = "<span class='red'>"+data.highway_congest_road+"路段</span>名列春节拥堵高发路段排行榜第<span class='red'>"+data.highway_congest_rank+"</span>位, 记得开启导航躲避拥堵哦！";
                    insertList(content,"hcongest");
                    count ++;
                }
                if(key == "notice"){
                    content  = data.custom_notice;
                    insertList(content,"notice");
                }
                if(key == "distance"){
                    div.className = "list distance";
                    var btn = document.createElement('div');
                    btn.innerHTML = "点击查看冬季保养攻略";
                    btn.className = "protect_btn";
                    html.innerHTML = "全程行驶<span class='red'>"+Math.round((data.distance/1000))+"</span>公里,出发前别忘了给爱车做保养";
                    img.src = "./img/protect_icon.png";
                    div.appendChild(img);
                    div.appendChild(html);
                    div.appendChild(btn);
                    downList.append(div);
                    $('.protect_btn').on('click',function(){
                        AmapApp.log.log('click_go_protect');
                    });
                    count ++;
                }
                if(key == "city"){
                    $('.strategy').css('display','block');
                    div.className = "cityIcon"
                    var newimg = document.createElement('img');
                    html.innerHTML = "<span class='red'>" + data.city_congest_road + "</span>为<span class='red'>" + data.city_congest_city + "</span>春节期间<span class='red'>" + data.city_congest_direction + "</span>拥堵路段";
                    img.src = "./img/city.png";
                    newimg.src = data.city_congest_bypass;
                    newimg.id = "city";
                    div.appendChild(img);
                    div.appendChild(html);
                    // div.appendChild(newimg);
                    $('.strategy').append(div);
                    $('.strategy').append(newimg);
                    count ++;
                }
        }
        //根据接受到的key值判断策略匹配。
        //根据count值进行判断
        function addStrategy(count,rkey){
            var downList = $('.downList');
            var div = document.createElement('div'),
                img = document.createElement('img'),
                html = document.createElement('div');
            var rule1 = "用高德地图，为你的回家路保驾护航！春节期间使用导航更有金币翻倍送。",
                rule2 = "回家路太漫长？快来人民日报客户端看新闻、抢红包！晒全家福更有好礼相送";
            div.className = 'list';
            //距离超过了500公里
            if(rkey.distance){
                if(count == 4 || count == 3){
                    insertList(rule2,"red_bag",true);
                    $('.bottom').css('background-size','cover');
                }
                if(count == 2 && rkey.city){
                    insertList(rule1,"plane",true);
                    insertList(rule2,"red_bag",true);
                } 
                if(count ==2 && !rkey.city){
                    $('.strategy').css('display','block');
                    div.className = "cityIcon"
                    var newimg = document.createElement('img');
                    html.innerHTML = "每年春运，都是一场战斗，提前备战，让你的“迁徙”赢在出发前";
                    img.src = "./img/move.png";
                    newimg.src = "./img/test.jpg";
                    newimg.id = "city";
                    div.appendChild(img);
                    div.appendChild(html);
                    /*$('.strategy').append(div);
                    $('.strategy').append(newimg);*/
                    insertList(rule1,"plane",true);
                    insertList(rule2,"red_bag",true);
                }     
                if(count == 1 && rkey.city){
                    insertList(rule1,"plane",true);
                    insertList(rule2,"red_bag",true);
                }
                if(count ==1 && !rkey.city){
                    $('.strategy').css('display','block');
                    div.className = "cityIcon"
                    var newimg = document.createElement('img');
                    html.innerHTML = "每年春运，都是一场战斗，提前备战，让你的“迁徙”赢在出发前";
                    img.src = "./img/city.png";
                    newimg.src = "./img/test.jpg";
                    newimg.id = "city";
                    div.appendChild(img);
                    div.appendChild(html);
                    /*$('.strategy').append(div);
                    $('.strategy').append(newimg);*/
                    insertList(rule1,"plane",true);
                    insertList(rule2,"red_bag",true);
                }
                if(count == 0){
                    $('.strategy').css('display','block');
                    div.className = "cityIcon"
                    var newimg = document.createElement('img');
                    html.innerHTML = "每年春运，都是一场战斗，提前备战，让你的“迁徙”赢在出发前";
                    img.src = "./img/city.png";
                    newimg.src = "./img/test.jpg";
                    newimg.id = "city";
                    div.appendChild(img);
                    div.appendChild(html);
                    /*$('.strategy').append(div);
                    $('.strategy').append(newimg);*/
                    insertList(rule1,"plane",true);
                    insertList(rule2,"red_bag",true);
                }
            }
            //距离没有超过500公里
            if(!rkey.distance){
                if(count == 4 || count == 3){
                    insertList(rule2,"red_bag",false);
                    $('.bottom').css('background-size','cover');
                }
                if(count == 2 && rkey.city){
                    insertList(rule1,"plane",false);
                    insertList(rule2,"red_bag",false);
                } 
                if(count ==2 && !rkey.city){
                    $('.strategy').css('display','block');
                    div.className = "cityIcon"
                    var newimg = document.createElement('img');
                    html.innerHTML = "每年春运，都是一场战斗，提前备战，让你的“迁徙”赢在出发前";
                    img.src = "./img/city.png";
                    newimg.src = "./img/test.jpg";
                    newimg.id = "city";
                    div.appendChild(img);
                    div.appendChild(html);
                    /*$('.strategy').append(div);
                    $('.strategy').append(newimg);*/
                    insertList(rule2,"hcongest",false);
                }     
                if(count == 1 && rkey.city){
                    insertList(rule1,"plane",false);
                    insertList(rule2,"red_bag",false);
                }
                if(count ==1 && !rkey.city){
                    $('.strategy').css('display','block');
                    div.className = "cityIcon"
                    var newimg = document.createElement('img');
                    html.innerHTML = "每年春运，都是一场战斗，提前备战，让你的“迁徙”赢在出发前";
                    img.src = "./img/city.png";
                    newimg.src = "./img/test.jpg";
                    newimg.id = "city";
                    div.appendChild(img);
                    div.appendChild(html);
                    /*$('.strategy').append(div);
                    $('.strategy').append(newimg);*/
                    insertList(rule1,"plane",false);
                    insertList(rule2,"red_bag",false);
                }
                if(count == 0){
                    $('.strategy').css('display','block');
                    div.className = "cityIcon"
                    var newimg = document.createElement('img');
                    html.innerHTML = "每年春运，都是一场战斗，提前备战，让你的“迁徙”赢在出发前";
                    img.src = "./img/move.png";
                    newimg.src = "./img/test.jpg";
                    newimg.id = "city";
                    div.appendChild(img);
                    div.appendChild(html);
                    /*$('.strategy').append(div);
                    $('.strategy').append(newimg);*/
                    insertList(rule1,"plane",false);
                    insertList(rule2,"red_bag",false);
                }
            }
        }
        //接受策略匹配到的key值填充策略
        function insertList(content,keysrc,bool){
            if (inapp && keysrc === 'plane') {
                return;
            }
            var div = document.createElement('div'),
                img = document.createElement('img'),
                html = document.createElement('div');
            if(keysrc === 'plane'){
                html.className = 'plane';
            }else if(keysrc === 'red_bag'){
                html.className = 'red_bag';
            }
            div.className = 'list';
            html.innerHTML = content+"";
            img.src = "./img/" + keysrc + ".png";
            div.appendChild(img);
            div.appendChild(html);
            if(bool == true){
                $('.distance').before(div);
            }
            else{
                var downList = $('.downList');
                downList.append(div);
            }
        }
        //判断回家距离占大军的比例
        function judgePercent(){
            var dis = data.distance/1000;
            var per;
            if(dis >= 800){
                per = 99;
            }else{
                if(dis >= 500){
                   per = 95; 
                }else{
                    if(dis >= 400){
                        per = 92;
                    }else{
                        if(dis >= 300){
                            per = 88;
                        }else{
                            if(dis >= 200){
                                per = 85;
                            }else{
                                if(dis >= 150){
                                    per = 82;
                                }else{
                                    if(dis >= 100){
                                        per = 78;
                                    }else{
                                        if(dis >= 50){
                                            per = 73;
                                        }else{
                                            per = 60;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return per + "%";
        }
        //返回产生的星星的数量
        function starJudge(){
            if (hour < 2) {
                return 1;
            }
            else if (hour < 4) {
                return 2;
            }
            else if (hour < 8) {
                return 3;
            }
            else if (hour < 12) {
                return 4;
            }
            return 5;
        }
        //计算页面的适配
        function computeSize(){
            var rate = (document.body.clientWidth*100)/320;
            $('html').css('font-size',rate+"px");
        }
        //填充路线详情页的路线
        function fillDetail(){
            var detailPanel = $('.detailPanel');
            var imgsrc;
            var html = "<div class='start'><div class='start_icon'>起</div>从<span class='mypos'>" +data.start_name+ "</span>出发<div class='start_line line'></div></div>";
            data.steps.forEach(function(step){
                imgsrc = actionImg(step.action);
                var dis = step.distance/1000 > 1 ? Math.round(step.distance/100)/10 + "公里" : step.distance+"米";
                html += "<div class='step'>" +
                            "<div class='step_icon'><img src='./img/" + imgsrc + ".png' /></div>" +
                            "<div class='line'></div>" +
                            "<div class='road'>"+ step.road+ "</div>" +
                            "<div class='dis'>"+ dis + "</div>" +
                        "</div>";
            });
            html += "<div class='end'><div class='end_icon'>终</div>到达终点<span class='endpos'>" +data.end_name+ "</span></div>";
            detailPanel.html(html);
            detailPanel.css({
                'top':'-' + detailPanel.height() + 'px',
                'z-index':'-1'
            });
            //根据action动作判断对应的图片src key
            function actionImg(action){
                switch (action){
                    case "1":
                        return "left";
                    case "2":
                        return "right";
                    case "3":
                        return "fleft";
                    case "4":
                        return "fright";
                    case "5":
                        return "bleft";
                    case "6":
                        return "bright";
                    case "7":
                        return "tleft";
                    case "8":
                        return "straight";
                    case "9":
                        return "tleft";
                    case "12":
                        return "incircle";
                    case "13":
                        return "outcircle";
                    default :
                        return "straight";
                }
            }
        }
        //触发点击的事件切换路线详情的显示
        function showLineDetail(){
            var detailPanel = $('.detailPanel');
            detailPanel.off('webkitTransitionEnd',end);
            if(detailPanel.css('visibility') == 'hidden'){
                AmapApp.log.log('click_showLineDetail');
                detailPanel.css({
                    'position':'relative',
                    'visibility':'visible',
                    'top':'0px',
                    'transition':'top 1000ms',
                    'webkitTransition':'top 1000ms'
                });
                $('.angle').attr("src","./img/up.png");
            }
            else{
                detailPanel.on('webkitTransitionEnd',end,false);
                AmapApp.log.log('click_hideLineDetail');
                detailPanel.css({
                    top:'-'+detailPanel.height() + 'px',
                    'transition':'top 100ms',
                    'webkitTransition':'top 100ms'
                });
                $('.angle').attr("src","./img/down.png");
            }

        }
        function end(){
            $('.detailPanel').css({
                'position':'absolute',
                'visibility':'hidden'
            });
        }
        function inShare(){
            AmapApp.napi.share(shareCont,function(res){
                AmapApp.log.log('share_in_' + res.type);
            });
        }
        /*function outShare(){
            var ua = navigator.userAgent.toLowerCase();
            if(ua.match(/MicroMessenger/i)=="micromessenger"){
                AmapApp.bapi.openWeixinPrompt(url.SHARE+"?inapp=1");
                return;
            }
            AmapApp.bapi.openAmapBanner(url.SHARE);
            setTimeout(function() {
                 window.location.href = "http://a.app.qq.com/o/simple.jsp?pkgname=com.autonavi.minimap&g_f=992003";
                },1000);
        }*/
    }
    function getUrl(strKey){
        return isPublicEnv ? publicUrl[strKey] : testUrl[strKey]
    }
    function getRequest(name){
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return (r[2]);
        return null
    }
})(window);