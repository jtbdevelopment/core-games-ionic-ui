'use strict';

describe('Controller: CoreIonicSignedInCtrl', function () {

    // load the controller's module
    beforeEach(module('coreGamesIonicUi.controllers'));

    var SignedInCtrl;

    var state = {go: jasmine.createSpy()};
    var httpCache = {removeAll: jasmine.createSpy()};
    var cacheFactory = {
        get: function (name) {
            if (name === '$http') {
                return httpCache;
            }
        }
    };
    var scope;
    var rootScope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        rootScope = $rootScope;
        spyOn(rootScope, '$broadcast').andCallThrough();
        SignedInCtrl = $controller('CoreIonicSignedInCtrl', {
            $scope: scope,
            $state: state,
            $rootScope: rootScope,
            $cacheFactory: cacheFactory
        });
    }));

    it('on entering, clears cache, broadcasts login and goes to signedin', function () {
        rootScope.$broadcast('$ionicView.enter');
        rootScope.$apply();

        expect(httpCache.removeAll).toHaveBeenCalled();
        expect(rootScope.$broadcast).toHaveBeenCalledWith('login');
        expect(state.go).toHaveBeenCalledWith('app.games')
    });
});