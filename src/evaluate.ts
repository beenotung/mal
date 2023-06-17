import util from 'util'
import { AST, Rational, rational, symbol } from './token'
import { lcm } from './math'

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
      return add(args)
    case minus_operator:
      return minus(args)
    case multiply_operator:
      return multiply(args)
    case divide_operator:
      return divide(args)
    default:
      throw new EvaluationError({
        when: 'evaluate_list',
        message: 'unexpected fn',
        fn,
        args,
      })
  }
}

function add(args: AST[]): AST {
  if (args.length === 0) {
    return 0
  }
  let left = args[0]
  for (let i = 1; i < args.length; i++) {
    left = add_two(left, args[i])
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
    right = castRational(right, { when: 'add', message: 'expect Num' })
    let down = right.down
    let up = left * down + right.up
    return rational(up, down)
  }
  if (typeof right === 'number') {
    left = castRational(left, { when: 'add', message: 'expect Num' })
    let down = left.down
    let up = left.up + right * down
    return rational(up, down)
  }
  left = castRational(left, { when: 'add', message: 'expect Num' })
  right = castRational(right, { when: 'add', message: 'expect Num' })
  let down = lcm(left.down, right.down)
  let up = (down / left.down) * left.up + (down / right.down) * right.up
  return rational(up, down)
}

function minus(args: AST[]): AST {
  if (args.length === 0) {
    return 0
  }
  let left = args[0]
  if (args.length === 1) {
    if (typeof left === 'number') {
      return -left
    }
    left = castRational(left, { when: 'minus', message: 'expect Num' })
    return rational(-left.up, left.down)
  }
  for (let i = 1; i < args.length; i++) {
    left = minus_two(left, args[i])
  }
  return left
}

function minus_two(left: AST, right: AST): AST {
  if (right === 0) return left
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right
  }
  if (typeof left === 'number') {
    right = castRational(right, { when: 'minus', message: 'expect Num' })
    let down = right.down
    let up = left * down - right.up
    return rational(up, down)
  }
  if (typeof right === 'number') {
    left = castRational(left, { when: 'minus', message: 'expect Num' })
    let down = left.down
    let up = left.up - right * down
    return rational(up, down)
  }
  left = castRational(left, { when: 'minus', message: 'expect Num' })
  right = castRational(right, { when: 'minus', message: 'expect Num' })
  let down = lcm(left.down, right.down)
  let up = (down / left.down) * left.up - (down / right.down) * right.up
  return rational(up, down)
}

function multiply(args: AST[]): AST {
  if (args.length === 0) {
    return 1
  }
  let left = args[0]
  for (let i = 1; i < args.length; i++) {
    left = multiply_two(left, args[i])
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
    right = castRational(right, { when: 'multiply', message: 'expect Num' })
    let up = left * right.up
    let down = right.down
    return rational(up, down)
  }
  if (typeof right === 'number') {
    left = castRational(left, { when: 'multiply', message: 'expect Num' })
    let up = left.up * right
    let down = left.down
    return rational(up, down)
  }
  left = castRational(left, { when: 'multiply', message: 'expect Num' })
  right = castRational(right, { when: 'multiply', message: 'expect Num' })
  let up = left.up * right.up
  let down = left.down * right.down
  return rational(up, down)
}

function divide(args: AST[]): AST {
  if (args.length === 0) {
    return 1
  }
  let left = args[0]
  if (args.length === 1) {
    return one_divide(left)
  }
  for (let i = 1; i < args.length; i++) {
    left = divide_two(left, args[i])
  }
  return left
}

function one_divide(ast: AST): AST {
  if (ast === 1) return 1
  if (typeof ast === 'number') {
    return rational(1, ast)
  }
  ast = castRational(ast, { when: 'divide', message: 'expect Num' })
  return rational(ast.down, ast.up)
}

function divide_two(left: AST, right: AST): AST {
  if (right === 1) return left
  if (typeof left === 'number' && typeof right === 'number') {
    return rational(left, right)
  }
  if (typeof right === 'number') {
    right = one_divide(right)
  } else {
    right = castRational(right, { when: 'divide', message: 'expect Num' })
  }
  return multiply_two(left, right)
}

function castRational(ast: AST, context: ContextType): Rational {
  if (Array.isArray(ast)) {
    throw new EvaluationError({ ...context, ast })
  }
  if (typeof ast == 'object' && ast.type === 'rational') {
    return ast
  }
  throw new EvaluationError({ ...context, ast })
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
