import { test } from "node:test";
import assert from "node:assert/strict";

// Mock browser.webRequest before importing the module under test
globalThis.browser = {
  webRequest: {
    onBeforeSendHeaders: {
      addListener: () => {},
    },
  },
};

const { rewriteUserAgent } = await import("../src/background.js");

test("rewriteUserAgent sets the user-agent header to the TV value", () => {
  const details = {
    requestHeaders: [
      { name: "User-Agent", value: "Mozilla/5.0 Chrome" },
      { name: "Accept", value: "text/html" },
    ],
  };

  const result = rewriteUserAgent(details);

  assert.deepStrictEqual(result.requestHeaders, [
    { name: "User-Agent", value: "Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/5.0 NativeTVAds Safari/538.1" },
    { name: "Accept", value: "text/html" },
  ]);
});

test("rewriteUserAgent matches user-agent case-insensitively", () => {
  const details = {
    requestHeaders: [{ name: "user-agent", value: "old" }],
  };

  const result = rewriteUserAgent(details);

  assert.strictEqual(result.requestHeaders[0].value, "Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/5.0 NativeTVAds Safari/538.1");
});
