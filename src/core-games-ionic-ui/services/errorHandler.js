'use strict';

angular.module('coreGamesIonicUi.services').run(
    ['$rootScope', '$state', '$ionicLoading', '$ionicPopup',
        function ($rootScope, $state, $ionicLoading, $ionicPopup) {
            function showErrorAndReconnect() {
                $ionicPopup.alert({
                    title: 'There was a problem!',
                    template: 'Going to reconnect!'
                });
                $state.go('network');
            }

            $rootScope.$on('InvalidSession', function () {
                $ionicLoading.hide();
                if ($state.$current.name !== 'signin') {
                    showErrorAndReconnect();
                }
            });
            $rootScope.$on('GeneralError', function () {
                $ionicLoading.hide();
                showErrorAndReconnect();
            });
        }
    ]
);