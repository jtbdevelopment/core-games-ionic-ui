'use strict';

angular.module('coreGamesIonicUi.controllers')
    .controller('CoreIonicNetworkCtrl',
    ['$scope', '$state', '$cordovaNetwork', '$timeout', '$window', 'ENV',
        function ($scope, $state, $cordovaNetwork, $timeout, $window, ENV) {
            function online() {
                $state.go('signin');
            }

            function checkOnline() {
                $scope.message = 'Checking network status...';
                //  Need a timeout to ensure its initialized
                if ($window.location.href.indexOf('file') === 0 && ENV.domain !== 'localhost') {
                    $timeout(function () {
                        try {
                            if ($cordovaNetwork.isOnline()) {
                                online();
                                return;
                            }
                        } catch (error) {
                            if (error.message === 'navigator.connection is undefined') {
                                //  Assume a browser and go
                                online();
                                return;
                            }
                            console.log(error);
                        }
                        $scope.message = 'Internet not currently available.';
                    }, 1000);
                } else {
                    online();
                }
            }

            $scope.$on('$cordovaNetwork:online', function () {
                online();
            });

            $scope.$on('$ionicView.enter', function () {
                checkOnline();
            });

            checkOnline();
        }
    ]
);