'use strict';

describe('Service: errorHandler registered', function () {
    beforeEach(module('coreGamesIonicUi.services'));

    var $state, $ionicLoading, $ionicPopup, $rootScope;
    beforeEach(module(function ($provide) {
        $state = {go: jasmine.createSpy(), $current: { name: 'x'}};
        $provide.factory('$state', function () {
            return $state;
        });
        $ionicPopup = {
            alert: jasmine.createSpy()
        };
        $ionicLoading = {
            hide: jasmine.createSpy()
        };
        $provide.factory('$ionicPopup', function () {
            return $ionicPopup;
        });
        $provide.factory('$ionicLoading', function () {
            return $ionicLoading;
        });
        $provide.factory('jtbLiveGameFeed', function() { return {}});
    }));

    beforeEach(inject(function (_$rootScope_) {
        $rootScope = _$rootScope_;
    }));

    function testStandardErrorDialog() {
        expect($ionicLoading.hide).toHaveBeenCalled();
        expect($ionicPopup.alert).toHaveBeenCalledWith({
            title: 'There was a problem!',
            template: 'Going to reconnect!'
        });
        expect($state.go).toHaveBeenCalledWith('network');
    }

    it('test an invalid session error broadcast is handled', function () {
        $rootScope.$broadcast('InvalidSession');
        $rootScope.$apply();
        testStandardErrorDialog();
    });

    it('test an invalid session error broadcast is not handled when already on signin', function () {
        $state.$current.name = 'signin';
        $rootScope.$broadcast('InvalidSession');
        $rootScope.$apply();
        expect($ionicLoading.hide).toHaveBeenCalled();
        expect($ionicPopup.alert).not.toHaveBeenCalled();
        expect($state.go).not.toHaveBeenCalled();
    });

    it('test a general error broadcast is handled', function () {
        $rootScope.$broadcast('GeneralError');
        $rootScope.$apply();
        testStandardErrorDialog();
    });

    it('test a cordova offline is handled', function () {
        $rootScope.$broadcast('$cordovaNetwork:offline');
        $rootScope.$apply();
        testStandardErrorDialog();
    });
});

