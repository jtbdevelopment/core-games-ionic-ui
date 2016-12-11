'use strict';

angular.module('coreGamesIonicUi.services').factory('jtbIonicVersionNotesService',
    ['$ionicPopup', 'jtbPlayerService',
        function ($ionicPopup, jtbPlayerService) {
            return {
                displayVersionNotesIfAppropriate: function (currentVersion, releaseNotes) {
                    if (jtbPlayerService.currentPlayer().lastVersionNotes < currentVersion) {
                        $ionicPopup.alert({
                            title: 'Welcome to version ' + currentVersion + '!',
                            template: releaseNotes
                        });
                        jtbPlayerService.updateLastVersionNotes(currentVersion);
                    }
                }
            };
        }
    ]
);