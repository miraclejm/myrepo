/**
 * Created by mojueww on 16/1/5.
 * TODO 自动处理目录
 */
var shell = require('shelljs');
var argv = require('yargs').argv;
var fs = require("fs");
var _ = require("underscore")
module.exports = {
	createhtml:function(){
		var htmlList = argv.l || argv.list;

		if(htmlList.indexOf(",") === -1){
			htmlList = [htmlList];
		}else{
			htmlList = htmlList.split(",");
		}

		var html = '';
		html += '<!DOCTYPE html>\r\n';
		html += '<html>\r\n';
		html += '<head>\r\n';
		html += '<meta charset="utf-8"/>\r\n';
		html += '<title>Title</title>\r\n';
		html += '<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0, minimum-scale=1.0, maximum-scale=1.0" />\r\n';
		html += '<meta name="format-detection" content="telephone=no"/>\r\n';
		html += '<!-- build:css css/common.min.css -->\r\n';
		html += '<link rel="stylesheet" href="css/reset/reset.css"/>\r\n';
		html += '<!-- endbuild -->\r\n';
		html += '</head>\r\n';
		html += '<body>\r\n';
		html += '<!-- build:js js/common.min.js -->\r\n';
		html += '<script src="js/lib/zepto/src/zepto.js"></script>\r\n';
		html += '<script src="js/lib/amap_util/src/amap_util.js"></script>\r\n';
		html += '<script src="js/lib/amap_bridge/src/amap_bridge.js"></script>\r\n';
		html += '<script src="js/lib/amap_log/src/amap_log.js"></script>\r\n';
		html += '<!-- endbuild -->\r\n';
		html += '</body>\r\n';
		html += '</html>\r\n';

		_.each(htmlList,function(v,i){
			fs.writeFile(v + ".html", html, function(err) {
				if(err) {
					gde.error(err);
				}
			});

		})


	},
	name:"createhtml",
	desc:"生成html文件",
	usage:"gde createhtml -l [文件列表] -p [要执行的目录]",
	param:[{
		"short":"p",
		"full":"path",
		"describe":"要启动的网站目录 默认当前目录"
	},{
		"short":"l",
		"full":"list",
		"demand":true,
		"describe":"要生成的html文件名字列表"
	}]
}