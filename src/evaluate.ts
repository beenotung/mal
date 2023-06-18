import util from 'util'
import { AST, Rational, rational, symbol } from './token'
import { lcm } from './math'

export function evaluate(ast: AST): AST {
  if (Array.isArray(ast)) {
    return evaluate_list(ast)
  }
  if (typeof ast === 'symbol') {
    if (ast in const_dict) {
      return const_dict[ast]
    }
    throw new EvaluationError({
      when: 'evaluate',
      message: 'symbol not defined',
      symbol: ast,
    })
  }
  if (
    typeof ast === 'number' ||
    typeof ast === 'boolean' ||
    typeof ast === 'string' ||
    ast instanceof Set ||
    ast instanceof Map ||
    ast.type === 'rational' ||
    ast.type === 'keyword'
  ) {
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
  let func = fn_dict[funcSymbol as keyof typeof fn_dict]
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

let const_dict = {
  [symbol('true')]: true,
  [symbol('false')]: false,
  [symbol('pi')]: Math.PI,
  [symbol('e')]: Math.E,
  [symbol('phi')]: (1 + Math.sqrt(5)) / 2,
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
  if (typeof left === 'string' && typeof right === 'string') {
    return left + right
  }
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
    if (typeof left === 'string') {
      return left
    }
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
  if (typeof left === 'string' && typeof right === 'string') {
    return left.replace(right, '')
  }
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
  if (typeof left === 'string') {
    let when = 'repeat(*)'
    castArgsLength(args, 2, { when })
    let right = castNum(evaluate(args[1]), { when })
    return left.repeat(right)
  }
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
  if (typeof left === 'string') {
    let when = 'split(/)'
    castArgsLength(args, 2, { when })
    let right = castString(evaluate(args[1]), { when })
    return left.split(right)
  }
  if (args.length === 1) {
    return one_divide(left)
  }
  for (let i = 1; i < args.length; i++) {
    left = divide_two(left, evaluate(args[i]))
  }
  return left
}

function split(left: string, right: AST): AST {
  right = castNum(right, { when: 'split(/)' })
  return left.repeat(right)
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

function list(args: AST[]): AST {
  return args.map(ast => evaluate(ast))
}

function new_set(args: AST[]): AST {
  return new Set(args.map(ast => evaluate(ast)))
}

function new_map(args: AST[]): AST {
  if (args.length % 2 !== 0)
    throw new EvaluationError({
      when: 'new_map',
      message: 'expect odd number of args',
      args,
    })
  let map = new Map()
  for (let i = 0; i < args.length; i += 2) {
    map.set(evaluate(args[i]), evaluate(args[i + 1]))
  }
  return map
}

function greater(args: AST[]): AST {
  if (args.length === 0)
    throw new EvaluationError({
      when: '>',
      message: 'expect at least 1 args',
      args,
    })
  let left = evaluate(args[0])
  let right
  for (let i = 1; i < args.length; i++) {
    right = evaluate(args[i])
    if (!greater_two(left, right)) return false
    left = right
  }
  return true
}

function greater_two(left: AST, right: AST): boolean {
  left = castComparable(left, { when: '>' })
  right = castComparable(right, { when: '>' })
  return left > right
}

function greater_or_equal(args: AST[]): AST {
  if (args.length === 0)
    throw new EvaluationError({
      when: '>=',
      message: 'expect at least 1 args',
      args,
    })
  let left = evaluate(args[0])
  let right
  for (let i = 1; i < args.length; i++) {
    right = evaluate(args[i])
    if (!greater_or_equal_two(left, right)) return false
    left = right
  }
  return true
}

function greater_or_equal_two(left: AST, right: AST): boolean {
  left = castComparable(left, { when: '>=' })
  right = castComparable(right, { when: '>=' })
  return left >= right
}

function lesser(args: AST[]): AST {
  if (args.length === 0)
    throw new EvaluationError({
      when: '<',
      message: 'expect at least 1 args',
      args,
    })
  let left = evaluate(args[0])
  let right
  for (let i = 1; i < args.length; i++) {
    right = evaluate(args[i])
    if (!lesser_two(left, right)) return false
    left = right
  }
  return true
}

function lesser_two(left: AST, right: AST): boolean {
  left = castComparable(left, { when: '<' })
  right = castComparable(right, { when: '<' })
  return left < right
}

function lesser_or_equal(args: AST[]): AST {
  if (args.length === 0)
    throw new EvaluationError({
      when: '<=',
      message: 'expect at least 1 args',
      args,
    })
  let left = evaluate(args[0])
  let right
  for (let i = 1; i < args.length; i++) {
    right = evaluate(args[i])
    if (!lesser_or_equal_two(left, right)) return false
    left = right
  }
  return true
}

function lesser_or_equal_two(left: AST, right: AST): boolean {
  left = castComparable(left, { when: '<=' })
  right = castComparable(right, { when: '<=' })
  return left <= right
}

function equal(args: AST[]): AST {
  if (args.length === 0)
    throw new EvaluationError({
      when: '=',
      message: 'expect at least 1 args',
      args,
    })
  let left = evaluate(args[0])
  let right
  for (let i = 1; i < args.length; i++) {
    right = evaluate(args[i])
    if (!equal_two(left, right)) return false
    left = right
  }
  return true
}

function equal_two(left: AST, right: AST): boolean {
  if (typeof left === 'boolean' && typeof right === 'boolean')
    return left === right
  left = castComparable(left, { when: '=' })
  right = castComparable(right, { when: '=' })
  return left == right
}

function and(args: AST[]): AST {
  if (args.length === 0)
    throw new EvaluationError({
      when: 'and',
      message: 'expect at least 1 args',
      args,
    })
  let left = evaluate(args[0])
  let right
  for (let i = 1; i < args.length; i++) {
    right = evaluate(args[i])
    left = and_two(left, right)
    if (!left) return left
  }
  return left
}

function and_two(left: AST, right: AST): AST {
  if (typeof left === 'boolean' && typeof right === 'boolean')
    return left && right
  left = castComparable(left, { when: 'and' })
  right = castComparable(right, { when: 'and' })
  return left && right
}

function or(args: AST[]): AST {
  if (args.length === 0)
    throw new EvaluationError({
      when: 'or',
      message: 'expect at least 1 args',
      args,
    })
  let left = evaluate(args[0])
  let right
  for (let i = 1; i < args.length; i++) {
    right = evaluate(args[i])
    left = or_two(left, right)
    if (!left) return left
  }
  return left
}

function or_two(left: AST, right: AST): AST {
  if (typeof left === 'boolean' && typeof right === 'boolean')
    return left || right
  left = castComparable(left, { when: 'or' })
  right = castComparable(right, { when: 'or' })
  return left || right
}

function not(args: AST[]): boolean {
  let ast = castArgsLength(args, 1, { when: 'not' })[0]
  ast = evaluate(ast)
  return !ast
}

let fn_dict = {
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
  [symbol('list')]: list,
  [symbol('new-array')]: list,
  [symbol('new-set')]: new_set,
  [symbol('new-map')]: new_map,
  [symbol('>')]: greater,
  [symbol('>=')]: greater_or_equal,
  [symbol('<')]: lesser,
  [symbol('<=')]: lesser_or_equal,
  [symbol('=')]: equal,
  [symbol('and')]: and,
  [symbol('or')]: or,
  [symbol('not')]: not,
}

function castRational(ast: AST, context: { when: string }): Rational {
  if (
    typeof ast === 'object' &&
    !Array.isArray(ast) &&
    !(ast instanceof Set) &&
    !(ast instanceof Map) &&
    ast.type === 'rational'
  )
    return ast
  throw new EvaluationError({ when: context.when, message: 'expect Num', ast })
}

function castNum(ast: AST, context: { when: string }): number {
  if (typeof ast === 'number') return ast
  ast = castRational(ast, context)
  return ast.up / ast.down
}

function castString(ast: AST, context: { when: string }): string {
  if (typeof ast === 'string') return ast
  throw new EvaluationError({
    when: context.when,
    message: 'expect string',
    ast,
  })
}

function castComparable(ast: AST, context: { when: string }): number | string {
  if (typeof ast === 'string') return ast
  return castNum(ast, context)
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
