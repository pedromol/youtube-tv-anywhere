import { TV_PAGE_PATTERN, TV_USER_AGENT } from "./config.js";

export function rewriteUserAgent(details) {
  for (const header of details.requestHeaders) {
    if (header.name.toLowerCase() === "user-agent") {
      header.value = TV_USER_AGENT;
    }
  }

  return { requestHeaders: details.requestHeaders };
}

browser.webRequest.onBeforeSendHeaders.addListener(
  rewriteUserAgent,
  { urls: [TV_PAGE_PATTERN] },
  ["blocking", "requestHeaders"]
);
