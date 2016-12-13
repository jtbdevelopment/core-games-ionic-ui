'use strict';

describe('Service: jtbIonicInviteFriends', function () {

    beforeEach(module('coreGamesIonicUi.services'));

    var versionAsInt = 9.3;
    var player = {
        lastVersionNotes: '' + versionAsInt + ''
    };
    var $q, openTemplate, openParams, modalPromise, modal, $ionicPopup, $ionicModal, jtbFacebook, $rootScope;
    beforeEach(module(function ($provide) {
        $provide.factory('jtbLiveGameFeed', function () {
            return {}
        });
        $provide.factory('$document', function () {
            return {bind: jasmine.createSpy()}
        });
        $provide.factory('$state', function () {
            return {}
        });
        $provide.factory('$ionicLoading', function () {
            return {}
        });
        $provide.factory('$ionicPopup', function () {
            return {};
        });

        $provide.factory('jtbPlayerService', function () {
            return {};
        });

        jtbFacebook = {
            inviteFriends: jasmine.createSpy()
        };
        $provide.factory('jtbFacebook', function () {
            return jtbFacebook;
        });

        modalPromise = undefined;
        modal = {
            show: jasmine.createSpy(),
            hide: jasmine.createSpy(),
            remove: jasmine.createSpy()
        };
        $ionicModal = {
            fromTemplateUrl: function (t, p) {
                openTemplate = t;
                openParams = p;
                modalPromise = $q.defer();
                return modalPromise.promise;
            }
        };
        $provide.factory('$ionicModal', function () {
            return $ionicModal;
        });

    }));

    var service, $http;

    beforeEach(inject(function ($httpBackend, _$q_, $injector, _$rootScope_) {
        $http = $httpBackend;
        $q = _$q_;
        $rootScope = _$rootScope_;
        service = $injector.get('jtbIonicInviteFriends');
    }));

    it('initializes modal with default template', function () {
        var invitableFriends = [{id: 1, displayName: 'Y'}, {id: 3, displayName: 'fred'}];
        var message = 'a message';
        service.inviteFriendsToPlay(invitableFriends, message);

        expect(modalPromise).toBeDefined();
        expect(openTemplate).toEqual('templates/core-ionic/friends/invite-friends.html');
        expect(openParams.scope.invitableFriends).toEqual(invitableFriends);
        expect(openParams.animation).toEqual('slide-in-up');

        modalPromise.resolve(modal);
        $rootScope.$apply();
        expect(modal.show).toHaveBeenCalled();
    });

    it('initializes modal with another template', function () {
        var invitableFriends = [{id: 1, displayName: 'Y'}, {id: 3, displayName: 'fred'}];
        var message = 'a message';
        var sometemplate = 'templates/mine/mine.html';
        service.inviteFriendsToPlay(invitableFriends, message, sometemplate);

        expect(modalPromise).toBeDefined();
        expect(openTemplate).toEqual(sometemplate);
        expect(openParams.scope.invitableFriends).toEqual(invitableFriends);
        expect(openParams.animation).toEqual('slide-in-up');

        modalPromise.resolve(modal);
        $rootScope.$apply();
        expect(modal.show).toHaveBeenCalled();
    });

    describe('post init tests', function() {
        var invitableFriends = [{id: 1, displayName: 'Y'}, {id: 3, displayName: 'fred'}];
        var message = 'a message';

        beforeEach(function() {
            service.inviteFriendsToPlay(invitableFriends, message);
            modalPromise.resolve(modal);
            $rootScope.$apply();
        });
        it('cancelling does not invite', function () {
            openParams.scope.cancelInviteFriends();
            expect(modal.hide).toHaveBeenCalled();
            expect(modal.remove).toHaveBeenCalled();
            expect(jtbFacebook.inviteFriends).not.toHaveBeenCalled();
        });

        it('inviting does invite', function () {
            openParams.scope.inviteFriends([{id: 1}, {id: 2, other: 'X'}, {other: 'Y', id: 3}]);
            expect(modal.hide).toHaveBeenCalled();
            expect(modal.remove).toHaveBeenCalled();
            expect(jtbFacebook.inviteFriends).toHaveBeenCalledWith([1, 2, 3], message);
        });
    });

});