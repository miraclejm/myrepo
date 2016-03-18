var app = angular.module('myapp',[]);
app.directive('expend',function(){
    return {
        restrict : "EA",
        replace : true,
        transclude : true,
        scope : {
            title : '=expendTitle'
        },
        template : '<div>'
                    +'<div class="title" ng-click="toggle()">{{title}}</div>'
                    +'<div class="body" ng-show="showMe" ng-transclude></div>'
                    +'</div>',
        link : function(scope,element,type){
            scope.showMe = false;
            scope.toggle = function(){
                scope.showMe = !scope.showMe;
            }
        }
    }
})
.provider('cal',function(){
        this.$get = function(){
            return{
                add:function(a,b){
                    return a+b;
                },
                substract:function(a,b){
                    return a-b;
                },
                divide:function(a,b){
                    return a/b;
                },
                multiply:function(a,b){
                    return a*b;
                }
            }
        }
})
.controller('myctrl',function($scope){
    $scope.title = '点击展开';
    $scope.text = '里面的内容';
});