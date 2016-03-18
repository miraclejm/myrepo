(function(){
    var isPublicEnv = /amap\.com/i.test(location.host) && !/testing/i.test(location.host);
    var m5 = isPublicEnv ? 'http://m5.amap.com/' : 'http://maps.testing.amap.com/';
    var aosRoute = m5 + 'ws/valueadded/weather/mojiweather';
    var testUrl = {
        log: 'http://oss.testing.amap.com/ws/h5_log',
        SHARE: 'http://group.testing.amap.com/fengjie.ji/morningBroadcast/index.html?isInAmap=0',
    };
    var publicUrl = {
        log: 'http://oss.amap.com/ws/h5_log',
        SHARE: 'http://wap.amap.com/activity/morningBroadcast/index.html?isInAmap=0'
    };
    var url = {
        log: getUrl('log'),
        SHARE: getUrl('SHARE'),
        SHARE_IMG: 'http://cache.amap.com/h5/activity/morningBroadcast/shareSmall.jpg',//分享小图
        SHARE_BIGIMG: 'http://cache.amap.com/h5/activity/morningBroadcast/shareBig.jpg',//分享大图
    };
    var startOrigin;
    var destination;
    var marginSkip = 0;
    var currentState;
    var verison;
    var os = AmapApp.util.os.ios;
    var search = {
        and:"androidamap://openFeature?featureName=PathSearch&sourceApplication=softname",
        ios:"iosamap://openFeature?featureName=PathSearch&sourceApplication=flash&showType=0"
    }
    init();
    function init(){
        AmapApp.log.initLog("morningBroadcast");
        AmapApp.log.log("pv");
        computeSize();
        drawStatus();
        $('#ss').before("<div class='btn'></div>");
        $('#ss').before("<div class='logo'></div>");
        var isInAmap = AmapApp.util.isInAmap();
        var shareMsg = '高峰拥堵早知晓，上班不迟到~';
        var shareTitle = '【高德地图】早高峰播报';
        var shareCont = [
            {
                type: 'weibo',
                message:shareMsg,
                url: url.SHARE,
                imgUrl: url.SHARE_BIGIMG
            },
            {
                type: 'weixin',
                message: shareMsg,
                title: shareTitle,
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
        if(!isInAmap){
            // 端外
            AmapApp.bapi.weixinShare(shareCont,function(){
                AmapApp.log.log('share_out_' + res.type);
            });
            var iosurl = "iosamap://openFeature?featureName=PathSearch&sourceApplication=flash&showType=0";
            var andurl = "androidamap://openFeature?featureName=PathSearch&sourceApplication=softname";
            var skipurl;
            if(os){
                skipurl = 'http://wap.amap.com/callnative/?schema=' + encodeURIComponent( iosurl );
            }
            else{
                skipurl = 'http://wap.amap.com/callnative/?schema=' + encodeURIComponent( andurl );
            }
            AmapApp.log.log("outApp");
            $('.btn').html("<div class='btn-msg'>查看上班耗时</div>");
            //端外直接设置按钮点击跳客户端呼起页
            $('.btn').on('click',function(){
                AmapApp.log.log("btn_outApp_click");
                location.href = skipurl;
            });
        }
        else{
            //端内
            AmapApp.napi.getExtraUrl(function(amap){
                verison = amap.div;
            });
            var origin;
            AmapApp.napi.getMapLocation(function(loc){
                origin = {
                    "name" : loc.cityName,
                    "lat" : loc.lat,
                    "lon" : loc.lon
                };
            });
            userHomeAndCompany(function(res){
                var vArr = verison.replace(/[^0-9]+/g, '').split("");
                var verisonNum = vArr[1]+vArr[3]+vArr[5];
                if(verisonNum < 710){
                   // 版本低于710直接设置按钮为
                   AmapApp.log.log("inApp_low");
                    $('.btn').html("<div class='btn-msg'>查看上班耗时</div>");
                    $('.btn').on('click',function(){
                        AmapApp.log.log("btn_inApp_click");
                        // AmapApp.napi.searchRoute();
                        if(os){
                            AmapApp.napi.loadSchema(search.ios);
                        }else{
                            AmapApp.napi.loadSchema(search.and);
                        }
                    });
                }else{
                    //版本高于710
                    if(res.companyPoi){
                        AmapApp.log.log("inApp_high_filled");
                        destination = {
                            "name": res.companyPoi.name,
                            "lat": res.companyPoi.lat,
                            "lon": res.companyPoi.lon
                        }; 
                        destinationName = destination.name;
                        $('.btn-tips').css('display','none');
                        setLineAndBtn(origin,destination,destinationName);
                        return;
                    }
                    AmapApp.log.log("inApp_high_empty");
                    setLineAndBtn();
                }
            });
            registRightButton(function(){
                AmapApp.napi.share(shareCont,function(res){
                    AmapApp.log.log('share_in_' + res.type);
                });
            });
        }
        // bindEvent();
    }
    //获取是否填写了起终点信息  页面加载的时候就要去调这个接口
    function userHomeAndCompany(handler){
        AmapApp.napi.send({action: 'userHomeAndCompany'},handler);
        // handler();
    }
    //添加title bar右侧按钮
    function registRightButton(fn){
        var shareUrl = '';
        var shareContent;
        AmapApp.napi.send({
            action: 'registRightButton',
            type: 'share',
            buttonText : '分享',
            "function" : {
                "action" : "jsCallBack"
            }
        },fn);
    }
    //页面加载时获得路线状况，并绘制路线图,并且填充路线数据
    function setLineAndBtn(o,d,name){
        var btn = $('.btn');
        var text;
        $('#ss').before("<div class='lineCon'><div class='btn-tips'>设置完成后 点这里刷新路况</div></div>");
        var lineCon = $('.lineCon');
        if(setLineAndBtn.arguments.length > 0){
            text = '<div class="btn-msg">规划最佳上班路线</div>';
            or = o;
            destination = d;
            var start = or.lon + "," + or.lat;
            var end = destination.lon + "," + destination.lat;
            var dName = name;
            var key = "8d376b99185662728e7b646e896ab4fc";
            var lineUrl = "http://restapi.amap.com/v3/direction/driving?";
            var sUrl = lineUrl+"key="+key+"&origin="+start+"&destination="+end;
            $.get(sUrl,function(data){
                var timeStr;
                var distance = data.route.paths[0].distance/1000;
                var time = data.route.paths[0].duration/60;
                var hour = time >= 60 ? parseInt(time/60) : 0;
                var minute = time >= 60 ? (time-hour*60) : time;
                if(hour > 0){
                    timeStr = hour + "小时" + minute + "分钟";
                }
                else{
                    timeStr = minute + "分钟";
                }
                var showName = "<div class='showCon'><span class='show-icon'></span><span class='show-msg'>" + dName + "</span></div>";
                var bar = "<div class='bar' id='bar'></div>"
                var timeMsg = "<div class='timeMsg'>现在去公司" + distance + ""+
                                "公里&nbsp;预计耗时" + timeStr + "</div>";
                var size = parseInt(document.querySelector('html').style.fontSize);
                var rate = size*5/(distance*1000);//  px/米
                var routeData = data.route.paths[0].steps;
                lineCon.append(showName);
                lineCon.append(bar);
                lineCon.append(timeMsg);
                //div的宽度设置为 data.route.paths[0].steps[0].tmcs[0].status * rate
                for(var i = 0;i < routeData.length;i++){
                    for(var j = 0;j < routeData[i].tmcs.length;j++){
                        var dis = routeData[i].tmcs[j].distance;
                        var sta = routeData[i].tmcs[j].status;
                        judgeColor(sta,dis,rate);

                    }
                }
            });
            var dlat = destination.lat;
            var dlon = destination.lon;
            var aurl,osurl;
            btn.on('click',function(){
                AmapApp.log.log("btn_inApp_show");
                if(os){
                    osurl = "iosamap://path?sourceApplication=applicationName&backScheme=applicationScheme&sid=&slat=&slon=&sname=&did=&dlat=" + dlat + "&dlon=" + dlon + "&dname=" + dName + "&dev=0&m=0&t=0";
                    AmapApp.napi.loadSchema(osurl);
                }else{
                    aurl = "androidamap://route?sourceApplication=softname&slat=&slon=&sname=&dlat="+dlat+"&dlon=" + dlon + "&dname=" + dName + "&dev=0&m=0&t=2&showResult=1";
                    AmapApp.napi.loadSchema(aurl);
                    // AmapApp.napi.searchRoute(null,null,'bus');
                    // searchRoute('',destination);
                    // location.href = "http://tpl.testing.amap.com/api/searchRoute.html?spm=0.0.0.0.ONcKoo";
                }
            });
        }else{
            text = '<div class="btn-con"><span class="btn-icon"></span><span class="btn-msg">设置公司地址 订阅上班路况</span></div>';
            $('.btn-tips').css('display','block');
            $('.btn-tips').on('click',function(){
                location.reload();
            });
            btn.on('click',function(){
                AmapApp.log.log("btn_inApp_empty");
                if(os){
                    AmapApp.napi.loadSchema(search.ios);
                }else{
                    AmapApp.napi.loadSchema(search.and);
                }
            });
        }
        btn.html(text);
    }
    //绘制路线状况
    function drawStatus(){
        var map = new AMap.Map('lineStatus', {
                resizeEnable : true,
                layers:[new AMap.TileLayer({textIndex:9999})],
                zoom:11,
                forceVector:true
        });
        var trafficLayer = new AMap.TileLayer.Traffic({zIndex:0});
        trafficLayer.setMap(map);
        var lng = map.getCenter().lng;
        var lat = map.getCenter().lat;
        getWeatherInfo(lng,lat);
    }
    //获得天气相关信息
    function getWeatherInfo(x,y){
        AmapApp.bapi.aosJsonp(aosRoute,[
                {lon : x, sign: 1},
                {lat : y, sign: 1},
                {image_standard : 1, sign: 1},
                {traffic_restrict : 1},
                {aqi : 1},
                {forecast : 1}
            ],function(res){
                var nav = $('#nav-show');
                var date  = res.update_time.split(" ")[0];
                var year = date.split('-')[0];
                var month = parseInt(date.split('-')[1]);
                var day = parseInt(date.split('-')[2]);
                var dateInfo = year + '.' + month + '.' + day;
                var weather = res.weather_condition;
                var temp_high = res.forecast[0].temp_high;
                var temp_low = res.forecast[0].temp_low;
                var weatherInfo = weather + temp_high + '~' + temp_low;
                var airLevel = res.aqi_quality_level;
                var pm = res.aqi.pm25 || "";
                var airInfo = airLevel + pm;
                var limit = res.traffic_restrict.plate_no;
                var limitInfo;
                if(limit == ""){
                    limitInfo = "";
                }
                else{
                    limitInfo = "限行" + limit;
                }
                var info = [
                    {
                        flag : "date",
                        info : dateInfo
                    },
                    {
                        flag : "weather",
                        info : weatherInfo
                    },
                    {
                        flag : "air",
                        info : airInfo
                    },
                    {
                        flag : "limit",
                        info : limitInfo
                    }
                ];
                for(var i in info){
                    if(!info[i].info == " "){
                        console.log(info[i].flag);
                        console.log(info[i].info);
                        var html = "<div class='nav-cell'>" +
                                        "<div class='nav-icon' id='" + info[i].flag + "'></div>";
                                    if(info[i].flag == "weather"){
                                        html += "<div class='nav-msg'>" + info[i].info + " ℃</div>";
                                    }else{
                                        html += "<div class='nav-msg'>" + info[i].info + "</div>";
                                    }
                                    html += "</div>";
                        nav.append(html);
                    }
                }
            });
    }
    function judgeColor(s,d,rate){
        var status = s;
        var distance = d;
        var classname = 'green';
        var bar = $('#bar');
        if(s === "畅通"){
            currentState = status;
            marginSkip += parseInt(d);
            return;
        }
        switch(status){
            case "未知":
                classname = 'blue'
                break;
            case "拥堵":
                classname = 'red'
                break;
            case "缓行":
                classname = 'yellow'
                break;
            default: return;
        }
        if(currentState != status && currentState){
            currentState = status;
        }
        else if(!currentState){
                currentState = s;
        }
        bar.append("<div class='" + classname + "' style='width:" + distance*rate + "px;left:" + marginSkip*rate + "px'></div>");
        marginSkip += parseInt(d);
    }
    function computeSize(){
        var rate = (document.documentElement.clientWidth*100)/640;
        document.querySelector('html').style.fontSize = rate + 'px';
    }
   
    function getUrl(strKey){
        return isPublicEnv ? publicUrl[strKey] : testUrl[strKey]
    }
})();