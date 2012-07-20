(function( $ ){

    var launched = false;

    $.findOnPage = function(el, options, callback){
        // To avoid scope issues, use 'base' instead of 'this'
        // to reference this class from internal events and functions.
        var base = this;

        // Access to jQuery and DOM versions of element
        base.$el = $(el);
        base.el = el;

        // Add a reverse reference to the DOM object
        base.$el.data("findOnPage", base);
       
        base.callback = function(){
            if(callback)
                callback.apply();
        }

        base.replacer = function replacer(match, p1, p2, p3, offset, string) {
            // p1 is nondigits, p2 digits, and p3 non-alphanumerics
            return '<span class="' + base.options.textHighlightClass + '">' + match + '</span>';
        }


        base.init = function(){
            
            if( typeof( callback ) === "undefined" || callback === null ) callback = "null";
            
            base.callback = callback;

            base.options = $.extend({},$.findOnPage.defaultOptions, options);

            if(!base.options.caseSensitive) {
                jQuery.expr[':'].contains = function (a, i, m) {
                    var result = $(a).text().match(new RegExp(m[3], "ig"));
                    return result != null && result.length > 0;
                };
            }
            
            var $closeButton = $("<button id='close-fop_search_box-container' >X</button>");
            var $searchBox = $("<input id='input-text' type='text' />")
            var $searchNavigationButtons = $("<div id='fop_search_text_buttons-container'><button disabled='disabled' id='fop_search-bw'>&lt;&lt;</button><button disabled='disabled' type='button' id='fop_search-fw' >&gt;&gt;</button></div>");
            var $searchMatchesContainer = $("<span id='fop_search_matching-container'>0</span>");
            var $searchBoxContainer = $("<div id='fop_search_box-container' />");
            var currentMatchIndex = 0;
            var matchCount = 0;
            var isScrolled = false;
            
            if(!launched) {
                $searchBoxContainer.append($closeButton, $searchBox, $searchNavigationButtons, $searchMatchesContainer);
                $searchBoxContainer.appendTo("body").slideDown(1500, "easeOutBounce", base.callback );
                $searchBox.focus();
            }
            
            //close button
            $closeButton.click(function () {
                $(this).parent().slideUp(750);
                $('.' + base.options.textHighlightClass).contents().unwrap();
                launched = false;
            });

            //search box input
            function replacer(match, p1, p2, p3, offset, string) {
                // p1 is nondigits, p2 digits, and p3 non-alphanumerics
                return '<span class="' + base.options.textHighlightClass + '">' + match + '</span>';
            }
            function stripSpecialRegexCharacter(string) {
                var specialChars = ["\\\\", "\\[", "\\]", "\\(", "\\)", "\\/", "\\*", "\\+", "\\?", "\\{", "\\}"];
                var result = string;
                for (var index in specialChars)
                    result = result.replace(new RegExp(specialChars[index], "g"), ".");

                return result;
            }

            function sizeSort(a,b){
                return a.innerHTML.length > b.innerHTML.length ? 1 : -1;
            };

            function highlightMe(regex, node) {

                var result = base.options.caseSensitive? node.clone().children().remove().end().text().match(regex) : node.clone().children().remove().end().text().match(regex, "i");
                if (result) { // matching!
                    node.html(
                        node.html().replace(new RegExp(regex, "ig"), replacer)
                        );
                }
            }

            $searchBox.keyup(function (event) {
                $('.' + base.options.textHighlightClass).contents().unwrap(); //removes previously added span.textFound
     
                matchCount = 0;
                var $this = $(this);
                currentMatchIndex = 0;

                if ($this.val().length > base.options.minLength) {
                    var theRegex = stripSpecialRegexCharacter($this.val()).replace(new RegExp("\\s", "g"), "\\s+").replace(new RegExp("'", "g"), "\\'");                    
                    $(base.options.parentContainer)
                    .find('*')
                    .sort(sizeSort)
                    .filter(":visible")
                    .each(function(){
                        if (!$(this).find("." + base.options.textHighlightClass).length)
                            highlightMe(theRegex, $(this));
                    });

                    matchCount = $("span." + base.options.textHighlightClass).length;
                    
                    //enable next match button if more than 1 result found
                    if (matchCount > 1)
                        $("button#fop_search-fw").attr("disabled",false);
                    else
                        $searchBoxContainer.find("button:not(#close-fop_search_box-container)").attr("disabled",true);

                    if (matchCount === 0) {
                        $searchMatchesContainer.text(0);
                        $('html').scrollTop(0);
                    }
                    else //update match counter
                        $searchMatchesContainer.text((currentMatchIndex + 1) + "/" + matchCount);

                    //scrolls to first match
                    if ($("span." + base.options.textHighlightClass).length && !isScrolled) {
                        scrollToMatch(0);
                        isScrolled = true;
                    }

                }
                else {

                    $searchMatchesContainer.text(0);
                    $searchBoxContainer.find("button:not(#close-fop_search_box-container)").attr("disabled",true);
                    isScrolled = false;
                }

            });
            //navigation buttons
            $("#fop_search_text_buttons-container button:not(#close-fop_search_box-container)").click(function () {

                var currentMatchCount = $("span." + base.options.textHighlightClass).length;
                var direction = $(this).attr("id");

                if (currentMatchCount < 2) {
                    $("button.match-nav").attr("disabled",true);
                    return false;
                }

                if (direction == "fop_search-fw" && (currentMatchIndex < (currentMatchCount - 1))) {
                    currentMatchIndex++;
                    scrollToMatch(currentMatchIndex);
                }
                if (direction == "fop_search-bw" && currentMatchIndex > 0) {
                    currentMatchIndex--;
                    scrollToMatch(currentMatchIndex);
                }
                //update match counter
                $searchMatchesContainer.text((currentMatchIndex + 1) + "/" + currentMatchCount);

            });

            function scrollToMatch(matchIndex) {

                var firstMatchYPosition = $("span." + base.options.textHighlightClass).eq(matchIndex).offset().top;
                var windowHeight = $(window).height();
                $('html, body').animate({
                    scrollTop: firstMatchYPosition - (windowHeight / 2)
                }, 800);

                if(( $searchBoxContainer.offset().top + $searchBoxContainer.height() ) > firstMatchYPosition)
                    $searchBoxContainer.css({right : "2px", left : 'auto'});
                else
                    $searchBoxContainer.css({left : "2px", right : "auto"});
                
                console.log(firstMatchYPosition, "match position");
                console.log($searchBoxContainer.offset().top, "search container position")
                console.log($searchBoxContainer.height(), "search container height")

                switch (matchIndex) {
                    case 0:
                        $("button#fop_search-bw").attr("disabled",true);
                        if (matchCount > 1) // if there is only one match both must be disabled
                            $("button#fop_search-fw").attr("disabled",false);
                        break;
                    case (matchCount - 1):
                        $("button#fop_search-fw").attr("disabled",true);
                        if (matchCount > 1) // if there is only one match both must be disabled
                            $("button#fop_search-bw").attr("disabled",false);
                        break;
                    default:
                        $("button#fop_search-fw").attr("disabled",false);
                        $("button#fop_search-bw").attr("disabled",false);
                        break;

                }
            }
            launched = true;
        };

        // Run initializer
        base.init();
    };

    $.findOnPage.defaultOptions = {
        caseSensitive: false,
        excludedChildElements: 'a,b',
        textHighlightClass: 'text-found',
        minLength: 3,
        parentContainer: 'body'
    };

    $.fn.findOnPage = function( options, callback ) {
        var self = this;
        this.click(function(event){
            event.preventDefault();
            if(!launched)
                return (new $.findOnPage(self, options, callback));
        });


    };

})( jQuery );