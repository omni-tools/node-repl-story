const REPL = require('repl');
const fs = require('fs');
const os = require('os');

const BASIC_WHITELIST = ['.history'];

const setUpHistory = (replServer, filename, options) => {
  loadHistoryIntoReplServer(replServer, filename, options);

  if (options.record) setUpHistoryRecording(replServer, filename, options);

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
const loadHistoryIntoReplServer = (replServer, filename) => {
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

  let writing = false;
  const close = () => {
    if (writing) return setTimeout(close, 25);
    fs.closeSync(descriptor);
    replServer.emit('end-of-story');
  };

  replServer.on('line', cmd => {
    if (cmd && !whitelist.includes(cmd)) {
      writing = true;
      scribe.write(`${cmd}\n`, () => {
        writing = false;
      });
    } else {
      // erase item from history
      replServer.historyIndex++;
      replServer.history.pop();
    }
  });
  replServer.on('exit', close);
};

const isReplLike = repl =>
  repl === REPL || repl instanceof REPL.REPLServer || typeof repl.start === 'function';

// MAYBE: should consider lodash :smirk:
const isPlainObject = value => value != null && value.constructor.name === 'Object';

const resolveOptions = args => {
  if (args.length === 0)
    throw new Error('Missing options. Provide either an historyFile path or a config object');

  if (args.length === 1) return isPlainObject(args[0]) ? [undefined, args[0]] : [args[0], {}];

  if (isReplLike(args[0])) return [args[1], {repl: args[0]}]; // repl.history signature
  return isReplLike(args[1]) ? [args[0], {repl: args[1]}] : args;
};

const replHistory = (...args) => {
  const [standaloneFilename, options] = resolveOptions(args);

  const {
    replServer = REPL,
    repl = replServer,
    historyFile = standaloneFilename,
    filename = historyFile,
    noCreate = false,
    create = !noCreate,
    noRecord = false,
    record = !noRecord,
    ignore
  } = options;

  if (!filename) throw new Error('You need to provide filename or historyFile');
  if (typeof filename !== 'string') throw new Error('History filename needs to be a string');

  if (!isReplLike(repl)) throw new Error('Unexpected repl/replServer provided');

  const resolvedFilename = filename.replace(/^~/, os.homedir);
  if (!fs.existsSync(resolvedFilename)) {
    if (!create) throw new Error(`Provided filename does not exists and create is disabled`);
    fs.writeFileSync(resolvedFilename, '');
  }

  // Note, passing options enable to forward all options to repl.start
  const replInstance = repl instanceof REPL.REPLServer ? repl : repl.start(options);

  return setUpHistory(replInstance, resolvedFilename, {record, ignore});
};

module.exports = replHistory;
module.exports.replStory = replHistory;
module.exports.replHistory = replHistory;
module.exports.loadHistoryIntoReplServer;
module.exports._utils = {isPlainObject, isReplLike};
