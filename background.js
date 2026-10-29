"use strict";

function rewriteUserAgent(x) {
  for (var header of x.requestHeaders) {
    if (header.name.toLowerCase() === "user-agent") {
      header.value = "Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/5.0 NativeTVAds Safari/538.1";
    }
  }
  return {requestHeaders: x.requestHeaders};
}

//chrome.webRequest.onBeforeSendHeaders.addListener(rewriteUserAgent, {urls: ["*://*.youtube.com/tv*", "*://*.youtube.com/pair*"]}, ["blocking", "requestHeaders"]);
chrome.webRequest.onBeforeSendHeaders.addListener(rewriteUserAgent, {urls: ["*://*.youtube.com/tv*"]}, ["blocking", "requestHeaders"]);


