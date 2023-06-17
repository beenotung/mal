import { gcd } from './math'

export type AST =
  | Num
  | boolean
  | string
  | AST[]
  | Keyword
  | symbol
  | Set<AST>
  | Map<AST, AST>

export type Num = number | Rational

export type ComplexAST = Exclude<AST, number | string | symbol>

export let symbol = Symbol.for

export type Rational = {
  type: 'rational'
  up: number
  down: number
}

export function rational(up: number, down: number): Rational | number {
  if (down < 0) {
    up = -up
    down = -down
  }
  if (down === 1) return up
  if (up === 1)
    return {
      type: 'rational',
      up,
      down,
    }
  if (up % down === 0) return up / down
  let factor = gcd(up, down)
  if (factor !== 1) {
    up /= factor
    down /= factor
  }
  return {
    type: 'rational',
    up,
    down,
  }
}

export type Keyword = {
  type: 'keyword'
  value: string
}

let keywords = new Map<string, Keyword>()

export function keyword(value: string): Keyword {
  let instance = keywords.get(value)
  if (!instance) {
    instance = { type: 'keyword', value }
    keywords.set(value, instance)
  }
  return instance
}

export function list(...nodes: AST[]): AST[] {
  return nodes
}
