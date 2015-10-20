(function (angular) {

  // Create all modules and define dependencies to make sure they exist
  // and are loaded in the correct order to satisfy dependency injection
  // before all nested files are concatenated by Gulp

  // Config
  angular.module('coreGamesIonicUi.config', [])
      .value('coreGamesIonicUi.config', {
          debug: true
      });

  // Modules
  angular.module('coreGamesIonicUi.controllers', []);
  angular.module('coreGamesIonicUi.services', []);
  angular.module('coreGamesIonicUi',
      [
          'ionic',
          'ngCordova',
          'coreGamesUi',
          'coreGamesIonicUi.config',
          'coreGamesIonicUi.services',
          'coreGamesIonicUi.controllers'
      ]);

})(angular);

'use strict';

angular.module('coreGamesIonicUi.controllers')
    .controller('CoreIonicNetworkCtrl',
    ['$scope', '$state', '$cordovaNetwork', '$timeout', '$window', 'ENV',
        function ($scope, $state, $cordovaNetwork, $timeout, $window, ENV) {

            function online() {
                $state.go('signin');
            }

            function checkOnline() {
                $scope.message = 'Checking network status...';
                //  Need a timeout to ensure its initialized
                if ($window.location.href.indexOf('file') === 0 && ENV.domain !== 'localhost') {
                    $timeout(function () {
                        try {
                            if ($cordovaNetwork.isOnline()) {
                                online();
                                return;
                            }
                        } catch (error) {
                            if (error.message === 'navigator.connection is undefined') {
                                //  Assume a browser and go
                                online();
                                return;
                            }
                            console.log(error);
                        }
                        $scope.message = 'Internet not currently available.';
                    }, 1000);
                } else {
                    online();
                }
            }

            $scope.$on('$cordovaNetwork:online', function () {
                online();
            });

            $scope.$on('$ionicView.enter', function () {
                checkOnline();
            });

            checkOnline();
        }
    ]
);
'use strict';

//  TODO - tests
angular.module('coreGamesIonicUi.controllers')
    .controller('CoreIonicSignedInCtrl',
    ['$scope', '$state', '$rootScope', '$cacheFactory',
        function ($scope, $state, $rootScope, $cacheFactory) {

            function clearHttpCache() {
                $cacheFactory.get('$http').removeAll();
            }

            function onSuccessfulLogin() {
                console.log('Logged in');
                clearHttpCache();
                $rootScope.$broadcast('login');
                $state.go('app.games');
            }

            $scope.$on('$ionicView.enter', function () {
                onSuccessfulLogin();
            });

        }
    ]
);
'use strict';

//  TODO - tests
angular.module('coreGamesIonicUi.controllers')
    .controller('CoreIonicSignInCtrl',
    ['$scope', '$window', '$http', '$state', '$cacheFactory', 'jtbFacebook', 'ENV', '$ionicLoading',
        function ($scope, $window, $http, $state, $cacheFactory, jtbFacebook, ENV, $ionicLoading) {
            //  TODO - Make this a popup on error I think
            $scope.message = '';
            $scope.showFacebook = false;
            $scope.showManual = false;

            $scope.manualForm = {
                username: '',
                password: '',
                rememberme: false
            };

            function clearHttpCache() {
                $cacheFactory.get('$http').removeAll();
            }

            function onSuccessfulLogin() {
                $ionicLoading.hide();
                $state.go('signedin');
            }

            function onFailedLogin() {
                $ionicLoading.hide();
                console.log('Login failed');
                clearHttpCache();
                $scope.message = 'Invalid username or password.';
            }

            $scope.manualLogin = function () {
                $ionicLoading.show({
                    template: 'Sending...'
                });
                clearHttpCache();
                $http({
                    transformRequest: function (obj) {
                        var str = [];
                        for (var p in obj) {
                            if (obj.hasOwnProperty(p)) {
                                str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
                            }
                        }
                        return str.join('&');
                    },
                    url: '/signin/authenticate',
                    data: {
                        username: $scope.manualForm.username,
                        password: $scope.manualForm.password,
                        'remember-me': $scope.manualForm.rememberme
                    },
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    method: 'POST'
                }).success(onSuccessfulLogin).error(onFailedLogin);
            };

            function showLoginOptions() {
                $scope.showFacebook = true;
                $scope.showManual = ENV.domain === 'localhost' || ENV.domain.href.indexOf('-dev') > -1;
                $scope.message = '';
            }

            function autoLogin() {
                $scope.showFacebook = false;
                $scope.showManual = false;
                $scope.message = 'Logging in via Facebook';
                clearHttpCache();
                if ($window.location.href.indexOf('file') === 0) {
                    $http.get(ENV.apiEndpoint +
                        '/auth/facebook?code=' +
                        jtbFacebook.currentAuthorization().accessToken).
                        success(onSuccessfulLogin).
                        error(onFailedLogin);
                } else {
                    $window.location = ENV.apiEndpoint + '/auth/facebook';
                }
            }

            $scope.fbLogin = function () {
                jtbFacebook.initiateFBLogin().then(function (details) {
                    if (!details.auto) {
                        showLoginOptions();
                    } else {
                        autoLogin();
                    }
                }, function () {
                    showLoginOptions();
                });
            };

            $scope.$on('$ionicView.enter', function () {
                jtbFacebook.canAutoSignIn().then(function (details) {
                    clearHttpCache();
                    if (!details.auto) {
                        showLoginOptions();
                    } else {
                        autoLogin();
                    }
                }, function () {
                    showLoginOptions();
                });
            });
        }
    ]
);

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
                switch (event.event) {
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
                if (angular.isDefined(event.event)) {
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
                            if (angular.isDefined(token) && token.length > 0) {
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

