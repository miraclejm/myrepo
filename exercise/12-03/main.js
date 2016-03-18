var app = angular.module('myapp',[]);
app.controller('myCtrl',function($scope,$http){
  /* $http.get("D:/php/Customers_JSON.php")
    .success(function(res){
        $scope.names = res.records;
    });*/
    $scope.flag = "true";
    $scope.names = [
        {"name":"北京","size":"1024K"},
        {"name":"天津","size":"512K"},
        {"name":"石家庄","size":"2048K"}
    ];
    $scope.toggle = function(){
        $scope.flag = !$scope.flag;
    }
});