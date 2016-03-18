/**
 * Created by mojueww on 15/12/24.
 */
var cp = require("child_process");
var argv = require('yargs').argv;
var util = require("./util.js");
var shell = require("shelljs");
var fs = require("fs");
var Promise = require("bluebird");
var _ = require("underscore");
var mkdirp = require("mkdirp");
var mdkirpPromise = Promise.promisify(mkdirp);

function getWidgetsJson(jsonPath){
		return new Promise(function(resolve,reject){
			var widgetsJson = {
				"zepto":{
					"folder":"js/lib",
					"url":"git@gitlab.alibaba-inc.com:amap-lab/zepto.git",
				},
				amap_util: {
					folder: 'js/lib',
					url: 'git@gitlab.alibaba-inc.com:amap-lab/util.git'
				},
				amap_bridge: {
					folder: 'js/lib',
					url: 'git@gitlab.alibaba-inc.com:amap-lab/native.git'
				},
				amap_browser: {
					folder: 'js/lib',
					url: 'git@gitlab.alibaba-inc.com:amap-lab/browser.git'
				},
				amap_log: {
					folder: 'js/lib',
					url: 'git@gitlab.alibaba-inc.com:amap-lab/log.git'
				},
				"reset":{
					"folder":"css",
					"url":"git@gitlab.alibaba-inc.com:amap-lab/reset.git"
				}
			}

			if(fs.existsSync(jsonPath)){
				resolve(jsonPath);
			}else{
				fs.writeFile(jsonPath, JSON.stringify(widgetsJson,null,4), function(err) {
					if(err) {
						reject(err);
					} else {
						resolve(jsonPath);
					}
				});
			}
		});
}



module.exports = {
	init:function(){
		var cwd = gde.processCWD;
		var folder = gde.config.install["folder"];
		var jsonPath = cwd + "/widgets.json";

		getWidgetsJson(jsonPath).then(function(jsonpath){
			_.each(folder,function(v,i){
				var path = cwd + "/" + v;
				mkdirp(path)
			})
			return fs.readFileSync(jsonpath);
		}).then(function(buffer){
			var widgets = JSON.parse(buffer.toString());
			//var promiseall =[];
			_.each(widgets,function(v,i){
				var url = v.url;
				var folder = cwd + "/" + v.folder;
				var branch = v.branch;
				var widgetsPath = folder + "/" + i;

				//如果强制更新则删除内容来更新
				if(v.update){
					if(process.platform !== 'dirwin'){
						shell.exec("rm -rf " + widgetsPath.replace("/","\\").replace(/\\/g,"\\\\"));
					}else{
						shell.exec("rm -rf " + widgetsPath);
					}
				}
				if(!fs.existsSync(widgetsPath)){
					//var aa = mdkirpPromise(folder).then(function(){
					//	shell.exec("cd " + folder);
					//	shell.exec("git clone " + url)
					//})
					//promiseall.push(aa);
					var cmd = "";
					if(branch){
						cmd = "git clone -b " + branch + " " + url + " " + widgetsPath;
					}else{
						cmd = "git clone " + url + " " + widgetsPath;
					}
					mkdirp(folder,function(){
						shell.exec(cmd);
						shell.cd(folder);
						shell.exec("rm -rf .git .gitignore *.md");
						shell.cd(widgetsPath);
						shell.exec("rm -rf .git .gitignore demo test");
					});
				}
			})
			//return Promise.all(promiseall);
		}).catch(function(err){
			console.log(err);
		})

	},
	name:"init",
	desc:"init a project",
	usage:"gde init [options]",
	param:[{
		"short":"p",
		"full":"path",
		"describe":"要初始化项目的目录，默认使用当前目录"
	}]
}


