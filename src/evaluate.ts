import util from 'util'
import { AST, Rational, rational, symbol } from './token'
import { lcm } from './math'

export function evaluate(ast: AST): AST {
  if (typeof ast === 'string') {
    return ast
  }
  if (typeof ast === 'number') {
    return ast
  }
  if (typeof ast === 'symbol') {
    throw new EvaluationError({
      when: 'evaluate',
      message: 'lookup not implemented',
      keyword: ast,
    })
  }
  if (Array.isArray(ast)) {
    return evaluate_list(ast)
  }
  if (ast.type === 'rational') {
    return ast
  }
  if (ast.type === 'keyword') {
    return ast
  }
  let _: never = ast
  throw new EvaluationError({
    when: 'evaluate',
    message: 'unknown type',
    ast,
  })
}

function evaluate_list(list: AST[]): AST {
  if (list.length === 0) {
    throw new EvaluationError({
      when: 'evaluate_list',
      message: 'empty list',
    })
  }
  let funcSymbol = list[0]
  let args = list.slice(1)
  let func = fns[funcSymbol as keyof typeof fns]
  if (!func) {
    throw new EvaluationError({
      when: 'evaluate_list',
      message: 'unexpected function',
      funcSymbol,
      args,
    })
  }
  return func(args)
}

function add(args: AST[]): AST {
  if (args.length === 0) {
    return 0
  }
  let left = evaluate(args[0])
  for (let i = 1; i < args.length; i++) {
    left = add_two(left, evaluate(args[i]))
  }
  return left
}

function add_two(left: AST, right: AST): AST {
  if (left === 0) return right
  if (right === 0) return left
  if (typeof left === 'number' && typeof right === 'number') {
    return left + right
  }
  if (typeof left === 'number') {
    right = castRational(right, { when: 'add' })
    let down = right.down
    let up = left * down + right.up
    return rational(up, down)
  }
  if (typeof right === 'number') {
    left = castRational(left, { when: 'add' })
    let down = left.down
    let up = left.up + right * down
    return rational(up, down)
  }
  left = castRational(left, { when: 'add' })
  right = castRational(right, { when: 'add' })
  let down = lcm(left.down, right.down)
  let up = (down / left.down) * left.up + (down / right.down) * right.up
  return rational(up, down)
}

function minus(args: AST[]): AST {
  if (args.length === 0) {
    return 0
  }
  let left = evaluate(args[0])
  if (args.length === 1) {
    if (typeof left === 'number') {
      return -left
    }
    left = castRational(left, { when: 'minus' })
    return rational(-left.up, left.down)
  }
  for (let i = 1; i < args.length; i++) {
    left = minus_two(left, evaluate(args[i]))
  }
  return left
}

function minus_two(left: AST, right: AST): AST {
  if (right === 0) return left
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right
  }
  if (typeof left === 'number') {
    right = castRational(right, { when: 'minus' })
    let down = right.down
    let up = left * down - right.up
    return rational(up, down)
  }
  if (typeof right === 'number') {
    left = castRational(left, { when: 'minus' })
    let down = left.down
    let up = left.up - right * down
    return rational(up, down)
  }
  left = castRational(left, { when: 'minus' })
  right = castRational(right, { when: 'minus' })
  let down = lcm(left.down, right.down)
  let up = (down / left.down) * left.up - (down / right.down) * right.up
  return rational(up, down)
}

function multiply(args: AST[]): AST {
  if (args.length === 0) {
    return 1
  }
  let left = evaluate(args[0])
  for (let i = 1; i < args.length; i++) {
    left = multiply_two(left, evaluate(args[i]))
  }
  return left
}

function multiply_two(left: AST, right: AST): AST {
  if (left === 1) return right
  if (right === 1) return left
  if (typeof left === 'number' && typeof right === 'number') {
    return left * right
  }
  if (typeof left === 'number') {
    right = castRational(right, { when: 'multiply' })
    let up = left * right.up
    let down = right.down
    return rational(up, down)
  }
  if (typeof right === 'number') {
    left = castRational(left, { when: 'multiply' })
    let up = left.up * right
    let down = left.down
    return rational(up, down)
  }
  left = castRational(left, { when: 'multiply' })
  right = castRational(right, { when: 'multiply' })
  let up = left.up * right.up
  let down = left.down * right.down
  return rational(up, down)
}

function divide(args: AST[]): AST {
  if (args.length === 0) {
    return 1
  }
  let left = evaluate(args[0])
  if (args.length === 1) {
    return one_divide(left)
  }
  for (let i = 1; i < args.length; i++) {
    left = divide_two(left, evaluate(args[i]))
  }
  return left
}

function one_divide(ast: AST): AST {
  if (ast === 1) return 1
  if (typeof ast === 'number') {
    return rational(1, ast)
  }
  ast = castRational(ast, { when: 'divide' })
  return rational(ast.down, ast.up)
}

function divide_two(left: AST, right: AST): AST {
  if (right === 1) return left
  if (typeof left === 'number' && typeof right === 'number') {
    return rational(left, right)
  }
  if (typeof right === 'number') {
    right = rational(1, right)
  } else {
    right = castRational(right, { when: 'divide' })
    right = rational(right.down, right.up)
  }
  return multiply_two(left, right)
}

