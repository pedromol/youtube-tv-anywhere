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

const { TV_USER_AGENT } = await import("../src/config.js");
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
    { name: "User-Agent", value: TV_USER_AGENT },
    { name: "Accept", value: "text/html" },
  ]);
});

test("rewriteUserAgent matches user-agent case-insensitively", () => {
  const details = {
    requestHeaders: [{ name: "user-agent", value: "old" }],
  };

  const result = rewriteUserAgent(details);

  assert.strictEqual(result.requestHeaders[0].value, TV_USER_AGENT);
});
