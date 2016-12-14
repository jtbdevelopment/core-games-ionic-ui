'use strict';

describe('Service: jtbIonicGameActions', function () {

    beforeEach(module('coreGamesIonicUi.services'));

    var game = {
            id: 'theGameId',
            updated: 0,
            gamePhase: 'SomePhase'
        },
        updatedGame = {
            id: 'theGameId',
            updated: 1,
            gamePhase: 'APhase'
        };

    var playerBaseURL = 'http:/xx.com/y';
    var gameURL = playerBaseURL + '/game/' + game.id + '/';

    var $ionicActionSheet, $q, $state, gameCache, actionSheetShowParams, $ionicActionSheetInstance;
    var $ionicLoading, ionicPopupParams, popupPromise;
    var adPromise, adHandler = {
        showInterstitial: function () {
            adPromise = $q.defer();
            return adPromise.promise;
        }
    };
    beforeEach(module(function ($provide) {
        actionSheetShowParams = undefined;
        ionicPopupParams = undefined;
        popupPromise = undefined;
        $provide.factory('jtbLiveGameFeed', function () {
            return {}
        });
        $provide.factory('$ionicPopup', function () {
            return {
                alert: function (params) {
                    popupPromise = $q.defer();
                    ionicPopupParams = params;
                    return popupPromise.promise;
                }
            };
        });

        $ionicLoading = {
            show: jasmine.createSpy('show'),
            hide: jasmine.createSpy('hide')
        };
        $provide.factory('$ionicLoading', function () {
            return $ionicLoading;
        });
        $state = {go: jasmine.createSpy()};
        adPromise = undefined;
        $provide.factory('jtbIonicAds', function () {
            return adHandler;
        });
        $provide.factory('$state', function () {
            return $state;
        });
        $ionicActionSheetInstance = {
            close: jasmine.createSpy(),
            dismiss: jasmine.createSpy()
        };
        actionSheetShowParams = undefined;
        $ionicActionSheet = {
            show: function (params) {
                actionSheetShowParams = params;
            }
        };
        $provide.factory('$ionicActionSheet', function () {
            return $ionicActionSheet;
        });

        gameCache = {
            getGameForID: function (id) {
                if (id === game.id) {
                    return game;
                }
                return undefined;
            },
            putUpdatedGame: jasmine.createSpy()
        };
        $provide.factory('jtbGameCache', function () {
            return gameCache;
        });
        $provide.factory('jtbPlayerService', function () {
            return {
                currentPlayerBaseURL: function () {
                    return playerBaseURL;
                }
            };
        });
    }));

    var service, $http, confirmMessage, errorMessage;

    beforeEach(inject(function ($httpBackend, _$q_, $injector) {
        $http = $httpBackend;
        $q = _$q_;
        confirmMessage = undefined;
        errorMessage = undefined;
        updatedGame.gamePhase = 'ResetPhase';
        service = $injector.get('jtbIonicGameActions');
    }));


    function testStandardActionSheet() {
        expect(actionSheetShowParams.buttons).toEqual([]);
        expect(actionSheetShowParams.destructiveText).toEqual(confirmMessage);
        expect(actionSheetShowParams.titleText).toEqual('Are you sure?');
        expect(actionSheetShowParams.cancelText).toEqual('Cancel');
        expect(actionSheetShowParams.cancel).toBeDefined();
        expect(actionSheetShowParams.destructiveButtonClicked).toBeDefined();
    }

    function testStandardErrorPopup() {
        expect(ionicPopupParams.template).toEqual(errorMessage);
        expect(ionicPopupParams.title).toEqual('Problem making move!');
        expect(popupPromise).toBeDefined();
    }

    it('test get game url', function () {
        expect(service.getGameURL(game)).toEqual(gameURL);
    });

    describe('standard functions and dialogs without errors', function () {
        var stateChange;
        beforeEach(function () {
            stateChange = undefined;
        });

        afterEach(function () {
            $http.flush();
            expect(gameCache.putUpdatedGame).toHaveBeenCalledWith(updatedGame);
            if (angular.isDefined(stateChange)) {
                expect($state.go).toHaveBeenCalledWith(stateChange, {gameID: game.id});
            } else {
                expect($state.go).not.toHaveBeenCalled();
            }
            expect($ionicLoading.show).toHaveBeenCalledWith({
                template: 'Sending...'
            });
            expect($ionicLoading.hide).toHaveBeenCalled();
        });

        it('test rematch works', function () {
            updatedGame.gamePhase = 'AnotherPhase';
            stateChange = 'app.' + updatedGame.gamePhase.toLowerCase();
            $http.expectPUT(gameURL + 'rematch').respond(updatedGame);
            service.rematch(game);
            expect(adPromise).toBeDefined();
            adPromise.resolve();
        });

        it('test rematch works custom adHandler', function () {
            updatedGame.gamePhase = 'AnotherPhase';
            stateChange = 'app.' + updatedGame.gamePhase.toLowerCase();
            $http.expectPUT(gameURL + 'rematch').respond(updatedGame);
            var p = $q.defer();
            service.rematch(game, function () {
                return p.promise;
            });
            expect(adPromise).toBeUndefined();
            p.resolve();
        });

        it('test new works', function () {
            updatedGame.gamePhase = 'NewPhase';
            stateChange = 'app.' + updatedGame.gamePhase.toLowerCase();
            var options = {
                option1: true,
                flags: [true, false]
            };
            $http.expectPOST(playerBaseURL + '/new', options).respond(updatedGame);
            service.new(options);
            expect(adPromise).toBeDefined();
            adPromise.resolve();
        });

        it('test new works with custom ad', function () {
            updatedGame.gamePhase = 'NewPhase';
            stateChange = 'app.' + updatedGame.gamePhase.toLowerCase();
            var options = {
                option1: true,
                flags: [true, false]
            };
            $http.expectPOST(playerBaseURL + '/new', options).respond(updatedGame);
            var p = $q.defer();
            service.new(options, function () {
                return p.promise;
            });
            expect(adPromise).toBeUndefined();
            p.resolve();
        });

        it('test accept works', function () {
            $http.expectPUT(gameURL + 'accept').respond(updatedGame);
            service.accept(game);
            expect(adPromise).toBeDefined();
            adPromise.resolve();
        });

        it('test accept works with custom ad handler', function () {
            $http.expectPUT(gameURL + 'accept').respond(updatedGame);
            var p = $q.defer();
            service.accept(game, function () {
                return p.promise;
            });
            expect(adPromise).toBeUndefined();
            p.resolve();
        });

        describe('with positive confirm using standard confirm dialog', function () {
            afterEach(function () {
                actionSheetShowParams.destructiveButtonClicked();
            });

            it('test quit works', function () {
                confirmMessage = 'Quit this game!';
                service.quit(game);
                testStandardActionSheet();
                $http.expectPUT(gameURL + 'quit').respond(updatedGame);
            });

            it('test reject works', function () {
                confirmMessage = 'Reject this game!';
                service.reject(game);
                testStandardActionSheet();
                $http.expectPUT(gameURL + 'reject').respond(updatedGame);
            });

            it('test decline rematch works', function () {
                confirmMessage = 'Decline further rematches.';
                service.declineRematch(game);
                testStandardActionSheet();
                $http.expectPUT(gameURL + 'endRematch').respond(updatedGame);
            });
        });
    });

    describe('standard confirmable actions with negative confirm using standard confirm dialog', function () {
        afterEach(function () {
            actionSheetShowParams.cancel();
            expect($ionicLoading.show).not.toHaveBeenCalled();
            expect($ionicLoading.hide).not.toHaveBeenCalled();
        });

        it('test quit not sent on', function () {
            confirmMessage = 'Quit this game!';
            service.quit(game);
            testStandardActionSheet();
        });

        it('test reject not sent on', function () {
            confirmMessage = 'Reject this game!';
            service.reject(game);
            testStandardActionSheet();
        });

        it('test decline rematch not sent on', function () {
            confirmMessage = 'Decline further rematches.';
            service.declineRematch(game);
            testStandardActionSheet();
        });
    });

    it('test an error using standard dialog', function () {
        errorMessage = 'bad thing';
        $http.expectPUT(gameURL + 'accept').respond(401, errorMessage);
        service.accept(game);
        expect(adPromise).toBeDefined();
        adPromise.resolve();
        $http.flush();
        expect($ionicLoading.show).toHaveBeenCalled();
        expect($ionicLoading.hide).toHaveBeenCalled();
        testStandardErrorPopup();
    });

    it('test an error using custom handler', function () {
        errorMessage = 'bad thing';
        var handler = function(message, promise) {
            expect(message).toEqual(errorMessage);
            expect(promise).toBeDefined();
            promise.reject();
        };
        service.setErrorHandler(handler);
        expect(service.getErrorHandler()).toEqual(handler);
        $http.expectPUT(gameURL + 'accept').respond(401, errorMessage);
        service.accept(game);
        expect(adPromise).toBeDefined();
        adPromise.resolve();
        $http.flush();
        expect($ionicLoading.show).toHaveBeenCalled();
        expect($ionicLoading.hide).toHaveBeenCalled();
    });

    describe('test custom action promises', function () {
        var http, $rootScope;
        beforeEach(inject(function ($http, _$rootScope_) {
            http = $http;
            $rootScope = _$rootScope_;
        }));

        it('function wrap action with success', function () {
            var url = 'something';
            var response = {id: 'id'};
            $http.expectPUT(url).respond(response);
            var success = false;
            service.wrapActionOnGame(http.put(url)).then(function (update) {
                expect(update).toEqual(response);
                success = true;
            });
            $http.flush();
            expect(success).toBeTruthy();
        });

        it('function wrap action with failure', function () {
            var url = 'something';
            $http.expectPUT(url).respond(401);
            var failure = false;
            service.wrapActionOnGame(http.put(url)).then(function () {
            }, function () {
                failure = true;
            });
            $http.flush();
            popupPromise.resolve();
            $rootScope.$apply();
            expect(failure).toBeTruthy();
        });

        it('function wrap confirmable with accept and success', function () {
            var url = 'something';
            var response = {id: 'id'};
            $http.expectPUT(url).respond(response);
            var success = false;
            service.wrapConfirmedActionOnGame('test', function () {
                return http.put(url)
            }).then(function (update) {
                expect(update).toEqual(response);
                success = true;
            });
            actionSheetShowParams.destructiveButtonClicked();
            $http.flush();
            expect(success).toBeTruthy();
        });

        it('function wrap confirmable with accept and http failure', function () {
            var url = 'something';
            $http.expectPUT(url).respond(401);
            var failure = false;
            service.wrapConfirmedActionOnGame('test', function () {
                return http.put(url)
            }).then(
                function () {
                },
                function () {
                    failure = true;
                });
            actionSheetShowParams.destructiveButtonClicked();
            $http.flush();
            popupPromise.resolve();
            $rootScope.$apply();
            expect(failure).toBeTruthy();
        });

        it('function wrap confirmable with reject of confirm to fail', function () {
            var failure = false;
            service.wrapConfirmedActionOnGame('test', function () {
                return http.put(url)
            }).then(
                function () {
                },
                function () {
                    failure = true;
                });
            actionSheetShowParams.cancel();
            $rootScope.$apply();
            expect(failure).toBeTruthy();
        });
    });
});

