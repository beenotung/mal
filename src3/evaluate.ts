import { AST } from './ast'

export class Environment {
  parent?: Environment

  fn_map = new Map<string, (args: AST[]) => AST>()

  get_fn(name: string): (args: AST[]) => AST {
    let fn = this.fn_map.get(name)
    if (fn) return fn
    if (this.parent) return this.parent.get_fn(name)
    throw new FunctionNotDefinedEvaluateError(this, name)
  }

  evaluate(ast: AST): AST {
    if (ast.type == 'list') {
      return this.evaluate_list(ast)
    }
    return ast
  }

  evaluate_list(ast: AST.List): AST {
    let args = ast.value as AST[]
    if (args.length == 0) {
      throw new EmptyListEvaluateError(this)
    }
    let symbol = args[0] as AST.Symbol
    let fn = this.get_fn(symbol.value)
    let values: AST[] = new Array(args.length - 1)
    for (let i = 1; i < args.length; i++) {
      values[i - 1] = this.evaluate(args[i])
    }
    return fn(values)
  }

  define_fn(name: string, fn: (args: AST[]) => AST) {
    this.fn_map.set(name, fn.bind(this))
  }
}

export class RootEnvironment extends Environment {
  constructor() {
    super()
    this.define_fn('+', this.add)
  }

  add(args: AST[]): AST {
    let value = 0
    for (let i = 0; i < args.length; i++) {
      let arg = args[i]
      switch (arg.type) {
        case 'integer': {
          value += arg.value
          continue
        }
        case 'float': {
          value += arg.value
          continue
        }
        default: {
          throw new NotOverloadedEvaluateError(this, '+', args, i)
        }
      }
    }
    return { type: 'integer', value }
  }
}

export class NotOverloadedEvaluateError extends Error {
  constructor(
    public environment: Environment,
    public fn_name: string,
    public args: AST[],
    public arg_index: number,
  ) {
    let name = JSON.stringify(fn_name)
    let type = JSON.stringify(args[arg_index].type)
    super(
      `the function ${name} is not overloaded to support argument of type ${type}`,
    )
  }
}

export class EmptyListEvaluateError extends Error {
  constructor(public environment: Environment) {
    super('list to be evaluated cannot be empty')
  }
}

export class FunctionNotDefinedEvaluateError extends Error {
  constructor(public environment: Environment, public fn_name: string) {
    super('function not defined: ' + JSON.stringify(fn_name))
  }
}
