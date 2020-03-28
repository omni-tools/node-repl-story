const path = require('path');
const {spawn} = require('child_process');
const test = require('ava');

const TMP_FOLDER = path.join(__dirname, '..', 'tmp');
const makeHistoryFilename = suffix =>
  path.join(TMP_FOLDER, `.integration.history.${process.pid}.${suffix}`);

const getIntegrationScriptPath = file => path.join(__dirname, 'scripts', file);

test.cb('basic integration test', t => {
  const repl = spawn(getIntegrationScriptPath('integration.simple.js'), [
    makeHistoryFilename('simple')
  ]);
  const errors = [];
  const lines = [];
  repl.stderr.on('data', err => errors.push(err.toString()));
  repl.stdout.on('data', data => lines.push(data.toString()));
  repl.stdout.once('data', () => {
    t.deepEqual(lines, ['> ']);
    repl.stdin.write('"ki" + "kou"\n');
    setTimeout(() => {
      t.deepEqual(lines.join(''), "> 'kikou'\n> ");
      repl.kill();
    }, 800);
  });

  repl.on('close', code => {
    if (code > 0) return t.end(new Error(errors[0]));
    t.end();
  });
});
