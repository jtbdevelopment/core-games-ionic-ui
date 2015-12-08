'use strict';

describe('Service: pushNotifications', function () {
    // load the controller's module
    beforeEach(module('coreGamesIonicUi.services'));


    var rootScope, service, http, timeout;
    // Initialize the controller and a mock scope

    var player = {
        md5: 'anmd5'
    };
    var localStorage;

    beforeEach(module(function ($provide) {
        localStorage = {};
        $provide.factory('jtbLocalStorage', function () {
            return localStorage;
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
        var expectedConfig = {};
        beforeEach(function () {
            pushInstance = {
                on: jasmine.createSpy(),
                setApplicationIconBadgeNumber: jasmine.createSpy()
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

        describe('test handlers', function () {
            var register, error, notify;
            var senderID = 'sender id!';
            beforeEach(function () {
                pushInstance = {
                    on: function (what, cb) {
                        switch (what) {
                            case 'registration':
                                register = cb;
                                break;
                            case 'notification':
                                notify = cb;
                                break;
                            case 'error':
                                error = cb;
                        }
                    },
                    setApplicationIconBadgeNumber: jasmine.createSpy()
                };
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
            });

            it('does nothing with undefined token', function () {
                register({});
                timeout.flush();
            });
            it('does nothing with blank token', function () {
                register({registrationId: ''});
                timeout.flush();
            });
            it('does nothing with OK token', function () {
                register({registrationId: 'OK'});
                timeout.flush();
            });

            it('registers first time token successfully', function () {
                var token = 'new token';
                localStorage['get'] = function (key, value) {
                    return value;
                };
                localStorage['set'] = jasmine.createSpy();
                http.expectPUT('/api/notifications/register/' + token).respond(200);
                register({registrationId: token});
                timeout.flush();
                http.flush();
                expect(localStorage['set']).toHaveBeenCalledWith('pushNotification-anmd5-token', token);
                expect(localStorage['set']).toHaveBeenCalledWith('pushNotification-anmd5-last', jasmine.any(Number));
            });

            it('registers first time token fails', function () {
                var token = 'new token';
                localStorage['get'] = function (key, value) {
                    return value;
                };
                localStorage['set'] = jasmine.createSpy();
                http.expectPUT('/api/notifications/register/' + token).respond(500);
                register({registrationId: token});
                timeout.flush();
                http.flush();
                expect(localStorage['set']).not.toHaveBeenCalledWith('pushNotification-anmd5-token', token);
                expect(localStorage['set']).not.toHaveBeenCalledWith('pushNotification-anmd5-last', jasmine.any(Number));
            });

            it('registers changed token successfully even if old one just registered', function () {
                var token = 'new token';
                var oldToken = 'old token';
                localStorage['get'] = function (key) {
                    if (key.indexOf('token') >= 0) {
                        return oldToken;
                    }
                    return new Date().getTime().toString();
                };
                localStorage['set'] = jasmine.createSpy();
                http.expectPUT('/api/notifications/register/' + token).respond(200);
                register({registrationId: token});
                timeout.flush();
                http.flush();
                expect(localStorage['set']).toHaveBeenCalledWith('pushNotification-anmd5-token', token);
                expect(localStorage['set']).toHaveBeenCalledWith('pushNotification-anmd5-last', jasmine.any(Number));
            });

            it('registers changed token successfully if one registered over a week ago', function () {
                var token = 'new token';
                localStorage['get'] = function (key) {
                    if (key.indexOf('token') >= 0) {
                        return token;
                    }
                    return new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000) - 60).getTime().toString();
                };
                localStorage['set'] = jasmine.createSpy();
                http.expectPUT('/api/notifications/register/' + token).respond(200);
                register({registrationId: token});
                timeout.flush();
                http.flush();
                expect(localStorage['set']).toHaveBeenCalledWith('pushNotification-anmd5-token', token);
                expect(localStorage['set']).toHaveBeenCalledWith('pushNotification-anmd5-last', jasmine.any(Number));
            });

            it('does not registers changed token if one registered less than a week ago', function () {
                var token = 'new token';
                localStorage['get'] = function (key) {
                    if (key.indexOf('token') >= 0) {
                        return token;
                    }
                    return new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000) + 60).getTime().toString();
                };
                localStorage['set'] = jasmine.createSpy();
                register({registrationId: token});
                timeout.flush();
                expect(localStorage['set']).not.toHaveBeenCalledWith('pushNotification-anmd5-token', token);
                expect(localStorage['set']).not.toHaveBeenCalledWith('pushNotification-anmd5-last', jasmine.any(Number));
            });

            it('error handler - does nothing for now', function() {
                error();
            });

            it('handles notification with count set', function() {
                var count = 13;
                notify({count: count});
                expect(pushInstance.setApplicationIconBadgeNumber).toHaveBeenCalledWith(jasmine.any(Function), jasmine.any(Function), count);
            });

            it('handles notification with count not set', function() {
                notify({});
                expect(pushInstance.setApplicationIconBadgeNumber).not.toHaveBeenCalledWith(jasmine.any(Function), jasmine.any(Function), jasmine.any(Number));
            });
        });
    });

    describe('without push notify plugin', function () {
        beforeEach(function() {
            window.PushNotification = undefined;
        });

        it('ignores senderId after retrieving', function () {
            var senderID = 'sender id!';
            http.expectGET('/api/notifications/senderID').respond(senderID);
            rootScope.$broadcast('playerLoaded');
            rootScope.$apply();
            http.flush();
        });
    });
});

