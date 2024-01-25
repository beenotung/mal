import { expect } from 'chai'
import {
  AST,
  evaluate,
  type_float,
  type_int,
  type_list,
  type_string,
  type_symbol,
} from './core'

function test(name: string, input: AST, expected: AST | Error) {
  it(`should eval ${name}`, () => {
    if (expected instanceof Error) {
      expect(() => evaluate(input)).to.throws(expected.message)
    } else {
      let actual = evaluate(input)
      expect(actual).deep.equals(expected)
    }
  })
}

test(
  '+ for int',
  {
    type: type_list,
    value: [
      { type: type_symbol, value: '+' },
      { type: type_int, value: 2 },
      { type: type_int, value: 3 },
    ],
  },
  { type: type_int, value: 5 },
)

test(
  '+ for float',
  {
    type: type_list,
    value: [
      { type: type_symbol, value: '+' },
      { type: type_float, value: 2.2 },
      { type: type_float, value: 3.3 },
    ],
  },
  { type: type_float, value: 5.5 },
)

test(
  '+ for string',
  {
    type: type_list,
    value: [
      { type: type_symbol, value: '+' },
      { type: type_string, value: 'app' },
      { type: type_string, value: 'le' },
    ],
  },
  new Error('cannot "+" ast type: ' + type_string),
)

test(
  'concat for string',
  {
    type: type_list,
    value: [
      { type: type_symbol, value: 'concat' },
      { type: type_string, value: 'app' },
      { type: type_string, value: 'le' },
    ],
  },
  { type: type_string, value: 'apple' },
)
