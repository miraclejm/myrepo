function my(){
    var data = '{"title":"miraclejm"}';
    var html = new EJS({url:'../temp/header.ejs'}).render(JSON.parse(data));
}
my();