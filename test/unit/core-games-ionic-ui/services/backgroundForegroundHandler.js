'use strict';

describe('Service: backgroundForegroundHandler registered', function () {
    beforeEach(module('coreGamesIonicUi.services'));

    var $document = {
        resumeFunction: undefined,
        pauseFunction: undefined,
        bind: function (event, fn) {
            if (event === 'pause') {
                this.pauseFunction = fn;
            }
            else {
                this.resumeFunction = fn;
            }
        }
    };

    var $state, $ionicLoading, $timeout, jtbLiveGameFeed;
    beforeEach(module(function ($provide) {
        $state = {go: jasmine.createSpy(), $current: { name: 'x'}};
        $provide.factory('$state', function () {
            return $state;
        });
        $ionicLoading = {
            hide: jasmine.createSpy()
        };
        $provide.factory('$ionicLoading', function () {
            return $ionicLoading;
        });
        jtbLiveGameFeed = {
            suspendFeed: jasmine.createSpy()
        };
        $provide.factory('jtbLiveGameFeed', function () {
            return jtbLiveGameFeed;
        });

        $provide.factory('$document', function () {
            return $document;
        });
        $provide.factory('$ionicPopup', function () {
            return {
            }
        });
    }));

    beforeEach(inject(function (_$timeout_) {
        $timeout = _$timeout_;
    }));

    it('test pause and resume are bound on document', function() {
        expect($document.resumeFunction).toBeDefined();
        expect($document.pauseFunction).toBeDefined();
    });

    it('if resume is called after no pauses, goes to network reconnect', function () {
        $document.resumeFunction();
        expect($ionicLoading.hide).toHaveBeenCalled();
        expect($state.go).toHaveBeenCalledWith('network');
    });

    it('receiving pause sets up $timeout that goes to network after $timeout', function () {
        $document.pauseFunction();
        $timeout.flush();
        expect(jtbLiveGameFeed.suspendFeed).toHaveBeenCalled();
    });

    it('receiving pause and then resume cancels $timeout', function () {
        $document.pauseFunction();
        $document.resumeFunction();
        var exception = false;
        try {
            $timeout.flush();
        } catch (ex) {
            exception = true;
        }
        expect(exception).toEqual(true);
        expect($ionicLoading.hide).not.toHaveBeenCalled();
        expect($state.go).not.toHaveBeenCalledWith('network');
    });

    it('receiving multiple pauses requires multiple resumes or $timeout fires', function () {
        $document.pauseFunction();
        $document.pauseFunction();
        $document.resumeFunction();
        $timeout.flush();
        expect(jtbLiveGameFeed.suspendFeed).toHaveBeenCalled();
    });

});

