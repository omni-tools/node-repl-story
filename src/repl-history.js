const {REPLServer} = require('repl');
const fs = require('fs');

const BASIC_WHITELIST = ['.history']; // TODO: make it extendable! (ignore)

const setUpHistory = (replServer, filename, options = {}) => {
  loadHistoryIntoReplServer(replServer, filename, options);
  setUpHistoryRecording(replServer, filename, options); // todo: make it optional (noRecord)

  replServer.commands.history = {
    help: 'Show the history',
    action() {
      replServer.history.map(historyItem => {
        replServer.outputStream.write(historyItem);
        replServer.outputStream.write('\n');
      });
      replServer.displayPrompt();
    }
  };
  return replServer;
};
const loadHistoryIntoReplServer = (replServer, filename, options) => {
  // MAYBE: filter on load? (_.uniq?)
  const history = fs
    .readFileSync(filename)
    .toString()
    .split('\n')
    .reverse()
    .slice(1);
  // MAYBE: better parsing
  replServer.history = history;
  return replServer;
};

const setUpHistoryRecording = (replServer, filename, options) => {
  const descriptor = fs.openSync(filename, 'a');
  const scribe = fs.createWriteStream(filename, {fd: descriptor});

  replServer.on('line', cmd => {
    if (cmd && !BASIC_WHITELIST.includes(cmd)) {
      scribe.write(`${cmd}\n`);
    } else {
      // erase item from history
      replServer.historyIndex++;
      replServer.history.pop();
    }
  });
  process.on('exit', function() {
    fs.closeSync(descriptor);
  });
};

const replHistory = options => {
  const {
    replServer,
    repl = replServer,
    historyFile,
    filename = historyFile,
    prompt,
    noCreate = false
  } = options || {};
  if (!noCreate && !fs.existsSync(filename)) fs.writeFileSync(filename, '');

  // MAYBE: read only mode, injectable values
  if (repl instanceof REPLServer) return setUpHistory(repl, filename);

  return setUpHistory(repl.start(prompt), filename);
};

module.exports = replHistory;
module.exports.loadHistoryIntoReplServer;
