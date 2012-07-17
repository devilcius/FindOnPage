$(document).ready(function(){
    $("h1 .title").lettering();
    var showMeIconLinkText = null;
    var hideMeIconLinkText = "Please, hide me!";
    $("a#show-me-icon-link").click(function(){
        if(showMeIconLinkText == null) showMeIconLinkText = $(this).text();
        var $this = $(this);
        $("div#search-icon-container").slideToggle(1000, 'easeInOutBack', function() {
            $(".triangle-border").effect("shake", {
                times:2
            }, 300);
            if(!$(this).is(":visible"))
                $this.text(showMeIconLinkText);
            else
                $this.text(hideMeIconLinkText);
              
        })
    });

    $("a#find-on-page").hover(
        function(){         
            $(this).find("img").attr("src","img/find-icon-admire.png");
        }
        ,function(){
            $(this).find("img").attr("src","img/find-icon.png");
        })
        
    $("a#find-on-page").findOnPage(
    {caseSensitive:true},
    function(){
        $("p.triangle-border").children("span").fadeOut(750, function(){
            $(this).text("Now it's time to try the magic. Type something in the search box.").fadeIn(750);
        });
    });
});