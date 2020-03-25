const repl = require('repl');
const path = require('path');

const historyPlease = require('..');

const historyFile = path.join(__dirname, '.try');

if (process.argv[2] === '--no-start') historyPlease({repl, prompt: ':: ', filename: historyFile});
else historyPlease({repl: repl.start(), historyFile});
