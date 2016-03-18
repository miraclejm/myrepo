/**
 * Created by mojueww on 15/12/24.
 */
var argv = require('yargs').argv;
var colors = require("colors");
var path = require("path");
var config = require("./lib/gde-config");

colors.setTheme({
	warn: 'yellow',
	debug: 'blue',
	error: 'red',
	log:"white",
	tips:"bgGreen"
});

var gde = {
	log:function(str){
		console.log(colors.log(str));
	},
	debug:function(str){
		console.log(colors.debug(str));
	},
	error:function(str){
		console.log(colors.error(str));
	},
	warn:function(str){
		console.log(colors.warn(str));
	},
	tips:function(str){
		console.log(colors.tips(str));
	}
};


Object.defineProperty(global, 'gde', {
	enumerable : true,
	writable : false,
	Configurable:false,
	value:gde
})

gde.config = config;

gde.run = function(){
	//当前命令
	var command = process.argv[2];
	//执行路径
	var cwd = argv.path || argv.p || process.cwd();
	gde.command = command;
	gde.processCWD = cwd;
	var commondFile = require("./lib/gde-" + command);
	commondFile[command]();
}

module.exports = gde;