function abs(args: AST[]): AST {
  let ast = castArgsLength(args, 1, { when: 'abs' })[0]
  ast = evaluate(ast)
  if (typeof ast === 'number') return Math.abs(ast)
  ast = castRational(ast, { when: 'abs' })
  return rational(Math.abs(ast.up), Math.abs(ast.down))
}

function acos(args: AST[]): AST {
  return Math.acos(castNumArg(args, { when: 'acos' }))
}

function asin(args: AST[]): AST {
  return Math.asin(castNumArg(args, { when: 'asin' }))
}

function atan(args: AST[]): AST {
  return Math.atan(castNumArg(args, { when: 'atan' }))
}

function atan2(args: AST[]): AST {
  args = castArgsLength(args, 2, { when: 'atan2' })
  let x = evaluate(args[0])
  x = castNum(x, { when: 'atan2' })
  let y = evaluate(args[1])
  y = castNum(y, { when: 'atan2' })
  return Math.atan2(x, y)
}

function ceil(args: AST[]): AST {
  return Math.ceil(castNumArg(args, { when: 'ceil' }))
}

function cos(args: AST[]): AST {
  return Math.cos(castNumArg(args, { when: 'cos' }))
}

function exp(args: AST[]): AST {
  return Math.exp(castNumArg(args, { when: 'exp' }))
}

function floor(args: AST[]): AST {
  return Math.floor(castNumArg(args, { when: 'floor' }))
}

function log(args: AST[]): AST {
  return Math.log(castNumArg(args, { when: 'log' }))
}

function max(args: AST[]): AST {
  if (args.length === 0) return -Infinity
  let ast_arr = args.map(ast => evaluate(ast))
  let num_arr = ast_arr.map(ast => castNum(ast, { when: 'max' }))
  let max_num = Math.max(...num_arr)
  let index = num_arr.indexOf(max_num)
  return ast_arr[index]
}

function min(args: AST[]): AST {
  if (args.length === 0) return Infinity
  let ast_arr = args.map(ast => evaluate(ast))
  let num_arr = ast_arr.map(ast => castNum(ast, { when: 'min' }))
  let min_num = Math.min(...num_arr)
  let index = num_arr.indexOf(min_num)
  return ast_arr[index]
}

function pow(args: AST[]): AST {
  args = castArgsLength(args, 2, { when: 'pow' })
  let x = evaluate(args[0])
  let y = evaluate(args[1])

  if (typeof x === 'number' && typeof y === 'number') {
    return x ** y
  }

  if (typeof y === 'number') {
    x = castRational(x, { when: 'pow' })
    return rational(x.up ** y, x.down ** y)
  }

  x = castNum(x, { when: 'pow' })
  y = castNum(y, { when: 'pow' })

  return Math.atan2(x, y)
}

function random(args: AST[]): AST {
  castArgsLength(args, 0, { when: 'random' })
  return Math.random()
}

function round(args: AST[]): AST {
  return Math.round(castNumArg(args, { when: 'round' }))
}

function sin(args: AST[]): AST {
  return Math.sin(castNumArg(args, { when: 'sin' }))
}

function sqrt(args: AST[]): AST {
  return Math.sqrt(castNumArg(args, { when: 'sqrt' }))
}

function tan(args: AST[]): AST {
  return Math.tan(castNumArg(args, { when: 'tan' }))
}

let fns = {
  [symbol('+')]: add,
  [symbol('-')]: minus,
  [symbol('*')]: multiply,
  [symbol('/')]: divide,
  [symbol('abs')]: abs,
  [symbol('acos')]: acos,
  [symbol('asin')]: asin,
  [symbol('atan')]: atan,
  [symbol('atan2')]: atan2,
  [symbol('ceil')]: ceil,
  [symbol('cos')]: cos,
  [symbol('exp')]: exp,
  [symbol('floor')]: floor,
  [symbol('log')]: log,
  [symbol('max')]: max,
  [symbol('min')]: min,
  [symbol('pow')]: pow,
  [symbol('random')]: random,
  [symbol('round')]: round,
  [symbol('sin')]: sin,
  [symbol('sqrt')]: sqrt,
  [symbol('tan')]: tan,
}

function castRational(ast: AST, context: { when: string }): Rational {
  if (typeof ast == 'object' && !Array.isArray(ast) && ast.type === 'rational')
    return ast
  throw new EvaluationError({ when: context.when, message: 'expect Num', ast })
}

function castNum(ast: AST, context: { when: string }): number {
  if (typeof ast === 'number') return ast
  ast = castRational(ast, context)
  return ast.up / ast.down
}

function castArgsLength(
  args: AST[],
  length: number,
  context: { when: string },
): AST[] {
  if (args.length !== length)
    throw new EvaluationError({
      when: context.when,
      expected_args_length: length,
      actual_args_length: args.length,
    })
  return args
}

function castNumArg(args: AST[], context: { when: string }): number {
  let ast = castArgsLength(args, 1, context)[0]
  ast = evaluate(ast)
  return castNum(ast, context)
}

type ContextType<T extends object = {}> = T & {
  when: string
  message?: string
  ast?: AST
}

export class EvaluationError<Context extends ContextType> extends EvalError {
  constructor(public context: Context) {
    super(util.inspect(context))
  }
}
