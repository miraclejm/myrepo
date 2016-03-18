/**
 * 预热页面用到的API
 */
;!function(Bridge,win){
		/**
		 * 分享.
		 * @param {Array.<Object>} cont
		 *    [{type: "weibo", message: "", title: "", url: ""},
		 *    {type: "weixin", message: "", title: "", url: ""},
		 *    {type: "pengyou", message: "", title: "", url: ""}]
		 * @param {Object} poiInfo 
		 *    poiid 或 lon和lat 至少一方存在
		 */
		Bridge.share = function(cont, urlType, poiInfo){
            var param = {
                action: "share",
                content: cont,
                useCustomUrl: "1",
                urlType: urlType ? "" + urlType : "1"
            };
            if(poiInfo) {
                param.poiInfo = poiInfo;
            }
            Bridge.send(param);	
       }
		/**
		 * aosrequest.
		 * 参数为两种形式，分别为 aosrequest(obj, handler) 和
		 * aosrequest(url, params, handler, progress, showNetErr, 	method)
		 * 
		 * @param {String} url 请求url	
		 *    此参数为 obj 类型时，此参数为所有参数列表，此时第二个参数为回调方法
		 *    此时 obj 的 key 应该和真实接口保持一致：
		 *    urlPrefix，method，progress，params，alert，encrypt，goback，showNetErr
		 * @param {Array.<Object>} params 请求参数列表
		 * @param {Function} handler 回调方法，请求结果会以JSON格式传给方法的第一个参数
		 * @param {Integer|String} [progress] 可选，请求时的提示信息，
		 *    为数字1时显示默认的提示信息
		 * @param {Boolean} [showNetErr=false] 网络异常时是否进行提示，默认不提示
		 * @param {String} [method=POST] 可选，请求方式
		 */
       Bridge.aosrequest = function(url, params, handler, progress, showNetErr, method) {
            if (!url) return;
            var obj;
            // (obj, handler) 形式调用
            if (typeof url === 'object') {
                obj = url;
                handler = params;
                showNetErr = obj.showNetErr;
                delete obj.showNetErr;
            } else { // (url, params, handler, progress, showNetErr, method) 形式
                obj = {
                    urlPrefix: url,
                    method: method,
                    progress: progress,
                    params: params
                };
            }
            obj.action = 'aosrequest';
            obj.method = 'string' === typeof obj.method && 'GET' === obj.method.toUpperCase() ? 'GET' : 'POST';
            if (obj.progress) {
                obj.progress = 1 === obj.progress ? '正在加载' : obj.progress;
            } else {
                // ios 下 progress 为空字符串时会显示默认信息
                delete obj.progress;
            }
            Bridge.send(obj, function(res) {
                var result = JSON.parse(res.content);
                if (!result) {
                    result = {code: -10};
                } else if (showNetErr && (result.code == -1 || result.code == -2)) {
                    Bridge.promptMessage('请检查网络后重试');
                }
                handler(result);
            });
       }
       /**客户端交互的相关参数*/
		Bridge.getExtraUrl = function(handler) {
			var param = {
			    action : "getExtraUrl"
			};
			Bridge.send(param, handler);
		}
		/*登录bind*/
		Bridge.loginBind = function(handler){
			var param = {
				action:'loginBind',
				type: 'phone'
			}
			Bridge.send(param, handler);
		}
		/*客户端的toast*/
		Bridge.promptMessage = function(message, type, handler) {
            var param = {
                action: "promptMessage",
                message: message,
                type: "" + type
            };
            Bridge.send(param, handler);
        }
		/**
		 * 播放音乐
		 *@param url  播放地址 mp3 url
		 *@param act  播放状态 play pause stop
		 *@param loop 是否循环播放 1 循环
		 *@param isShort  0短音频 1长音频
		 * */
		Bridge.audioCtr = function(url, act, loop, isShort) {
			var obj = {
		        "action": 'webAudio',
		        "url": url,
		        "act": act,
		        "loop": loop ? "1" : "0",
		        "short": isShort ? "1" : "0"
		    };
		    Bridge.send(obj);
		}
		 /**
		 * 获取当前用户位置：城市，经纬度.
		 * @param {Function} handler 回调方法
		 */
		Bridge.getMapLocation=function(handler) {
		    var param = {
		        action: "getMapLocation",
		        forceReturnValue: 1
		    };
		    Bridge.send(param, handler);
		}
}(Bridge,window);