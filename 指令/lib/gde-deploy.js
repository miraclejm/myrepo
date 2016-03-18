/**
 * Created by jinlong.liu on 15/12/25
 * Deploy the files to server
 * Edit by mojueww on 15/12/30
 *
 * 将html文件发布到wap下
 * 将静态文件打包未build发布到amap-fe下。
 *
 *
 * TODO
 * 目录处理
 * publish 前必须push到dialy
 * 只有master分支才能执行 daily publish 判断下
 * 优化代码
 * .gdeconfig 存储版本号 如：1.0.0 1.0.1
 * http://g.alicdn.com/amap-fe/??nnday/1.0.0/css/common-b1679252e6.css,nnday/1.0.0/css/sx-f9a74efa19.css 支持。
 */
var shelljs = require('shelljs');
var exec = require('child-process-promise').exec;
var ftpClient = require('ftp-client');
var util = require('./util');
var argv = require('yargs').argv;
var fs = require("fs");
var Promise = require("bluebird");
var mkdirp = require("mkdirp");
var _ = require("underscore");
var fsPromise = Promise.promisifyAll(fs);
// get params
var deployProject = argv.d ? argv.d : argv.deploy;
var deployMessage = argv.mes ? argv.mes : argv.message;
var assigneeId = argv.ai ? argv.ai : argv.assignee;
var model = argv.m || argv.model || "test";

var filesFolder = 'build';
var platform = "win32";
var configFolder = "~/";
var configName = ".gde";
//个人配置
var configPath = "";

var projectJsonPath = "projectinfo.json";

var isNewVersion;
var version = "";
var gitlabBranch = '';
var publishTag = "";
/*
*
* git tag publish/1.0.0
 git push origin publish/1.0.0:publish/1.0.0
* */
var gitlabBranchWap = "auto-deploy";
var namespace = "amap-fe";
//namespace http://gitlab.alibaba-inc.com/amap-fe
var namespace_id = "39479";

//执行路径
var cwd = "";
//output目录
var output = "";
var config = {};
var deployFolder =  deployProject + gde.config.sep + 'activity';
var deployName = "";

var execCommond = function(str,isShowCommnd,isShowReturn){
    isShowCommnd = isShowCommnd === undefined?true:isShowCommnd;
    isShowReturn = true;
    if(isShowCommnd){
        gde.debug(str);
    }
    return exec(str).then(function(result){
        var stdout = result.stdout;
        var stderr = result.stderr;
        if(isShowReturn){
            gde.log(stdout);
        }
        if(stderr){
            throw new Error(stderr);
        }
        return stdout;
    });
}

var shell = {
    exec:function(str){
        gde.debug("exec:" + str);
        return shelljs.exec(str);

    },
    cd:function(str){
        gde.debug("cd " + str);
        return shelljs.cd(str);
    }
}


function readjson() {
  return new Promise(function(resolve,reject){
    if(fs.existsSync(configPath)){
      resolve(configPath);
    }else{
      resolve(false);
    }
  })
}


var deploy = function(){
    cwd = gde.processCWD;
    //output 目录
    output = gde.processCWD + gde.config.sep + gde.config.output;

    if(model === "publish" && !fs.existsSync(deployFolder)){
        gde.error("请输入正确的deploy参数,deploy参数必须是绝对路径");
        return;
    }
    //项目目录名称
    deployName = util.getDeployName(gde.processCWD);
    //部署目录
    deployFolder = deployFolder + "/" + deployName;

    if(process.platform == 'darwin'){
        configPath = process.env.HOME + gde.config.sep + configName;
    }else{
        configPath = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + gde.config.sep + configName;
    }

    //首先删除掉output目录
    execCommond("rm -rf output").then(function(studout){
        if(model === "test"){
            return execCommond("gde release --md5").then(function(){
                test();
            })
        }else if(model === "daily"){
            privateMethod.setProjectAttr();
            return execCommond("gde release --cdn --md5 --deploy --model=daily --version=" + deployName + "/" + version + "/").then(function(){
                daily();
            });;
        }else{
            privateMethod.setProjectAttr();
            return execCommond("gde release --cdn --md5 --deploy --model=publish --version=" + deployName + "/" + version + "/").then(function(){
                publish();
            });;
        }
    }).catch(function(err){
        gde.error("发生错误:\r\n" + err);

    })
}



