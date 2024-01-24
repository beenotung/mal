import { expect } from 'chai'
import { AST, evaluate, type_int, type_list, type_symbol } from './core'

function test(name: string, input: AST, expected: AST) {
  it(`should eval ${name}`, () => {
    let actual = evaluate(input)
    expect(actual).deep.equals(expected)
  })
}

test(
  '+',
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
