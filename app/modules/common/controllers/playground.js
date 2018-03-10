(function() {
    'use strict';

    /** TODO
     * @ngdoc controller
     * @name petriNet.common.controller:PlaygroundController
     * @description Playground controller
     **/
    playgroundController.$inject = ['$scope', '$timeout', 'petriGraphicService', 'settings'];
    function playgroundController($scope, $timeout, petriGraphicService, settings) {
        var vm = this;

        vm.addPlace = addPlace;
        vm.addTransition = addTransition;
        vm.addArc = addArc;
        vm.remove = remove;
        vm.clear = clear;

        vm.backgroundText = 'PetriNet Playground';
        vm.activeTool = {};

        var _arcSource = null;
        var _arcTarget = null

        _init();

        ///// Functions /////
        function _init() {
            petriGraphicService.newDraw('Paper');
            if (settings.enviroment === 'PRD') {
                _mock();
            }
        }

        function _mock() {
            $timeout(function () {
                var p1 = petriGraphicService.newPlace('P1', 3);
                var p2 = petriGraphicService.newPlace('P2');
                var t1 = petriGraphicService.newTransition('T1');

                p1.parent().cx(p1.parent().x() - 130);
                p2.parent().cx(p2.parent().x() + 130);

                petriGraphicService.newArc(p1, t1);
                petriGraphicService.newArc(t1, p2);
            }, 100);
        }

        /** TODO
         * @ngdoc method
         * @name methodName
         * @methodOf petriNet.common.controller:PlaygroundController
         * @param {type} param description...
         * @returns {type} description...
         * @description
         * description...
         **/
        function addPlace() {
            var label = window.prompt('Place label (Leave it blank for no label)');
            if( label !== null) {
                var tokens = window.prompt('Tokens quantity', '0');
                if( tokens !== null) {
                    tokens = tokens - 0; // String to number
                    petriGraphicService.newPlace(label, tokens);
                }
            }
        }

        /** TODO
         * @ngdoc method
         * @name methodName
         * @methodOf petriNet.common.controller:PlaygroundController
         * @param {type} param description...
         * @returns {type} description...
         * @description
         * description...
         **/
        function addTransition() {
            var label = window.prompt('Transition label (Leave it blank for no label)');
            if( label !== null) {
                petriGraphicService.newTransition(label);
            }
        }

        /** TODO
         * @ngdoc method
         * @name methodName
         * @methodOf petriNet.common.controller:PlaygroundController
         * @param {type} param description...
         * @returns {type} description...
         * @description
         * description...
         **/
        function addArc() {
            if (vm.activeTool.type === '') {
                var nodes = petriGraphicService.getNodes();
                vm.activeTool.type = 'arc';
                vm.activeTool.message = 'Select the SOURCE element';
                nodes.click(function (event) {
                    if(!_arcSource) {
                        _arcSource = petriGraphicService.getElementById(event.target.id);
                        vm.activeTool.message = 'Select the TARGET element';
                    } else {
                        _arcTarget = petriGraphicService.getElementById(event.target.id);
                        petriGraphicService.newArc(_arcSource, _arcTarget);
                        _resetTools();
                    }
                    $scope.$digest();
                });
            } else {
                _resetTools()
            }
        }

        /** TODO
         * @ngdoc method
         * @name methodName
         * @methodOf petriNet.common.controller:PlaygroundController
         * @param {type} param description...
         * @returns {type} description...
         * @description
         * description...
         **/
        function remove() {
            if (vm.activeTool.type === '') {
                var elements = petriGraphicService.getElements();
                vm.activeTool.type = 'remove';
                vm.activeTool.message = 'Click to REMOVE an element';
                elements.click(function (event) {
                    var element = petriGraphicService.getElementById(event.target.id);
                    petriGraphicService.remove(element);
                    _resetTools()
                    $scope.$digest();
                });
            } else {
                _resetTools()
            }
        }

        function _resetTools() {
            var elements = petriGraphicService.getElements();
            vm.activeTool.type = '';
            vm.activeTool.message = '';
            _arcSource = null;
            _arcTarget = null;
            elements.off('click');
        }

        /** TODO
         * @ngdoc method
         * @name methodName
         * @methodOf petriNet.common.controller:PlaygroundController
         * @param {type} param description...
         * @returns {type} description...
         * @description
         * description...
         **/
        function clear() {
            petriGraphicService.newDraw('Paper');
        }
    }

    angular.module('petriNet.common').controller('PlaygroundController', playgroundController);
})();
