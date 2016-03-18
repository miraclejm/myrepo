(function(){
    var show = 0;
    window.addEventListener('pageshow',function(event){
        show++;
        console.log(event);
        // alert("this is your "+show+"times!"+event.persisted);
    });
    window.addEventListener('beforeunload',function(){
        alert("GO GO GO ");
    })
})();