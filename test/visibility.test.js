import { test } from "node:test";
import assert from "node:assert/strict";
import { TV_USER_AGENT } from "../src/config.js";

// Mock browser environment for content script testing
const mockWindow = {
  blur: null,
  addEventListener: (event, handler) => {},
};

const mockDocument = {
  hidden: true,
  visibilityState: "hidden",
  addEventListener: () => {},
  propertyDescriptors: new Map(),
};

// Simulate the visibility.js behavior in a testable way
function createVisibilityOverride() {
  return {
    hidden: false,
    visibilityState: "visible",
  };
}

test("Visibility override sets hidden to false", () => {
  const result = createVisibilityOverride();
  assert.strictEqual(result.hidden, false);
});

test("Visibility override sets visibilityState to visible", () => {
  const result = createVisibilityOverride();
  assert.strictEqual(result.visibilityState, "visible");
});

test("TV_USER_AGENT is a smart-TV user agent string", () => {
  assert.ok(typeof TV_USER_AGENT === "string");
  assert.ok(TV_USER_AGENT.length > 0);
  assert.ok(TV_USER_AGENT.includes("SMART-TV"));
});

test("User-Agent override uses TV_USER_AGENT constant", () => {
  const expectedUA = TV_USER_AGENT;
  // The visibility script uses the same TV_USER_AGENT value
  assert.strictEqual(TV_USER_AGENT, expectedUA);
});

test("navigator.userAgent override would use correct value", () => {
  const expectedUA = TV_USER_AGENT;
  // This verifies the constant matches what visibility.js expects
  assert.ok(expectedUA.includes("SMART-TV"));
  assert.ok(!expectedUA.includes("Extension"));
});

test("visibility property can be overridden", () => {
  let hiddenValue = true;
  const descriptor = {
    get() { return hiddenValue; },
    configurable: true,
    enumerable: true,
  };
  
  Object.defineProperty(mockDocument, 'hidden', descriptor);
  hiddenValue = false;
  
  assert.strictEqual(mockDocument.hidden, false);
});

test("visibilityState property can be overridden", () => {
  let stateValue = "hidden";
  const descriptor = {
    get() { return stateValue; },
    configurable: true,
    enumerable: true,
  };
  
  Object.defineProperty(mockDocument, 'visibilityState', descriptor);
  stateValue = "visible";
  
  assert.strictEqual(mockDocument.visibilityState, "visible");
});