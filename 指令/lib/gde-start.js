/**
 * Created by mojueww on 15/12/29.
 */
var shell = require("shelljs");
var argv = require('yargs').argv;

module.exports = {
	start:function(){
		var cwd = gde.processCWD;
		var port = argv.port || argv.po || "8010";
		var path = cwd;
		if(path){
			shell.exec("node " + __dirname + "/../node_modules/http-server/bin/http-server "+ path +" -p " + port);
		}else{
			shell.exec("node " + __dirname + "/../node_modules/http-server/bin/http-server -p " + port);
		}
	},
	name:"start",
	desc:"启动一个服务器",
	usage:"gde start -p [网站目录] -po [要启动的端口号]",
	param:[{
		"short":"p",
		"full":"path",
		"describe":"要启动的网站目录 默认当前目录"
	},{
		"short":"po",
		"full":"port",
		"describe":"要启动的端口号 默认是8010"
	}]
}