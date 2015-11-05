'use strict';

describe('Service: pushNotifications', function () {
    // load the controller's module
    beforeEach(module('coreGamesIonicUi.services'));


    var rootScope, service, http, timeout;
    // Initialize the controller and a mock scope

    var player = {
        md5: 'anmd5'
    };
    beforeEach(module(function ($provide) {
        $provide.factory('jtbLocalStorage', function () {
            return {};
        });
        $provide.factory('jtbPlayerService', function () {
            return {
                currentPlayer: function () {
                    return player;
                }
            };
        });
    }));

    beforeEach(inject(function ($injector, $rootScope, $httpBackend, $timeout) {
        rootScope = $rootScope;
        http = $httpBackend;
        timeout = $timeout;
        service = $injector.get('jtbPushNotifications');
    }));

    describe('with push notify plugin', function () {
        var push, pushInstance;
        var localStorage, playerService;
        var expectedConfig = {};
        beforeEach(function () {
            pushInstance = {
                on: jasmine.createSpy()
            };
            push = {
                init: function (config) {
                    expect(config).toEqual(expectedConfig);
                    return pushInstance;
                }
            };
            window.PushNotification = push;
        });

        it('does nothing if senderID is not able to be retrieved', function () {
            http.expectGET('/api/notifications/senderID').respond(400, {stuff: 'struff'});
            rootScope.$broadcast('playerLoaded');
            rootScope.$apply();
            http.flush();
        });

        it('does nothing if senderID is retrieved as NOTSET', function () {
            http.expectGET('/api/notifications/senderID').respond('NOTSET');
            rootScope.$broadcast('playerLoaded');
            rootScope.$apply();
            http.flush();
        });

        it('multiple retrieves, single request ', function () {
            http.expectGET('/api/notifications/senderID').respond('NOTSET');
            rootScope.$broadcast('playerLoaded');
            rootScope.$apply();
            http.flush();
            rootScope.$broadcast('playerLoaded');
            rootScope.$apply();
        });

        it('initializes and registers with id', function () {
            var senderID = 'sender id!';
            expectedConfig = {
                android: {
                    senderID: senderID,
                    sound: false,
                    vibrate: true
                },
                ios: {
                    senderID: senderID,
                    alert: true,
                    badge: true,
                    sound: false,
                    clearBadge: true
                },
                windows: {}
            };

            http.expectGET('/api/notifications/senderID').respond(senderID);
            rootScope.$broadcast('playerLoaded');
            rootScope.$apply();
            http.flush();
            expect(pushInstance.on).toHaveBeenCalledWith('registration', jasmine.any(Function));
            expect(pushInstance.on).toHaveBeenCalledWith('error', jasmine.any(Function));
            expect(pushInstance.on).toHaveBeenCalledWith('notification', jasmine.any(Function));
        });

        it('only initializes once', function () {
            var senderID = 'sender id!';
            expectedConfig = {
                android: {
                    senderID: senderID,
                    sound: false,
                    vibrate: true
                },
                ios: {
                    senderID: senderID,
                    alert: true,
                    badge: true,
                    sound: false,
                    clearBadge: true
                },
                windows: {}
            };

            http.expectGET('/api/notifications/senderID').respond(senderID);
            rootScope.$broadcast('playerLoaded');
            rootScope.$apply();
            http.flush();
            expect(pushInstance.on).toHaveBeenCalledWith('registration', jasmine.any(Function));
            expect(pushInstance.on).toHaveBeenCalledWith('error', jasmine.any(Function));
            expect(pushInstance.on).toHaveBeenCalledWith('notification', jasmine.any(Function));

            pushInstance.on.reset();
            push = {};
            rootScope.$broadcast('playerLoaded');
            rootScope.$apply();
            expect(pushInstance.on).not.toHaveBeenCalledWith('registration', jasmine.any(Function));
            expect(pushInstance.on).not.toHaveBeenCalledWith('error', jasmine.any(Function));
            expect(pushInstance.on).not.toHaveBeenCalledWith('notification', jasmine.any(Function));
        });
    });

    describe('without push notify plugin', function () {

    });
});

