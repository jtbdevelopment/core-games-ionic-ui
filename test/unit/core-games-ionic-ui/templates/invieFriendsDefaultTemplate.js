describe('', function () {

    beforeEach(function () {
        module('coreGamesIonicUi.templates');
    });


    var $templateCache;
    beforeEach(inject(function (_$templateCache_) {
        $templateCache = _$templateCache_;
    }));

    it('verify invite-friends.html registered', function() {
        expect($templateCache.get('templates/core-ionic/friends/invite-friends.html')).toBeDefined();
    });
});
