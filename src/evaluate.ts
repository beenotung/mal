import util from 'util'
import { AST, Num, rational, symbol } from './token'

export function evaluate(ast: AST) {
  if (typeof ast === 'string') {
    return ast
  }
  if (typeof ast === 'number') {
    return ast
  }
  if (typeof ast === 'symbol') {
    return ast
  }
  if (Array.isArray(ast)) {
    return evaluate_list(ast)
  }
  if (ast.type === 'rational') {
    return ast
  }
  if (ast.type === 'keyword') {
    return { lookup: ast }
  }
  let _: never = ast
  throw new EvaluationError({
    when: 'evaluate',
    message: 'unknown type',
    ast,
  })
}

let add_operator = symbol('+')
let minus_operator = symbol('-')
let multiply_operator = symbol('*')
let divide_operator = symbol('/')

function evaluate_list(list: AST[]): AST {
  if (list.length === 0) {
    throw new EvaluationError({
      when: 'evaluate_list',
      message: 'empty list',
    })
  }
  let fn = list[0]
  let args = list.slice(1)
  switch (fn) {
    case add_operator:
      return list.slice(1).reduce((acc: Num, c) => add(acc, c as Num), 0 as Num)
    case minus_operator:
      return list.slice(1).reduce((acc: number, c) => acc - (c as any), 0)
    case multiply_operator:
      return list.slice(1).reduce((acc: number, c) => acc * (c as any), 1)
    case divide_operator:
      return list.slice(1).reduce((acc: number, c) => acc / (c as any), 0)
    default:
      throw new EvaluationError({
        when: 'evaluate_list',
        message: 'unexpected fn',
        fn,
        args,
      })
  }
}

function add(a: Num, b: Num): Num {
  if (typeof a === 'number' && typeof b === 'number') {
    return a + b
  }
  if (typeof a === 'object' && typeof b === 'object') {
    let down = lcm(a.down, b.down)
    let up = (down / a.down) * a.up + (down / b.down) * b.up
    return rational(up, down)
  }
  if (typeof a === 'object' && typeof b === 'number') {
    let down = a.down
    let up = a.up + b * down
    return rational(up, down)
  }
  if (typeof a === 'number' && typeof b === 'object') {
    let down = b.down
    let up = a * down + b.up
    return rational(up, down)
  }
  throw new EvaluationError({ when: 'add', message: 'unexpected types', a, b })
}

function lcm(a: number, b: number): number {
  return (a * b) / gcm(a, b)
}

function gcm(a: number, b: number): number {
  let tmp
  for (;;) {
    if (b === 0) return a
    if (a === b) return a
    if (a < b) {
      tmp = a
      a = b
      b = tmp
    } else {
      tmp = a % b
      a = b
      b = tmp
    }
  }
}

type ContextType<T extends object = {}> = T & { when: string; ast?: AST }

export class EvaluationError<Context extends ContextType> extends EvalError {
  constructor(public context: Context) {
    super(util.inspect(context))
  }
}
