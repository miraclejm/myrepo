/**
 * @update time 2015/7/16
 */
if (typeof Component === 'undefined'){
	var Component = {};	
}
/**
 * @description 页面加载loading,所有图片预先加载其他都为component 的组件
 * @version 0.1
 * @constructor
 * @param {Object} options{ 
 * 		<b>imgList</b>     <array>  - 需要加载的imglist.</br>
 *		<b>processing</b>  <Function> - 正在加载中的状态显示， 返回加载百分比 .</br>
 *		<b>afterFun</b>    <Function> - 加载完毕后需要初始化的 .</br>
 * }
 */
Component.Loading = function(options){
	this.options = {
		imgList       : [], //需要加载的imglist
        audioHtmlList : [], //需要加载的audio标签类list
		processing    : function(idx) {}, //正在加载中的状态显示， 返回加载百分比
		afterFun      : function() {}  //加载完毕后需要初始化的
	};
	for(var p in options) {
		if(options.hasOwnProperty(p)) {
			this.options[p] = options[p];
		}
	}	
	this._init();
}
/**
 * Component.Loading.
 * @namespace
 */
Component.Loading.prototype	= {
	/**		
	 * Loading#_init
	 * loading入口
	 * documented asLoading#_init
	 **/
	_init:function(){
		var _this = this;
		this.total = this.options.imgList.length;// + this.options.audioHtmlList.length;
		this.loadedNum = 0;
        var _callback = function(){
			_this.loadedNum++;
			var percent = _this.loadedNum / _this.total;
			_this.options.processing.call(_this.options.processing, Math.round(percent * 100));
			if(percent === 1){
				setTimeout(function(){
					_this.options.afterFun.call(_this.options.afterFun);
				},500);
                //document.body.removeEventListener("canplaythrough", _this.audioLoadedCB, true);
                //document.body.removeEventListener("error", _this.audioLoadedCB, true);
			}
		};
		_this._imgLoader(_callback);
        if(this.options.audioHtmlList.length) {
            _this._audioHtmlLoader(_callback);
        }
	},
	/** 
	 * Loading#_imgLoader
	 * @param {Function} callback 回调方法
	 * 
	 * */
	_imgLoader:function(callback){
		var imgList = this.options.imgList;
		for(var i = 0,len = imgList.length;i<len;i++){	
			this._load(imgList[i],(i+1),callback);
		}
	},
	/**Loading#_load
	 * @param {String} link
	 * @param {Number} count
	 * @param {Function}  callback
	 * */
	_load:function(link,count,callback){
		var img = new Image();
		img.onload = function(){
			callback();		
		};
		img.onerror = function(){	
			callback();
		}
		img.src= link;
	},
    
    _audioHtmlIdCache : "",
    
    /** 
	 * Loading#_audioHtmlLosder
     * @param {Function}  callback
	 * */
    _audioHtmlLoader:function(callback) {
        var _this = this;
        //_this.audioLoadedCB = function(e) {
        //    var ele = e.target;
        //    var id = ele.id;
        //    if("audio" === ele.nodeName.toLowerCase() && id) {
        //        if(-1 === _this._audioHtmlIdCache.indexOf("[" + id + "]")) {
        //            _this._audioHtmlIdCache += "[" + id + "]";
        //            callback();
        //        }
        //    }
        //};
        //document.body.addEventListener("canplaythrough", _this.audioLoadedCB, true);
        //document.body.addEventListener("error", _this.audioLoadedCB, true);
        var audioList = this.options.audioHtmlList;
        var audioDom = null;
        for(var i = 0, len = audioList.length, item = null; i < len; i++) {
            item = audioList[i];
            audioDom = document.createElement("audio");
            audioDom.id = item.id;
            audioDom.setAttribute("preload", "auto");
            audioDom.setAttribute("src", item.src);
            document.body.appendChild(audioDom);
        }
    }
}