export type AST = AST.Any

export namespace AST {
  export type Any = Integer | Float | String | Array | Symbol | List

  export type Integer = {
    type: 'integer'
    value: number
  }

  export type Float = {
    type: 'float'
    value: number
  }

  export type String = {
    type: 'string'
    value: string
  }

  export type Array<T = unknown> = {
    type: 'array'
    value: T[]
  }

  export type Symbol = {
    type: 'symbol'
    value: string
  }

  export type List<T = unknown> = {
    type: 'list'
    value: T[]
  }
}
