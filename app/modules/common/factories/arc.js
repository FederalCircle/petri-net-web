(function() {
    'use strict';

    /** TODO
     * @ngdoc service
     * @name petriNet.common.factory:arcFactory
     * @description
     * description...
     **/
    arcFactory.$inject = ['$q', 'configFactory'];

    function arcFactory($q, configFactory) {
        var factory = {
            newArc: newArc
        };
        return factory;

        ///// Functions /////
        /**
         * @ngdoc method
         * @name newArc
         * @methodOf petriNet.common.factory:arcFactory
         * @param {SVG.Element} source element to be used as arc source
         * @param {SVG.Element} target element to be used as arc target
         * @returns {Object} Arc object w/ the source, target an path element
         * @description
         * Creates an arrow between two elements.
         **/
        function newArc(container, source, target, value, id) {
            var arc = _drawArc();

            // Properties
            arc.petriType = 'arc';
            arc.value = value || 1;
            arc.source = source;
            arc.target = target;
            arc.valueBox = null;
            arc.valueText = null;

            // Methods
            arc.tokenAnimation = tokenAnimation;

            _init();

            return arc;

            /////

            function _init() {
                if (arc.source.petriType === 'transition') {
                    arc.source.outputs.push(arc);
                } else {
                    arc.target.inputs.push(arc);
                }

                if (arc.value > 1) _createValueBox();

                source.parent().on('dragmove', _updateArc);
                target.parent().on('dragmove', _updateArc);
            }

            function _drawArc() {
                var linePath = _getArcPath();
                var newArcElement = container
                    .group()
                    .path(linePath)
                    .stroke('#000')
                    .attr(configFactory.get().nodeStyle.arc)
                    .addClass('arc');
                newArcElement.id(id);
                newArcElement.marker('end', 10, 6, function(add) {
                    add.path("M 0 0 L 6 3 L 0 6 z");
                });

                return newArcElement;
            }

            function _updateArc() {
                var linePath = _getArcPath();
                arc.plot(linePath);
                if (arc.valueBox) _updateValueBoxPosition();
            }

            function _getArcPath() {
                var sourceParent = source.parent();
                var targetParent = target.parent();

                var coordinates = {
                    x1: sourceParent.cx(),
                    y1: sourceParent.cy() - (sourceParent.rbox().height / 2) + (source.rbox().height / 2),
                    x2: targetParent.cx(),
                    y2: targetParent.cy() - (targetParent.rbox().height / 2) + (target.rbox().height / 2)
                };

                // Creates an temporary line to make the definitive one start and finish at the right points
                var tempPath = ["M", coordinates.x1, coordinates.y1, "L", coordinates.x2, coordinates.y2].join(' ');
                tempPath = container.path(tempPath);
                var pointStart = tempPath.pointAt((source.rbox().height / 2));
                var pointEnd = tempPath.pointAt(tempPath.length() - (source.rbox().height / 1.7));
                tempPath.remove();

                // Update the coordinates with the data extracted from the temporary line
                coordinates.x1 = pointStart.x;
                coordinates.y1 = pointStart.y;
                coordinates.x2 = pointEnd.x;
                coordinates.y2 = pointEnd.y;

                // Returns an string with the path to build the line
                return ["M", coordinates.x1, coordinates.y1, "L", coordinates.x2, coordinates.y2].join(' ');
            }

            function _createValueBox() {
                var assetsContainer = arc.parent().group();
                arc.valueBox = assetsContainer
                    .rect(20, 20)
                    .stroke('#000')
                    .fill('#fff');
                arc.valueText = assetsContainer
                    .text(arc.value + "")
                    .attr({
                        'style': 'user-select:none;'
                    });
                _updateValueBoxPosition();
            }

            function _updateValueBoxPosition() {
                var arcCenter = arc.pointAt(arc.length() / 2);
                arc.valueBox.cx(arcCenter.x).cy(arcCenter.y);
                arc.valueText.cx(arcCenter.x).cy(arcCenter.y)
            }

            function tokenAnimation() {
                var deferred = $q.defer();
                var place, directionMultiplier;
                if (arc.source.petriType === 'place') {
                    // In this case tokens are withdrawn from place
                    place = arc.source;
                    directionMultiplier = -1;
                } else {
                    // In this case tokens are deposited on place
                    place = arc.target;
                    directionMultiplier = 1;
                }

                var token = arc.parent().circle(10).opacity(0);
                var animation = token.animate(1000).during(function(pos, morph, eased) {
                    var position = arc.pointAt(eased * arc.length());
                    token.center(position.x, position.y);
                });
                animation.once(0.01, function() {
                    if (directionMultiplier === -1)
                        place.setTokens(place.getTokens() + (arc.value * directionMultiplier));
                    token.opacity(1);
                });
                animation.once(0.99, function() {
                    token.remove();
                    if (directionMultiplier === 1)
                        place.setTokens(place.getTokens() + (arc.value * directionMultiplier));
                    setTimeout(function(){deferred.resolve();},200)

                });

                return deferred.promise;
            }
        }
    }

    angular.module('petriNet.common').factory('arcFactory', arcFactory);
})();
