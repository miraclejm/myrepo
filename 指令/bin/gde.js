#!/usr/bin/env node
var gde = require("../index.js");
var _ = require("underscore");
var argv = require('yargs');
var shell = require("shelljs");

var commond = process.argv[2];
var commondList = {
	"init":"init",
	"release":"release",
	"start":"start",
	"deploy":"deploy",
	"createhtml":"createhtml",
	"mirrorhtml":"mirrorhtml",
	"daily":"daily"
}

if(commondList[commond]){
	var commondHelp = require("../lib/gde-" + commond);
	if(commondHelp && commondHelp.name && commondHelp.desc){
		argv.command(commondHelp.name, commondHelp.desc, function (yargs, argv) {
			commondHelp.usage && yargs.usage(commondHelp.usage);

			commondHelp.param && _.each(commondHelp.param,function(v,i){
				yargs.option(v.full, {
					alias: v.short,
					describe: v.describe,
					demand: v.demand
				})
			})
			yargs.help("h").alias("h","help")
		}).argv;
	}
	gde.run();
}else{
	if(argv.argv.h || argv.argv.help){
		argv.usage('Usage: gde [options]')
			.example('gde init', '初始化目录结构')
			.example('gde start', '启动一个站点')
			.example('gde deploy','发布站点\r\n')

			.example('gde release', '打包目录')
			.example("gde createhtml","生成含有基本结构的html文件")
			.example("gde mirrorhtml","生成html文件的镜像文件")
			.help('h')
			.alias('h', 'help').argv;
	}else{
		shell.exec("gde -h");
	}
}
