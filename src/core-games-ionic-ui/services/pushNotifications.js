/*global PushNotification:false */
'use strict';

var WEEK_IN_MILLIS = 7 * 24 * 60 * 60 * 1000;
angular.module('coreGamesIonicUi.services').factory('jtbPushNotifications',
    ['$http', '$rootScope', '$timeout', '$window', 'jtbLocalStorage', 'jtbPlayerService',
        function ($http, $rootScope, $timeout, $window, jtbLocalStorage, jtbPlayerService) {

            var deviceToken;
            var pushInstance;


            function registerToken(token) {
                console.log('register token called with ' + JSON.stringify(token));
                if (angular.isDefined(token) && token != null && token.length > 0 && token !== 'OK') {
                    console.log('Checking..');
                    var keyBase = 'pushNotification-' + jtbPlayerService.currentPlayer().md5;
                    var keyToken = keyBase + '-token';
                    var keyRegistered = keyBase + '-last';
                    var lastToken = jtbLocalStorage.get(keyToken, '');
                    var lastReg = new Date(parseInt(jtbLocalStorage.get(keyRegistered, '0')));
                    console.log('Last reg ' + lastReg.toLocaleString());
                    var lastRegDiff = new Date() - lastReg;
                    if (lastRegDiff > WEEK_IN_MILLIS || token !== lastToken) {
                        console.log('Registering');
                        $http.put('/api/notifications/register/' + token).success(function () {
                            jtbLocalStorage.set(keyToken, token);
                            jtbLocalStorage.set(keyRegistered, new Date().getTime());
                            deviceToken = token;
                            console.log('registered device');
                        }).error(function (error) {
                            console.error('failed to register device ' + JSON.stringify(error));
                            //  TODO
                        });
                    } else {
                        console.log('Recently registered.');
                    }
                } else {
                    console.log('Not registering');
                }
            }

            function handleNotification(notification) {
                if (angular.isDefined(notification.count) && angular.isDefined(pushInstance)) {
                    try {
                        pushInstance.setApplicationIconBadgeNumber(
                            function () {
                            },
                            function () {
                                console.log('Failed to set badge');
                            },
                            notification.count);
                    } catch (ex) {
                        //  expect failure on android
                    }
                }
            }

            function handleError(error) {
                //  TODO
            }

            function handleRegistration(data) {
                registerToken(data.registrationId);
            }

            $rootScope.$on('playerLoaded', function () {
                $http.get('/api/notifications/senderID', {cache: true}).success(function (id) {
                    if (id !== 'NOTSET') {
                        if (angular.isDefined(window.PushNotification)) {
                            if (angular.isDefined(pushInstance)) {
                                console.log('Already registered for push, skipping');
                            } else {
                                //  TODO
                                var config = {
                                    android: {
                                        senderID: id,
                                        sound: false,
                                        vibrate: true
                                    },
                                    ios: {
                                        senderID: id,
                                        alert: true,
                                        badge: true,
                                        sound: false,
                                        clearBadge: true
                                    },
                                    windows: {}
                                };
                                pushInstance = PushNotification.init(config);
                                pushInstance.on('registration', function (data) {
                                    console.log('Registration ' + JSON.stringify(data));
                                    $timeout(handleRegistration(data));
                                });
                                pushInstance.on('notification', function (data) {
                                    console.log('Notification ' + JSON.stringify(data));
                                    $timeout(handleNotification(data));
                                });
                                pushInstance.on('error', function (data) {
                                    console.log('Error ' + JSON.stringify(data));
                                    $timeout(handleError(data));
                                });
                                console.log('Initial registration for push completed');
                            }
                        } else {
                            console.log('No PushNotification defined');
                        }
                    }
                    else {
                        console.log('No sender id set (senderId = ' + id + ')');
                    }
                }).error(function (error) {
                    console.log('Not able to get senderID ' + JSON.stringify(error));
                    //  TODO
                });
            });

//  Service is automatic background
            return {};
        }
    ]
)
;
