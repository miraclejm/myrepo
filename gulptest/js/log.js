;!(function(window){
	var Logs = {
		_hasInitParam:false,
		_initParam: function(){
			this.mobile = Bridge.os;
			this.duan = Bridge.InNative?"":"_wx";
			this.source = this.getQuery()["gd_from"] || "wabao";
		},
		/*
		* 发送pv
		* */
		sendLog: function(page,key){
			if(!this._hasInitParam){
				this._initParam();
				this._hasInitParam = true;
			}
			if (key) {
				this.page = 'wabao_' + page + this.duan + '_' + this.mobile + "_" + this.source;
			} else {
				key = page;
			}
			this.log(key);
		},
		log:function(click){
			var data={};
			click = click||"";
			data.action = 'logUserAction';
			var param = {page:this.page,click:click};
			data.para = JSON.stringify(param);
			Bridge.send(data,function(){});	
		},
		/**
		 * 获得URL Query
		 */
		getQuery: function (url) {
			url = url ? url : window.location.search;
			if (url.indexOf("?") < 0) return {};
			var queryParam = url.substring(url.indexOf("?") + 1, url.length).split("&"),
				queryObj = {};
			var i = 0;
			var j = "";
			for (i = 0; j = queryParam[i]; i++) {
				queryObj[j.substring(0, j.indexOf("=")).toLowerCase()] = j.substring(j.indexOf("=") + 1, j.length);
			}
			return queryObj;
		}
	}
	window.Logs = Logs;
})(window)
