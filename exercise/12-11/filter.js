var app = angular.module('myapp',[]);
/*var toUpFilterFactory = function(){
        return function(input){
           return input.toUpperCase();
        }
        将所有字母专门转为大写的过滤器
};
app.filter('toUp',toUpFilterFactory);*/
var toUpFilterFactory = function(){
    return function(input,flag){
        if(!flag) return input.toUpperCase();
        var output = input.replace(/\b\w+\b/g,function(word){
            return word.substring(0,1).toUpperCase()+word.substring(1);
        });
        return output;
    }
};
app.filter('toUp',toUpFilterFactory);