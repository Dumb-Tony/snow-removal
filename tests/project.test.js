"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); }
  catch (error) { console.error(`✗ ${name}`); throw error; }
}

test("all local page assets exist", () => {
  const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
  const localReferences = references.filter(reference => !/^(?:https?:|#|data:)/.test(reference));
  assert.ok(localReferences.length >= 3);
  for (const reference of localReferences) {
    const fileReference = reference.split(/[?#]/, 1)[0];
    assert.ok(fs.existsSync(path.join(root, fileReference)), `Missing page asset: ${reference}`);
  }
});

test("the pure core loads before the browser application", () => {
  assert.ok(html.indexOf('src="core.js"') < html.search(/src="app\.js(?:[?#][^"]*)?"/));
});

test("every JavaScript DOM id exists in index.html", () => {
  const ids = [...app.matchAll(/getElementById\("([^"]+)"\)/g)].map(match => match[1]);
  assert.ok(ids.length > 15);
  for (const id of ids) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `Missing DOM id: ${id}`);
  }
});

test("the standalone page has no external runtime dependency", () => {
  const executableReferences = [...html.matchAll(/(?:script src|link rel="stylesheet" href)="([^"]+)"/g)].map(match => match[1]);
  assert.ok(executableReferences.every(reference => !/^https?:/.test(reference)));
});

console.log("All project-integrity tests passed.");
