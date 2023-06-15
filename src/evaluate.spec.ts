import { expect } from 'chai'
import { evaluate } from './evaluate'
import { rational, symbol } from './token'

describe('evaluate TestSuit', () => {
  describe('echo literal value', () => {
    it('should echo number', () => {
      expect(evaluate(12)).to.equals(12)
    })
    it('should echo ration number', () => {
      expect(evaluate(rational(2, 3))).to.deep.equals(rational(2, 3))
    })
    it('should echo string', () => {
      expect(evaluate('cat')).to.equals('cat')
    })
    it('should echo symbol', () => {
      expect(evaluate(symbol('cat'))).to.equals(symbol('cat'))
    })
  })
  describe('evaluate list', () => {
    describe('math evaluate', () => {
      it('should evaluate +', () => {
        expect(evaluate([symbol('+'), 2, 3])).to.equal(5)
        expect(
          evaluate([symbol('+'), rational(1, 3), rational(1, 3)]),
        ).to.deep.equal(rational(2, 3))
      })
      it.skip('should evaluate -', () => {
        expect(evaluate([symbol('-'), 5, 2])).to.equal(3)
      })
      it('should evaluate *', () => {
        expect(evaluate([symbol('*'), 2, 3])).to.equal(6)
      })
      it.skip('should evaluate /', () => {
        expect(evaluate([symbol('/'), 6, 3])).to.equal(2)
      })
    })
  })
})
