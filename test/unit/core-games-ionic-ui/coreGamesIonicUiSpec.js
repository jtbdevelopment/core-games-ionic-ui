'use strict';

describe('', function () {

    var moduleUnderTest, httpProvider;
    var dependencies = [];

    var hasModule = function (module) {
        return dependencies.indexOf(module) >= 0;
    };

    beforeEach(module('coreGamesIonicUi.config', function($httpProvider) {
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

    it('should load outside dependencies', function () {
        expect(hasModule('coreGamesUi')).toBeTruthy();
        expect(hasModule('ngCordova')).toBeTruthy();
        expect(hasModule('ionic')).toBeTruthy();
    });


    it('should load config module', function () {
        expect(hasModule('coreGamesIonicUi.config')).toBeTruthy();
    });

    it('should load config module', function () {
        expect(hasModule('coreGamesIonicUi.templates')).toBeTruthy();
    });

    it('should load interceptors module', function () {
        expect(hasModule('coreGamesIonicUi.interceptors')).toBeTruthy();
    });

    it('should load controllers module', function () {
        expect(hasModule('coreGamesIonicUi.controllers')).toBeTruthy();
    });

    it('should load services module', function () {
        expect(hasModule('coreGamesIonicUi.services')).toBeTruthy();
    });


});