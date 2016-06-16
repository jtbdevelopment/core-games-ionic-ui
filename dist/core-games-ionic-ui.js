(function (angular) {

    // Create all modules and define dependencies to make sure they exist
    // and are loaded in the correct order to satisfy dependency injection
    // before all nested files are concatenated by Gulp

    // Config
    angular.module('coreGamesIonicUi.config', [])
        .config(['$httpProvider', function ($httpProvider) {
            $httpProvider.defaults.withCredentials = true;
        }])
        .value('coreGamesIonicUi.config', {
            debug: true
        })
    ;

    // Modules
    angular.module('coreGamesIonicUi.controllers', []);
    angular.module('coreGamesIonicUi.services', []);
    angular.module('coreGamesIonicUi.interceptors', []);
    angular.module('coreGamesIonicUi',
        [
            'ionic',
            'ngCordova',
            'coreGamesUi',
            'coreGamesIonicUi.config',
            'coreGamesIonicUi.interceptors',
            'coreGamesIonicUi.services',
            'coreGamesIonicUi.controllers'
        ])
    ;

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

            // Not testing since only used as a dev tool
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

'use strict';

angular.module('coreGamesIonicUi.interceptors').factory('jtbApiEndpointInterceptor',
    ['$q', 'ENV',
        function ($q, ENV) {
            return {
                'request': function (config) {
                    if (
                        (
                            //  TODO - this better
                            config.url.indexOf('/api') >= 0 ||
                            config.url.indexOf('/auth') >= 0 ||
                            config.url.indexOf('/signout') >= 0 ||
                            config.url.indexOf('/livefeed') >= 0 ||
                            config.url.indexOf('/signin/authenticate') >= 0
                        ) && config.url.indexOf(ENV.apiEndpoint) < 0) {
                        config.url = ENV.apiEndpoint + config.url;
                    }
                    return config;
                }
            };
        }
    ])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('jtbApiEndpointInterceptor');
    }]);


/*global PushNotification:false */
'use strict';

var WEEK_IN_MILLIS = 7 * 24 * 60 * 60 * 1000;
angular.module('coreGamesIonicUi.services').factory('jtbPushNotifications',
    ['$http', '$rootScope', '$timeout', '$window', 'jtbLocalStorage', 'jtbPlayerService',
        function ($http, $rootScope, $timeout, $window, jtbLocalStorage, jtbPlayerService) {

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

            var pushInstance;

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
