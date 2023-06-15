import { expect } from 'chai'
import { AST, parse } from './reader'
import { symbol } from './symbol'

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
})
