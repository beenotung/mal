export type AST = Num | string | AST[] | Keyword | symbol

export type Num = number | Rational

export type ComplexAST = Exclude<AST, number | string | symbol>

export let symbol = Symbol.for

export type Rational = {
  type: 'rational'
  up: number
  down: number
}

export function rational(up: number, down: number): Rational {
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
