/**
 * Created by mojueww on 16/1/24.
 */


var path = require("path");
var config = {
	install:{
		"folder":{
			"js":"js",
			"img":"img",
			"css":"css",
			"sound":"sound",
			"font":"font",
			"video":"video"
		}
	},
	linshi:"linshi",
	output:"output",
	buildFolder:"build",
	htmlFolder:"htmlFolder",
	platform:process.platform,
	sep:process.platform === "darwin"?path.sep:path.win32.sep
}
module.exports = config;
