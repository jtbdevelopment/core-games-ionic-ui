'use strict';

angular.module('coreGamesIonicUi.services').factory('jtbPushNotifications',
    ['$http', '$injector', '$rootScope', '$window', 'jtbLocalStorage', 'jtbPlayerService',
        function ($http, $injector, $rootScope, $window, jtbLocalStorage, jtbPlayerService) {
            var WEEK_IN_MILLIS = 7 * 24 * 60 * 60 * 1000;
            var cordovaPush;
            var cordovaDevice;
            try {
                if ($window.location.href.indexOf('file:') === 0) {
                    cordovaPush = $injector.get('$cordovaPush');
                    cordovaDevice = $injector.get('$cordovaDevice');
                }
            } catch (ex) {
                cordovaPush = undefined;
                cordovaDevice = undefined;
            }

            var deviceToken;

            function registerToken(token) {
                if (angular.isDefined(token) && token != null && token.length > 0) {
                    var keyBase = 'push-' + jtbPlayerService.currentPlayer().md5;
                    var keyToken = keyBase + '-token';
                    var keyRegistered = keyBase + '-last';
                    var lastToken = jtbLocalStorage.get(keyToken, '');
                    var lastReg = new Date(parseInt(jtbLocalStorage.get(keyRegistered, '0'))) - new Date();
                    if (lastReg > WEEK_IN_MILLIS || token !== lastToken) {
                        $http.put('/api/notifications/register/' + token).success(function () {
                            jtbLocalStorage.set(keyToken, token);
                            jtbLocalStorage.set(keyRegistered, new Date().getMilliseconds());
                            deviceToken = token;
                            console.log('registered device');
                        }).error(function (error) {
                            console.error('failed to register device ' + JSON.stringify(error));
                            //  TODO
                        });
                    }
                }
            }

            function handleAndroidEvent(event, notification) {
                switch (notification.event) {
                    case 'registered':
                        if (notification.regid.length > 0) {
                            console.log('registered cb ' + notification.regid);
                            registerToken(notification.regid);
                        } else {
                            console.error('bad registered cb ' + JSON.stringify(notification));
                        }
                        break;
                    case 'message':
                        console.log('Received push message ' + JSON.stringify(notification));
                        break;
                    case 'error':
                        console.error('Received error message ' + JSON.stringify(notification));
                        break;
                    default:
                        console.error('Received unknown message ' + JSON.stringify(notification));
                        break;
                }
            }

            function handleIOSEvent(notification) {
                if (angular.isDefined(notification)) {
                    if (angular.isDefined(notification.alert)) {
                        navigator.notification.alert(notification.alert);
                    }

                    if (angular.isDefined(notification.sound)) {
                        //  TODO play sound
                        console.log('play sound');
                    }

                    if (angular.isDefined(notification.badge)) {
                        cordovaPush.setBadgeNumber(notification.badge).then(function (result) {
                            // Success!
                        }, function (err) {
                            //  TODO
                        });
                    }
                }
            }

            $rootScope.$on('$cordovaPush:notificationReceived', function (event, notification) {
                console.log('notification notification ' + JSON.stringify(notification));
                if (angular.isDefined(notification) && angular.isDefined(notification.event)) {
                    handleAndroidEvent(event, notification);
                } else {
                    handleIOSEvent(notification);
                }
            });

            $rootScope.$on('playerLoaded', function () {
                $http.get('/api/notifications/senderID').success(function (id) {
                    if (angular.isDefined(cordovaPush) && angular.isDefined(cordovaDevice)) {
                        var config;
                        var platform = cordovaDevice.getPlatform();
                        if (platform === 'android' ||
                            platform === 'Android' ||
                            platform === 'amazon-fireos') {
                            config = {
                                senderID: id
                            };
                        } else {
                            //  TODO
                            config = {
                                badge: true,
                                sound: false,
                                alert: true
                            };
                        }
                        cordovaPush.register(config).then(function (token) {
                            if (angular.isDefined(token) && token.length > 0 && token !== 'OK') {
                                console.log('Push Token ' + token);
                                registerToken(token);
                            }
                        }, function (error) {
                            //  TODO
                        });
                    }
                }).error(function (error) {
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

