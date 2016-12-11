describe('', function () {

    beforeEach(function () {
        module('coreGamesIonicUi.templates');
    });


    var $templateCache;
    beforeEach(inject(function (_$templateCache_) {
        $templateCache = _$templateCache_;
    }));

    it('verify network.html registered', function() {
        expect($templateCache.get('templates/core-ionic/sign-in/network.html')).toBeDefined();
    });

    it('verify sign-in.html registered', function() {
        expect($templateCache.get('templates/core-ionic/sign-in/sign-in.html')).toBeDefined();
    });

    it('verify signed-in.html registered', function() {
        expect($templateCache.get('templates/core-ionic/sign-in/signed-in.html')).toBeDefined();
    });
});
