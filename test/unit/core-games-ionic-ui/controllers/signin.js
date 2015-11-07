'use strict';

//  Not testing manual login as that is dev tool only
describe('Controller: CoreIonicSignInCtrl', function () {

    // load the controller's module
    beforeEach(module('coreGamesIonicUi.controllers'));

    var SignInCtrl, scope, q, mockFacebook, autoLogin, doLogin, state, http, rootScope;
    var window;
    var token = 'sometoken';

    var ENV;

    var ionicLoadng = {
        hide: jasmine.createSpy(),
        show: jasmine.createSpy()
    };
    var httpCache = {removeAll: jasmine.createSpy()};
    var cacheFactory = {
        get: function (name) {
            if (name === '$http') {
                return httpCache;
            }
        }
    };

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope, $q, $httpBackend) {
        ENV = {
            domain: 'somedomain',
            apiEndpoint: 'http://123.com/base'
        };
        window = {
            location: {
                href: ''
            }
        };

        q = $q;
        rootScope = $rootScope;
        http = $httpBackend;

        state = {go: jasmine.createSpy()};
        mockFacebook = {
            canAutoSignIn: function () {
                autoLogin = q.defer();
                return autoLogin.promise;
            },
            initiateFBLogin: function () {
                doLogin = q.defer();
                return doLogin.promise;
            },
            currentAuthorization: function () {
                return {
                    accessToken: token
                }
            }
        };
        scope = $rootScope.$new();
        SignInCtrl = $controller('CoreIonicSignInCtrl', {
            $scope: scope,
            $window: window,
            jtbFacebook: mockFacebook,
            $state: state,
            ENV: ENV,
            $ionicLoading: ionicLoadng,
            $cacheFactory: cacheFactory
        });
    }));

    it('initializes', function () {
        expect(scope.showFacebook).toEqual(false);
        expect(scope.showManual).toEqual(false);
        expect(scope.message).toEqual('');
    });

    describe('on enter is published', function () {
        beforeEach(function () {
            rootScope.$broadcast('$ionicView.enter');
            rootScope.$apply();
        });

        it('initializes and can autologin, file', function () {
            window.location.href = 'file://somefile';
            autoLogin.resolve({auto: true, permissions: 'perm'});
            http.expectGET(ENV.apiEndpoint + '/auth/facebook?code=' + token).respond(200);
            scope.$apply();
            http.flush();
            expect(scope.showFacebook).toEqual(false);
            expect(scope.showManual).toEqual(false);
            expect(scope.message).toEqual('Logging in via Facebook');
            expect(ionicLoadng.hide).toHaveBeenCalled();
            expect(state.go).toHaveBeenCalledWith('signedin');
        });

        it('initializes and can autologin, file, withError', function () {
            window.location.href = 'file://somefile';
            autoLogin.resolve({auto: true, permissions: 'perm'});
            http.expectGET(ENV.apiEndpoint + '/auth/facebook?code=' + token).respond(500);
            scope.$apply();
            http.flush();
            expect(httpCache.removeAll).toHaveBeenCalled();
            expect(scope.showFacebook).toEqual(false);
            expect(scope.showManual).toEqual(false);
            expect(scope.message).toEqual('Invalid username or password.');
            expect(ionicLoadng.hide).toHaveBeenCalled();
            expect(state.go).not.toHaveBeenCalledWith('signedin');
        });

        it('initializes and can autologin, http', function () {
            window.location.href = 'http://somefile';
            autoLogin.resolve({auto: true, permissions: 'perm'});
            scope.$apply();
            expect(scope.showFacebook).toEqual(false);
            expect(scope.showManual).toEqual(false);
            expect(scope.message).toEqual('Logging in via Facebook');
            expect(window.location).toEqual(ENV.apiEndpoint + '/auth/facebook');
        });

        it('initializes and cannot autologin with localhost', function () {
            ENV.domain = 'localhost';
            autoLogin.resolve({auto: false, permissions: 'perm'});
            scope.$apply();
            expect(scope.showFacebook).toEqual(true);
            expect(scope.showManual).toEqual(true);
            expect(scope.message).toEqual('');
        });

        it('errors with localhost', function () {
            ENV.domain = 'localhost';
            autoLogin.reject();
            scope.$apply();
            expect(scope.showFacebook).toEqual(true);
            expect(scope.showManual).toEqual(true);
            expect(scope.message).toEqual('');
        });

        it('initializes and cannot autologin with -dev', function () {
            ENV.apiEndpoint = 'http://something-dev.aws.com';
            autoLogin.resolve({auto: false, permissions: 'perm'});
            scope.$apply();
            expect(scope.showFacebook).toEqual(true);
            expect(scope.showManual).toEqual(true);
            expect(scope.message).toEqual('');
        });

        it('errors with -dev', function () {
            ENV.apiEndpoint = 'http://something-dev.aws.com';
            autoLogin.reject();
            scope.$apply();
            expect(scope.showFacebook).toEqual(true);
            expect(scope.showManual).toEqual(true);
            expect(scope.message).toEqual('');
        });

        it('initializes and cannot autologin with non-manual', function () {
            autoLogin.resolve({auto: false, permissions: 'perm2'});
            scope.$apply();
            expect(scope.showFacebook).toEqual(true);
            expect(scope.showManual).toEqual(false);
            expect(scope.message).toEqual('');
        });

        it('errors with non-manual', function () {
            autoLogin.reject();
            scope.$apply();
            expect(scope.showFacebook).toEqual(true);
            expect(scope.showManual).toEqual(false);
            expect(scope.message).toEqual('');
        });

        it('pressing FB Login to success and auto-login, file', function () {
            window.location.href = 'file://somefile';
            scope.fbLogin();
            doLogin.resolve({auto: true});
            http.expectGET(ENV.apiEndpoint + '/auth/facebook?code=' + token).respond(200);
            scope.$apply();
            http.flush();
            expect(scope.showFacebook).toEqual(false);
            expect(scope.showManual).toEqual(false);
            expect(scope.message).toEqual('Logging in via Facebook');
            expect(ionicLoadng.hide).toHaveBeenCalled();
            expect(state.go).toHaveBeenCalledWith('signedin');
        });

        it('pressing FB Login to success and auto-login, file, with error', function () {
            window.location.href = 'file://somefile';
            scope.fbLogin();
            doLogin.resolve({auto: true});
            http.expectGET(ENV.apiEndpoint + '/auth/facebook?code=' + token).respond(500);
            scope.$apply();
            http.flush();
            expect(httpCache.removeAll).toHaveBeenCalled();
            expect(scope.showFacebook).toEqual(false);
            expect(scope.showManual).toEqual(false);
            expect(scope.message).toEqual('Invalid username or password.');
            expect(ionicLoadng.hide).toHaveBeenCalled();
            expect(state.go).not.toHaveBeenCalledWith('signedin');
        });

        it('pressing FB Login to success and auto-login, http', function () {
            window.location.href = 'http://somefile';
            scope.fbLogin();
            doLogin.resolve({auto: true});
            scope.$apply();
            expect(scope.showFacebook).toEqual(false);
            expect(scope.showManual).toEqual(false);
            expect(scope.message).toEqual('Logging in via Facebook');
            expect(window.location).toEqual(ENV.apiEndpoint + '/auth/facebook');
        });

        it('pressing FB Login to success but not auto-login', function () {
            window.location = {href: 'somethinglocalhostsomething'};
            scope.fbLogin();
            doLogin.resolve({auto: false});
            scope.$apply();
            expect(scope.showFacebook).toEqual(true);
            expect(scope.showManual).toEqual(false);
            expect(scope.message).toEqual('');
        });

        it('pressing FB Login to failure', function () {
            window.location = {href: 'somethinglocalhostsomething'};
            scope.fbLogin();
            doLogin.reject();
            scope.$apply();
            expect(scope.showFacebook).toEqual(true);
            expect(scope.showManual).toEqual(false);
            expect(scope.message).toEqual('');
        });
    });
});
