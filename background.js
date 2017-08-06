"use strict";

var config = {
  apiKey: "AIzaSyAkpiEWoAPAca8MsXv26oZPflZWlHABc0I",
  authDomain: "chromecontrol-77635.firebaseapp.com",
  databaseURL: "https://chromecontrol-77635.firebaseio.com",
  projectId: "chromecontrol-77635",
  storageBucket: "chromecontrol-77635.appspot.com",
  messagingSenderId: "258067669794"
};

firebase.initializeApp(config);

function xhrWithAuth(callback) {
  var access_token;
  var retry = true;
  var url = "https://www.googleapis.com/plus/v1/people/me";
  getToken();

  /*** Get the access token and call the identity API ***/
  function getToken() {
      chrome.identity.getAuthToken({ interactive: false }, function(token) {
        if (chrome.runtime.lastError) {
          callback(chrome.runtime.lastError);
          return;
        }
        access_token = token;

        var xhr = new XMLHttpRequest();
        xhr.open("get", url);
        xhr.setRequestHeader("Authorization", "Bearer " + access_token);
        xhr.onload = requestComplete;
        xhr.send();
      });
    }

    /*** Clean up and report any errors ***/
    function requestComplete() {
      if (this.status == 401 && retry) {
        retry = false;
        chrome.identity.removeCachedAuthToken({ token: access_token },
                                              getToken);
      } else {
        callback(null, this.status, this.response);
      }
    }
}

function ongUserFetched(error, status, response) {
  if (!error && status == 200) {
    console.log(response);
    var gUser = JSON.parse(response);
      console.log("there is gUser!!!");
      firebase.database().ref("users/").once('value').then(function(s) {
        console.log("checking if user already exists in firebase...");
        if(!s.val().hasOwnProperty(gUser.id)){
          console.log("user doesn't exist, creating now...");
          firebase.database().ref("users/"+gUser.id).set({
            username: gUser.displayName,
            email: gUser.emails[0].value,
            chromeLoggedIn: true,
            command: "none"
          }, function(){
            console.log("Firebase command reset");
          });
        }
        else {
          console.log("user exist already, moving on...")
          existingUserMonitor(gUser);
        }
      });
    }
    else {
     console.log("Error:", error);
    }
}

