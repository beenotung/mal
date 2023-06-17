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
        expect(evaluate([symbol('+')])).to.equals(0)
        expect(evaluate([symbol('+'), 2])).to.equals(2)
        expect(evaluate([symbol('+'), 2, 3])).to.equals(5)
        expect(evaluate([symbol('+'), 2, 3, 4])).to.equals(9)
        expect(
          evaluate([symbol('+'), rational(1, 3), rational(1, 3)]),
        ).to.deep.equals(rational(2, 3))
      })
      it('should evaluate -', () => {
        expect(evaluate([symbol('-')])).to.equals(0)
        expect(evaluate([symbol('-'), 5])).to.equals(-5)
        expect(evaluate([symbol('-'), 5, 2])).to.equals(3)
        expect(evaluate([symbol('-'), 5, 2, 1])).to.equals(2)
        expect(evaluate([symbol('-'), 1, rational(1, 3)])).to.deep.equals(
          rational(2, 3),
        )
      })
      it('should evaluate *', () => {
        expect(evaluate([symbol('*')])).to.equals(1)
        expect(evaluate([symbol('*'), 2])).to.equals(2)
        expect(evaluate([symbol('*'), 2, 3])).to.equals(6)
        expect(evaluate([symbol('*'), 2, 3, 4])).to.equals(24)
        expect(
          evaluate([symbol('*'), rational(2, 3), rational(4, 5)]),
        ).to.deep.equals(rational(8, 15))
      })
      it('should evaluate /', () => {
        expect(evaluate([symbol('/')])).to.equals(1)
        expect(evaluate([symbol('/'), 6])).to.deep.equals(rational(1, 6))
        expect(evaluate([symbol('/'), 6, 3])).to.equals(2)
        expect(evaluate([symbol('/'), 6, 3, 2])).to.equals(1)
        expect(
          evaluate([symbol('/'), rational(2, 3), rational(4, 5)]),
        ).to.deep.equals(rational(5, 6))
      })
    })
  })
})