/**
 * deploy files to daily server
 **/
var test = function() {
    privateMethod.getGdeJson().then(function(config) {
        gde.tips("git配置:");
        console.log(config);
        gde.tips("如果要修改配置请进入" + configPath + " 目录自行修改");

        var configPrivate = {
            "host": "10.125.1.214",
            "port": "21",
            "user": config.ftpUsername,
            "password": config.ftpPassword
        }
        privateMethod.uploadFTP(configPrivate)
    }).catch(function(err){
        gde.error(err);
    })
}



var daily = function(){
    privateMethod.getGdeJson().then(function(config){
        gde.tips("git配置:");
        console.log(config);
        gde.tips("如果要修改配置请进入" + configPath + " 目录自行修改");

        var gitlabToken = config.gitlab.token;
        var userName = config.username;
        var gitlabUrl = config.gitlab.url;


        assigneeId = assigneeId ? assigneeId : 31601;
        var gitlab = require('gitlab')({
            url: gitlabUrl,
            token: gitlabToken
        });

        deployMessage = deployMessage ? deployMessage : 'Add project ' + deployName + ' by ' + userName;

        var buildFolder = gde.processCWD + gde.config.sep + gde.config.buildFolder;
        var htmlFolder = gde.processCWD + gde.config.sep + gde.config.htmlFolder;

        return privateMethod.hasExitProject(cwd + gde.config.sep + ".git")
            .then(function(isExit){
                //如果目录下存在.git文件 证明已经创建过项目了
                if(isExit){
                    return isExit;
                }else{
                    gde.tips("http://gitlab.alibaba-inc.com/"+ namespace +" 下创建仓库" + deployName);
                    return privateMethod.createProject(gitlab);
                }
            }).then(function(isExit){
                //创建ignore文件
                gde.tips("创建.gitignore文件");
                return privateMethod.writeGitignore(isExit);
            }).then(function(isExit){
                //如果不存在git 则认为是新项目
                shell.cd(cwd);
                if(!isExit) {
                    //初始化项目 提交代码 并且push到master分支 本地新建分支.
                    shell.exec('git init');
                    shell.exec('git remote add origin git@gitlab.alibaba-inc.com:' + namespace + '/' + deployName + '.git');
                    shell.exec('git add .');
                    shell.exec('git commit -m "' + deployMessage + '"');
                    shell.exec('git push origin master');
                }else{
                    shell.exec('git checkout master');
                    shell.exec("git status");
                    shell.exec('git add .');
                    shell.exec('git commit -m "' + deployMessage + '"');
                    shell.exec('git push origin master');
                }
                return privateMethod.getProjectInfo();
            }).then(function(projectObj){
                if(projectObj.isNewVerson){
                    shell.exec('git checkout -b' + gitlabBranch);
                }else{
                    shell.exec('git checkout ' + gitlabBranch);
                }
                //merge
                shell.exec('git merge master');
                shell.exec("git status");
                shell.exec('git add .');
                shell.exec('git commit -m "' + deployMessage + '"');
                shell.exec('git push origin ' + gitlabBranch);
                //最后切回master分支开发
                shell.exec('git checkout master');

                if(projectObj.isNewVerson){
                    privateMethod.setProjectNoNewVersion();
                }

                shell.exec('rm -rf ' + buildFolder);
                shell.exec('rm -rf ' + htmlFolder);
                return "";
            }).then(function(result){
                ////提交output 到测试环境
                privateMethod.uploadFTP();
            })
    }).catch(function(err){
        gde.error(err);
    })

}


