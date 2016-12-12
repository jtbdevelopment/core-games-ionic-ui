'use strict';

angular.module('coreGamesIonicUi.services').run(
    ['$document', '$state', '$ionicLoading', '$timeout', 'jtbLiveGameFeed',
        function ($document, $state, $ionicLoading, $timeout, jtbLiveGameFeed) {
            function reconnect() {
                $ionicLoading.hide();
                $state.go('network');
            }

            var pauseResumeStack = 0;
            var pausePromise;

            $document.bind('pause', function () {
                console.warn('pause detected');
                ++pauseResumeStack;
                pausePromise = $timeout(function () {
                    if (pauseResumeStack > 0) {
                        console.info('pauseResumeStack still in pause - shutting down live feed');
                        pauseResumeStack = 0;
                        pausePromise = undefined;
                        jtbLiveGameFeed.suspendFeed();
                    } else {
                        console.info('ignoring pauseResumeStack, stack back to 0');
                    }
                }, 3 * 60 * 1000); //  delay between checks should not match delay between interstitials
            });

            $document.bind('resume', function () {
                console.warn('resume detected');
                if (pauseResumeStack > 0) {
                    console.info('pauseResumeStack stack reduced');
                    --pauseResumeStack;
                    if (pauseResumeStack === 0 && angular.isDefined(pausePromise)) {
                        console.info('clearing pause promise');
                        $timeout.cancel(pausePromise);
                        pausePromise = undefined;
                    }
                } else {
                    console.info('pauseResumeStack empty - full reconnect');
                    reconnect();
                }
            });
        }
    ]
);