"use strict";

const TV_USER_AGENT =
  "Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/5.0 NativeTVAds Safari/538.1";

const TV_PAGE_FILTER = { urls: ["*://*.youtube.com/tv*"] };

function rewriteUserAgent(details) {
  for (const header of details.requestHeaders) {
    if (header.name.toLowerCase() === "user-agent") {
      header.value = TV_USER_AGENT;
    }
  }

  return { requestHeaders: details.requestHeaders };
}

browser.webRequest.onBeforeSendHeaders.addListener(
  rewriteUserAgent,
  TV_PAGE_FILTER,
  ["blocking", "requestHeaders"]
);
