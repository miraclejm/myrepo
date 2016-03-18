;(function(win, undefined) {
    function Slide(element, options) {
        if(!element) return;
        
        this.options = {
            startIndex   : 0,    // 开始图片的索引
            speed        : 300,  // 滑动动画的时间，单位ms
            isFollow     : true, // 滑动元素是否跟随手指移动
            isLoop       : true, // 是否能循环滑动
            isAuto       : false,// 是否自动开始轮播,如果为true，isLoop也必须为true
            widthScale   : 0,    // 特定的宽度比例
            autoDuration : 3000, // 自动轮播的时间间隔，只在isAuto=true时使用，单位ms
            autoSpeed    : 600,  // 自动轮播的速度，只在isAuto=true时使用，单位ms
            scrope       : null, // beforeFun、afterFun回调函数的执行作用域，不需要的可不传
            //beforeFun    : function(idx, item) {}, // 在滑动开始前调用，参数为当前的index和元素
            afterFun     : function(idx, item) {}  // 在滑动开始后调用，参数为滑动后的index和元素
        };
        for(var p in options) {
            if(options.hasOwnProperty(p)) {
                this.options[p] = options[p];
            }
        }
        if(this.options.isAuto) {
            this.options.isLoop = true;
        }
        this.index = this.options.startIndex;
        this.container = element;
        this.panel = this.container.children[0];
        
        this.panelItems = this.panel.children;
        this.length = this.panelItems.length;
        if(this.length < 2) return;
        
        if(this.options.isLoop) {
            var sChild = this.panelItems[0].cloneNode(true),
                eChild = this.panelItems[this.length - 1].cloneNode(true);
            this.panel.appendChild(sChild);
            this.panel.insertBefore(eChild, this.panelItems[0]);
            this.oriLength = this.length;
            this.length = this.panelItems.length;
            this.index += 1;
        }
        
        this.size();
        
        if(this.container.addEventListener) {
            this.container.addEventListener("touchstart", this, false);
            this.container.addEventListener("webkitTransitionEnd", this, false);
            win.addEventListener("resize", this, false);
        }
        
        if(this.options.isAuto) {
            this.auto();
        }
    }
    
    Slide.prototype = {
        size: function() {
            
            if(this.options.widthScale){
                var scale = this.options.widthScale;
                this.width = document.body.clientWidth * scale;
                this.specialdis = document.body.clientWidth * (1-scale) - 20;
            }else{
                this.width = this.container.getBoundingClientRect().width;
                this.width = (this.width*100/640)*6.4;
            }
            
            if(!this.width) return;
            
            this.container.style.visibility = "hidden";
            for(var len = this.length; len--;) {
                this.panelItems[len].style.width = this.width + "px";
            }
            
            this.panel.style.width = (this.width * this.length) + "px";
            
            this.slider(this.index, 0);
            this.container.style.visibility = "visible";
        },
        prev: function(speed) {
            clearTimeout(this.autoTimeout);
            if(0 < this.index) {
                var currIndex = this.index - 1;
                //this.options.beforeFun.call(this.options.scrope, this.index, this.panelItems[this.index]);
                this.slider(currIndex, speed);
                this.options.afterFun.call(this.options.scrope, this.indexConvert(currIndex), this.panelItems[this.index]);
            }
        },
        
        next: function(speed) {
            clearTimeout(this.autoTimeout);
            if(this.length - 1 > this.index) {
                var currIndex = this.index + 1;
                //this.options.beforeFun.call(this.options.scrope, this.index, this.panelItems[this.index]);
                this.slider(currIndex, speed);
                this.options.afterFun.call(this.options.scrope, this.indexConvert(currIndex), this.panelItems[this.index]);
            }
        },
        
        auto: function() {
            var _this = this;
            this.autoTimeout = setTimeout(function() {
                _this.next(_this.options.autoSpeed);
            }, this.options.autoDuration);
        },
        
        slideTo: function(idx) {
            idx = this.options.isLoop ? idx + 1 : idx;
            this.slider(idx, 0);
        },
        
        destroy: function() {
            if(this.container.removeEventListener) {
                var eventList = ["touchstart", "touchmove", "touchend", "webkitTransitionEnd"];
                for(var l = eventList.length; l--;) {
                    this.container.removeEventListener(eventList[l], this, false);
                }
                win.removeEventListener("resize", this, false);
            }
        },
        
        slider: function(index, duration) {
            duration = undefined !== duration ? duration : this.options.speed;
            //if(duration) {
            //    this.isSliding = true;
            //}
            var style = this.panel.style;
            var specialdis = this.specialdis,translateDis=0;
            style.webkitTransitionDuration = style.msTransitionDuration = style.transitionDuration = duration + "ms";
            if(index>0 && specialdis){
                translateDis = -(index * this.width - specialdis);
            }else{
                translateDis = -(index * this.width);
            }
            
            style.webkitTransform = "translate3d(" + translateDis + "px, 0, 0)";
            this.index = index;
        },
        
        // 传给afterFun的idx参数需要根据isLoop属性的值来做适配
        indexConvert: function(oriIndex) {
            if(this.options.isLoop) {
                oriIndex = 0 === oriIndex ? this.oriLength - 1 : (this.length - 1 === oriIndex ? 0 : oriIndex - 1);
            }
            return oriIndex;
        },
        
        handleEvent: function(e) {
            e = e || window.event;
            switch(e.type) {
                case "touchstart" : this.onTouchStart(e); break;
                case "touchmove" : this.onTouchMove(e); break;
                case "touchend" : this.onTouchEnd(e); break;
                case "webkitTransitionEnd": this.onTransitionEnd(e);break;
                case "resize" : this.size(); break;
                default: break;
            }
        },
        
        onTouchStart: function(e) {
            if(1 !== e.touches.length) return;
            this.startObj = {
                pageX : e.touches[0].pageX,
                pageY : e.touches[0].pageY,
                sTime : Number(new Date())
            };
            this.deltaX = 0;
            this.isScrolling = undefined;
            this.panel.style.webkitTransitionDuration = 0;
            clearTimeout(this.autoTimeout);
            
            this.container.removeEventListener('touchmove', this, false);
            this.container.removeEventListener('touchend', this, false);
            this.container.addEventListener("touchmove", this, false);
            this.container.addEventListener("touchend", this, false);
        },
        
        onTouchMove: function(e) {
            if(1 < e.touches.length) return;
            
            this.deltaX = e.touches[0].pageX - this.startObj.pageX;
            this.deltaY = e.touches[0].pageY - this.startObj.pageY;
            if("undefined" === typeof(this.isScrolling)) {
                this.isScrolling = (this.isScrolling || (2 * Math.abs(this.deltaX) < Math.abs(this.deltaY))) ? true : false;
            }
            if(this.isScrolling) {
                return;
            }
            e.preventDefault();

            var specialdis = this.options.specialdis,translateDis=0;
            if(this.index > 0 && specialdis){
                translateDis = (this.deltaX - this.index * this.width + specialdis );
            }else{
                translateDis = (this.deltaX - this.index * this.width );
            }

            if(this.options.isFollow) {
                this.panel.style.webkitTransform = "translate3d(" + translateDis + "px, 0, 0)";
            }
        },
        
        onTouchEnd: function(e) {
            if(this.deltaX) {
                var isSlide = (Number(new Date()) - this.startObj.sTime) < 250 && Math.abs(this.deltaX) > 20,
                    isBoundary = (0 === this.index && 0 < this.deltaX) || ((this.length - 1) === this.index && 0 > this.deltaX);
                
                //var i = 0; // -1, 0, 1
                //if(isSlide) {
                //    i = isBoundary ? 0 : (0 > this.deltaX ? 1 : -1);
                //} else {
                //    if(this.options.isFollow) {
                //        i = (this.width / 2) < Math.abs(this.deltaX) ? 
                //            (isBoundary ? 0 : -(this.deltaX / Math.abs(this.deltaX))) : 0;
                //    }
                //}
                
                var i = isSlide || (this.width / 2) < Math.abs(this.deltaX) ? 
                            (isBoundary ? 0 : (0 > this.deltaX ? 1 : -1)) : 0;
                
                var currIdx = this.index + i;
                //this.options.beforeFun.call(this.options.scrope, this.index, this.panelItems[this.index]);
                this.slider(currIdx, this.options.speed);
                this.options.afterFun.call(this.options.scrope, this.indexConvert(currIdx), this.panelItems[currIdx]);
                
                // 优化: 在不触发onTransitionEnd的时候延时改变isSliding的值，以保证下次的滑动可以进行
                var _this = this;
                this.slidingTimeout = setTimeout(function() {
                    _this.onTransitionEnd();
                }, this.options.speed + 100);
            }
            AmapApp.log.initLog('revokeUser');
            var flag = this.index;
            switch(flag){
                case 1 :
                    AmapApp.log.log("pv_accurate");
                    break;
                case 2 :
                    AmapApp.log.log("pv_bus");
                    break;
                case 3 :
                    AmapApp.log.log("pv_electric");
                    break;
                default :
                    AmapApp.log.log("pv_professional");
            }
            this.container.removeEventListener('touchmove', this, false);
            this.container.removeEventListener('touchend', this, false);
        },
        
        onTransitionEnd: function(e) {
            clearTimeout(this.slidingTimeout);
            //this.isSliding = false;
            if(this.options.isLoop) {
                if(0 === this.index) {
                    this.slider(this.length - 2, 0);
                } else if((this.length - 1) === this.index) {
                    this.slider(1, 0);
                }
            }
            if(this.options.isAuto) {
                this.auto();
            }
        }
    };
    
    win.PicSlide = Slide;
})(window);