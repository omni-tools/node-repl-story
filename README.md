# `repl-story`

> Load history into node repl

[![npm](https://img.shields.io/npm/v/repl-story.svg)](https://www.npmjs.com/package/repl-story)
[![Build Status](https://travis-ci.com/omni-tools/node-repl-story.svg?branch=master)](https://travis-ci.com/omni-tools/node-repl-story)
[![codecov](https://codecov.io/gh/omni-tools/node-repl-story/branch/master/graph/badge.svg)](https://codecov.io/gh/omni-tools/node-repl-story)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)


## Basic Usage

```js
const repl = require('repl');
const replHistory = require('repl-story');

const filename = '~/.my.cli'
const replServer = replHistory({repl, filename});
// play around in repl
// you can consult history using command .history
```

## Api

`replHistory(options);`
The two mantary field of options are:
- `replServer` or `repl`: either the `repl` module, or a `ReplServer`
- `filename` or `historyFile`: path toward the history file

Here is the other facultative options that can be provided to `replHistory`:
- `prompt`: optional prompt to use if did not provided a `ReplServer` instance
- `create` or `noCreate`: whether history file should be created if missing *[default: `create=true`]*
- `record` or `noRecord`: whether new history should be recorded *[default: `record=true`]*
- `ignore`: an array of values that should not be recorded into history

`replHistory()` return the [`ReplServer`](https://nodejs.org/api/repl.html#repl_class_replserver) instance you provided, or otherwise the one it started.

## Acknowledgment

This is the adaptation of [repl.history](https://github.com/tmpvar/repl.history) to current node Apis.

And why story? `repl-history` was already taken :wink:
