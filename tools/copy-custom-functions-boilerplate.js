#!/usr/bin/env node --harmony

const path = require('path');
const fs = require('fs-extra');

const readContents = fs.readFileSync(
  path.resolve(__dirname, '../dist/custom-functions-boilerplate/console.g.js')
);
const encodedContents = encodeURIComponent(readContents);
const fullContents = [
  'export const consoleMonkeypatch = `',
  encodedContents,
  '`;',
  '',
].join('\n');

fs.writeFileSync(
  path.resolve(__dirname, '../src/server/custom-functions/console-monkeypatch.ts'),
  fullContents
);
