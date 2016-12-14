'use strict';

/**
 * Error Handling
 * --------------
 * To change look of dialog - override path to template with setErrorDialogHTMLTemplate
 * OR
 * override error handler with setErrorHandler which takes 1 param with error message
 *
 * Actions Requiring Confirmation
 * ------------------------------
 * To change look of dialog - override path to template with setConfirmDialogHTMLTemplate
 *
 * Game Specific Actions
 * ---------------------
 * You can use wrapActionOnGame and wrapConfirmedActionOnGame to create standard handlers for game calls,
 * cache interaction and error handling
 */
angular.module('coreGamesIonicUi.services').factory('jtbIonicGameActions',
    ['$http', '$q', '$state', '$ionicPopup', '$ionicActionSheet', 'jtbGameCache',
        'jtbPlayerService', '$ionicLoading', 'jtbIonicAds',
        function ($http, $q, $state, $ionicPopup, $ionicActionSheet, jtbGameCache,
                  jtbPlayerService, $ionicLoading, jtbIonicAds) {

            function defaultErrorCallback(errorMessage, promise) {
                $ionicPopup.alert({
                    title: 'Problem making move!',
                    template: errorMessage
                }).then(function () {
                    promise.reject();
                });
            }

            var errorHandler = defaultErrorCallback;

            //  TODO - ads in ionic
            var defaultAdHandler = jtbIonicAds.showInterstitial;

            function gameURL(game) {
                return jtbPlayerService.currentPlayerBaseURL() + '/game/' + game.id + '/';
            }

            function showSending() {
                $ionicLoading.show({
                    template: 'Sending...'
                });
            }

            function hideSending() {
                $ionicLoading.hide();
            }

            function generalizeTakeActionPromiseHandler(httpPromise) {
                var promise = $q.defer();
                showSending();
                httpPromise.then(
                    function (response) {
                        var updatedGame = response.data;
                        hideSending();
                        jtbGameCache.putUpdatedGame(updatedGame);
                        promise.resolve(updatedGame);
                    },
                    function (response) {
                        console.error(response.data + '/' + response.status);
                        hideSending();
                        errorHandler(response.data, promise);
                    }
                );
                return promise.promise;
            }

            function generalizedConfirmedTakeHttpAction(confirmMessage, httpActionCB) {
                var promise = $q.defer();
                $ionicActionSheet.show({
                    buttons: [],
                    destructiveText: confirmMessage,
                    titleText: 'Are you sure?',
                    cancelText: 'Cancel',
                    cancel: function() {
                        promise.reject();
                    },
                    destructiveButtonClicked: function () {
                        generalizeTakeActionPromiseHandler(httpActionCB()).then(function (updatedGame) {
                            promise.resolve(updatedGame);
                        }, function () {
                            promise.reject();
                        });
                    }
                });

                return promise.promise;
            }


            function standardHttpAction(game, action) {
                return $http.put(gameURL(game) + action);
            }

            function generateAd(adHandler) {
                if (angular.isUndefined(adHandler)) {
                    adHandler = defaultAdHandler;
                }
                return adHandler();
            }

            var service = {
                //  Override error handler
                getErrorHandler: function () {
                    return errorHandler;
                },

                setErrorHandler: function (cb) {
                    errorHandler = cb;
                },


                //  Helpers for defining game specific actions
                getGameURL: function (game) {
                    return gameURL(game);
                },
                wrapActionOnGame: function (httpActionCB) {
                    return generalizeTakeActionPromiseHandler(httpActionCB);
                },
                wrapConfirmedActionOnGame: function (confirmMessage, httpActionCB) {
                    return generalizedConfirmedTakeHttpAction(confirmMessage, httpActionCB);
                },

                //  Standard actions

                //  adHandler will default if undefined
                new: function (options, adHandler) {
                    generateAd(adHandler).then(function () {
                        service.wrapActionOnGame($http.post(
                            jtbPlayerService.currentPlayerBaseURL() + '/new',
                            options)).then(
                            function (game) {
                                $state.go('app.' + game.gamePhase.toLowerCase(), {gameID: game.id});
                            }
                        );
                    });
                },

                //  adHandler will default if undefined
                accept: function (game, adHandler) {
                    generateAd(adHandler).then(function () {
                        service.wrapActionOnGame(standardHttpAction(game, 'accept'));
                    });
                },

                reject: function (game) {
                    service.wrapConfirmedActionOnGame('Reject this game!', function () {
                        return standardHttpAction(game, 'reject');
                    });
                },

                declineRematch: function (game) {
                    service.wrapConfirmedActionOnGame('Decline further rematches.', function () {
                        return standardHttpAction(game, 'endRematch');
                    });
                },

                //  adHandler will default if undefined
                rematch: function (game, adHandler) {
                    generateAd(adHandler).then(function () {
                        service.wrapActionOnGame(standardHttpAction(game, 'rematch')).then(function (game) {
                            $state.go('app.' + game.gamePhase.toLowerCase(), {gameID: game.id});
                        });
                    });
                },

                quit: function (game) {
                    service.wrapConfirmedActionOnGame('Quit this game!', function () {
                        return standardHttpAction(game, 'quit');
                    });
                }
            };
            return service;
        }
    ]
);


