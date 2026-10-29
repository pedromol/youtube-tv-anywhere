import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TV_USER_AGENT,
  TV_PAGE_PATTERN,
  TV_PAGE_URL_FILTER,
} from "../src/config.js";

test("TV_USER_AGENT is a smart-TV user agent string", () => {
  assert.ok(typeof TV_USER_AGENT === "string");
  assert.ok(TV_USER_AGENT.length > 0);
  assert.ok(TV_USER_AGENT.includes("SMART-TV"));
});

test("TV_PAGE_PATTERN matches youtube.com/tv", () => {
  assert.strictEqual(TV_PAGE_PATTERN, "*://*.youtube.com/tv*");
});

test("TV_PAGE_URL_FILTER is the youtube.com/tv filter", () => {
  assert.strictEqual(TV_PAGE_URL_FILTER, "||youtube.com/tv");
});
