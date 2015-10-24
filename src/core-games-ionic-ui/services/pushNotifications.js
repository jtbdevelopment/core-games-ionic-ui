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
                console.log('register token called with ' + JSON.stringify(token));
                if (angular.isDefined(token) && token != null && token.length > 0 && token !== 'OK') {
                    console.log('Checking..');
                    var keyBase = 'push-' + jtbPlayerService.currentPlayer().md5;
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

            function handleIOSEvent(event, notification) {
                if (angular.isDefined(notification)) {
                    if (angular.isDefined(notification.alert)) {
                        navigator.notification.alert(notification.alert);
                    }

                    if (angular.isDefined(event.sound)) {
                        //  TODO play sound
                        console.log('play sound' + JSON.stringify(event.sound));
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
                //console.log('notification event ' + JSON.stringify(event));
                console.log('notification notification ' + JSON.stringify(notification));
                if (angular.isDefined(notification) && angular.isDefined(notification.event)) {
                    handleAndroidEvent(event, notification);
                } else {
                    handleIOSEvent(event, notification);
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
                            //  TODO - review
                            config = {
                                badge: true,
                                sound: false,
                                alert: true
                            };
                        }
                        cordovaPush.register(config).then(function (token) {
                            console.log('Push Token ' + token);
                            registerToken(token);
                        }, function (error) {
                            console.log('Error registering ' + JSON.stringify(error));
                            //  TODO
                        });
                    }
                }).error(function (error) {
                    console.log('Not able to get senderID');
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
