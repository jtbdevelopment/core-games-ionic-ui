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
          'coreGamesIonicUi.services'
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

angular.module('coreGamesIonicUi.controllers')
    .controller('CoreIonicSignInCtrl',
    ['$scope', '$window', '$http', '$state', '$cacheFactory', 'jtbFacebook', 'ENV', '$ionicLoading',
        function ($scope, $window, $http, $state, $cacheFactory, jtbFacebook, ENV, $ionicLoading) {
            //  TODO - Make this a popup on error I think
            $scope.message = 'Initializing...';
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
