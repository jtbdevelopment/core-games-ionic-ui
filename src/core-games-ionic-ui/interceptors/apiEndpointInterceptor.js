'use strict';

angular.module('coreGamesIonicUi.interceptors').factory('jtbApiEndpointInterceptor',
    ['$q', 'ENV',
        function ($q, ENV) {
            return {
                'request': function (config) {
                    if (
                        (
                            //  TODO - this better
                            config.url.indexOf('/api') >= 0 ||
                            config.url.indexOf('/auth') >= 0 ||
                            config.url.indexOf('/signout') >= 0 ||
                            config.url.indexOf('/livefeed') >= 0 ||
                            config.url.indexOf('/signin/authenticate') >= 0
                        ) && config.url.indexOf(ENV.apiEndpoint) < 0) {
                        config.url = ENV.apiEndpoint + config.url;
                    }
                    return config;
                }
            };
        }
    ]);

