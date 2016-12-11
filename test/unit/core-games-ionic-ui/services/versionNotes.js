'use strict';

describe('Service: jtbIonicVersionNotesService', function () {

    beforeEach(module('coreGamesIonicUi.services'));

    var versionAsInt = 9.3;
    var player = {
        lastVersionNotes: '' + versionAsInt + ''
    };
    var $q, openParams, $ionicPopup, playerService;
    beforeEach(module(function ($provide) {
        $ionicPopup = {
            alert: jasmine.createSpy()
        };
        $provide.factory('$ionicPopup', function () {
            return $ionicPopup;
        });

        playerService = {
            currentPlayer: function () {
                return player
            },
            updateLastVersionNotes: jasmine.createSpy('updateLastVersionNotes')
        };
        $provide.factory('jtbPlayerService', function () {
            return playerService;
        });
    }));

    var service, $http;

    beforeEach(inject(function ($httpBackend, _$q_, $injector) {
        $http = $httpBackend;
        $q = _$q_;
        service = $injector.get('jtbIonicVersionNotesService');
    }));

    it('does nothing if version is = current version as float', function () {
        service.displayVersionNotesIfAppropriate(versionAsInt);
        expect($ionicPopup.alert).not.toHaveBeenCalled();
        expect(playerService.updateLastVersionNotes).not.toHaveBeenCalled();
    });

    it('does nothing if version is = current version as string', function () {
        service.displayVersionNotesIfAppropriate('' + versionAsInt);
        expect($ionicPopup.alert).not.toHaveBeenCalled();
        expect(playerService.updateLastVersionNotes).not.toHaveBeenCalled();
    });

    it('pops up and updates notes on server if minor patch', function () {
        var updatedNotes = 'Blah blah';
        service.displayVersionNotesIfAppropriate(versionAsInt + 0.1, updatedNotes);
        expect($ionicPopup.alert).toHaveBeenCalledWith({
                title: 'Welcome to version 9.4!',
                template: updatedNotes
            }
        );
        expect(playerService.updateLastVersionNotes).toHaveBeenCalledWith(9.4);
    });

    it('pops up and updates notes on server if major patch, no template', function () {
        var updatedNotes = 'Blah blah bleh!';
        service.displayVersionNotesIfAppropriate(versionAsInt + 1, updatedNotes);
        expect($ionicPopup.alert).toHaveBeenCalledWith({
                title: 'Welcome to version 10.3!',
                template: updatedNotes
            }
        );
        expect(playerService.updateLastVersionNotes).toHaveBeenCalledWith(10.3);
    });
});