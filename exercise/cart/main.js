var app = angular.module("myCartApp",[]);
app.controller("buycart",function($scope){
    $scope.production = [
        {"name":"car","price":"20$"},
        {"name":"bike","price":"5$"},
        {"name":"bread","price":"1$"},
        {"name":"fruit","price":"10$"},
        {"name":"girl","price":"50$"},
        {"name":"boy","price":"60$"}
    ];
    $scope.cart = [

    ];
});