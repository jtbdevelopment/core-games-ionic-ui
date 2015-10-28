/*global PushNotification:false */
'use strict';

var WEEK_IN_MILLIS = 7 * 24 * 60 * 60 * 1000;
angular.module('coreGamesIonicUi.services').factory('jtbPushNotifications',
    ['$http', '$rootScope', '$window', 'jtbLocalStorage', 'jtbPlayerService',
        function ($http, $rootScope, $window, jtbLocalStorage, jtbPlayerService) {

            var deviceToken;

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
                    var lastRegDiff = lastReg - new Date();
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
                console.log(JSON.stringify(notification));
            }

            function handleError(error) {
                console.log('error in push ' + JSON.stringify(error));
            }

            function handleRegistration(data) {
                console.log('registration event ' + JSON.stringify(data));
                registerToken(data.registrationId);
            }

            var pushNotification, pushInstance;
            try {
                if ($window.location.href.indexOf('file:') === 0 && angular.isDefined($window.PushNotification)) {
                    pushNotification = PushNotification;
                }
            } catch (ex) {
                pushNotification = undefined;
            }

            $rootScope.$on('playerLoaded', function () {
                $http.get('/api/notifications/senderID').success(function (id) {
                    if (angular.isDefined(pushNotification) && id !== 'NOTSET') {
                        var config;
                        //  TODO
                        config = {
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
                            windows: {

                            }
                        };
                        pushInstance = pushNotification.init(config);
                        pushInstance.on('registration', handleRegistration);
                        pushInstance.on('notification', handleNotification);
                        pushInstance.on('error', handleError);
                    } else {
                        console.log('No pushNotification defined');
                    }
                }).error(function (error) {
                    console.log('Not able to get senderID ' + JSON.stringify(error));
                    //  TODO
                });
            });

            return {
                register: function () {
                }
            };
        }
    ]
);
