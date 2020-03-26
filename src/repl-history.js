const {REPLServer} = require('repl');
const fs = require('fs');

const BASIC_WHITELIST = []; // TODO: make it configurable!

const setUpHistory = (replServer, filename) => {
  loadHistoryIntoReplServer(replServer, filename);
  setUpHistoryRecording(replServer, filename); // todo: make it optional

  // TODO: commands and more!
  return replServer;
};
const loadHistoryIntoReplServer = (replServer, filename) => {
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

const setUpHistoryRecording = (replServer, filename) => {
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
