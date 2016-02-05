(function(window){
    $(document).ready(function(){
        var initShow = $('.giftLeft .active').data('type');
        showGift(initShow);
    });
    init();
    function init(){
        addLeftActive();
        fillGift();
    }
    function addLeftActive(){
        var list = $('.giftLeft div');
        list.on('click',function(){
            $(this).addClass('active').siblings().removeClass('active');
            showGift($(this).data('type'));
        });
    }
    function showGift(type){
        var content = $('#'+type);
        content.css('display','inline-block').siblings().css('display','none');
    }
    function fillGift(){
        var data = [
            {
                "id":1,
                "name":"国家奖学金",
                "who":"财务部/教育部",
                "time":"2002起",
                "money":"24.6万",
                "group":"全体本专科学生",
                "level":"一等/二等",
                "much":"6000/4000元/人·年",
                "rate":"13/42",
                "main":"财政部教育部"
            },
            {
                "id":2,
                "name":"国防奖学金",
                "who":"兰州军区",
                "time":"1999起",
                "money":"50万",
                "group":"全体学生",
                "level":"",
                "much":"5000元/人·年",
                "rate":"100",
                "main":"西北大学后备军官办"
            },
            {
                "id":3,
                "name":"德才奖学金",
                "who":"舒德干教授",
                "time":"2001-2006",
                "money":"15万",
                "group":"研究生，本科生",
                "level":"一等/二等",
                "much":"2000/1000.元/人·年",
                "rate":"5/15",
                "main":"德才奖学金评审委员会"
            },
            {
                "id":4,
                "name":"中国石油奖学金",
                "who":"中国石油天然气公司",
                "time":"2004-2005",
                "money":"15万",
                "group":"研究生，本科生",
                "level":"一等/二等",
                "much":"3000/2000元/人·年",
                "rate":"10/15",
                "main":"中国石油奖学金领导小组"
            },
            {
                "id":5,
                "name":"中国石油塔里木油田奖学金",
                "who":"中国石油塔里木油田分公司",
                "time":"2005-2008",
                "money":"20万",
                "group":"研究生，本科生",
                "level":"一等/二等",
                "much":"1200/1000元/人·年",
                "rate":"8/10",
                "main":"塔里木油田奖学金领导小组"
            },
            {
                "id":6,
                "name":"王耀东体育奖学金",
                "who":"王耀东教授",
                "time":"2004-2011",
                "money":"8万",
                "group":"全体学生",
                "level":"一等",
                "much":"500元/人·年",
                "rate":"10",
                "main":"王耀东体育奖学金评审委员会"
            },
            {
                "id":7,
                "name":"杨虎城奖学金",
                "who":"杨延武女士",
                "time":"1996-",
                "money":"20万元利息支付",
                "group":"本科生",
                "level":"",
                "much":"500元/人·年",
                "rate":"10",
                "main":"西北大学"
            },
            {
                "id":8,
                "name":"金太阳奖学金",
                "who":"旅法华侨郑定贵先生及其夫人",
                "time":"1997-",
                "money":"8万人民币利息支付",
                "group":"计算机系",
                "level":"",
                "much":"500元/人·年",
                "rate":"12",
                "main":"计算机系"
            },
            {
                "id":9,
                "name":"笹川日中友好奖学金",
                "who":"中日友好联络会笹川日中友好基金会",
                "time":"1997-",
                "money":"1万",
                "group":"日语系",
                "level":"",
                "much":"2000元/人·年",
                "rate":"5",
                "main":"外语系"
            },
            {
                "id":10,
                "name":"IET奖学金",
                "who":"国际工程技术公司（IET公司）",
                "time":"1999-2001",
                "money":"每年2000美元",
                "group":"研究生，本科生",
                "level":"一等/二等",
                "much":"800元/人·年",
                "rate":"5",
                "main":"西北大学"
            }
        ];
        var container = $('#use table');
        var html;
        for(var i in data){
            html += "<tr>";
            html += "<td>"+data[i].id+"</td>";
            html += "<td>"+data[i].name+"</td>";
            html += "<td>"+data[i].who+"</td>";
            html += "<td>"+data[i].time+"</td>";
            html += "<td>"+data[i].money+"</td>";
            html += "<td>"+data[i].group+"</td>";
            html += "<td>"+data[i].level+"</td>";
            html += "<td>"+data[i].much+"</td>";
            html += "<td>"+data[i].rate+"</td>";
            html += "<td>"+data[i].main+"</td>";
            html += "</tr>";
        };
       /* "id":1,
                "name":"国家奖学金",
                "who":"财务部/教育部",
                "time":"2002起",
                "money":"24.6万",
                "group":"全体本专科学生",
                "level":"一等/二等",
                "much":"6000/4000元/人·年",
                "rate":"13/42",
                "main":"财政部教育部"*/
        container.append(html);
    }
})(window);