function existingUserMonitor(gUser) {
  firebase.database().ref("users/"+gUser.id).update({
    "chromeLoggedIn": true
  });
  firebase.database().ref("users/"+gUser.id).on("value", function (s) {
    console.log("s: " + JSON.stringify(s));
    if (s.val().command != "reset") {
      var cmd = s.val().command;
      switch(cmd){
        case "new_tab":
          chrome.tabs.create({url: "http://google.com"},function(tab){
            console.log("new_tab request completed!");
            fbCmdReset(gUser.id);
          });
          break;
        case "close_tab":
          chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            chrome.tabs.remove(tabs[0].id);
            fbCmdReset(gUser.id);
            console.log("close_tab request completed!");
          });
          break;
        //--- new code for sites_search
        case "sites_search":
          var site =  s.val().siteName || "google";
          var query = s.val().siteQuery || "current weather";
          var url = "";
          switch (site){
            case "Quora":
              url = "https://www.quora.com/search?q=";
              break;
            case "Amazon":
              url = "https://www.amazon.com/s/field-keywords";
              break;
            case "Facebook":
              url = "https://www.facebook.com/search/top/?q=";
              break;
            case "Twitter":
              url = "https://twitter.com/search?q=";
              break;
            case "Google":
              url = "http://google.com/#q=";
              break;
            case "Stack Overflow":
              url = "https://stackoverflow.com/search?q=";
              break;
            case "YouTube":
              url = "https://www.youtube.com/results?search_query=";
              break;
            default:
          }
          url += query;
          chrome.tabs.create({url: url}, function(tab){
              fbCmdReset(gUser.id);
              console.log("sites_search request completed!");
          });
          break;
        //--- end new code
        case "zoom":
          chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            chrome.tabs.getZoom(tabs[0].id, function(zoomFactor) {
              var zoomType = s.val().zoomType;
              if(zoomType == "reset" || (zoomType == "out" && (zoomFactor - 0.25) <= 0)){
                zoomChange = 1.0;
                console.log("zoomChange reset to 1.0 aka 100%");
              }
              else {
                var zoomChange = zoomType == "in" ? 0.25 + zoomFactor : zoomFactor - 0.25;
              }
              console.log("zoomType is: " + zoomType);
              console.log("changing from " + zoomFactor + " --> " + zoomChange);
              chrome.tabs.setZoom(tabs[0].id, zoomChange, function(){
                console.log("done zooming now!!!");
                fbCmdReset(gUser.id);
              });
            });
          });
          break;
        case "website_search":
          var websiteUrl = !s.val().websiteUrl.includes("http") ? "http://" + s.val().websiteUrl : s.val().websiteUrl;
          if(websiteUrl.includes("..")){
            websiteUrl = websiteUrl.replace("..",".");
          }
          chrome.tabs.create({url: websiteUrl}, function(tab){
            fbCmdReset(gUser.id);
            console.log("website_search request completed!");
          });
          break;
        case "create_bookmark":
          console.log("in bookmark spot!!!");
          chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            var title = tabs[0].title;
            var url = tabs[0].url;
            chrome.bookmarks.search("Browser Control", function(results){
              if(!results.length){
                chrome.bookmarks.create({"parentId": "1", "title": "Browser Control"},
                  function(newFolder) {
                    console.log("added folder: " + newFolder.title);
                    addUrlToBookmarks(newFolder.id, title, url, gUser.id);
                });
              }
              else {
                console.log("bookmark results: " + JSON.stringify(results));
                console.log("Found bookmark folder!!! " + results[0].id);
                addUrlToBookmarks(results[0].id, title, url, gUser.id);
              }
            });
          });
          break;
        case "reload_page":
          chrome.tabs.query({ lastFocusedWindow: true, active: true }, function (tabs) {
            fbCmdReset(gUser.id);
            chrome.tabs.reload(tabs[0].id, { bypassCache: true }, function(){
              console.log("reload_page request completed!");
            });
          });
          break;
        case "remove_links":
          chrome.tabs.query({lastFocusedWindow: true, active: true }, function (tabs) {
            fbCmdReset(gUser.id);
            chrome.tabs.reload(tabs[0].id, { bypassCache: false }, function(){
              console.log("remove_links request completed!");
            });
          });
          break;
        case "close_window":
          fbCmdReset(gUser.id);
          if(s.val().windowType == "current"){
            chrome.windows.getLastFocused(function(window){
              chrome.windows.remove(window.id, function(){
                console.log("close_window request completed! (single window)");
              });
            });
          }
          else {
            chrome.windows.getAll(function(windows){
              console.log("windows: " + JSON.stringify(windows));
              var i;
              for(i = 0; i < windows.length; i++){
                chrome.windows.remove(windows[i]["id"], function(){
                  console.log("close_window request completed! (multiple windows)");
                });
              }
            });
          }
          break;
        case "restore_window":
          fbCmdReset(gUser.id);
          chrome.sessions.restore(function(restoredSession){
            console.log("restore_window request completed!");
          });
        break;
        default:
          chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            var params = { data: s.val().command, userID: gUser.id, height: tabs[0].height};
            if(s.val().command == "open_link"){
              params.linkNumber = s.val().linkNumber;
            }
            chrome.tabs.sendMessage(tabs[0].id, params, function (response) {
              console.log("response: "+JSON.stringify(response));
            });
          });
        }
      }
    });
}

function addUrlToBookmarks(id, title, url, userID){
  chrome.bookmarks.create({"parentId": id, "title": title, "url": url},
  function(result){
    fbCmdReset(userID);
  });
}

function fbCmdReset(userID){
  firebase.database().ref("users/"+userID).update({ "command": "reset" }, function(){
    console.log("Firebase command reset");
  });
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    fbCmdReset(request.userID);
    console.log("hi!!!!");
    console.log("background.js request: " + JSON.stringify(request));
    console.log("background.js sender: " + JSON.stringify(sender));
    if(request !== undefined){
      sendResponse({response: "got " + request.actions + " request!"});
      console.log("got " + request.actions + " request!");
    }
  });

xhrWithAuth(ongUserFetched);
