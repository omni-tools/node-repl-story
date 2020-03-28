const REPL = require('repl');
const {PassThrough, Writable} = require('stream');
const fs = require('fs');
const path = require('path');
const test = require('ava');
const replHistory = require('../src/repl-story');

const TMP_FOLDER = path.join(__dirname, '..', 'tmp', String(process.pid));
const makeHistoryFilename = () => path.join(TMP_FOLDER, `.history-file.${Date.now()}`);

const getReplInputStream = () => new PassThrough();
const getReplOutpuStream = captureBuffer =>
  Object.assign(
    new Writable({
      captureBuffer,
      write(chunck, encoding, cb) {
        captureBuffer.push(chunck.toString());
        cb();
      }
    }),
    {captureBuffer}
  );

const getRepl = () => {
  const capturedOutput = [];
  const replServer = REPL.start({
    input: getReplInputStream(),
    output: getReplOutpuStream(capturedOutput)
  });

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
  for (const folder of [path.dirname(TMP_FOLDER), TMP_FOLDER]) {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }
  }
});

test('exposed function and helpers/aliases by module', t => {
  t.is(typeof replHistory, 'function');
  t.is(typeof replHistory.replHistory, 'function');
  t.is(typeof replHistory.replStory, 'function');
});

test('crash if missing args', t => {
  t.throws(() => replHistory(), {
    message: 'Missing options. Provide either an historyFile path or a config object'
  });
  t.throws(() => replHistory({}), {
    message: 'You need to provide filename or historyFile'
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

test('should crash if file does not exist and no create option', async t => {
  const repl = getRepl();
  t.throws(() => replHistory({repl, filename: '~/T/H/I/S/not/Exist/Okay', create: false}), {
    message: `Provided filename does not exists and create is disabled`
  });
  t.throws(
    () => replHistory({repl, filename: '~/We/do/not/want/to/goto/Tataouine', noCreate: true}), // considered evil
    {message: `Provided filename does not exists and create is disabled`}
  );
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

test('correctly set up instantiating a repl', async t => {
  const filename = makeHistoryFilename();
  const captureBuffer = [];
  const input = getReplInputStream();
  const output = getReplOutpuStream(captureBuffer);
  // output and input are forwared to repl.start()
  const repl = replHistory({input, output, filename, prompt: ':: '});
  repl.inputStream.write("'Self instantiating repl'\n");
  t.deepEqual(repl.outputStream.captureBuffer, [':: ', "'Self instantiating repl'\n", ':: ']);
  repl.close();
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

test('enable writing to repl, but no history preserved', async t => {
  const repl = getRepl();
  const filename = makeHistoryFilename();
  const historyItems = ['1+1', '2', "'makes four'"];
  fs.writeFileSync(filename, historyItems.concat(['']).join('\n'));
  const wrapRepl = replHistory({repl, filename, record: false});

  wrapRepl.inputStream.write('.history\n');
  t.deepEqual(repl.outputStream.captureBuffer, [
    '> ',
    ...historyItems
      .map(i => [`${i}`, '\n'])
      .reverse()
      .flat(),
    '> '
  ]);
  wrapRepl.inputStream.write("'say something cool but secrete\n");
  wrapRepl.inputStream.write("'something cool but secrete'\n");
  t.is(wrapRepl.last, 'something cool but secrete');
  await wrapRepl.cleanClose();

  const historyContent = fs
    .readFileSync(filename)
    .toString()
    .split('\n')
    .filter(line => line.length);
  t.deepEqual(historyContent, historyItems, 'History didnt stayed the same');
});
