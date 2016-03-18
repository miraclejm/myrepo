var app = angular.module('myapp',[]);
        app.controller("myctrl",function($scope){
            $scope.names = [
                {"name":"jack","eat":"shit"},
                {"name":"ji","eat":"shit"},
                {"name":"wang","eat":"shit"},
                {"name":"li","eat":"shit"}
            ];
            $scope.update = -1;
            $scope.$watch('name',function(nv,ov){
                if(nv == ov){return;}//略过第一次的执行
                $scope.update++;
            });
        });
        app.directive('newclock',function(){
            return {
                restrict : "E",
                replace : true,
                template : "<div class='test'></div>",
                link:function(scope,element,attrs){
                /*
                    抒写新的指令编写时钟
                    setInterval(function(){
                        var d = new Date();
                        element.text(d.toString());
                    },1000);
                    */
                    // var sb = scope.$eval(attrs.data);
                    /*  scope.$watch(attrs.data,function(nv,ov){
                        var list = element.find('span');
                        list[0].textContent = nv.name;
                        list[1].textContent = nv.age;
                        list[2].textContent = nv.gender;
                    },true);*/
                   /* setInterval(function(){
                        scope.$apply("sb.age = sb.age + 1");
                    },1000);*/
                    var model = attrs.data;
                    element.append("name:<input field='name' type='text'>");
                    element.append("age:<input field='age' type='text'>");
                    element.append("gender<input field='gender' type='text'>");
                    element.find('input').on('keyup',function(e){
                        var field = e.target.getAttribute("field");
                        scope[model][field] = e.target.value;
                        scope.$apply(" ");
                        //angular需要将数据的变化进行传播。让$watch监听到。
                        //scope.$apply("sb.name='jm'");==sb.name = "jm";scope.$apply(" ");
                        //$watch的第三个参数bool类型，true表示参数是比较值，false表示比较引用。默认为false.
                    });
                }.
            }  
            })
            .directive('logger',function(){
                return{
                    restrict:"A",
                    link:function(scope,element,attrs){
                    var model = attrs.data;
                    scope.$watch(model,function(nv,ov){
                        var cnt = JSON.stringify(nv,null," ");
                        element.html("<div>"+cnt+"</div>");
                    },true);
                }
                }
            });