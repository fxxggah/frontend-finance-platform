const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');

const filename = require.resolve('../lib/format/money.ts');
const moneyModule = new Module(filename, module);
moneyModule._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { maskMoneyInput, moneyPasteDigits, parseMoneyInput, formatMoneyInput, formatMoney } = moneyModule.exports;

test('bank typing uses cents and preserves empty and zero values', () => {
  for (const [digits, expected] of [['', ''], ['0', '0,00'], ['1', '0,01'], ['12', '0,12'], ['123', '1,23'], ['123456', '1.234,56'], ['000123456', '1.234,56']]) {
    assert.equal(maskMoneyInput(digits), expected);
  }
  assert.equal(maskMoneyInput('abc123'), null);
  assert.equal(maskMoneyInput('9007199254740992'), null);
  assert.equal(maskMoneyInput('9007199254740991'), null);
});

test('clipboard accepts Brazilian amounts and raw cents; malformed text is rejected', () => {
  for (const text of ['123456', '1.234,56', 'R$ 1.234,56', '  R$\u00a01.234,56  ']) {
    assert.equal(maskMoneyInput(moneyPasteDigits(text)), '1.234,56');
  }
  assert.equal(maskMoneyInput(moneyPasteDigits('12,3')), '12,30');
  assert.equal(maskMoneyInput(moneyPasteDigits('1.234')), '1.234,00');
  for (const text of ['abc123', '1.23,45', '1,234.56', '1,234', '1e3', '', 'R$']) {
    assert.equal(moneyPasteDigits(text), null, text);
  }
});

test('negative input is restricted to fields that explicitly support it', () => {
  assert.equal(maskMoneyInput('-123456'), null);
  assert.equal(moneyPasteDigits('-1.234,56'), null);
  assert.equal(maskMoneyInput('-', true), '-');
  assert.equal(maskMoneyInput('-123456', true), '-1.234,56');
  assert.equal(maskMoneyInput(moneyPasteDigits('-R$ 1.234,56', true), true), '-1.234,56');
});

test('editing and payload conversion keep reais and reject partial parses', () => {
  for (const value of [0, 0.01, 1234.56, -1234.56, 999999999.99]) {
    assert.equal(parseMoneyInput(formatMoneyInput(value)), value);
  }
  for (const text of ['', '-', '123abc', '1.23,45', '1,234']) assert.ok(Number.isNaN(parseMoneyInput(text)));
  assert.equal(formatMoneyInput(NaN), '');
  assert.equal(formatMoney(1234.56), 'R$\u00a01.234,56');
});
