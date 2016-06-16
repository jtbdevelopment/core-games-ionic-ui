'use strict';

describe('', function () {

    var moduleUnderTest, httpProvider;
    var dependencies = [];

    var hasModule = function (module) {
        return dependencies.indexOf(module) >= 0;
    };

    beforeEach(module('coreGamesIonicUi.config', function($httpProvider) {
        console.log('init');
        httpProvider = $httpProvider;
    }));
    
    beforeEach(function () {
        // Get module
        moduleUnderTest = angular.module('coreGamesIonicUi');
        dependencies = moduleUnderTest.requires;
        inject();
    });

    it('should enable credentials', function() {
        expect(httpProvider.defaults.withCredentials).toEqual(true);
    });

    it('should load config module', function () {
        expect(hasModule('coreGamesIonicUi.config')).toBeTruthy();
    });


    it('should load interceptors module', function () {
        expect(hasModule('coreGamesIonicUi.interceptors')).toBeTruthy();
    });


    it('should load services module', function () {
        expect(hasModule('coreGamesIonicUi.services')).toBeTruthy();
    });


});