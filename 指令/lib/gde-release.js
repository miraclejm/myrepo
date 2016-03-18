/**
 * Created by mojueww on 15/12/24.
 */
var shell = require("shelljs");
var fs = require("fs");
var argv = require('yargs')

module.exports = {
	release:function(){
		var args = process.argv;
			var argsString = args.slice(3).join(" ");
			var cwd = gde.processCWD;
			if (argsString.indexOf("--path") === -1) {
				argsString = argsString + " --path=" + cwd;
			}
			var cmd = __dirname;
			shell.cd(cmd + "/../");
			shell.exec("gulp release " + argsString);
	},
	name:"release",
	desc:"release a project",
	usage:"gde release -m [是否适用md5] -d [是否压缩js css html] -jc [是否进行语法检查] -p [要执行的目录]",
	param:[{
		"short":"m",
		"full":"md5",
		"describe":"适用带md5的静态文件"
	},{
		"short":"d",
		"full":"deploy",
		"describe":"压缩js，css和html"
	},{
		"short":"jc",
		"full":"jshint",
		"describe":"是否进行语法检查"
	},{
		"short":"p",
		"full":"path",
		"describe":"要打包项目的目录，默认使用当前目录"
	}]
}
