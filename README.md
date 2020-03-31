# `repl-story`

> Load history into node repl

[![npm](https://img.shields.io/npm/v/repl-story.svg)](https://www.npmjs.com/package/repl-story)
[![Build Status](https://travis-ci.com/omni-tools/node-repl-story.svg?branch=master)](https://travis-ci.com/omni-tools/node-repl-story)
[![codecov](https://codecov.io/gh/omni-tools/node-repl-story/branch/master/graph/badge.svg)](https://codecov.io/gh/omni-tools/node-repl-story)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)


## Basic Usage

```js
const replHistory = require('repl-story');

const replServer = replHistory('~/.my.wonderful.cli');
// play around in repl
// you can consult history using command .history
```

## Api

`replHistory` supports differents signatures:

```js
replHistory(repl|replServer, filename); // original signature similar to repl.history
replHistory(filename, [repl|replServer]);
replHistory(options);
replHistory(filename, options);
//  -> REPLServer
```

Here are the different possible params:
-  **`filename` or `historyFile`**: the path toward the history file. `filename` is mandatory.
  However you can skip it and provide it via the `options` argument as the `filename` property (you can also use the alias `historyFile`).
-  **`replServer` or `repl`**: either the `repl` module, or a `ReplServer`. *[default the `require('repl')` builtin library]*

-  an **`options` object**, this give you better control over `repl` and `repl-story` configuration.
  This is a plain old js object that support the following properties
    - **`filename` or `historyFile`**: if not provided as leading argument, you can embed the file configuration into the option object.
    - **`replServer` or `repl`**: either the `repl` module, or a `ReplServer`. *[default the `require('repl')` builtin library]*
    - `create` or `noCreate`: whether history file should be created if missing *[default: `create=true`]*
    - `record` or `noRecord`: whether new history should be recorded *[default: `record=true`]*
    - `ignore`: an array of values that should not be recorded into history
    - any other options supported by `repl.start()` if you did not provided a `ReplServer` instance, such as:
      - `prompt`: optional prompt to use *[default `'> '`]*
      - `input`:  Readable stream to read from *[default `'process.stdin`]*
      - `output`:  Readable stream to write to *[default `process.stdout`]*
      - any other [option `repl.start()` supports](https://nodejs.org/api/repl.html#repl_repl_start_options) like `eval`, `writer`, `completer`, `useColors`; `terminal` `replMode`


`replHistory()` return the [`REPLServer`](https://nodejs.org/api/repl.html#repl_class_replserver) instance you provided, or otherwise the one it started.


**Note:** replHistory instrument the repl server so that when it closes the history file is closed properly.
If you want for this to be complete, you can listen the `end-of-story` event on the replServer itself.

### 'Complex' Example
Here is an example to illustrate how to configure `repl-story`:

```js
const repl = require('repl');
const replHistory = require('repl-story');

const replServer = replHistory({
    repl,
    filename: '~/.my.cli',
    record: false, // load history but do no record it. (equivalent to 'noRecord: true')
    noCreate: true, // disable creation if missing. (equivalent to 'create: false')
    prompt: ':> ' // options are forwarded to repl.start() if no provided replServer
});
```

## Acknowledgment

This started as the adaptation of [repl.history](https://github.com/tmpvar/repl.history) to current node Apis.

*And why story?* `repl-history` was already taken :wink:
