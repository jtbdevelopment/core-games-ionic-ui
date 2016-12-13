'use strict';

angular.module('coreGamesIonicUi.services').service('jtbIonicInviteFriends',
    ['$ionicModal', '$rootScope', 'jtbFacebook',
        function ($ionicModal, $rootScope, jtbFacebook) {
            return {
                inviteFriendsToPlay: function (invitableFriends, message, template) {
                    if (angular.isUndefined(template)) {
                        template = 'templates/core-ionic/friends/invite-friends.html';
                    }

                    var inviteModal;
                    var $scope = $rootScope.$new();

                    $scope.invitableFriends = invitableFriends;
                    $scope.inviteFriends = function (friendsToInvite) {
                        var ids = [];
                        angular.forEach(friendsToInvite, function (friend) {
                            ids.push(friend.id);
                        });
                        jtbFacebook.inviteFriends(ids, message);
                        inviteModal.hide();
                        inviteModal.remove();
                    };
                    $scope.cancelInviteFriends = function () {
                        inviteModal.hide();
                        inviteModal.remove();
                    };

                    $ionicModal.fromTemplateUrl(template, {
                        scope: $scope,
                        animation: 'slide-in-up'
                    }).then(function (modal) {
                        inviteModal = modal;
                        modal.show();
                    });
                }
            };
        }
    ]
);

