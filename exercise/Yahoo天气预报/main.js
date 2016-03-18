var yahoo_url = "https://query.yahooapis.com/v1/public/yql?q=";
var selectedCity = "北京";
var unit = "c";
$(function(){
    init();
})
function init(){
    getCityId(selectedCity);
}
function getCityId(city){
    var query = 'select woeid from geo.placefinder where text="' + city + '"&format=json';
    var jsonURL = yahoo_url + query;
    $.getJSON(jsonURL, woeidDownloaded);
}
function woeidDownloaded(data){
    var id = data.query.results.Result.woeid;
    getCityWeather(id);
}
function getCityWeather(woeid){
    var infoquery = 'select * from weather.forecast where woeid=' + woeid + ' and u = "' + unit + '" &format=json';
    var jsonURL = yahoo_url + infoquery;
    $.getJSON(jsonURL, function(data){
    });
}