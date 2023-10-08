import { expect } from 'chai'
import {
  AST,
  parse,
  type_float,
  type_int,
  type_keyword,
  type_list,
  type_quote,
  type_rational,
  type_string,
  type_symbol,
} from './core'

function test(name: string, input: string, expected: AST) {
  it(`should parse ${name}`, () => {
    let actual = parse(input)
    // console.dir({ name, input, expected, actual }, { depth: 20 })
    expect(actual).to.deep.equals(expected)
  })
}

test('integer', '123', { type: type_int, value: 123 })
test('float', '3.14', { type: type_float, value: 3.14 })
test('rational', '123/31', { type: type_rational, value: { p: 123, q: 31 } })
test('string', '"str"', { type: type_string, value: 'str' })
test('string with double quote', '"str\\"ing"', {
  type: type_string,
  value: 'str"ing',
})
test('keyword in kebab-case', ':first-name', {
  type: type_keyword,
  value: 'first-name',
})
test('quoted keyword', "'first-name", {
  type: type_quote,
  value: { type: type_symbol, value: 'first-name' },
})
test('quoted list', "'(1 2 3)", {
  type: type_quote,
  value: {
    type: type_list,
    value: [
      { type: type_int, value: 1 },
      { type: type_int, value: 2 },
      { type: type_int, value: 3 },
    ],
  },
})
test('symbol in kebab-case', 'find-last', {
  type: type_symbol,
  value: 'find-last',
})
test('symbol with operator', '+', { type: type_symbol, value: '+' })
test('list', '(+ 2 3 4)', {
  type: type_list,
  value: [
    { type: type_symbol, value: '+' },
    { type: type_int, value: 2 },
    { type: type_int, value: 3 },
    { type: type_int, value: 4 },
  ],
})
test('nested list', '(+ 2 (* 3 4))', {
  type: type_list,
  value: [
    { type: type_symbol, value: '+' },
    { type: type_int, value: 2 },
    {
      type: type_list,
      value: [
        { type: type_symbol, value: '*' },
        { type: type_int, value: 3 },
        { type: type_int, value: 4 },
      ],
    },
  ],
})
