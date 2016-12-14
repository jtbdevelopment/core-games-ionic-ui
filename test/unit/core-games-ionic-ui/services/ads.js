/*global AdMob:false */
'use strict';

window.AdMob = {
    AD_POSITION: {
        NO_CHANGE: 0,
        TOP_LEFT: 1,
        TOP_CENTER: 2,
        TOP_RIGHT: 3,
        LEFT: 4,
        CENTER: 5,
        RIGHT: 6,
        BOTTOM_LEFT: 7,
        BOTTOM_CENTER: 8,
        BOTTOM_RIGHT: 9,
        POS_XY: 10
    }
};

describe('Service: jtbIonicAds', function () {
    beforeEach(module('coreGamesIonicUi.services'));

    var googleAdSpy = {};
    var platformUnderTest = 'browser';
    var mockCordovaDevice = {
        getPlatform: function () {
            return platformUnderTest
        }
    };
    beforeEach(module(function ($provide) {
        $provide.factory('$ionicPopup', function () {
            return {}
        });
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
        $provide.factory('$cordovaDevice', [function () {
            return mockCordovaDevice;
        }]);
        $provide.factory('$cordovaGoogleAds', [function () {
            return googleAdSpy;
        }]);
    }));

    var service;
    beforeEach(inject(function ($injector) {
        googleAdSpy = {};
        googleAdSpy.prepareInterstitial = jasmine.createSpy();
        googleAdSpy.createBanner = jasmine.createSpy();
        googleAdSpy.showInterstitial = jasmine.createSpy();
        service = $injector.get('jtbIonicAds');
    }));

    describe('for browser platform', function () {
        beforeEach(function () {
            platformUnderTest = 'browser';
        });

        it('initializes correctly', function () {
            service.initialize();
            //  tough to test beyond this since it is applixir provided logic applied to html
        });

        describe('calling ads', function () {
            beforeEach(function () {
                service.initialize();
            });

            it('show interstitial first time', function () {
                window.invokeApplixirVideoUnitExtended = jasmine.createSpy();
                service.showInterstitial();
                // can't test callback function
                expect(window.invokeApplixirVideoUnitExtended).toHaveBeenCalledWith(false, 'middle', jasmine.any(Function));
                expect(window.invokeApplixirVideoUnitExtended.calls.count()).toEqual(1);
            });

            it('show interstitial rapidly after first time does nothing second time', function () {
                window.invokeApplixirVideoUnitExtended = jasmine.createSpy();
                service.showInterstitial();
                // can't test callback function
                expect(window.invokeApplixirVideoUnitExtended).toHaveBeenCalledWith(false, 'middle', jasmine.any(Function));
                expect(window.invokeApplixirVideoUnitExtended.calls.count()).toEqual(1);
                window.invokeApplixirVideoUnitExtended.calls.argsFor(0)[2]();
                service.showInterstitial();
                expect(window.invokeApplixirVideoUnitExtended.calls.count()).toEqual(1);
            });
        });
    });

    var ids = {
        ios: {
            key: 'iOS',
            banner: 'ca-app-pub-8812482609918940/2316719315',
            interstitial: 'ca-app-pub-8812482609918940/9839986116'
        },
        android: {
            key: 'Android',
            banner: 'ca-app-pub-8812482609918940/3876007710',
            interstitial: 'ca-app-pub-8812482609918940/5352740910'
        }
    };

    var INTERSTITIAL = 'interstitial';

    function generateOnAdXXX(messageType, adType) {
        //  TODO - ugly
        var event = document.createEvent('CustomEvent');
        event.initEvent(messageType, true, false);
        event.adType = adType;
        document.dispatchEvent(event);
    }

    var generator = {
        generateOnAdDismiss: function (adType) {
            generateOnAdXXX('onAdDismiss', adType);
        },
        generateOnAdFailLoad: function (adType) {
            generateOnAdXXX('onAdFailLoad', adType);
        },
        generateOnAdLeaveApp: function (adType) {
            generateOnAdXXX('onAdLeaveApp', adType);
        }
    };

    angular.forEach(ids, function (keys, platform) {
        describe('for ' + platform + ' platform', function () {
            beforeEach(function () {
                platformUnderTest = keys.key;
            });

            it('initializes correctly', function () {
                service.initialize(ids);
                expect(googleAdSpy.prepareInterstitial.calls.count()).toEqual(1);
                expect(googleAdSpy.prepareInterstitial).toHaveBeenCalledWith({
                    adId: keys.interstitial,
                    autoShow: false
                });
                expect(googleAdSpy.createBanner.calls.count()).toEqual(1);
                expect(googleAdSpy.createBanner).toHaveBeenCalledWith({
                    adId: keys.banner,
                    position: AdMob.AD_POSITION.BOTTOM_CENTER,
                    autoShow: true
                });
            });

            it('initializes twice does nothing second time', function () {
                service.initialize(ids);
                service.initialize(ids);
                expect(googleAdSpy.prepareInterstitial.calls.count()).toEqual(1);
                expect(googleAdSpy.prepareInterstitial).toHaveBeenCalledWith({
                    adId: keys.interstitial,
                    autoShow: false
                });
                expect(googleAdSpy.createBanner.calls.count()).toEqual(1);
                expect(googleAdSpy.createBanner).toHaveBeenCalledWith({
                    adId: keys.banner,
                    position: AdMob.AD_POSITION.BOTTOM_CENTER,
                    autoShow: true
                });
            });

            describe('calling ads', function () {
                beforeEach(function () {
                    service.initialize(ids);
                });

                angular.forEach(['OnAdDismiss', 'OnAdFailLoad', 'OnAdLeaveApp'], function (type) {
                    it('handles ad mob message ' + type + ' with interstitial', function () {
                        googleAdSpy.prepareInterstitial.calls.reset();
                        googleAdSpy.createBanner.calls.reset();

                        generator['generate' + type](INTERSTITIAL);
                        expect(googleAdSpy.createBanner.calls.count()).toEqual(0);
                        expect(googleAdSpy.prepareInterstitial.calls.count()).toEqual(1);
                        expect(googleAdSpy.prepareInterstitial).toHaveBeenCalledWith({
                            adId: keys.interstitial,
                            autoShow: false
                        });
                    });

                    it('handles ad mob message ' + type + ' with non interstitial', function () {
                        googleAdSpy.prepareInterstitial.calls.reset();
                        googleAdSpy.createBanner.calls.reset();

                        generator['generate' + type]('banner');
                        expect(googleAdSpy.createBanner.calls.count()).toEqual(0);
                        expect(googleAdSpy.prepareInterstitial.calls.count()).toEqual(0);
                    });
                });

                it('show interstitial first time', function () {
                    window.invokeApplixirVideoUnitExtended = jasmine.createSpy();
                    service.showInterstitial();
                    expect(googleAdSpy.showInterstitial.calls.count()).toEqual(1);
                    expect(googleAdSpy.showInterstitial).toHaveBeenCalled();
                });

                it('show interstitial rapidly after first time does nothing second time', function () {
                    window.invokeApplixirVideoUnitExtended = jasmine.createSpy();
                    service.showInterstitial();
                    expect(googleAdSpy.showInterstitial.calls.count()).toEqual(1);
                    expect(googleAdSpy.showInterstitial).toHaveBeenCalled();

                    generator.generateOnAdDismiss(INTERSTITIAL);

                    service.showInterstitial();
                    expect(googleAdSpy.showInterstitial.calls.count()).toEqual(1);
                });
            });
        });
    });
});