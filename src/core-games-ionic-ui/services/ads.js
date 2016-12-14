/*global invokeApplixirVideoUnitExtended:false */
/*global AdMob:false */
'use strict';

angular.module('coreGamesIonicUi.services').factory('jtbIonicAds',
    ['$cordovaGoogleAds', '$cordovaDevice',
        function ($cordovaGoogleAds, $cordovaDevice) {
            var DEFAULT_TIME_BETWEEN_INTERSTITIALS = 2 * 60 * 1000;  // 2 minutes
            var IOS = 'iOS';
            var BROWSER = 'browser';
            var ANDROID = 'Android';

            var lastInterstitialShown = new Date(0);
            var timeBetweenInterstitials = DEFAULT_TIME_BETWEEN_INTERSTITIALS;
            var platform = '';
            var adMobInterstitialId = '';
            var initialized = false;

            function requestAdMobInterstitialAd() {
                $cordovaGoogleAds.prepareInterstitial({adId: adMobInterstitialId, autoShow: false});
            }

            //  Admob

            //  Debugging 
            /*
             document.addEventListener('onAdLoaded', function (e) {
             try {
             console.info('Ad Loaded:' + JSON.stringify(e));
             } catch (ex) {
             console.info('Ad Loaded, not serializable');
             }

             });

             document.addEventListener('onAdPresent', function (e) {
             try {
             console.info('Ad Present:' + JSON.stringify(e));
             } catch (ex) {
             console.info('Ad Present, not serializable');
             }
             });
             */
            
            document.addEventListener('onAdDismiss', function (e) {
                if (e.adType === 'interstitial') {
                    lastInterstitialShown = new Date();
                    requestAdMobInterstitialAd();
                }
            });

            document.addEventListener('onAdFailLoad', function (e) {
                if (e.adType === 'interstitial') {
                    requestAdMobInterstitialAd();
                }
            });

            //  they clicked on ad
            document.addEventListener('onAdLeaveApp', function (e) {
                if (e.adType === 'interstitial') {
                    requestAdMobInterstitialAd();
                }
            });

            return {
                //
                //  ids should be structure like
                //  ids: {
                //     ios: {
                //         banner: 'ccccc',
                //         interstitial: 'xxxx'
                //     },
                //     android: {
                //         banner: 'cccdd',
                //         interstitial: 'zzxx'
                //     }
                //  }
                initialize: function (ids, timeBetweenInterstitialsInSeconds) {
                    if(angular.isDefined(timeBetweenInterstitialsInSeconds)) {
                        timeBetweenInterstitials = timeBetweenInterstitialsInSeconds * 1000;
                    }
                    if (!initialized) {
                        try {
                            platform = $cordovaDevice.getPlatform();
                        } catch (ex) {
                            platform = BROWSER;
                        }
                        switch (platform) {
                            case IOS:
                                adMobInterstitialId = ids.ios.interstitial;
                                requestAdMobInterstitialAd();
                                $cordovaGoogleAds.createBanner({
                                    adId: ids.ios.banner,
                                    position: AdMob.AD_POSITION.BOTTOM_CENTER,
                                    autoShow: true
                                });
                                break;
                            case ANDROID:
                                adMobInterstitialId = ids.android.interstitial;
                                requestAdMobInterstitialAd();
                                $cordovaGoogleAds.createBanner({
                                    adId: ids.android.banner,
                                    position: AdMob.AD_POSITION.BOTTOM_CENTER,
                                    autoShow: true
                                });
                                break;
                            case BROWSER:
                                (function (d, s, id) {
                                    var js, fjs = d.getElementsByTagName(s)[0];
                                    if (d.getElementById(id)) {
                                        return;
                                    }
                                    js = d.createElement(s);
                                    js.id = id;
                                    js.src = '//developer.appprizes.com/applixir_richmedia.js';
                                    fjs.parentNode.insertBefore(js, fjs);
                                }(document, 'script', 'applixir-jssdk'));
                                break;
                            default:
                                break;
                        }
                        initialized = true;
                    }
                },

                showInterstitial: function () {
                    if (((new Date()) - lastInterstitialShown ) >= timeBetweenInterstitials) {
                        switch (platform) {
                            case IOS:
                            case ANDROID:
                                try {
                                    $cordovaGoogleAds.showInterstitial();
                                } catch (ex) {
                                    console.warn(JSON.stringify(ex));
                                    requestAdMobInterstitialAd();
                                }
                                break;
                            case BROWSER:
                                try {
                                    invokeApplixirVideoUnitExtended(false, 'middle', function () {
                                        lastInterstitialShown = new Date();
                                    });
                                } catch (ex) {
                                    console.warn(JSON.stringify(ex));
                                }
                                break;
                            default:
                                break;
                        }
                    }
                }
            };
        }
    ]
);
