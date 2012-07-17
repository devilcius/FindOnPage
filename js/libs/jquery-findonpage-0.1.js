(function( $ ){



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

        base.init = function(){
            
            if( typeof( callback ) === "undefined" || callback === null ) callback = "null";
            
            base.callback = callback;

            base.options = $.extend({},$.findOnPage.defaultOptions, options);

            if(base.options.caseSensitive) {
                jQuery.expr[':'].contains = function (a, i, m) {
                    return jQuery(a).text().toLowerCase().indexOf(m[3].toLowerCase()) >= 0;
                };
            }

            var $closeButton = $("<button class='ui-button ui-widget ui-state-default ui-corner-all' id='close-search_box-container' >X</button>");
            var $searchBox = $("<input id='input-text'type='text' />")
            var $searchNavigationButtons = $("<div id='search_text_buttons-container'><button class='ui-button ui-widget ui-state-default ui-corner-all match-nav ui-button-disabled ui-state-disabled'id='search-bw'>&lt;&lt;</button><button class='ui-button ui-widget ui-state-default ui-corner-all match-nav ui-button-disabled ui-state-disabled' type='button' id='search-fw' >&gt;&gt;</button></div>");
            var $searchMatchesContainer = $("<span id='search_matching-container'>0</span>");
            var $searchBoxContainer = $("<div id='search_box-container' />");
            var currentMatchIndex = 0;
            var matchCount = 0;
            $searchBoxContainer.append($closeButton, $searchBox, $searchNavigationButtons, $searchMatchesContainer);
            $searchBoxContainer.appendTo("body").slideDown(1500, "easeOutBounce", base.callback );
            $searchBox.focus();
            
            //close button
            $closeButton.click(function () {
                $(this).parent().slideUp(750);
                $('.' + base.options.textHighlightClass).contents().unwrap();
            });

            //search box input
            function replacer(match, p1, p2, p3, offset, string) {
                // p1 is nondigits, p2 digits, and p3 non-alphanumerics
                return '<span class="' + base.options.textHighlightClass + '">' + match + '</span>';
            }
            $searchBox.keyup(function (event) {
                $('.' + base.options.textHighlightClass).contents().unwrap(); //removes previously added span.textFound
                matchCount = 0;
                var $this = $(this);
                currentMatchIndex = 0;
                if ($this.val().length > base.options.minLength) {

                    $('*:contains(' + $(this).val() + ')').filter(':visible').each(function () {
                        if ($(this).children().not('a, span').length < 1) {
                            matchCount++;
                            $(this).html(
                                $(this).html().replace(new RegExp("[a-zA-Z]"+$this.val().substr(1)),
                                    replacer)
                                );
                        }
                    });

                    //enable next match button if more than 1 result found
                    if (matchCount > 1)
                        $("button#search-fw").removeClass("ui-button-disabled ui-state-disabled");
                    if (matchCount === 0)
                        $searchMatchesContainer.text(0);
                    else //update match counter
                        $searchMatchesContainer.text((currentMatchIndex + 1) + "/" + matchCount);

                    //scrolls to first match
                    if ($("span." + base.options.textHighlightClass).length) {
                        scrollToMatch(0);
                    }
                }
            });
            //navigation buttons
            $("#search_text_buttons-container button.match-nav").live("click", function () {
                var matches = $("span.text-found").length;
                var direction = $(this).attr("id");

                if (matches < 2) {
                    $("button.match-nav").addClass("ui-button-disabled ui-state-disabled");
                    return false;
                }

                if (direction == "search-fw" && (currentMatchIndex < (matches - 1))) {
                    currentMatchIndex++;
                    scrollToMatch(currentMatchIndex);
                }
                if (direction == "search-bw" && currentMatchIndex > 0) {
                    currentMatchIndex--;
                    scrollToMatch(currentMatchIndex);
                }
                //update match counter
                $searchMatchesContainer.text((currentMatchIndex + 1) + "/" + matches);

            });

            function scrollToMatch(matchIndex) {

                var firstMatchYPosition = $("span.text-found").eq(matchIndex).offset().top;
                var windowHeight = $(window).height();
                $('html, body').animate({
                    scrollTop: firstMatchYPosition - (windowHeight / 2)
                }, 800, updateNavButtons);
                function updateNavButtons() {

                    switch (currentMatchIndex) {
                        case 0:
                            $("button#search-bw").addClass("ui-button-disabled ui-state-disabled");
                            $("button#search-fw").removeClass("ui-button-disabled ui-state-disabled");
                            break;
                        case (matchCount - 1):
                            $("button#search-fw").addClass("ui-button-disabled ui-state-disabled");
                            $("button#search-bw").removeClass("ui-button-disabled ui-state-disabled");
                            break;

                    }
                }
            }
        };



        // Run initializer
        base.init();
    };

    $.findOnPage.defaultOptions = {
        caseSensitive: false,
        excludedChildren: 'a,span',
        textHighlightClass: 'text-found',
        minLength: 3
    };

    $.fn.findOnPage = function( options, callback ) {
        var self = this;
        this.click(function(event){
            event.preventDefault();
            return (new $.findOnPage(this, options, callback));
        });


    };

})( jQuery );