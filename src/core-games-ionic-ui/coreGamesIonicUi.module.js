(function (angular) {

    // Create all modules and define dependencies to make sure they exist
    // and are loaded in the correct order to satisfy dependency injection
    // before all nested files are concatenated by Gulp

    // Config
    angular.module('coreGamesIonicUi.config', [])
        .config(['$httpProvider', function ($httpProvider) {
            $httpProvider.defaults.withCredentials = true;
        }])
        .value('coreGamesIonicUi.config', {
            debug: true
        })
    ;

    // Modules
    angular.module('coreGamesIonicUi.controllers', []);
    angular.module('coreGamesIonicUi.services', []);
    angular.module('coreGamesIonicUi.interceptors', []);
    angular.module('coreGamesIonicUi',
        [
            'ionic',
            'ngCordova',
            'coreGamesUi',
            'coreGamesIonicUi.config',
            'coreGamesIonicUi.interceptors',
            'coreGamesIonicUi.services',
            'coreGamesIonicUi.controllers'
        ])
    ;

})(angular);
