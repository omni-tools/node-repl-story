const REPL = require('repl');
const fs = require('fs');
const os = require('os');

const BASIC_WHITELIST = ['.history'];

const setUpHistory = (replServer, filename, options = {}) => {
  loadHistoryIntoReplServer(replServer, filename, options);

  if (!options.noRecord) setUpHistoryRecording(replServer, filename, options);

  replServer.defineCommand('history', {
    help: 'Show the history',
    action() {
      this.history.map(historyItem => {
        this.outputStream.write(historyItem);
        this.outputStream.write('\n');
      });
      this.displayPrompt();
    }
  });
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
  replServer.on('exit', () => fs.closeSync(descriptor));
};

const replHistory = options => {
  if (!options)
    throw new Error('Missing options. Provide either an historyFile path or a config object');
  if (typeof options === 'string') options = {filename: options};

  const {
    replServer = REPL, // FIXME: check
    repl = replServer,
    historyFile,
    filename = historyFile,
    noCreate = false,
    create = !noCreate,
    noRecord = false,
    record = !noRecord,
    ignore
  } = options;

  if (!filename) throw new Error('You need to provide filename or historyFile');

  if (repl !== REPL && !(repl instanceof REPL.REPLServer) && typeof repl.start !== 'function')
    throw new Error('Unexpected repl/replServer provided');

  const resolvedFilename = filename.replace(/^~/, os.homedir);
  if (create && !fs.existsSync(resolvedFilename)) fs.writeFileSync(resolvedFilename, '');

  // Note, passing options enable to forward all options to repl.start
  const replInstance = repl instanceof REPL.REPLServer ? repl : repl.start(options);

  return setUpHistory(replInstance, resolvedFilename, {record, ignore});
};

module.exports = replHistory;
module.exports.replStory = replHistory;
module.exports.replHistory = replHistory;
module.exports.loadHistoryIntoReplServer;
