var app = angular.module('myapp',[]);
app.directive('tab',function(){
    return{
        restrict : 'E',
        transclude : 'true',
        scope : {},
        controller : ['$scope',function($scope){
            var panes = $scope.panes = [];
            $scope.select = function(pane){
                angular.forEach(panes,function(pane){
                    pane.selected = false;
                });
                pane.selected = true;
            };
            this.addPane = function(pane){
                if(panes.length == 0)$scope.select(pane);
                panes.push(pane);
            }
        }],
        template :
            '<div>'+
                '<ul>'+
                    '<li ng-repeat="pane in panes" ng-class="active:pane.selected">'+
                        '<a href="" ng-click="select(pane)">{{pane.title}}</a>'+
                    '</li>'+
                '</ul>'+
            '<div ng-transclude></div>'+
            '</div>',
            replace : true 
           }
    })
    .directive('pane',function(){
        return{
            require : '^tab',
            restrict : 'E',
            transclude : true,
            replace : true,
            scope :{ title : '@'},
            link : function(scope,element,attrs,tabctrl){
                tabctrl.addPane(scope);
            },
            template : '<div ng-transclude ng-class="{active:selected}"></div>'
        }
    });