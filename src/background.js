import { TV_USER_AGENT, TV_PAGE_PATTERN } from "./config.js";

/**
 * Rewrites the User-Agent header to the TV value.
 */
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

console.log('[background] TV User-Agent:', TV_USER_AGENT);
console.log('[background] TV Page Pattern:', TV_PAGE_PATTERN);