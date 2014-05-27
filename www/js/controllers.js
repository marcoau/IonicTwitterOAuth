angular.module('starter.controllers', ['twitterLib'])

.controller('LoginCtrl', function($rootScope, $scope, TwitterLib, $state) {

  // $state.go('tab.dash');

  $scope.doLogin = function () {
    // alert('TEST doLogin');
    console.log('$scope.doLogin');
    TwitterLib.init().then(function (_data) {
      //the whole data
      // alert(JSON.stringify(_data));
      $state.transitionTo('tab.dash');
    }, function error(_error) {
      alert(JSON.stringify(_error));
    });
  };
  //
  //
  $scope.doLogout = function () {
    TwitterLib.logOut();
  };
  //
  //
  $scope.doStatus = function () {
    // alert('doStatus');
    var options = {
      url: "https://api.twitter.com/1.1/statuses/user_timeline.json",
      data: {
        'screen_name': "aaronksaunders",
        'count': "25"
      }
    };
    TwitterLib.apiGetCall(options).then(function (_data) {
      // alert("doStatus success");
      $scope.items = _data;
    }, function (_error) {
      alert("doStatus error" + JSON.stringify(_error));
    });
  };
  //
  //
  $scope.doTweet = function () {
    // alert('doTweet');

    TwitterLib.tweet("Sample tweet " + new Date()).then(function (_data) {
      alert("tweet success");
    }, function (_error) {
      alert("tweet error" + JSON.stringify(_error));
    });
  };

})

.controller('FriendsCtrl', function($scope, Friends) {
  $scope.friends = Friends.all();
})

.controller('FriendDetailCtrl', function($scope, $stateParams, Friends) {
  $scope.friend = Friends.get($stateParams.friendId);
})

.controller('AccountCtrl', function($scope) {
})

.controller('DashCtrl', function($scope, TwitterLib) {
  $scope.doLogout = function () {
    TwitterLib.logOut();
  };
});
