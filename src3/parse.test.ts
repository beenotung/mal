import { expect } from 'chai'
import { AST } from './ast'
import { parse } from './parse'

function test_parse<T extends AST.Any>(input: string, expected: T) {
  let actual = parse(input)
  expect(actual).to.deep.equal(expected)
}

it('should parse integer', () => {
  test_parse<AST.Integer>('123', {
    type: 'integer',
    value: 123,
  })
})

it('should parse float', () => {
  test_parse<AST.Float>('12.34', {
    type: 'float',
    value: 12.34,
  })
})

context('string', () => {
  it('should parse double-quoted string', () => {
    test_parse<AST.String>('"apple"', {
      type: 'string',
      value: 'apple',
    })
  })
  it('should parse single-quoted string', () => {
    test_parse<AST.String>("'apple'", {
      type: 'string',
      value: 'apple',
    })
  })
  it('should parse string with escape sequence', () => {
    test_parse<AST.String>(`"apple's \\"app store\\""`, {
      type: 'string',
      value: `apple's "app store"`,
    })
    test_parse<AST.String>(`'apple\\'s "app store"'`, {
      type: 'string',
      value: `apple's "app store"`,
    })
  })
})

context('array', () => {
  it('should parse empty array', () => {
    test_parse<AST.Array>('[]', {
      type: 'array',
      value: [],
    })
  })
  it('should parse integer array', () => {
    test_parse<AST.Array>('[12,34]', {
      type: 'array',
      value: [
        { type: 'integer', value: 12 },
        { type: 'integer', value: 34 },
      ],
    })
  })
  it('should parse string array', () => {
    test_parse<AST.Array>('["apple","pie"]', {
      type: 'array',
      value: [
        { type: 'string', value: 'apple' },
        { type: 'string', value: 'pie' },
      ],
    })
  })
  it('should parse array of mixed type', () => {
    test_parse<AST.Array>('[12,3.4,"apple"]', {
      type: 'array',
      value: [
        { type: 'integer', value: 12 },
        { type: 'float', value: 3.4 },
        { type: 'string', value: 'apple' },
      ],
    })
  })
})

context('symbol', () => {
  function test_symbol(symbol: string) {
    it('should parse ' + symbol, () => {
      test_parse<AST.Symbol>(symbol, { type: 'symbol', value: symbol })
    })
  }
  context('math symbol', () => {
    test_symbol('+')
    test_symbol('-')
    test_symbol('*')
    test_symbol('/')
    test_symbol('%')
  })
  context('keyword symbol', () => {
    test_symbol('div')
    test_symbol('rem')
    test_symbol('mod')
    test_symbol('inc')
    test_symbol('dec')
  })
})

context('list', () => {
  it('should parse empty list', () => {
    test_parse<AST.List>('()', {
      type: 'list',
      value: [],
    })
  })
  it('should parse list with symbol', () => {
    test_parse<AST.List<AST.Any>>('(+ 12 34)', {
      type: 'list',
      value: [
        { type: 'symbol', value: '+' },
        { type: 'integer', value: 12 },
        { type: 'integer', value: 34 },
      ],
    })
  })
})
