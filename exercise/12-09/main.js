var app = angular.module('myapp',[]);
    angular.element(document).ready(function(){
    });
    app.controller('myctrl',function($scope){
        $scope.value = true;
        var e = document.querySelector('#btn');
        angular.element(e)
        .on('click',function(){
            $scope.value = !$scope.value;
            angular.bootstrap(document,['myapp']);
        });
    })
    .directive('duang',function(){
        return{
            restrict : "E",
            template : "<img src='a.gif'>"
        }
    })