var publish = function() {
    var buildFolder = gde.processCWD + gde.config.sep + gde.config.buildFolder;
    var htmlFolder = gde.processCWD + gde.config.sep + gde.config.htmlFolder;
    util.readCmdSync("确认要发布吗？执行该操作将更新资源到线上cdn?请输入yes or no").then(function(result){
        if(result === "yes"){
            return privateMethod.getGdeJson()
        }else{
            throw new Error("取消发布");
        }
    }).then(function(config){
        gde.tips("git配置:");
        console.log(config);
        gde.tips("如果要修改配置请进入" + configPath + " 目录自行修改");

        var gitlabToken = config.gitlab.token;
        var userName = config.username;
        var gitlabUrl = config.gitlab.url;

        var gitlabProjectId = 88004;
        assigneeId = assigneeId ? assigneeId : 31601;
        var gitlab = require('gitlab')({
            url: gitlabUrl,
            token: gitlabToken
        });


        deployMessage = deployMessage ? deployMessage : 'Add project ' + deployName + ' by ' + userName;
        return privateMethod.hasExitProject(cwd + gde.config.sep + ".git")
            .then(function(isExit){
                if(!isExit){
                    throw new Error("must deploy daily");
                }
                //TODO 这样做不好 如果后续出现问题了 本地的json已经更新了.
                privateMethod.updateProjectVersion();
                var shellCMD = "";
                shell.cd(cwd);
                shell.exec('git checkout master');
                shell.exec("git status");
                shell.exec('git add .');
                shell.exec('git commit -m "' + deployMessage + '"');
                shell.exec('git push origin master');

                shell.exec("git checkout " + gitlabBranch);
                shell.exec('git merge master');
                shell.exec('git add .');
                shell.exec('git commit -m "' + deployMessage + '"');
                shell.exec('git push origin ' + gitlabBranch);
                //打tag
                shell.exec("git tag " + publishTag);
                shell.exec('git push origin ' + publishTag + ":" + publishTag);
                return isExit;
            }).then(function(){
                deployMessage = deployMessage ? deployMessage : 'Add project ' + deployName + ' by ' + userName;
                shell.cd(deployProject);
                shell.exec('git stash');
                shell.exec('git checkout master');
                shell.exec('git pull');
                shell.exec('git branch -D ' + gitlabBranchWap);
                shell.exec('git checkout -b ' + gitlabBranchWap + ' origin/master --no-track');
                shell.exec('git branch --set-upstream-to=origin/' + gitlabBranchWap + ' ' + gitlabBranchWap);
                shell.exec('git pull');

                shell.cd(cwd);
                if(!fs.existsSync(deployFolder)){
                    fs.mkdirSync(deployFolder)
                }

                shellCMD = 'cp -r ' + cwd + gde.config.sep + gde.config.htmlFolder + gde.config.sep + '* ' + deployFolder + gde.config.sep;
                shell.exec(shellCMD);
                shell.cd(deployProject);
                shell.exec('git add ' + deployFolder);
                shell.exec('git commit -am "' + deployMessage + '"');
                shell.exec('git push --set-upstream origin ' + gitlabBranchWap);
                shell.exec('rm -rf ' + buildFolder);
                shell.exec('rm -rf ' + htmlFolder);

                gitlab.projects.merge_requests.add(gitlabProjectId,
                    gitlabBranchWap,
                    'master',
                    assigneeId,
                    deployMessage,
                    function(result) {
                        //TODO 如何判断是否request成功
                        gde.tips("提交merge_request请求");
                        console.log(result);
                    }
                );

               privateMethod.uploadFTP();

            })
    }).catch(function(err){
        gde.error(err);
    })
}



