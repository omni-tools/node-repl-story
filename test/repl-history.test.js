const test = require('ava');

const replHistory = require('..');

test('I can load it', t => {
  t.is(typeof replHistory, 'function');
});
