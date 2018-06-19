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
        vm.removeElement = removeElement;
        vm.clear = clear;
        vm.startSimulation = startSimulation;
        vm.downloadNetFile = downloadNetFile;
        vm.loadNetFile = loadNetFile;

        vm.backgroundText = 'PetriNet Playground';
        vm.activeTool = {};

        var _arcSource = null;
        var _arcTarget = null

        _init();

        ///// Functions /////
        function _init() {
            petriGraphicService.newDraw('Paper');
            _initKeyBindings();
            _mock();
        }

        function startSimulation() {
            petriGraphicService.startSimulation();
        }

        function _initKeyBindings() {
            angular.element(document).keydown(function (event) {
                // 80 = p | 84 = t | 65 = a | 82 = r
                switch (event.keyCode) {
                    case 80:
                        vm.addPlace();
                        break;
                    case 84:
                        vm.addTransition();
                        break;
                    case 65:
                        vm.addArc();
                        break;
                    case 82:
                        vm.removeElement();
                        break;
                }
            });
        }

        function _mock() {
            $timeout(function () {
                var p1 = petriGraphicService.newPlace('P1', 2);
                var p2 = petriGraphicService.newPlace('P2');
                var t1 = petriGraphicService.newTransition('T1');

                p1.parent().cx(p1.parent().x() - 130);
                p2.parent().cx(p2.parent().x() + 130);

                var a1 = petriGraphicService.newArc(p1, t1);
                var a2 = petriGraphicService.newArc(t1, p2, 2);
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
            if (!vm.activeTool.type) {
                var nodes = petriGraphicService.getNodes();
                vm.activeTool.type = 'arc';
                vm.activeTool.message = 'Select the SOURCE element';
                nodes.click(function (event) {
                    if(!_arcSource) {
                        _arcSource = petriGraphicService.getElementById(event.target.id);
                        vm.activeTool.message = 'Select the TARGET element';
                    } else {
                        _arcTarget = petriGraphicService.getElementById(event.target.id);
                        if(_arcTarget.petriType != _arcSource.petriType) {
                            var value = window.prompt('Arc value', '1');
                            value = value - 0;
                            petriGraphicService.newArc(_arcSource, _arcTarget, value);
                            _resetTools();
                        }
                    }
                    $scope.$digest();
                });
                try { $scope.$digest(); } catch (e) { console.log('Digest in progress...'); }
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
        function removeElement() {
            if (!vm.activeTool.type) {
                var elements = petriGraphicService.getElements();
                vm.activeTool.type = 'remove';
                vm.activeTool.message = 'Click to REMOVE an element';
                elements.click(function (event) {
                    var element = petriGraphicService.getElementById(event.target.id);
                    petriGraphicService.remove(element);
                    _resetTools()
                    $scope.$digest();
                });
                try { $scope.$digest(); } catch (e) { console.log('Digest in progress...'); }
            } else {
                _resetTools()
            }
        }

        function _resetTools() {
            var elements = petriGraphicService.getElements();
            var nodes = petriGraphicService.getNodes();
            vm.activeTool.type = '';
            vm.activeTool.message = '';
            _arcSource = null;
            _arcTarget = null;
            elements.off('click');
            nodes.off('click');
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

        function downloadNetFile() {
            var data = petriGraphicService.getNetConfig();
            var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
            var link = document.createElement('a');
            link.setAttribute("href", dataStr);
            link.setAttribute("download", "petri-net.json");
            link.click();
        }

        function loadNetFile(file, errFiles) {
            var fr = new FileReader();
            fr.onload = function () {
                var data = JSON.parse(fr.result);
                petriGraphicService.loadNet(data);
            }
            fr.readAsText(file);
        }
    }

    angular.module('petriNet.common').controller('PlaygroundController', playgroundController);
})();
