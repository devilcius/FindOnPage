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


            function stripSpecialRegexCharacter(string) {
                var specialChars = ["\\\\", "\\[", "\\]", "\\(", "\\)", "\\/", "\\*", "\\+", "\\?", "\\{", "\\}"];
                var result = string;
                for (var index in specialChars)
                    result = result.replace(new RegExp(specialChars[index], "g"), ".");

                return result;
            }

            function innerHighlight(node, pattern) {
                var skip = 0;
                if (node.nodeType === 3) { // 3 - Text node
                    var pos = node.data.search(pattern);
                    if (pos >= 0 && node.data.length > 0) { // .* matching "" causes infinite loop

                        var match = node.data.match(pattern); // get the match(es), but only handle the 1st one, hence /g is not recommended
                        var spanNode = document.createElement('span');
                        spanNode.className = base.options.textHighlightClass; // set css
                        var middleBit = node.splitText(pos); // split to 2 nodes, node contains the pre-pos text, middleBit has the post-pos
                        var endBit = middleBit.splitText(match[0].length); // similarly split middleBit to 2 nodes
                        var middleClone = middleBit.cloneNode(true);
                        spanNode.appendChild(middleClone);
                        // parentNode ie. node, now has 3 nodes by 2 splitText()s, replace the middle with the highlighted spanNode:
                        middleBit.parentNode.replaceChild(spanNode, middleBit);
                        ;
                        skip = 1; // skip this middleBit, but still need to check endBit
                    }
                } else if (node.nodeType === 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) { // 1 - Element node
                    for (var i = 0; i < node.childNodes.length; i++) { // highlight all children
                        i += innerHighlight(node.childNodes[i], pattern); // skip highlighted ones
                    }
                }
                return skip;
            }


            $searchBox.keyup(function (event) {

                matchCount = 0;
                var $this = $(this);
                currentMatchIndex = 0;
                
                if ($this.val().length > base.options.minLength - 1)//removes previously added span.textFound and empty text nodes...
                    $('.' + base.options.textHighlightClass).contents().unwrap().filter(function(){
                        if(this.parentNode)
                            with(this.parentNode)
                                normalize();
                    });

                if ($this.val().length > base.options.minLength) {
                    var filteredString = stripSpecialRegexCharacter($this.val()).replace(new RegExp("\\s", "i"), "\\s+").replace(new RegExp("'", "g"), "\\'");
                    var regex = base.options.caseSensitive? new RegExp(filteredString) : new RegExp(filteredString, "i");

                    innerHighlight($(base.options.parentContainer)[0], regex);

                    //ommit hidden nodes
                    matchCount = $("span." + base.options.textHighlightClass).filter(function(){
                        return $(this).closest(":hidden").length === 0;
                    }).length;
                    
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

                var direction = $(this).attr("id");

                if (matchCount < 2) {
                    $("button.match-nav").attr("disabled",true);
                    return false;
                }

                if (direction == "fop_search-fw" && (currentMatchIndex < (matchCount - 1))) {
                    currentMatchIndex++;
                    scrollToMatch(currentMatchIndex);
                }
                if (direction == "fop_search-bw" && currentMatchIndex > 0) {
                    currentMatchIndex--;
                    scrollToMatch(currentMatchIndex);
                }
                //update match counter
                $searchMatchesContainer.text((currentMatchIndex + 1) + "/" + matchCount);

            });

            function scrollToMatch(matchIndex) {

                var $firstMatchingSpan = $("span." + base.options.textHighlightClass).eq(matchIndex);
                var windowHeight = $(window).height();
                $('html, body').animate({
                    scrollTop: $firstMatchingSpan.offset().top - (windowHeight / 2)
                }, 800);



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
        this.bind("click", function(event){
            event.preventDefault();
            if(!launched)
                return (new $.findOnPage(self, options, callback));
        });


    };

})( jQuery );