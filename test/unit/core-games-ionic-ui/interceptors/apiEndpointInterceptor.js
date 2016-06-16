'use strict';

describe('Service: unauthorizedHandler', function () {
    var httpProvider;
    // load the controller's module
    beforeEach(module('coreGamesIonicUi.interceptors', function ($httpProvider) {
        httpProvider = $httpProvider;
    }));
    
    beforeEach(module('coreGamesIonicUi.interceptors'));

    var ENV = {apiEndpoint: 'http://xyz.com'};
    beforeEach(module(function ($provide) {
        $provide.factory('ENV', function () {
            return ENV;
        });
    }));

    var interceptor;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($injector) {
        interceptor = $injector.get('jtbApiEndpointInterceptor');
    }));

    it('registers interceptor', function () {
        expect(httpProvider.interceptors).toContain('jtbApiEndpointInterceptor');
    });

    it('does not prepend a random url', function () {
        var config = {url: 'x'};
        interceptor.request(config);
        expect(config).toEqual({url: 'x'});
    });

    it('does not prepend a url with endpoint in it already', function () {
        var config = {url: ENV.apiEndpoint + '/api'};
        interceptor.request(config);
        expect(config).toEqual({url: ENV.apiEndpoint + '/api'});
    });

    angular.forEach(['/api', '/auth', '/signout', '/livefeed', '/signin/authenticate'], function (url) {
        it('does prepend for ' + url, function () {
            var config = {url: url};
            interceptor.request(config);
            expect(config).toEqual({url: ENV.apiEndpoint + url});
        });
    });
});
