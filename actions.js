var data;
var image;
var timer;
var userID;
var height;
// var googleQuery;
// var stackoverflowQuery;
// var youtubeQuery;
var synth = window.speechSynthesis;
var utterThis = new SpeechSynthesisUtterance("I'm sorry, I don't understand that request. Please try again later or try a different request.");

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.log("DATA: " + request.data);
    data = request.data;
    userID = request.userID;
    if (typeof request.height !== "undefined"){
      height = request.height;
      console.log("height is: " + height);
    }
    // if (typeof request.googleQuery !== "undefined"){
    //   googleQuery = request.googleQuery;
    //   console.log("googleQuery is: " + googleQuery);
    // }
    // if (typeof request.stackoverflowQuery !== "undefined"){
    //   stackoverflowQuery = request.stackoverflowQuery;
    //   console.log("stackoverflowQuery is: " + stackoverflowQuery);
    // }
    // if (typeof request.youtubeQuery !== "undefined"){
    //   youtubeQuery = request.youtubeQuery;
    //   console.log("youtubeQuery is: " + youtubeQuery);
    // }
    selectIntent(data);
  }
);

var intentFuncMap = {
  "scroll_up": scrollUp,
  "scroll_up_full": scrollUpFull,
  "scroll_down": scrollDown,
  "scroll_down_full": scrollDownFull,
  // "new_tab": newTab,
  // "google_search": googleSearch,
  // "stackoverflow_search": stackoverflowSearch,
  // "youtube_search": youtubeSearch,
  "go_back": goBack,
  "go_forward": goForward,
  // "close_tab": closeTab,
};

function scrollUp() {
  console.log("I'm trying to scroll up");
  window.scrollBy(window.scrollY, -height/2);
  chrome.runtime.sendMessage({"actions" : "scrollUp", "userID" : userID}, function (response) {
      console.log("scrollUp response: " + response);
  });
}

function scrollUpFull() {
  console.log("I'm trying to scroll up full");
  window.scrollTo(window.scrollY, 0);
  chrome.runtime.sendMessage({"actions" : "scrollUpFull", "userID" : userID}, function (response) {
      console.log("scrollUpFull response: " + response);
  });
}

function scrollDown() {
  console.log("I'm trying to scroll down");
  window.scrollBy(window.scrollY, height/2);
  chrome.runtime.sendMessage({"actions" : "scrollDown", "userID" : userID}, function (response) {
      console.log("scrollDown response: " + response);
  });
}

function scrollDownFull() {
  console.log("I'm trying to scroll down full");
  window.scrollTo(window.scrollY, height);
  chrome.runtime.sendMessage({"actions" : "scrollDownFull", "userID" : userID}, function (response) {
      console.log("scrollDownFull response: " + response);
  });
}

// function newTab() {
//   console.log("I'm trying to new tab");
//   chrome.runtime.sendMessage({"actions" : "newTab", "userID" : userID}, function (response) {
//       console.log("newTab response: " + response);
//   });
// }

// function googleSearch() {
//   console.log("I'm trying to google search");
//   chrome.runtime.sendMessage({"actions" : "googleSearch", "userID" : userID, "googleQuery" : googleQuery}, function (response) {
//       console.log("googleSearch response: " + response);
//   }); 
// }

// function stackoverflowSearch() {
//   console.log("I'm trying to stackoverflow search");
//   chrome.runtime.sendMessage({"actions" : "stackoverflowSearch", "userID" : userID, "stackoverflowQuery" : stackoverflowQuery}, function (response) {
//       console.log("stackoverflowSearch response: " + response);
//   }); 
// }

// function youtubeSearch() {
//   console.log("I'm trying to youtube search");
//   chrome.runtime.sendMessage({"actions" : "youtubeSearch", "userID" : userID, "youtubeQuery" : youtubeQuery}, function (response) {
//       console.log("youtubeSearch response: " + response);
//   }); 
// }

function goBack() {
  console.log("I'm trying to go back");
  window.history.back();
  chrome.runtime.sendMessage({"actions" : "goBack", "userID" : userID}, function (response) {
      console.log("goBack response: " + response);
  });
}

function goForward() {
  console.log("I'm trying to go forward");
  window.history.forward();
  chrome.runtime.sendMessage({"actions" : "goForward", "userID" : userID}, function (response) {
      console.log("goForward response: " + response);
  });
}

// function closeTab() {
//   console.log("I'm trying to close tab");
//   chrome.runtime.sendMessage({"actions" : "closeTab", "userID" : userID}, function (response) {
//       console.log("closeTab response: " + response);
//   });
// };

function selectIntent(data) {
  console.log("inside selectIntent!!!");
  var foundFunction = false;
  var x;
  for (var key in intentFuncMap) {
    if (data == key) {
      console.log("found function! it is: " + key);
      foundFunction = true;
      x = key
      break;
    }
  }
  if (foundFunction){
    intentFuncMap[x]();
  }
  else {
    if (data != "reset") {
      synth.speak(utterThis);
    }
  }
}