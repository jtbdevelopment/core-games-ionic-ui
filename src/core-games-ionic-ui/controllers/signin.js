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