var privateMethod = {
    getGdeJson:function(){
        return readjson().then(function(val){
            if(!val){
                return util.readCmdSync("git username").then(function(username){
                    config["username"] = username;
                    return util.readCmdSync("git token");
                }).then(function(token){
                    config.gitlab = {};
                    config.gitlab["token"] = token;
                    config.gitlab["url"] = "http://gitlab.alibaba-inc.com";
                    return util.readCmdSync("ftp username");
                }).then(function(username){
                    config["ftpUsername"] = username;
                    return util.readCmdSync("ftp password");
                }).then(function(password){
                    config["ftpPassword"] = password;
                    return util.writeFile(configPath,config);
                })
            }else{
                return Promise.resolve(fs.readFileSync(configPath)).then(function(buffer){
                    var content = buffer.toString();
                    return JSON.parse(content);
                });
            }
        })

    },
    hasExitProject:function(path){
        //return  new Promise(function(resolve,reject){
        //    gitlab.groups.listProjects(namespace_id,function(result){
        //        var val = false;
        //        _.each(result,function(v,i){
        //            if(v.name === name){
        //                val = true;
        //            }
        //        });
        //        resolve(val);
        //    })
        //
        //})
        //判断是否存在.git
        return new Promise(function(resolve,reject){
            var isExit = fs.existsSync(path);
            resolve(isExit);
        })
    },
    createProject:function(gitlab){
        return new Promise(function(resolve,reject){
            gitlab.projects.create({
                "namespace_id":namespace_id,
                "name":deployName,
            },function(result){
                if(!result.id){
                    reject("has a error");
                }else{
                    resolve(false);
                }
            })
        })
    },
    writeGitignore:function(isExit){
        return new Promise(function(resolve,reject){

            if(fs.existsSync(".gitignore")){
                resolve(isExit);
                return;
            }
            var text = '.*' + '\r\n';
            text = text + 'output' + "\r\n";
            text = text + 'linshi' + "\r\n";
            text = text + gde.config.htmlFolder + "\r\n";

            fs.writeFile(".gitignore", text, function(err) {
                if(err) {
                    reject(err);
                } else {
                    resolve(isExit);
                }
            });

        })
    },
    setProjectAttr:function(){
        "use strict";
        var obj = privateMethod.getProjectInfo();
        console.log("===========");
        console.log(obj);
        console.log("===========");
        version = obj.version;
        isNewVersion = obj.isNewVerson;
        gitlabBranch = 'daily/' + version;
        publishTag = "publish/" + version;
    },
    getProjectInfo:function(){
        var obj;
        if(fs.existsSync(projectJsonPath)){
            var buffer = fs.readFileSync(projectJsonPath);
            obj = JSON.parse(buffer.toString());
        }else {
            obj = {
                version: "1.0.0",
                isNewVerson: true
            }
            fs.writeFile(projectJsonPath, JSON.stringify(obj, null, 4));
        }
        return obj;
    },
    updateProjectVersion:function(){
        var buffer = fs.readFileSync(projectJsonPath);
        var obj = JSON.parse(buffer.toString());
        var version = obj.version;
        version = parseInt(version.split(".").join(""),10) + 1;
        version = version.toString().split("").join(".");
        obj.version = version;
        obj.isNewVerson = true;
        fs.writeFileSync(projectJsonPath, JSON.stringify(obj,null,4));
        console.log("===========")
        console.log(obj);
    },
    setProjectNoNewVersion:function(){
        var buffer = fs.readFileSync(projectJsonPath);
        var obj = JSON.parse(buffer.toString());
        obj.isNewVerson = false;
        fs.writeFileSync(projectJsonPath, JSON.stringify(obj,null,4));
    },
    uploadFTP:function(configPrivate){
        var configPublic= {
            "host": "10.125.1.214",
            "port": "21",
            "user": "public.amap",
            "password": "lVVJ1Ci4"
        }

        var configFtp = configPrivate || configPublic;
        var options = {
            logging: 'basic'
        };
        var client = new ftpClient(configFtp, options);
        shell.cd(output);

        if(configPrivate){
            //上传私人目录
            client.connect(function() {
                client.upload('**', deployName, {
                    baseDir: "/",
                    overwrite: 'all'
                }, function(result) {
                    console.log(result);
                    console.log('Files have been uploaded to ftp server. Path: /' + deployName + '/');
                    gde.tips("访问：http://group.testing.amap.com/" + configFtp.user + "/" + deployName);
                });

            });

        }else{
            //上传public目录
            client.connect(function() {
                client.upload('*.html', "/activity/" + deployName, {
                    baseDir: "/",
                    overwrite: 'all'
                }, function(result) {
                    console.log(result);
                    console.log('Files have been uploaded to ftp server. Path: /activity/' + deployName + '/');
                    gde.tips("访问：http://group.testing.amap.com/public/activity/" + deployName);
                });

            });
        }
    }
}

module.exports = {
    deploy: deploy,
    name:"deploy",
    desc:"部署一个项目",
    usage:'Usage: gde deploy -m [deploy model] -d [deploy project path]',
    param:[{
        "short":"p",
        "full":"path",
        "describe":"要启动的网站目录 默认当前目录"
    },{
        "short":"m",
        "full":"model",
        "describe":"部署模式: test,daily,publish 默认是test"
    },{
        "short":"d",
        "full":"deploy",
        "describe":"deploy project path, must absulute path"
    }]
}