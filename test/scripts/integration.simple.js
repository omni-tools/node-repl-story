#!/usr/bin/env node
const path = require('path');
const replHistory = require('../../src/repl-story');

replHistory(
  process.argv[2] || path.join(__dirname, '..', '..', 'tmp', '.simple.integration.history')
);
