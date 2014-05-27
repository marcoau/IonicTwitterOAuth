/**
 * Twitter library written to work with Cordova.
 *
 * This was specifically written to work with IonicFramework & AngularJS
 *
 * The code is based on the OpenFB Library which can be found here
 *    https://github.com/ccoenraets/sociogram-angular-ionic
 *
 * And the Twitter Library that can be found here
 *
 *
 * @author Aaron Saunders @aaronksaunders
 * @version 0.1
 */
angular.module('twitterLib', [])

.factory('TwitterLib', function ($rootScope, $q, $window, $http, myAppConfig, $state) {

  // GLOBAL VARS

  var runningInCordova = false;
  var loginWindow;


  // Construct the callback URL fro when running in browser
  var index = document.location.href.indexOf('index.html');
  var callbackURL = document.location.href.substring(0, index) + 'oauthcallback.html';

  var oauth;

  // YOUR Twitter CONSUMER_KEY, Twitter CONSUMER_SECRET
  var options;

  options = angular.extend({}, myAppConfig.oauthSettings);
  options = angular.extend(options, {
    callbackUrl: callbackURL
  });

  // YOU have to replace it on one more Place                   
  // This key is used for storing Information related
  // var twitterKey = 'PU47tNh833f96TZ1OlrspA';

  var twitterKey;

  // used to check if we are running in phonegap/cordova
  $window.document.addEventListener("deviceready", function () {
    runningInCordova = true;

    callbackURL = myAppConfig.oauthSettings.callbackUrl;
    options.callbackUrl = callbackURL;
  }, false);

  function byteArrayToString(byteArray) {
    var string = '', l = byteArray.length, i;
    for (i = 0; i < l; i++) {
        string += String.fromCharCode(byteArray[i]);
    }
    return string;
  }

  var Twitter = {
    init: function () {

      // alert('TEST init!');

      var deferredLogin = $q.defer();
      //the event handler for processing load events for the oauth
      //process
      //@param event
      var doLoadstart = function (event) {
        // alert('TEST doLoadstart');
        console.log("in doLoadstart " + event.url);
        var url = event.url;
        Twitter.inAppBrowserLoadHandler(url, deferredLogin);
      };
      //
      // the event handler for processing exit events for the oauth
      // process
      //@param event
      var doExit = function (event) {
        // Handle the situation where the user closes the login window manually
        // before completing the login process
        console.log(JSON.stringify(event));
        deferredLogin.reject({error: 'user_cancelled',
            error_description: 'User cancelled login process',
            error_reason: "user_cancelled"
        });
      };

      var openAuthoriseWindow = function (_url) {

        // alert('TEST openAuthoriseWindow');

        loginWindow = $window.open(_url, '_blank', 'location=yes');

        if (runningInCordova) {
            loginWindow.addEventListener('loadstart', doLoadstart);

        } else {
            // this saves the promise value in the window when running in the browser
            window.deferredLogin = deferredLogin;
        }
      };

      var failureHandler = function () {
        console.log("ERROR: " + JSON.stringify(error));
        deferredLogin.reject({error: 'user_cancelled', error_description: error });
      };

      // Apps storedAccessData , Apps Data in Raw format
      var storedAccessData, rawData = localStorage.getItem(twitterKey);
      // here we are going to check whether the data about user is already with us.
      if (localStorage.getItem(twitterKey) !== null) {
        // alert('TEST verified');
        Twitter.verify(deferredLogin);
        $state.go('tab.dash');

      } else {
        // we have no data for save user
        // alert('TEST not verified');
        oauth = OAuth(options);
        oauth.fetchRequestToken(openAuthoriseWindow, failureHandler);
      }

      return deferredLogin.promise;
    },
    //
    //When inAppBrowser's URL changes we will track it here.
    //We will also be acknowledged was the request is a successful or unsuccessful
    //@param _url url received from the event
    //@param _deferred promise associated with login process
    inAppBrowserLoadHandler: function (_url, _deferred) {
      // alert('TEST inAppBrowserLoadHandler');

      // this gets the promise value from the window when running in the browser
      _deferred = _deferred || window.deferredLogin;

      //
      //@param _args
      var successHandler = function (_args) {
        // alert('successHandler: ' + _args);
        console.log(_args);
        // Saving token of access in Local_Storage
        var accessData = {};
        accessData.accessTokenKey = oauth.getAccessToken()[0];
        accessData.accessTokenSecret = oauth.getAccessToken()[1];

        // Configuring Apps LOCAL_STORAGE
        console.log("TWITTER: Storing token key/secret in localStorage");
        $rootScope.accessData = accessData;
        $window.localStorage.setItem(twitterKey, JSON.stringify(accessData));
        Twitter.verify(_deferred);

      };
      //
      //@param _args
      var failureHandler = function (_args) {
        console.log("ERROR - oauth_verifier: " + JSON.stringify(_args));
        _deferred.reject({error: 'user_cancelled', error_description: _args });
      };

      console.log("callbackURL " + callbackURL);

      if(_url.indexOf('oauth_verifier') >= 0) {
      // if (_url.indexOf(callbackURL + "?") >= 0) {

        // Parse the returned URL
        var params, verifier = '';
        params = _url.substr(_url.indexOf('?') + 1);

        params = params.split('&');
        for (var i = 0; i < params.length; i++) {
          var y = params[i].split('=');
          if (y[0] === 'oauth_verifier') {
              verifier = y[1];
          }
        }
        oauth.setVerifier(verifier);
        oauth.fetchAccessToken(successHandler, failureHandler);
        
        loginWindow.close();
      } else {
        // Just Empty
      }
    },
    //
    //this will verify the user and store the credentials if needed
    verify: function (_deferred) {

      // alert('TEST verify');
      
      var deferred = _deferred || $q.defer();
      var storedAccessData, rawData = localStorage.getItem(twitterKey);
      storedAccessData = JSON.parse(rawData);

      // javascript OAuth will care of else for app we need to send only the options
      oauth = oauth || OAuth(options);

      oauth.setAccessToken([storedAccessData.accessTokenKey, storedAccessData.accessTokenSecret]);

      oauth.get('https://api.twitter.com/1.1/account/verify_credentials.json?skip_status=true',
        function (data) {
          // alert('TEST verify resolved');

          $rootScope.userData = JSON.parse(data.text);
          // $rootScope.dataType = typeof userData;
          // $rootScope.name = userData.name;
          // $rootScope.data = userData;

          console.log("in verify resolved " + data.text);
          deferred.resolve(JSON.parse(data.text));
          // $state.go('tab.dash');
        }, function (_error) {
          alert("in verify reject " + _error);
          console.log("in verify reject " + _error);
          deferred.reject(JSON.parse(_error));
        }
      );
      return deferred.promise;
    },
    //this will verify the user and send a tweet
    //@param _message
    tweet: function (_message, _media) {

      var deferred = $q.defer();
      return deferred.promise
        .then(Twitter.verify().then(function () {
          console.log("in tweet verified success");

          tUrl = 'https://api.twitter.com/1.1/statuses/update.json';
          tParams = {
              'status': _message,
              'trim_user': 'true'
          };
          return Twitter.apiPostCall({
              url: tUrl,
              params: tParams
          });

        }, function (_error) {
            deferred.reject(JSON.parse(_error.text));
            console.log("in tweet " + _error.text);
        })
      );
    },
    // uses oAuth library to make a GET call
    // @param _options.url
    // @param _options.params
    apiGetCall: function (_options) {
      var deferred = $q.defer();

      // javascript OAuth will care of else for app we need to send only the options
      oauth = oauth || OAuth(options);

      var _reqOptions = angular.extend({}, _options);
      _reqOptions = angular.extend(_reqOptions, {
        success: function (data) {
          deferred.resolve(JSON.parse(data.text));
        },
        failure: function (error) {
          deferred.reject(JSON.parse(error.text));
        }
      });

      oauth.request(_reqOptions);
      return deferred.promise;
    },
    //uses oAuth library to make a POST call
    //@param _options.url
    //@param _options.params
    apiPostCall: function (_options) {
      var deferred = $q.defer();

      oauth = oauth || OAuth(options);

      oauth.post(_options.url, _options.params,
        function (data) {
          deferred.resolve(JSON.parse(data.text));
        },
        function (error) {
          console.log("in apiPostCall reject " + error.text);
          deferred.reject(JSON.parse(error.text));
        }
      );
      return deferred.promise;
    },
    //
    //clear out the tokens stored in local storage
    logOut: function () {
      // alert('TEST logOut');
      $rootScope.data = undefined;
      window.localStorage.removeItem(twitterKey);
      options.accessTokenKey = null;
      options.accessTokenSecret = null;
      // console.log("Please authenticate to use this app");
      $state.go('login');
    }
  };
  return Twitter;
})
.constant('myAppConfig', {
  oauthSettings: {
    consumerKey: '7Dzf4f6KHKjNNQTHxNFs4Grm2',
    consumerSecret: 'lmpmQqXD7oSXMKjWA0HPd5bMt3hhbpNonuGuw4YpSBOXVluvgZ',
    requestTokenUrl: 'https://api.twitter.com/oauth/request_token',
    authorizationUrl: "https://api.twitter.com/oauth/authorize",
    accessTokenUrl: "https://api.twitter.com/oauth/access_token",
    callbackUrl: "callbackUrl"
  }
});
