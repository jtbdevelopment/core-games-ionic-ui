describe('', function () {

    beforeEach(function () {
        module('coreGamesIonicUi.templates');
    });


    var $templateCache;
    beforeEach(inject(function (_$templateCache_) {
        $templateCache = _$templateCache_;
    }));

    it('verify admin-switch-player.html registered', function() {
        expect($templateCache.get('templates/core-ionic/admin/admin-switch-player.html')).toBeDefined();
    });

    it('verify admin-stats.html registered', function() {
        expect($templateCache.get('templates/core-ionic/admin/admin-stats.html')).toBeDefined();
    });

    it('verify admin.html registered', function() {
       expect($templateCache.get('templates/core-ionic/admin/admin.html')).toBeDefined();
    });
});
