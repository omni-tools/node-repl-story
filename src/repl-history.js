const {REPLServer} = require('repl');
const fs = require('fs');

const loadHistoryIntoReplServer = (replServer, historyFile) => {
  const history = fs
    .readFileSync(historyFile)
    .toString()
    .split('\n'); // TODO: better parsing
  replServer.history = history;

  return replServer;
};

const replHistory = options => {
  const {replServer, repl = replServer, historyFile, filename = historyFile, prompt} =
    options || {};
  // TODO: check historyFile exists
  if (repl instanceof REPLServer) return loadHistoryIntoReplServer(repl, filename);

  return loadHistoryIntoReplServer(repl.start(prompt), filename);
};

module.exports = replHistory;
module.exports.loadHistoryIntoReplServer;
