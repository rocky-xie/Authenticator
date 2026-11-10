"use strict";

const fs = require("fs");
const path = require("path");

function readMessages(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8").replace(/^\uFEFF/, ""));
}

const localeRoot = path.resolve(__dirname, "..", "_locales");
const english = readMessages(path.join(localeRoot, "en", "messages.json"));

for (const locale of fs.readdirSync(localeRoot).sort()) {
  if (locale === "en") {
    continue;
  }
  const filename = path.join(localeRoot, locale, "messages.json");
  const messages = readMessages(filename);
  let changed = false;

  for (const key of Object.keys(english)) {
    if (!Object.prototype.hasOwnProperty.call(messages, key)) {
      messages[key] = english[key];
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filename, `${JSON.stringify(messages, null, 2)}\n`);
  }
}
