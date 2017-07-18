var data;
var image;
var timer;
var userID;
var height;
var linkNumber;
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
    if (typeof request.linkNumber !== "undefined"){
      linkNumber = request.linkNumber;
      console.log("linkNumber is: " + linkNumber);
    }
    selectIntent(data);
  }
);

var intentFuncMap = {
  "scroll_up": scrollUp,
  "scroll_up_full": scrollUpFull,
  "scroll_down": scrollDown,
  "scroll_down_full": scrollDownFull,
  "go_back": goBack,
  "go_forward": goForward,
  "show_links": showLinks,
  "open_link": openLink
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
      console.log("sD new position: " + window.scrollY);
  });
}

function scrollDownFull() {
  console.log("I'm trying to scroll down full");
  window.scrollTo(window.scrollY, document.body.scrollHeight);
  chrome.runtime.sendMessage({"actions" : "scrollDownFull", "userID" : userID}, function (response) {
      console.log("scrollDownFull response: " + response);
      console.log("sDF new position: " + window.scrollY);
  });
}

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

function showLinks() {
  console.log("I'm trying to show links");
  var array = [];
  var links = document.getElementsByTagName("a");
  for(var i = 0; i < links.length; i++) {
    array.push(links[i].href);
    console.log("link " + i + " on page: " + array[i]);
    links[i].innerHTML = "<mark>Link " + i + ":</mark> " + links[i].innerHTML;
    links[i].setAttribute("id", i);
  }
  chrome.runtime.sendMessage({"actions" : "showLinks", "userID" : userID}, function (response) {
      console.log("showLinks response: " + response);
  });
}

function openLink() {
  console.log("I'm trying to open link");
  var link = document.getElementById(linkNumber);
  console.log(JSON.stringify(link));
  window.location.href = link;
  chrome.runtime.sendMessage({"actions" : "openLink", "userID" : userID}, function (response) {
      console.log("openLink response: " + JSON.stringify(response));
  });
}

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
