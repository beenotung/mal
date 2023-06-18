import { expect } from 'chai'
import { evaluate } from './evaluate'
import { AST, keyword, rational, symbol } from './token'

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
    it('should echo keyword', () => {
      expect(evaluate(keyword('dev-deps'))).to.equals(keyword('dev-deps'))
    })
    it('should echo true', () => {
      expect(evaluate(keyword('true'))).to.be.true
    })
    it('should echo false', () => {
      expect(evaluate(keyword('false'))).to.be.false
    })
  })
  describe('build-in data type', () => {
    it('should create list/Array', () => {
      expect(
        evaluate([symbol('list'), 2, [symbol('+'), 3, 4], 5]),
      ).to.deep.equals([2, 7, 5])
      expect(
        evaluate([symbol('new-array'), 2, [symbol('+'), 3, 4], 5]),
      ).to.deep.equals([2, 7, 5])
    })
    it('should create Set', () => {
      expect(
        evaluate([symbol('new-set'), 2, [symbol('+'), 3, 4], 5]),
      ).to.deep.equals(new Set([2, 7, 5]))
    })
    it('should create Map', () => {
      expect(
        evaluate([
          symbol('new-map'),
          [symbol('+'), 1, 1],
          'two',
          keyword('version'),
          [symbol('+'), 2, 3],
        ]),
      ).to.deep.equals(
        new Map<AST, AST>([
          [2, 'two'],
          [keyword('version'), 5],
        ]),
      )
    })
  })
  describe('evaluate list', () => {
    describe('math expression', () => {
      describe('numerical operators', () => {
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
        it('should evaluate nested +', () => {
          expect(
            evaluate([symbol('*'), [symbol('+'), 2, 3], [symbol('+'), 4, 5]]),
          ).to.equals((2 + 3) * (4 + 5))
        })
        it('should evaluate nested -', () => {
          expect(
            evaluate([symbol('*'), [symbol('-'), 2, 3], [symbol('-'), 4, 5]]),
          ).to.equals((2 - 3) * (4 - 5))
        })
        it('should evaluate nested *', () => {
          expect(
            evaluate([symbol('+'), [symbol('*'), 2, 3], [symbol('*'), 4, 5]]),
          ).to.equals(2 * 3 + 4 * 5)
        })
        it('should evaluate nested /', () => {
          expect(
            evaluate([symbol('+'), [symbol('/'), 2, 3], [symbol('/'), 4, 5]]),
          ).to.deep.equals(
            evaluate([symbol('+'), rational(2, 3), rational(4, 5)]),
          )
        })
      })
      describe('math functions', () => {
        class TestPrepareError extends Error {
          constructor(public inputs: AST[]) {
            super(JSON.stringify({ inputs }))
          }
        }
        function wrapNum(inputs: AST[]) {
          if (inputs.length === 0) return
          let ast = inputs[0]
          if (Array.isArray(ast)) {
            if (ast.length === 0) return
            ast[0] = [symbol('+'), ast[0], 0]
            return
          }
          if (
            typeof ast === 'number' ||
            (typeof ast === 'object' && ast.type == 'rational')
          ) {
            inputs[0] = [symbol('+'), ast, 0]
            return
          }
          throw new TestPrepareError(inputs)
        }
        function test(
          name: string,
          samples: [inputs: AST[], expectedOutput: AST][],
        ) {
          it(`should evaluate ${name}`, () => {
            for (let [inputs, expectedOutput] of samples) {
              wrapNum(inputs)
              let actualOutput = evaluate([symbol(name), ...inputs])
              expect(actualOutput).to.deep.equals(expectedOutput)
            }
          })
        }
        test('abs', [
          [[3], 3],
          [[-3], 3],
          [[rational(1, 2)], rational(1, 2)],
          [[rational(-1, 2)], rational(1, 2)],
          [[rational(1, -2)], rational(1, 2)],
          [[rational(-1, -2)], rational(1, 2)],
        ])
        test('acos', [
          [[0.5], Math.acos(0.5)],
          [[rational(1, 2)], Math.acos(1 / 2)],
        ])
        test('asin', [
          [[0.5], Math.asin(0.5)],
          [[rational(1, 2)], Math.asin(1 / 2)],
        ])
        test('atan', [
          [[0.5], Math.atan(0.5)],
          [[rational(1, 2)], Math.atan(1 / 2)],
        ])
        test('atan2', [
          [[3, 4], Math.atan2(3, 4)],
          [[rational(7, 2), rational(9, 2)], Math.atan2(7 / 2, 9 / 2)],
        ])
        test('ceil', [
          [[3.5], Math.ceil(3.5)],
          [[rational(7, 3)], Math.ceil(7 / 3)],
          [[-3.5], Math.ceil(-3.5)],
          [[rational(-7, 3)], Math.ceil(-7 / 3)],
        ])
        test('cos', [
          [[0.5], Math.cos(0.5)],
          [[rational(1, 2)], Math.cos(1 / 2)],
        ])
        test('exp', [
          [[0.5], Math.exp(0.5)],
          [[rational(1, 2)], Math.exp(1 / 2)],
        ])
        test('floor', [
          [[3.5], Math.floor(3.5)],
          [[rational(7, 3)], Math.floor(7 / 3)],
          [[-3.5], Math.floor(-3.5)],
          [[rational(-7, 3)], Math.floor(-7 / 3)],
        ])
        test('log', [
          [[0.5], Math.log(0.5)],
          [[rational(1, 2)], Math.log(1 / 2)],
        ])
        test('max', [
          [[], -Infinity],
          [[2], 2],
          [[2, 4], 4],
          [[4, 2], 4],
          [[3, 4, 2], 4],
          [[0.1, rational(1, 2)], rational(1, 2)],
        ])
        test('min', [
          [[], Infinity],
          [[2], 2],
          [[2, 4], 2],
          [[4, 2], 2],
          [[3, 1, 2], 1],
          [[0.6, rational(1, 2)], rational(1, 2)],
        ])
        test('pow', [
          [[2, 3], 8],
          [[rational(2, 3), 2], rational(4, 9)],
        ])
        it('should evaluate random', () => {
          let random = Math.random
          Math.random = () => 'mock random value' as any
          expect(evaluate([symbol('random')])).to.equals('mock random value')
          Math.random = random
        })
        test('round', [
          [[3.1], Math.round(3.1)],
          [[3.9], Math.round(3.9)],
          [[rational(31, 10)], Math.round(31 / 10)],
          [[rational(39, 10)], Math.round(39 / 10)],
          [[-3.1], Math.round(-3.1)],
          [[-3.9], Math.round(-3.9)],
          [[rational(-31, 10)], Math.round(-31 / 10)],
          [[rational(-39, 10)], Math.round(-39 / 10)],
        ])
        test('sin', [
          [[0.5], Math.sin(0.5)],
          [[rational(1, 2)], Math.sin(1 / 2)],
        ])
        test('sqrt', [
          [[0.5], Math.sqrt(0.5)],
          [[rational(1, 2)], Math.sqrt(1 / 2)],
        ])
        test('tan', [
          [[0.5], Math.tan(0.5)],
          [[rational(1, 2)], Math.tan(1 / 2)],
        ])
      })
    })
    describe('comparison expression', () => {
      function test(
        name: string,
        typeSamples: [
          type: string,
          samples: [inputs: AST[], expected: boolean][],
        ][],
      ) {
        describe(`compare with ${name}`, () => {
          for (let [type, samples] of typeSamples) {
            it(`should compare ${type}`, () => {
              for (let [inputs, expected] of samples) {
                expect(evaluate([symbol(name), ...inputs])).to.equals(expected)
              }
            })
          }
        })
      }
      test('>', [
        [
          'real number',
          [
            [[3, 2], true],
            [[3, 3], false],
          ],
        ],
        [
          'rational number',
          [
            [[rational(3, 2), rational(2, 2)], true],
            [[rational(3, 2), rational(3, 2)], false],
          ],
        ],
        [
          'string',
          [
            [['b', 'a'], true],
            [['b', 'b'], false],
          ],
        ],
      ])
      test('>=', [
        [
          'real number',
          [
            [[3, 2], true],
            [[3, 3], true],
            [[2, 3], false],
          ],
        ],
        [
          'rational number',
          [
            [[rational(3, 2), rational(2, 2)], true],
            [[rational(3, 2), rational(3, 2)], true],
            [[rational(2, 2), rational(3, 2)], false],
          ],
        ],
        [
          'string',
          [
            [['b', 'a'], true],
            [['b', 'b'], true],
            [['a', 'b'], false],
          ],
        ],
      ])
      test('<', [
        [
          'real number',
          [
            [[2, 3], true],
            [[2, 2], false],
          ],
        ],
        [
          'rational number',
          [
            [[rational(2, 2), rational(3, 2)], true],
            [[rational(2, 3), rational(2, 3)], false],
          ],
        ],
        [
          'string',
          [
            [['a', 'b'], true],
            [['a', 'a'], false],
          ],
        ],
      ])
      test('<=', [
        [
          'real number',
          [
            [[2, 3], true],
            [[2, 2], true],
            [[3, 2], false],
          ],
        ],
        [
          'rational number',
          [
            [[rational(2, 2), rational(3, 2)], true],
            [[rational(2, 3), rational(2, 3)], true],
            [[rational(3, 2), rational(2, 2)], false],
          ],
        ],
        [
          'string',
          [
            [['a', 'b'], true],
            [['a', 'a'], true],
            [['b', 'a'], false],
          ],
        ],
      ])
      test('=', [
        [
          'real number',
          [
            [[2, 2], true],
            [[2, 3], false],
          ],
        ],
        [
          'rational number',
          [
            [[rational(2, 3), rational(2, 3)], true],
            [[rational(2, 3), rational(3, 3)], false],
          ],
        ],
        [
          'string',
          [
            [['a', 'a'], true],
            [['a', 'b'], false],
          ],
        ],
        [
          'boolean',
          [
            [[true, true], true],
            [[false, false], true],
            [[true, false], false],
            [[false, true], false],
            [[true], true],
            [[true, true, true], true],
            [[true, false, true], false],
          ],
        ],
      ])
    })
  })
})
