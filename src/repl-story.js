const {REPLServer} = require('repl');
const fs = require('fs');
const os = require('os');

const BASIC_WHITELIST = ['.history'];

const setUpHistory = (replServer, filename, options = {}) => {
  loadHistoryIntoReplServer(replServer, filename, options);

  if (!options.noRecord) setUpHistoryRecording(replServer, filename, options);

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
  // MAYBE: filter on load? (_.uniq?), and apply ignore filter?
  const history = fs
    .readFileSync(filename)
    .toString()
    .split('\n')
    .reverse()
    .slice(1);
  replServer.history = history;
  return replServer;
};

const setUpHistoryRecording = (replServer, filename, options) => {
  const descriptor = fs.openSync(filename, 'a');
  const scribe = fs.createWriteStream(filename, {fd: descriptor});

  const whitelist = BASIC_WHITELIST.concat(options.ignore || []);

  replServer.on('line', cmd => {
    if (cmd && !whitelist.includes(cmd)) {
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
    noCreate = false,
    create = !noCreate,
    noRecord = false,
    record = !noRecord,
    ignore
  } = options || {};
  if (!repl) throw new Error('You need to provide repl or replServer');
  if (!filename) throw new Error('You need to provide filename or historyFile');

  const resolvedFilename = filename.replace(/^~/, os.homedir);
  if (create && !fs.existsSync(resolvedFilename)) fs.writeFileSync(resolvedFilename, '');

  const replInstance = repl instanceof REPLServer ? repl : repl.start(prompt);

  return setUpHistory(replInstance, resolvedFilename, {record, ignore});
};

module.exports = replHistory;
module.exports.replStory = replHistory;
module.exports.replHistory = replHistory;
module.exports.loadHistoryIntoReplServer;
