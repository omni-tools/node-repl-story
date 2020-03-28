const REPL = require('repl');
const {PassThrough, Writable} = require('stream');
const fs = require('fs');
const path = require('path');
const test = require('ava');
const replHistory = require('..');

const TMP_FOLDER = path.join(__dirname, '..', 'tmp');
const makeHistoryFilename = () => path.join(TMP_FOLDER, `.history-file.${Date.now()}`);

const getRepl = () => {
  const capturedOutput = [];
  const outputStream = new Writable({
    write(chunck, encoding, cb) {
      capturedOutput.push(chunck.toString());
      cb();
    }
  });
  const inputStream = new PassThrough();
  const replServer = REPL.start({input: inputStream, output: outputStream});

  const cleanClose = (beforeCloseDelay = 200, afterCloseDelay = 120) => {
    return new Promise(resolve => {
      setTimeout(() => {
        replServer.on('close', () => setTimeout(resolve, afterCloseDelay));
        replServer.close();
      }, beforeCloseDelay);
    });
  };

  return Object.assign(replServer, {capturedOutput, cleanClose});
};

const filterOutput = (outputChuncks, prompt = '> ') =>
  outputChuncks.filter(chunck => ![prompt, '\n'].includes(chunck));

test.before(() => {
  if (!fs.existsSync(TMP_FOLDER)) {
    fs.mkdirSync(TMP_FOLDER);
  }
});

test('exposed function and helpers/aliases by module', t => {
  t.is(typeof replHistory, 'function');
  t.is(typeof replHistory.replHistory, 'function');
  t.is(typeof replHistory.replStory, 'function');
});

test('crash if missing args', t => {
  t.throws(() => replHistory());
  t.throws(() => replHistory({repl: 'REPL STUB'}), {
    message: 'You need to provide filename or historyFile'
  });
  t.throws(() => replHistory({filename: 'FILENAME STUB'}), {
    message: 'You need to provide repl or replServer'
  });
});

test('crash if no valid repl provided', t => {
  t.throws(() => replHistory({filename: 'FILENAME STUB', repl: 'not a repl ;)'}), {
    message: 'Unexpected repl/replServer provided'
  });
});

test('correctly wrap a repl', async t => {
  const repl = getRepl();
  const filename = makeHistoryFilename();
  const wrapRepl = replHistory({repl, filename});
  t.is(wrapRepl, repl, 'Different repl was returned!');
  await wrapRepl.cleanClose();
});

test('enable writing to repl, and have history preserved', async t => {
  const repl = getRepl();
  const filename = makeHistoryFilename();
  const wrapRepl = replHistory({repl, filename});

  wrapRepl.inputStream.write("'Hello World!'\n");
  wrapRepl.inputStream.write("'Salut à tous!'\n");
  t.is(wrapRepl.last, 'Salut à tous!');
  wrapRepl.inputStream.write("'Hola Todos!'\n");
  wrapRepl.inputStream.write("'Bon allé, fini les histoires!'\n");
  t.is(wrapRepl.last, 'Bon allé, fini les histoires!');
  await wrapRepl.cleanClose();

  const historyContent = fs
    .readFileSync(filename)
    .toString()
    .split('\n')
    .filter(line => line.length);
  t.is(historyContent.length, 4, 'Invalid number of history item recorded');
});

test('supports history loading and access via command', async t => {
  const repl = getRepl();
  const filename = makeHistoryFilename();
  const historyItems = ['1+1', '2', "'makes four'"];
  fs.writeFileSync(filename, historyItems.concat(['']).join('\n'));
  const wrapRepl = replHistory({repl, filename});

  wrapRepl.inputStream.write('.history\n');
  t.is(wrapRepl.last, undefined);
  const outputItems = filterOutput(wrapRepl.capturedOutput);
  t.deepEqual([...outputItems].reverse(), historyItems);
  await wrapRepl.cleanClose();
});
