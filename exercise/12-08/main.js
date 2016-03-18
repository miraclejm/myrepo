var app = angular.module('myapp',[]);
app.provider('hello',function(){
    this.$get = function(){
        return "hello world!";
    };
});
angular.element(document).ready(function(){
    angular.injector(["ng","myapp"]).invoke(function(hello){
        var e = document.querySelector("#test");
        angular.element(e).text(hello);
    });
});