(function() {
    'use strict';

    /** TODO
     * @ngdoc service
     * @name petriNet.common.factory:placeFactory
     * @description
     * description...
     **/
    placeFactory.$inject = ['configFactory', 'svgAssetsFactory'];

    function placeFactory(configFactory, svgAssetsFactory) {
        var factory = {
            newPlace: newPlace
        };

        return factory;

        function newPlace(container, x, y, label, tokens, id) {
            var place = _drawPlace();
            // Properties
            place.petriType = 'place';
            place.label = label;
            // Methods
            place.getTokens = getTokens;
            place.setTokens = setTokens;
            // Private
            var _tokens = tokens;

            _init();

            return place;

            ///// Functions /////
            function _init() {
                place.setTokens(_tokens);
                svgAssetsFactory.addLabel(place, label);
                var hasShadow = configFactory.get().nodeStyle.place.shadow;
                if (hasShadow)
                    svgAssetsFactory.addDropShadow(place);
            }

            /**
             * Creates a new place element on the svg and returns it
             **/
            function _drawPlace() {
                var diameter = configFactory.get().nodeSize.place.diameter;
                var style = configFactory.get().nodeStyle.place;

                var placeElement = container
                    .group()
                    .draggy()
                    .circle(diameter)
                    .move(x, y)
                    .attr(style)
                    .addClass('place');
                placeElement.id(id);
                return placeElement;
            }

            /**
             * Returns the quantity of tokens in the actual place
             **/
            function getTokens() {
                return _tokens;
            }

            /**
             * Returns the quantity of tokens in the actual place
             **/
            function setTokens(quantity) {
                // Stops for invalid quantity values
                if (quantity < 0 || tokensCount === quantity || typeof quantity !== 'number') return;

                var tokensCount = _countTokenElements();
                // Set the new tokens quantity
                _tokens = quantity;

                // Less than 4 means dot tokens should be drawn
                // otherwise number tokens
                if (quantity <= 4) {
                    if (tokensCount > 4) {
                        // Remove text token inside
                        _getTokensElements().remove();
                    } else if (tokensCount > quantity) {
                        // Dot Tokens should be removed
                        // _drawDotTokens will only adust position
                        var tokensToRemoved = tokensCount - quantity;
                        var tokensList = _getTokensElements();
                        while (tokensToRemoved-- > 0) {
                            tokensList[tokensToRemoved].remove();
                        }
                    }
                    // Draw dot token
                    _drawDotTokens(quantity);
                } else {
                    if (tokensCount > 0 && tokensCount <= 4) {
                        // Remove dot tokens inside
                        _getTokensElements()
                            .forEach(function(token) {
                                token.remove();
                            });
                    } else if (tokensCount >= 5) {
                        // Remove text token inside
                        _getTokensElements().remove();
                    }
                    _drawNumberToken(quantity);
                }
            }

            /**
             * Create the SVG dot elements for the tokens if its less or equal than 4
             **/
            function _drawDotTokens(quantity) {
                var tokensCount = _countTokenElements();

                // Draw more dots if needed
                for (var i = quantity - tokensCount; i > 0; i--) {
                    place.parent()
                        .circle(10)
                        .addClass('token-dot')
                        .fill('#000')
                        .cx(place.cx())
                        .cy(place.cy());
                }

                // Filter the tokens elements only
                var tokenElements = place.parent()
                    .children().filter(function(child, i) {
                        return i && child.type == 'circle';
                    });

                // Adjust token element position
                tokenElements.forEach(function(token, i) {
                    var position = _getTokenPosition(token, place, i, quantity);
                    token
                        .animate(100)
                        .cx(position.cx)
                        .cy(position.cy);
                });
            }

            /**
             * Create the SVG's elements for the number of tokens if its more than 4
             **/
            function _drawNumberToken(number) {
                place.parent()
                    .text(number + "")
                    .attr({
                        'font-weight': 600,
                        'font-size': 20
                    }).
                style('user-select', 'none')
                    .addClass('token-number')
                    .cx(place.cx())
                    .cy(place.cy());
            }

            /**
             * Count the quantity of tokens elements inside the place
             **/
            function _countTokenElements() {
                var tokenElements = _getTokensElements();
                var tokensCount;
                if (tokenElements) {
                    tokensCount = (tokenElements.length > 0) ? tokenElements.length : 0
                    return tokensCount || tokenElements.text() - 0;
                } else
                    return 0;
            }

            /**
             * Return the tokens elements
             **/
            function _getTokensElements() {
                var tokensDot = place.parent().select('.token-dot').members;
                var tokentext = place.parent().select('.token-number').members['0'];

                if (tokensDot.length > 0) {
                    return tokensDot;
                } else {
                    return tokentext;
                }
            }

            /**
             * Compute the positions to organize the dot tokens inside the element
             **/
            function _getTokenPosition(token, place, index, total) {
                var position;
                var margin = 2;

                switch (total) {
                    case 1:
                        position = {
                            cx: place.cx(),
                            cy: place.cy()
                        };
                        break;
                    case 2:
                        if (index == 0) {
                            position = {
                                cx: place.cx() - (token.width() / 2 + margin),
                                cy: place.cy()
                            };
                        } else if (index == 1) {
                            position = {
                                cx: place.cx() + (token.width() / 2 + margin),
                                cy: place.cy()
                            };
                        }
                        break;
                    case 3:
                        if (index == 0) {
                            position = {
                                cx: place.cx(),
                                cy: place.cy() - (token.height() / 2 + margin)
                            };
                        } else if (index == 1) {
                            position = {
                                cx: place.cx() - (token.width() / 2 + margin),
                                cy: place.cy() + (token.height() / 2 + margin)
                            };
                        } else if (index == 2) {
                            position = {
                                cx: place.cx() + (token.width() / 2 + margin),
                                cy: place.cy() + (token.height() / 2 + margin)
                            };
                        }
                        break;
                    case 4:
                        if (index == 0) {
                            position = {
                                cx: place.cx() - (token.width() / 2 + margin),
                                cy: place.cy() - (token.height() / 2 + margin)
                            };
                        } else if (index == 1) {
                            position = {
                                cx: place.cx() + (token.width() / 2 + margin),
                                cy: place.cy() - (token.height() / 2 + margin)
                            };
                        } else if (index == 2) {
                            position = {
                                cx: place.cx() - (token.width() / 2 + margin),
                                cy: place.cy() + (token.height() / 2 + margin)
                            };
                        } else if (index == 3) {
                            position = {
                                cx: place.cx() + (token.width() / 2 + margin),
                                cy: place.cy() + (token.height() / 2 + margin)
                            };
                        }
                        break;
                }

                return position;
            }
        }
    }

    angular.module('petriNet.common').factory('placeFactory', placeFactory);
})();
