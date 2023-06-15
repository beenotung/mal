import { expect } from 'chai'
import { AST, parse } from './reader'
import { keyword, symbol } from './token'

describe('reader TestSuit', () => {
  it('should parse empty input', () => {
    expect(parse('')).to.equals(symbol('empty'))
  })

  it('should parse integer', () => {
    expect(parse('123')).to.equals(123)
  })

  it('should parse floating number', () => {
    expect(parse('1.23')).to.equals(1.23)
  })

  it('should parse rational number', () => {
    let ast: AST = {
      type: 'rational-number',
      left: 2,
      right: 3,
    }
    expect(parse('2/3')).to.deep.equals(ast)
  })

  it('should parse string', () => {
    expect(parse('"12"')).to.equals('12')
  })

  it('should parse string with escape sequence', () => {
    expect(parse('"12\\"34"')).to.equals('12"34')
  })

  it('should parse list', () => {
    expect(parse('(1 2 3)')).to.deep.equals([1, 2, 3])
  })

  it('should parse nested list', () => {
    expect(parse('(1 (2 3) (4 5))')).to.deep.equals([1, [2, 3], [4, 5]])
  })

  it('should parse keyword', () => {
    expect(parse(':class-name')).to.equals(keyword('class-name'))
  })

  it('should parse symbol', () => {
    expect(parse('+')).to.equals(symbol('+'))
    expect(parse('inc')).to.equals(symbol('inc'))
  })

  it('should parse function call', () => {
    expect(parse('(+ 2 3)')).to.deep.equals([symbol('+'), 2, 3])
  })
})
