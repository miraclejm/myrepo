var app = angular.module('myapp',[]);
app.controller('myCtrl',function($scope){
    $scope.person = {"head":"J","ass":"M"};
    $scope.reset = function(){
        $scope.user = angular.copy($scope.person);
    };
    $scope.reset();
    $scope.name = "uncle";
    $scope.email = "bbq@gmail.com";
});