(function() {
    'use strict';

    /** TODO
     * @ngdoc service
     * @name petriNet.common.service:petriLogicService
     * @description
     * description...
     **/
    petriLogicService.$inject = ['$interval'];
    function petriLogicService($interval) {
        var service = {
            addPlace: addPlace,
            addTransition: addTransition,
            addArc: addArc,
            isValidArc: isValidArc,
            remove: remove,
            reset: reset,
            startSimulation: startSimulation,
            getNetConfig: getNetConfig
        };

        var _places = {};
        var _transitions = {};
        var _arcs = {};

        return service;

        ///// Functions /////
        /** TODO
         * @name methodName
         * @param {type} param description...
         * @returns {type} description...
         * @description
         * description...
         **/
        function startSimulation() {
            var fireableTransitions = [];
            var allAffectedPlaces = {};
            var concurrencyPlaces = {};
            // angular.forEach bug
            for (var transitionId in _transitions) {
                var transition = _transitions[transitionId];
                var data = _evaluateTransition(transition);
                if (data.fireable) {
                    fireableTransitions.push(transitionId);
                    // Saves the affected places in the all affected places list
                    angular.forEach(data.affectedPlaces, function (place, placeId) {
                        if ( !allAffectedPlaces[placeId] ) {
                            allAffectedPlaces[placeId] = place;
                        }
                    });
                    /** TODO
                     * Verificar na lista dos places afetados quais estão ligados
                     * a duas ou mais fireable transitions
                     **/
                }
            }
            _triggerTransitions(fireableTransitions);
            return fireableTransitions;
        }

        /**
         * @name _isFireable
         * @param {Object} transition - Transition to be evaluated
         * @returns {Boolean}
         * @description
         * Check every source of arcs that input on transition and if they
         * all have suficient tokens, returns true.
         **/
        function _isFireable(transition) {
            var fireable = true;
            angular.forEach(transition.inputs, function (arcId) {
                var arc = _arcs[arcId];
                var source = _places[arc.sourceId];
                if (source.tokens < arc.value)
                    fireable = false;
            });
            return fireable;
        };

        function _evaluateTransition(transition) {
            var data = {
                fireable: true,
                affectedPlaces: {}
            }
            angular.forEach(transition.inputs, function (arcId) {
                var arc = _arcs[arcId];
                var source = _places[arc.sourceId];
                if (source.tokens < arc.value) {
                    data.fireable = false;
                    data.affectedPlaces[sourceId] = source;
                }
            });
            return data;
        };

        function _evaluateConcurrency(affectedPlaces, allAffectedPlaces, concurrencyPlaces) {
            angular.forEach(affectedPlaces, function (place, placeId) {
                allAffectedPlaces
            });
        }

        function _triggerTransitions(fireableTransitions) {
            // Trigger all inputs, then all outputs
            angular.forEach(fireableTransitions, function (transitionId) {
                var transition = _transitions[transitionId];
                angular.forEach(transition.inputs, function (arcId) {
                    var arc = _arcs[arcId];
                    var source = _places[arc.sourceId];
                    source.tokens -= arc.value;
                });
            });
            // Outputs
            angular.forEach(fireableTransitions, function (transitionId) {
                var transition = _transitions[transitionId];
                angular.forEach(transition.outputs, function (arcId) {
                    var arc = _arcs[arcId];
                    var target = _places[arc.targetId];
                    target.tokens += arc.value;
                });
            });
        }

        /** TODO
         * @ngdoc method
         * @name methodName
         * @methodOf petriNet.common.service:petriLogicService
         * @param {type} param description...
         * @returns {type} description...
         * @description
         * description...
         **/
        function addPlace(id, data) {
            data.inputs = data.inputs || [];
            data.outputs = data.outputs || [];
            _places[id] = data;
            _log('addPlace')
        }

        /** TODO
         * @ngdoc method
         * @name methodName
         * @methodOf petriNet.common.service:petriLogicService
         * @param {type} param description...
         * @returns {type} description...
         * @description
         * description...
         **/
        function addTransition(id, data) {
            data.inputs = data.inputs || [];
            data.outputs = data.outputs || [];
            _transitions[id] = data;
            _log('addTransition')
        }

        /** TODO
         * @ngdoc method
         * @name methodName
         * @methodOf petriNet.common.service:petriLogicService
         * @param {type} param description...
         * @returns {type} description...
         * @description
         * description...
         **/
        function addArc(id, data) {
            _arcs[id] = data;
            if (_transitions[data.sourceId]) {
                _transitions[data.sourceId].outputs.push(id);
            } else {
                _transitions[data.targetId].inputs.push(id);
            }
            _log('addArc')
        }

        /** TODO
         * @ngdoc method
         * @name methodName
         * @methodOf petriNet.common.service:petriLogicService
         * @param {type} param description...
         * @returns {type} description...
         * @description
         * description...
         **/
        function isValidArc(sourceType, targetType) {
            var isValid = true;
            if (sourceType == targetType) isValid = false;
            if (sourceType == 'arc') isValid = false;
            if (targetType == 'arc') isValid = false;

            return isValid;
        }

        /** TODO
         * @ngdoc method
         * @name methodName
         * @methodOf petriNet.common.service:petriLogicService
         * @param {type} param description...
         * @returns {type} description...
         * @description
         * Remove the element from the list and if it's a node element, return
         * the id of all the arcs connected to it.
         **/
        function remove(elementType, elementId) {
            var elementList;
            var isNode;
            switch (elementType) {
                case 'place':
                    elementList = _places;
                    isNode = true;
                    break;
                case 'transition':
                    elementList = _transitions;
                    isNode = true;
                    break;
                case 'arc':
                    elementList = _arcs;
                    isNode = false;
                    break;
            }

            delete elementList[elementId];

            // If element is'n a node, theres no arc to remove
            if (isNode) {
                var arcsToRemove = [];
                angular.forEach(_arcs, function (arc, arcId) {
                    if (arc.sourceId === elementId || arc.targetId === elementId) {
                        arcsToRemove.push(arcId);
                        delete _arcs[arcId];
                        _removeArcReferences(arcId, _places);
                        _removeArcReferences(arcId, _transitions);
                    }
                });
                _log('Remove node')
                return arcsToRemove;
            } else {
                _removeArcReferences(elementId)
                _log('Remove arc')
                return [];
            }
        }

        /**
         * @name _removeArcReferences
         * @param {String} id - Id of the arc to be removed.
         * @param {Object} json - Internal petriLogicService _places or _transitions object.
         * @description
         * Searches for references to the id in the elements input and output arcs, and remove them
         **/
        function _removeArcReferences(id, json) {
            angular.forEach(json, function (element) {
                angular.forEach(element.inputs, function (arcId, index) {
                    if (arcId == id)
                        element.inputs.splice(index, 1);
                });
                angular.forEach(element.outputs, function (arcId, index) {
                    if (arcId == id)
                        element.outputs.splice(index, 1);
                });
            });
        }

        function _log(str) {
            console.log('----------'+ str +'----------');
            console.log('_places', _places);
            console.log('_transitions', _transitions);
            console.log('_arcs', _arcs);
        }

        /** TODO
         * @ngdoc method
         * @name methodName
         * @methodOf petriNet.common.service:petriLogicService
         * @param {type} param description...
         * @returns {type} description...
         * @description
         * Reset the service state
         **/
        function reset() {
            _places = {};
            _transitions = {};
            _arcs = {};
        }

        function getNetConfig() {
            return angular.copy({
                places: _places,
                transitions: _transitions,
                arcs: _arcs
            })
        }
    }

    angular.module('petriNet.common').service('petriLogicService', petriLogicService);
})();
