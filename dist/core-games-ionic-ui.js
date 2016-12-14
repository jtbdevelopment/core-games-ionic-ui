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
    angular.module('coreGamesIonicUi.templates', []);
    angular.module('coreGamesIonicUi.controllers', []);
    angular.module('coreGamesIonicUi.services', []);
    angular.module('coreGamesIonicUi.interceptors', []);
    angular.module('coreGamesIonicUi',
        [
            'ionic',
            'ngCordova',
            'coreGamesUi',
            'coreGamesIonicUi.templates',
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
                var controller = this;

                function online() {
                    $state.go('signin');
                }

                function checkOnline() {
                    controller.message = 'Checking network status...';
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
                            controller.message = 'Internet not currently available.';
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


'use strict';

angular.module('coreGamesIonicUi.services').run(
    ['$document', '$state', '$ionicLoading', '$timeout', 'jtbLiveGameFeed',
        function ($document, $state, $ionicLoading, $timeout, jtbLiveGameFeed) {
            function reconnect() {
                $ionicLoading.hide();
                $state.go('network');
            }

            var pauseResumeStack = 0;
            var pausePromise;

            $document.bind('pause', function () {
                console.warn('pause detected');
                ++pauseResumeStack;
                pausePromise = $timeout(function () {
                    if (pauseResumeStack > 0) {
                        console.info('pauseResumeStack still in pause - shutting down live feed');
                        pauseResumeStack = 0;
                        pausePromise = undefined;
                        jtbLiveGameFeed.suspendFeed();
                    } else {
                        console.info('ignoring pauseResumeStack, stack back to 0');
                    }
                }, 3 * 60 * 1000); //  delay between checks should not match delay between interstitials
            });

            $document.bind('resume', function () {
                console.warn('resume detected');
                if (pauseResumeStack > 0) {
                    console.info('pauseResumeStack stack reduced');
                    --pauseResumeStack;
                    if (pauseResumeStack === 0 && angular.isDefined(pausePromise)) {
                        console.info('clearing pause promise');
                        $timeout.cancel(pausePromise);
                        pausePromise = undefined;
                    }
                } else {
                    console.info('pauseResumeStack empty - full reconnect');
                    reconnect();
                }
            });
        }
    ]
);
'use strict';

angular.module('coreGamesIonicUi.services').run(
    ['$rootScope', '$state', '$ionicLoading', '$ionicPopup',
        function ($rootScope, $state, $ionicLoading, $ionicPopup) {
            function showErrorAndReconnect() {
                $ionicLoading.hide();
                $ionicPopup.alert({
                    title: 'There was a problem!',
                    template: 'Going to reconnect!'
                });
                $state.go('network');
            }

            $rootScope.$on('InvalidSession', function () {
                if ($state.$current.name !== 'signin') {
                    showErrorAndReconnect();
                } else {
                    $ionicLoading.hide();
                }
            });
            $rootScope.$on('GeneralError', function () {
                showErrorAndReconnect();
            });

            $rootScope.$on('$cordovaNetwork:offline', function() {
                  showErrorAndReconnect();
            });
        }
    ]
);
'use strict';

/**
 * Error Handling
 * --------------
 * To change look of dialog - override path to template with setErrorDialogHTMLTemplate
 * OR
 * override error handler with setErrorHandler which takes 1 param with error message
 *
 * Actions Requiring Confirmation
 * ------------------------------
 * To change look of dialog - override path to template with setConfirmDialogHTMLTemplate
 *
 * Game Specific Actions
 * ---------------------
 * You can use wrapActionOnGame and wrapConfirmedActionOnGame to create standard handlers for game calls,
 * cache interaction and error handling
 */
angular.module('coreGamesIonicUi.services').factory('jtbIonicGameActions',
    ['$http', '$q', '$state', '$ionicPopup', '$ionicActionSheet', 'jtbGameCache',
        'jtbPlayerService', '$ionicLoading', 'jtbIonicAds',
        function ($http, $q, $state, $ionicPopup, $ionicActionSheet, jtbGameCache,
                  jtbPlayerService, $ionicLoading, jtbIonicAds) {

            function defaultErrorCallback(errorMessage, promise) {
                $ionicPopup.alert({
                    title: 'Problem making move!',
                    template: errorMessage
                }).then(function () {
                    promise.reject();
                });
            }

            var errorHandler = defaultErrorCallback;

            //  TODO - ads in ionic
            var defaultAdHandler = jtbIonicAds.showInterstitial;

            function gameURL(game) {
                return jtbPlayerService.currentPlayerBaseURL() + '/game/' + game.id + '/';
            }

            function showSending() {
                $ionicLoading.show({
                    template: 'Sending...'
                });
            }

            function hideSending() {
                $ionicLoading.hide();
            }

            function generalizeTakeActionPromiseHandler(httpPromise) {
                var promise = $q.defer();
                showSending();
                httpPromise.then(
                    function (response) {
                        var updatedGame = response.data;
                        hideSending();
                        jtbGameCache.putUpdatedGame(updatedGame);
                        promise.resolve(updatedGame);
                    },
                    function (response) {
                        console.error(response.data + '/' + response.status);
                        hideSending();
                        errorHandler(response.data, promise);
                    }
                );
                return promise.promise;
            }

            function generalizedConfirmedTakeHttpAction(confirmMessage, httpActionCB) {
                var promise = $q.defer();
                $ionicActionSheet.show({
                    buttons: [],
                    destructiveText: confirmMessage,
                    titleText: 'Are you sure?',
                    cancelText: 'Cancel',
                    cancel: function() {
                        promise.reject();
                    },
                    destructiveButtonClicked: function () {
                        generalizeTakeActionPromiseHandler(httpActionCB()).then(function (updatedGame) {
                            promise.resolve(updatedGame);
                        }, function () {
                            promise.reject();
                        });
                    }
                });

                return promise.promise;
            }


            function standardHttpAction(game, action) {
                return $http.put(gameURL(game) + action);
            }

            function generateAd(adHandler) {
                if (angular.isUndefined(adHandler)) {
                    adHandler = defaultAdHandler;
                }
                return adHandler();
            }

            var service = {
                //  Override error handler
                getErrorHandler: function () {
                    return errorHandler;
                },

                setErrorHandler: function (cb) {
                    errorHandler = cb;
                },


                //  Helpers for defining game specific actions
                getGameURL: function (game) {
                    return gameURL(game);
                },
                wrapActionOnGame: function (httpActionCB) {
                    return generalizeTakeActionPromiseHandler(httpActionCB);
                },
                wrapConfirmedActionOnGame: function (confirmMessage, httpActionCB) {
                    return generalizedConfirmedTakeHttpAction(confirmMessage, httpActionCB);
                },

                //  Standard actions

                //  adHandler will default if undefined
                new: function (options, adHandler) {
                    generateAd(adHandler).then(function () {
                        service.wrapActionOnGame($http.post(
                            jtbPlayerService.currentPlayerBaseURL() + '/new',
                            options)).then(
                            function (game) {
                                $state.go('app.' + game.gamePhase.toLowerCase(), {gameID: game.id});
                            }
                        );
                    });
                },

                //  adHandler will default if undefined
                accept: function (game, adHandler) {
                    generateAd(adHandler).then(function () {
                        service.wrapActionOnGame(standardHttpAction(game, 'accept'));
                    });
                },

                reject: function (game) {
                    service.wrapConfirmedActionOnGame('Reject this game!', function () {
                        return standardHttpAction(game, 'reject');
                    });
                },

                declineRematch: function (game) {
                    service.wrapConfirmedActionOnGame('Decline further rematches.', function () {
                        return standardHttpAction(game, 'endRematch');
                    });
                },

                //  adHandler will default if undefined
                rematch: function (game, adHandler) {
                    generateAd(adHandler).then(function () {
                        service.wrapActionOnGame(standardHttpAction(game, 'rematch')).then(function (game) {
                            $state.go('app.' + game.gamePhase.toLowerCase(), {gameID: game.id});
                        });
                    });
                },

                quit: function (game) {
                    service.wrapConfirmedActionOnGame('Quit this game!', function () {
                        return standardHttpAction(game, 'quit');
                    });
                }
            };
            return service;
        }
    ]
);



'use strict';

angular.module('coreGamesIonicUi.services').service('jtbIonicInviteFriends',
    ['$ionicModal', '$rootScope', 'jtbFacebook',
        function ($ionicModal, $rootScope, jtbFacebook) {
            return {
                inviteFriendsToPlay: function (invitableFriends, message, template) {
                    if (angular.isUndefined(template)) {
                        template = 'templates/core-ionic/friends/invite-friends.html';
                    }

                    var inviteModal;
                    var $scope = $rootScope.$new();

                    $scope.invitableFriends = invitableFriends;
                    $scope.inviteFriends = function (friendsToInvite) {
                        var ids = [];
                        angular.forEach(friendsToInvite, function (friend) {
                            ids.push(friend.id);
                        });
                        jtbFacebook.inviteFriends(ids, message);
                        inviteModal.hide();
                        inviteModal.remove();
                    };
                    $scope.cancelInviteFriends = function () {
                        inviteModal.hide();
                        inviteModal.remove();
                    };

                    $ionicModal.fromTemplateUrl(template, {
                        scope: $scope,
                        animation: 'slide-in-up'
                    }).then(function (modal) {
                        inviteModal = modal;
                        modal.show();
                    });
                }
            };
        }
    ]
);


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

'use strict';

angular.module('coreGamesIonicUi.services').factory('jtbIonicVersionNotesService',
    ['$ionicPopup', 'jtbPlayerService',
        function ($ionicPopup, jtbPlayerService) {
            return {
                displayVersionNotesIfAppropriate: function (currentVersion, releaseNotes) {
                    if (jtbPlayerService.currentPlayer().lastVersionNotes < currentVersion) {
                        $ionicPopup.alert({
                            title: 'Welcome to version ' + currentVersion + '!',
                            template: releaseNotes
                        });
                        jtbPlayerService.updateLastVersionNotes(currentVersion);
                    }
                }
            };
        }
    ]
);
angular.module('coreGamesIonicUi.templates').run(['$templateCache', function($templateCache) {$templateCache.put('templates/core-ionic/actions/action-confirm-dialog.html','<!--  TODO --><div class="game-confirm-dialog"><div class="modal-header"><h4 class="modal-title">{{confirmDialog.confirmMessage}}</h4></div><div class="modal-body"><span class="confirm-message">Are you sure?</span></div><div class="modal-footer"><button class="btn btn-default btn-danger action-button" ng-click="confirmDialog.takeAction()">Yes</button> <button class="btn btn-default btn-default btn-default-focus cancel-button" ng-click="confirmDialog.cancelAction()">No</button></div></div>');
$templateCache.put('templates/core-ionic/actions/action-error-dialog.html','<!--  TODO --><div class="game-error-dialog" role="dialog"><div class="modal-header"><h4 class="modal-title">Sorry!</h4></div><div class="modal-body"><span class="error-message">{{errorDialog.errorMessage}}</span></div><div class="modal-footer"><button class="btn btn-default btn-info btn-default-focus close-button" ng-click="errorDialog.closeError()">OK</button></div></div>');
$templateCache.put('templates/core-ionic/admin/admin-stats.html','<div class="admin-stats"><div class="row text-right"><div class="col"></div><div class="col">Last 24 hours</div><div class="col">Last 7 days</div><div class="col">Last 30 days</div></div><div class="row text-right"><div class="col-25 text-left">Total Games</div><div class="col-75">{{admin.gameCount}}</div></div><div class="row text-right"><div class="col text-left">Games Created</div><div class="col">{{admin.gamesLast24hours}}</div><div class="col">{{admin.gamesLast7days}}</div><div class="col">{{admin.gamesLast30days}}</div></div><div class="row text-right"><div class="col-25 text-left">Total Players</div><div class="col-75">{{admin.playerCount}}</div></div><div class="row text-right"><div class="col text-left">Players Created</div><div class="col">{{admin.playersCreated24hours}}</div><div class="col">{{admin.playersCreated7days}}</div><div class="col">{{admin.playersCreated30days}}</div></div><div class="row text-right"><div class="col text-left">Players Logged In</div><div class="col">{{admin.playersLastLogin24hours}}</div><div class="col">{{admin.playersLastLogin7days}}</div><div class="col">{{admin.playersLastLogin30days}}</div></div></div>');
$templateCache.put('templates/core-ionic/admin/admin-switch-player.html','<div class="admin-user"><div class="row row-center"><div class="col-25"><button class="button button-full button-positive button-stop-simulating" ng-disabled="!admin.revertEnabled" ng-click="admin.revertToNormal()">Stop</button></div><div class="col-75">{{admin.revertText}}</div></div><div class="row row-center"><div class="col-25"><button class="button button-full button-energized button-get-users" ng-click="admin.refreshData()">Get Users</button></div><div class="col-75"><div class="list"><label class="item item-input"><input type="text" ng-model="admin.searchText" placeholder="And Name contains.."></label></div></div></div><div class="item item-divider"><div class="row"><div class="col-50">Display Name</div><div class="col-25">ID</div><div class="col-25">Switch</div></div></div><div class="item" ng-repeat="player in admin.players"><div class="row row-center"><div class="col-50">{{player.displayName}}</div><div class="col-25">{{player.id}}</div><div class="col-25"><button class="button button-full button-assertive button-change-user" ng-click="admin.switchToPlayer(player.id)">Switch</button></div></div></div><div class="row"><div class="col-10">{{admin.currentPage}} of {{admin.numberOfPages}}</div><div class="col-90"><div class="item range range-positive"><input type="range" name="currentPage" min="1" max="{{admin.numberOfPages}}" ng-model="admin.currentPage" ng-change="admin.changePage()"></div></div></div></div>');
$templateCache.put('templates/core-ionic/admin/admin.html','<ion-view class="admin-screen"><ion-content class="has-header" ng-cloak><div class="row"><div class="col-50"><a class="button-full button {{main.adminShowStats ? \'selected\' : \'\'}}" ng-click="main.adminSwitchToStats()">Stats</a></div><div class="col-50"><a class="button-full button {{main.adminShowSwitch ? \'selected\' : \'\'}}" ng-click="main.adminSwitchToSwitchPlayer()">Switch Player</a></div></div><div ng-show="main.adminShowStats"><div ng-include="\'templates/core-ionic/admin/admin-stats.html\'"></div></div><div ng-show="main.adminShowSwitch"><div ng-include="\'templates/core-ionic/admin/admin-switch-player.html\'"></div></div></ion-content></ion-view>');
$templateCache.put('templates/core-ionic/friends/invite-friends.html','<!--  TODO - not using controllerAs because ionic modal 1.x does not support it --><div class="modal"><div class="invite-friends"><ion-header-bar><h1 class="title">Invite Friends!</h1></ion-header-bar><ion-content><div class="list"><label class="item item-input"><div style="width: 100%"><div class="input-label">Friends To Invite:</div></div></label><div angular-multi-select class="ams_container" min-search-length="1" helper-elements="filter noall nonone noreset" input-model="invitableFriends" output-model="friendsToInvite" button-template="angular-multi-select-btn-data.htm" item-label="<[ name ]>" search-property="name" button-label="<[ name ]>"></div></div><a class="button button-full button-submit" ng-click="inviteFriends(friendsToInvite)">Invite </a><a class="button button-full button-quit" ng-click="cancelInviteFriends()">Cancel</a></ion-content></div></div>');
$templateCache.put('templates/core-ionic/sign-in/network.html','<ion-view><ion-content class="network"><div><div class="row text-center"><div class="center"><p>{{network.message}}</p></div></div></div></ion-content></ion-view>');
$templateCache.put('templates/core-ionic/sign-in/sign-in.html','<ion-view><ion-content class="sign-in" ng-cloak><div class="row text-center"><div class="center"><p>{{signIn.message}}</p></div></div><div class="list" ng-show="signIn.showFacebook"><a class="item item-button" href="#" ng-click="signIn.fbLogin()"><img ng-src="images/sign-in-with-facebook.png"></a></div><div class="list" ng-show="signIn.showManual"><span class="item item-divider">Don\'t want to login with Facebook?</span><label class="item item-input"><span class="input-label">Email</span> <input id="username" name="username" type="email" size="25" ng-model="signIn.manualForm.username"></label><label class="item item-input"><span class="input-label">Password</span> <input id="password" name="password" type="password" size="25" ng-model="signIn.manualForm.password"></label><ion-toggle ng-model="signIn.manualForm.rememberMe">Remember Me?</ion-toggle><a class="button-full button-submit button" ng-click="signIn.manualLogin(username, password)">Login</a></div></ion-content></ion-view>');
$templateCache.put('templates/core-ionic/sign-in/signed-in.html','<ion-view><ion-content class="signed-in"><div><div class="row text-center"><div class="center"><p>Login successful...</p></div></div></div></ion-content></ion-view>');}]);