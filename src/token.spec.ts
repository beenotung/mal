import { expect } from 'chai'
import { Rational, rational } from './token'

describe('rational AST constructor', () => {
  it('should construct rational AST when it cannot be simplified', () => {
    let ast: Rational = {
      type: 'rational',
      up: 2,
      down: 3,
    }
    expect(rational(2, 3)).to.deep.equals(ast)
  })
  it('should simplify to number when down is 1', () => {
    expect(rational(2, 1)).to.equals(2)
  })
  it('should simplify to number when up is dividable by down', () => {
    expect(rational(4, 2)).to.equals(2)
  })
  it('should simplify by lcm when possible', () => {
    expect(rational(3, 6)).to.deep.equals(rational(1, 2))
  })
  it('should cancel negative sign when possible', () => {
    expect(rational(-1, -2)).to.deep.equals(rational(1, 2))
  })
  it('should put negative sign on upper part', () => {
    expect(rational(1, -2)).to.deep.equals(rational(-1, 2))
    expect(rational(-1, 2)).to.deep.equals(rational(-1, 2))
  })
})
