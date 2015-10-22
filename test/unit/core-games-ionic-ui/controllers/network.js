'use strict';

describe('Controller: CoreIonicSignInCtrl', function () {

    // load the controller's module
    beforeEach(module('coreGamesIonicUi.controllers'));

    var CoreIonicNetworkCtrl, scope, q, mockNetwork, state, http, rootScope, timeout;
    var window;

    var isOnline = false;
    var exception = {};
    mockNetwork = {
        isOnline: function() {
            if(angular.isDefined(isOnline)) {
                return isOnline;
            }
            throw exception;
        }
    };
    var ENV;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($rootScope, $timeout) {
        ENV = {
            domain: 'somedomain',
            apiEndpoint: 'http://123.com/base'
        };
        window = {
            location: {
                href: ''
            }
        };

        rootScope = $rootScope;
        timeout = $timeout;

        state = {go: jasmine.createSpy()};
        scope = $rootScope.$new();
    }));

    describe('device tests', function() {
        beforeEach(inject(function($controller) {
            window.location.href = 'file://somefile';
            CoreIonicNetworkCtrl = $controller('CoreIonicNetworkCtrl', {
                $scope: scope,
                $window: window,
                $state: state,
                $cordovaNetwork: mockNetwork,
                ENV: ENV
            });
        }));
        it('initializes, not localhost and offline', function () {
            expect(scope.message).toEqual('Checking network status...');
            timeout.flush();
            expect(state.go).not.toHaveBeenCalledWith('signin');
            expect(scope.message).toEqual('Internet not currently available.');
        });

        it('initializes and offline and online broadcast', function () {
            expect(scope.message).toEqual('Checking network status...');
            timeout.flush();
            expect(state.go).not.toHaveBeenCalledWith('signin');
            expect(scope.message).toEqual('Internet not currently available.');

            rootScope.$broadcast('$cordovaNetwork:online');
            rootScope.$apply();
            expect(state.go).toHaveBeenCalledWith('signin');
        });

        it('initializes and offline and re-entered, now online', function () {
            expect(scope.message).toEqual('Checking network status...');
            timeout.flush();
            expect(state.go).not.toHaveBeenCalledWith('signin');
            expect(scope.message).toEqual('Internet not currently available.');

            rootScope.$broadcast('$ionicView.enter');
            rootScope.$apply();

            isOnline = true;
            expect(scope.message).toEqual('Checking network status...');
            timeout.flush();
            expect(state.go).toHaveBeenCalledWith('signin');
        });

        it('initializes, not localhost and online', function () {
            expect(scope.message).toEqual('Checking network status...');
            isOnline = true;
            timeout.flush();
            expect(state.go).toHaveBeenCalledWith('signin');
        });

        it('initializes, not localhost and exception smells like a browser', function () {
            expect(scope.message).toEqual('Checking network status...');
            isOnline = undefined;
            exception = {message: 'navigator.connection is undefined'};
            timeout.flush();
            expect(state.go).toHaveBeenCalledWith('signin');
        });

        it('initializes, not localhost and exception does not smells like a browser', function () {
            expect(scope.message).toEqual('Checking network status...');
            isOnline = undefined;
            exception = {message: 'blah'};
            timeout.flush();
            expect(state.go).not.toHaveBeenCalledWith('signin');
            expect(scope.message).toEqual('Internet not currently available.');
        });
    });

    describe('http tests', function() {
        beforeEach(inject(function($controller) {
            window.location.href = 'http://somefile';
            CoreIonicNetworkCtrl = $controller('CoreIonicNetworkCtrl', {
                $scope: scope,
                $window: window,
                $state: state,
                $cordovaNetwork: mockNetwork,
                ENV: ENV
            });
        }));
        it('initializes', function () {
            expect(state.go).toHaveBeenCalledWith('signin');
            expect(scope.message).toEqual('Checking network status...');
        });
    });
});
