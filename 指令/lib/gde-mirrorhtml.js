/**
 * Created by mojueww on 16/1/6.
 * TODO replace方案需要重写 目前比较简单
 */
var shell = require('shelljs');
var argv = require('yargs').argv;
var fs = require("fs");
var _ = require("underscore");
var util = require("../lib/util");
module.exports = {
	mirrorhtml:function(){
		var htmlList = argv.l || argv.list;
		var all = argv.a || argv.all;

		if(htmlList){
			if(htmlList.indexOf(",") === -1){
				htmlList = [htmlList];
			}else{
				htmlList = htmlList.split(",");
			}
		}


		//是否根据wx生成
		var wxto = argv.wx || argv.wxto;
		if(all) {
			var files = fs.readdirSync(gde.processCWD);
			htmlList = files.filter(function (v, i) {
				//微信生成普通页面
				if (wxto) {
					if (v.indexOf("_wx.html") > 0 || v.indexOf("_wx.htm") > 0) {
						return v;
					}
				} else {
					if ((v.indexOf(".html") > 0 || v.indexOf(".htm") > 0 ) &&
						v.indexOf("_wx.html") < 0 && v.indexOf("_wx.htm") < 0) {
						return v;
					}
				}
			})
		}

			_.each(htmlList,function(v,i){
				var name = v;
				var content = fs.readFileSync(gde.processCWD + "/" + name).toString();
				var filename = "";
				if(!wxto){
					//将非_wx生成wx页面
					content = content.replace(/amap_bridge/g,"amap_browser");
					content = content.replace("common.min.js","common_wx.min.js");
					filename = v.split(".")[0] + "_wx.html";
				}else{
					content = content.replace(/amap_browser/g,"amap_bridge");
					content = content.replace("common_wx.min.js","common.min.js");
					filename = v.split(".")[0].replace("_wx","") + ".html";
				}


				fs.writeFile(filename, content, function(err) {
					if(err) {
						gde.error(err);
					}
				});
			})

		if(!htmlList){
			var tips = wxto?"目录下没有任何的_wx.html文件":"目录下没有任何的html文件"
			gde.tips(tips);
		}

	},
	name:"mirrorhtml",
	desc:"根据xx.html生成xx_wx.html, 或者根据xx_wx.html生成xx.html 默认是xx.html生成xx_wx.html",
	usage:"gde mirrorhtml -l [文件列表] -wx [生成方式]",
	param:[{
		"short":"wx",
		"full":"wxto",
		"describe":"根据wx生成没有wx的html"
	},{
		"short":"l",
		"full":"list",
		"describe":"需要映射的html文件名，逗号分割"
	},{
		"short":"a",
		"full":"all",
		"describe":"设置则映射目录下的全部html文件"
	}]
}
