const REPL = require('repl');
const {PassThrough} = require('stream');
const test = require('ava');
const {isPlainObject, isReplLike} = require('../src/repl-story')._utils;

test('isPlainObject', t => {
  for (const po of [{}, {hello: 'world'}]) t.true(isPlainObject(po));

  for (const notPo of ['string', 12, 2.4, /regex(p)/, []])
    t.false(isPlainObject(notPo), String(notPo));
});

test('isReplLike', t => {
  const fakeStart = () => {};
  const replServerLike = {start: fakeStart};
  const replServer = REPL.start({input: new PassThrough(), output: new PassThrough()});

  t.true(isReplLike(REPL), 'Should identify the REPL module himseld');
  t.true(isReplLike(replServer), 'Should identify a REPL server');
  t.true(isReplLike(replServerLike), 'Should identify module/object with a start function');
  replServer.close();

  for (const notRepl of ['string', 12, 2.4, /regex(p)/, [], new Object(), {}, {some: 'obj'}])
    t.false(isReplLike(notRepl, `${notRepl} a repl`));
});
