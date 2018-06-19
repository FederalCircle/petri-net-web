(function() {
    'use strict';

    /** TODO
     * @ngdoc service
     * @name petriNet.common.service:petriGraphicService
     * @description
     * description...
     **/
    petriGraphicService.$inject = ['petriLogicService', 'configFactory', 'placeFactory', 'svgAssetsFactory', 'transitionFactory', 'arcFactory'];
    function petriGraphicService(petriLogicService, configFactory, placeFactory, svgAssetsFactory, transitionFactory, arcFactory) {
        var service = {
            newDraw: newDraw,
            newPlace: newPlace,
            newTransition: newTransition,
            newArc: newArc,
            getElementById: getElementById,
            getElements: getElements,
            getNodes: getNodes,
            remove: remove,
            startSimulation: startSimulation,
            loadNet: loadNet,
            getNetConfig: getNetConfig
        };

        // Groups
        var _draw = {};
        var _elements = {}; // Places, transitions and arcs
        var _nodes = {}; // Only places and transitions
        var _places = {};
        var _transitions = {};
        var _arcs = {};

        return service;

        ///// Functions /////

        /**
         * @ngdoc method
         * @name newDraw
         * @methodOf petriNet.common.service:petriGraphicService
         * @param {String} element ID of the html element to insert the SVG element.
         * @param {int | string} width Width to spawn the SVG element.
         * @param {int | string} height Height to spawn the SVG element.
         * @description
         * Starts a new SVG element or resets an existing one.
         **/
        function newDraw(element, width, height) {
            if ( angular.equals(_draw, {}) ) {
                // New SVG and groups of elements
                _draw = SVG(element).size(width || '100%', height || '100%').panZoom(configFactory.get().zoom);
            } else {
                _centerView();
                _draw.zoom(1);
                _draw.clear();
                // Clean all data in logic service
                petriLogicService.reset();
            }
            _elements = _draw.group();
            _nodes = _elements.group();
            _places = _nodes.group();
            _transitions = _nodes.group();
            _arcs = _elements.group();
        }

        function _centerView() {
            if ( angular.equals(_draw, {}) ) return;
            if ( angular.isUndefined(_draw.node.attributes.viewBox) ) return;

            var viewBox = _draw.node.attributes.viewBox.value || '0 0 0 0';
            viewBox = viewBox.split(' ');
            viewBox[0] = '0';
            viewBox[1] = '0';
            viewBox = viewBox.join(' ');
            _draw.node.attributes.viewBox.value = viewBox;
        }

        /** TODO
         * @ngdoc method
         * @name methodName
         * @methodOf petriNet.common.service:petriGraphicService
         * @param {type} param description...
         * @returns {type} description...
         * @description
         * description...
         **/
        function newPlace(label, tokens, config) {
            var center = _centerPosition();
            tokens = tokens || 0;
            config = config || {};
            center.x = config.x || center.x;
            center.y = config.y || center.y;

            var placeElement = placeFactory.newPlace(_places, center.x, center.y, label, tokens, config.id);
            // Informs the logic service that a new place was created
            petriLogicService.addPlace(placeElement.node.id, {
                tokens: tokens
            });

            return placeElement;
        }

        /** TODO
         * @ngdoc method
         * @name methodName
         * @methodOf petriNet.common.service:petriGraphicService
         * @param {type} param description...
         * @returns {type} description...
         * @description
         * description...
         **/
        function newTransition(label, config) {
            var center = _centerPosition();
            config = config || {};
            center.x = config.x || center.x;
            center.y = config.y || center.y;

            var transitionElement = transitionFactory.newTransition(_transitions, center.x, center.y, label, config.id);
            // Informs the logic service that a new transition was created
            petriLogicService.addTransition(transitionElement.node.id, {});

            return transitionElement;
        }

        /**
         * @ngdoc method
         * @name _initialPosition
         * @methodOf petriNet.common.service:petriGraphicService
         * @returns {Object} Coordinates to the center of the SVG element
         * @description
         * Evaluate the coordinates to the SVG element center position
         **/
        function _centerPosition() {
            var svgViewBox = _draw.node.viewBox.baseVal;
            var svgWidth = _draw.node.width.baseVal.value;
            var svgHeight = _draw.node.height.baseVal.value;

            return {
                x: svgViewBox.x + svgWidth / 2,
                y: svgViewBox.y + svgHeight / 2
            };
        }

        function newArc(source, target, value, config) {
            source = source.parent().first();
            target = target.parent().first();
            var sourceType = source.petriType;
            var sourceId = source.node.id;
            var targetType = target.petriType;
            var targetId = target.node.id;
            config = config || {};

            if( petriLogicService.isValidArc(sourceType, targetType) ) {
                var newConn = arcFactory.newArc(_arcs, source, target, value, config.id);

                petriLogicService.addArc(newConn.node.id, {
                    sourceId: sourceId,
                    targetId: targetId,
                    value: value
                });

                return newConn;
            }
        }

        function getElementById(elementId) {
            return SVG.get(elementId);
        }

        function getElements() {
            return _elements;
        }

        function getNodes() {
            return _nodes;
        }

        function remove(element) {
            var elementId = element.node.id;
            var elementType = element.petriType;

            if(elementType == 'place' || elementType == 'transition' || elementType == 'arc') {
                element.parent().remove();

                var arcsToRemove = petriLogicService.remove(elementType, elementId);
                if (arcsToRemove.length > 0) {
                    angular.forEach(arcsToRemove, function (arcId) {
                        var arcContainer = SVG.get(arcId).parent();
                        arcContainer.remove();
                    });
                }
            }
        }

        function startSimulation() {
            var fireableTransitions = petriLogicService.startSimulation();
            angular.forEach(fireableTransitions, function (transitionId, index) {
                var transition = SVG.get(transitionId);
                transition.animateInputArcs()
                    .then(function () {
                        // When the last transition finish, triggers the outputs
                        if (index === fireableTransitions.length - 1) {
                            angular.forEach(fireableTransitions, function (transitionId) {
                                var transition = SVG.get(transitionId);
                                transition.animateOutputArcs();
                            });
                        }
                    });
            });
        }

        function loadNet(netConfig) {
            newDraw();
            angular.forEach(netConfig.places, function (place, id) {
                var placeConfig = {
                    id: id,
                    x: place.positionX,
                    y: place.positionY
                };
                newPlace(place.label, place.tokens, placeConfig);
            });
            angular.forEach(netConfig.transitions, function (transition, id) {
                var transitionConfig = {
                    id: id,
                    x: transition.positionX,
                    y: transition.positionY
                };
                newTransition(transition.label, transitionConfig);
            });
            angular.forEach(netConfig.arcs, function (arc, id) {
                var arcConfig = {
                    id: id
                };
                var source = getElementById(arc.sourceId);
                var target = getElementById(arc.targetId);
                newArc(source, target, arc.value, arcConfig);
            });
        }

        function getNetConfig() {
            var netConfig = petriLogicService.getNetConfig();
            angular.forEach(netConfig.places, function(place, id) {
                var placeElement = getElementById(id);
                place.label = placeElement.label;
                place.positionX = placeElement.parent().cx();
                place.positionY = placeElement.parent().cy();
            });
            angular.forEach(netConfig.transitions, function(transition, id) {
                var transitionElement = getElementById(id);
                transition.label = transitionElement.label;
                transition.positionX = transitionElement.parent().cx();
                transition.positionY = transitionElement.parent().cy();
            });
            return netConfig;
        }
    }

    angular.module('petriNet.common').service('petriGraphicService', petriGraphicService);
})();
