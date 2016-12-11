'use strict';

angular.module('coreGamesIonicUi.services').run(
    ['$rootScope', '$state', '$ionicLoading', '$ionicPopup',
        function ($rootScope, $state, $ionicLoading, $ionicPopup) {
            function showErrorAndReconnect() {
                $ionicLoading.hide();
                $ionicPopup.alert({
                    title: 'There was a problem!',
                    template: 'Going to reconnect!'
                });
                $state.go('network');
            }

            $rootScope.$on('InvalidSession', function () {
                if ($state.$current.name !== 'signin') {
                    showErrorAndReconnect();
                } else {
                    $ionicLoading.hide();
                }
            });
            $rootScope.$on('GeneralError', function () {
                showErrorAndReconnect();
            });

            $rootScope.$on('$cordovaNetwork:offline', function() {
                  showErrorAndReconnect();
            });
        }
    ]
);