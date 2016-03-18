var Promise = require("bluebird");
var fs = require("fs");
var path = require("path");

module.exports = {

	trim: function(x, char) {
		if (!x) {
			return '';
		}
		return x.replace(new RegExp('^' + char + '+|' + char + '+$', 'gm'),'');
	},

	trimLeft: function(x, char) {
		if (!x) {
			return '';
		}
		return x.replace(new RegExp('^' + char + '+', 'gm'),'');
	},

	trimRight: function(x, char) {
		if (!x) {
			return '';
		}
		return x.replace(new RegExp(char + '+$', 'gm'),'');
	},
	readCmdSync:function(prompt){
		return new Promise(function(resolve,reject){
			process.stdout.write(prompt + ':');
			process.stdin.resume();
			process.stdin.setEncoding('utf-8');
			process.stdin.on('data', function(chunk) {
				process.stdin.pause();
				resolve(chunk.replace("\n",""));
			});
		})

	},
	writeFile: function(filePath,json){
		return new Promise(function(resolve,reject){
			fs.writeFile(filePath, JSON.stringify(json,null,4), function(err) {
				if(err) {
					reject(err);
				} else {
					resolve(json);
				}
			});

		})
	},
	getDeployName:function(filePath){
		var patharr = path.basename(filePath);
		return patharr
	}
}
