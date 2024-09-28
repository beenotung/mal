import { expect } from 'chai'
import { AST } from './ast'
import { RootEnvironment } from './evaluate'
import { parse } from './parse'

function test_evaluate(input: AST.Any, output: AST.Any) {
  let env = new RootEnvironment()
  let actual = env.evaluate(input)
  expect(actual).deep.equals(output)
}

context('evaluate value', () => {
  function test_value(value: AST.Any) {
    it('should echo ' + value.type, () => {
      test_evaluate(value, value)
    })
  }
  test_value({ type: 'integer', value: 12 })
  test_value({ type: 'float', value: 12.34 })
  test_value({ type: 'string', value: 'apple' })
  test_value({ type: 'array', value: [12, 34] })
})

context('evaluate math', () => {
  function test_math(input: string, output: string) {
    test_evaluate(parse(input), parse(output))
  }
  context('add', () => {
    it('should starts with zero', () => {
      test_math('(+)', '0')
      test_math('(+ 3)', '3')
    })
    it('should add multiple numbers', () => {
      test_math('(+ 2 3)', '5')
      test_math('(+ 2 3 4)', '9')
    })
  })
})
