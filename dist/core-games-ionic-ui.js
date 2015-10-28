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
                $scope.showManual = ENV.domain === 'localhost' || ENV.apiEndpoint.indexOf('-dev') > -1;
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

            var pushInstance;

            $rootScope.$on('playerLoaded', function () {
                $http.get('/api/notifications/senderID').success(function (id) {
                    if (angular.isDefined(PushNotification) && id !== 'NOTSET') {
                        if(angular.isDefined(pushInstance)) {
                            console.log('Already registered for push');
                        } else {
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
                                windows: {}
                            };
                            pushInstance = PushNotification.init(config);
                            pushInstance.on('registration', handleRegistration);
                            pushInstance.on('notification', handleNotification);
                            pushInstance.on('error', handleError);
                            console.log('Initial registration for push completed');
                        }
                    } else {
                        console.log('No pushNotification defined or sender id not set (senderId = ' + id);
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
