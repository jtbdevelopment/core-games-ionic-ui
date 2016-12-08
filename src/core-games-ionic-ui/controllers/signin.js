'use strict';

//  TODO - Make this a popup on error I think
angular.module('coreGamesIonicUi.controllers')
    .controller('CoreIonicSignInCtrl',
        ['$scope', '$window', '$http', '$state', '$cacheFactory', 'jtbFacebook', 'ENV', '$ionicLoading',
            function ($scope, $window, $http, $state, $cacheFactory, jtbFacebook, ENV, $ionicLoading) {
                var controller = this;

                controller.message = '';
                controller.showFacebook = false;
                controller.showManual = false;

                controller.manualForm = {
                    username: '',
                    password: '',
                    rememberMe: false
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
                    controller.message = 'Invalid username or password.';
                }

                // Not testing since only used as a dev tool
                controller.manualLogin = function () {
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
                            username: controller.manualForm.username,
                            password: controller.manualForm.password,
                            'remember-me': controller.manualForm.rememberMe
                        },
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                        method: 'POST'
                    }).success(onSuccessfulLogin).error(onFailedLogin);
                };

                function showLoginOptions() {
                    controller.showFacebook = true;
                    controller.showManual = ENV.domain === 'localhost' || ENV.apiEndpoint.indexOf('-dev') > -1;
                    controller.message = '';
                }

                function autoLogin() {
                    controller.showFacebook = false;
                    controller.showManual = false;
                    controller.message = 'Logging in via Facebook';
                    clearHttpCache();
                    if ($window.location.href.indexOf('file') === 0) {
                        $http.get(ENV.apiEndpoint +
                            '/auth/facebook?code=' +
                            jtbFacebook.currentAuthorization().accessToken)
                            .success(onSuccessfulLogin)
                            .error(onFailedLogin);
                    } else {
                        $window.location = ENV.apiEndpoint + '/auth/facebook';
                    }
                }

                controller.fbLogin = function () {
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
