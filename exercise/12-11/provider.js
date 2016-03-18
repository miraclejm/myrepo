var app = angular.module('myapp',[]);
function docal(){
    var inject = angular.injector(["myapp"]),
        mycal = inject.get("calc");
        result = mycal.add(3,4);
        document.querySelector('#result').textContent = result;
}
app.provider('calc',function(){
    this.$get = function(){
        return{
            add:function(a,b){return a+b;},
            substract:function(a,b){return a-b;},
            divide:function(a,b){return a/b;},
            multiply:function(a,b){return a*b;},
        };
    };
});