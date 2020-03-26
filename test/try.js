const repl = require('repl');
const path = require('path');
const yargs = require('yargs');

const historyPlease = require('..');

const {filename, prompt, start, create, record, ignore} = yargs
  .option('--filename', {
    alias: 'f',
    string: true,
    default: path.join(__dirname, '.try')
  })
  .option('--prompt', {
    alias: 'p',
    string: true
  })
  .option('--record', {
    alias: 'r',
    boolean: true,
    default: true
  })
  .option('--ignore', {
    alias: 'i',
    string: true,
    default: '',
    coerce: v => v.split(';')
  })
  .option('--start', {
    alias: 's',
    boolean: true,
    default: true
  }).argv;

historyPlease({
  repl: start ? repl.start(prompt) : repl,
  filename,
  create,
  record,
  ignore
});
