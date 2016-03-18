var app = angular.module('myapp',[]);
app.controller('myctrl',function($scope){
    $scope.format = 'y-M-d h:mm:ss';
})
.directive('clock',function($interval,dateFilter){
       return{
        restrict:"EA",

        link:function(scope,element,attrs){
            var format,timeoutId;
            function updateTime(){
                element.text(dateFilter(new Date(),format));
            }
            scope.$watch(attrs.clock,function(value){
                format = value;
                updateTime();
            });
            element.on("$destory",function(){
                $interval.cancel(timeoutId);
            });
            timeoutId = $interval(function(){
                updateTime();
            },1000);
        }
       }
});