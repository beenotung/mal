import readline from 'readline'

type Context = {
  question(query: string, callback: (answer: string) => void): void
  write(output: string): void
}

function main() {
  let options = {
    input: process.stdin,
    output: process.stdout,
  }
  process.stdout.write('1')
  let io = readline.createInterface(options)
  let context: Context = {
    question: io.question.bind(io),
    write(output: string) {
      process.stdout.write(output)
    },
  }
  repl(context)
}

function repl(context: Context) {
  read(context, input => {
    print(context, evaluate(parse(input)))
    context.write('\n')
    repl(context)
  })
}

function read(context: Context, cb: (input: string) => void) {
  context.question('> ', cb)
}

export function parse(input: string): AST {
  let { ast, rest } = parse_one(input)
  if (rest) {
    throw new Error('extra tokens: ' + JSON.stringify(rest))
  }
  return ast
}

function parse_one(input: string): { ast: AST; rest: string } {
  input = input.trim()
  if (!input) throw new Error('empty input')

  let char = input[0]

  // list
  if (char == '(') {
    input = input.slice(1).trim()
    let list: AST[] = []
    for (;;) {
      let char = input[0]
      if (char == ')') break
      let { ast, rest } = parse_one(input)
      list.push(ast)
      input = rest.trim()
    }
    input = input.slice(1).trim()
    return { ast: { type: type_list, value: list }, rest: input }
  }

  // string
  if (char == '"') {
    let string = ''
    for (let i = 1; i < input.length; i++) {
      char = input[i]
      if (char == '"') {
        let rest = input.slice(i + 1)
        return { ast: { type: type_string, value: string }, rest }
      }
      if (char == '\\') {
        i++
        string += input[i]
        continue
      }
      string += char
    }
    throw new Error('missing closing quote of string')
  }

  // keyword
  if (char == ':') {
    let { name, rest } = parse_name(input.slice(1))
    return { ast: { type: type_keyword, value: name }, rest }
  }

  // quote
  if (char == "'") {
    let { ast, rest } = parse_one(input.slice(1))
    return { ast: { type: type_quote, value: ast }, rest }
  }

  // integer or rational number
  let number = parseFloat(input)
  if (Number.isInteger(number)) {
    let rest = input.slice(String(number).length).trim()
    if (rest[0] == '/') {
      rest = rest.slice(1)
      let p = number
      let q = parseFloat(rest)
      if (!Number.isInteger(q))
        throw new Error(
          'expect second integer of rational number, got: ' +
            JSON.stringify(rest),
        )
      rest = rest.slice(String(q).length).trim()
      return { ast: { type: type_rational, value: { p, q } }, rest }
    }
    return { ast: { type: type_int, value: number }, rest }
  }

  // float
  if (Number.isFinite(number)) {
    let rest = input.slice(String(number).length).trim()
    return { ast: { type: type_float, value: number }, rest }
  }

  // symbol
  let { name, rest } = parse_name(input)
  return { ast: { type: type_symbol, value: name }, rest }
}

function parse_name(input: string): { name: string; rest: string } {
  let name = ''
  let char: string
  let i = 0
  for_name_char: for (; i < input.length; i++) {
    char = input[i]
    switch (char) {
      case ')':
      case ' ':
      case '\n':
      case '\r':
      case '\t':
        break for_name_char
      default:
        name += char
    }
  }
  let rest = input.slice(name.length).trim()
  return { name, rest }
}

export const type_int = 1
export const type_float = 2
export const type_rational = 3
export const type_string = 4
export const type_keyword = 5
export const type_quote = 6
export const type_symbol = 7
export const type_list = 8

export type AST =
  | { type: typeof type_int; value: number }
  | { type: typeof type_float; value: number }
  // rational: a/b
  | { type: typeof type_rational; value: { p: number; q: number } }
  | { type: typeof type_string; value: string }
  | { type: typeof type_keyword; value: string }
  | { type: typeof type_quote; value: AST }
  | { type: typeof type_symbol; value: string }
  | { type: typeof type_list; value: AST[] }

function print(context: Context, ast: AST) {
  switch (ast.type) {
    case type_int:
    case type_float:
      context.write(String(ast.value))
      break
    case type_rational:
      context.write(`${ast.value.p}/${ast.value.q}`)
      break
    case type_string:
      context.write(JSON.stringify(ast.value))
      break
    case type_keyword:
      context.write(`:${ast.value}`)
      break
    case type_symbol:
      context.write(ast.value)
      break
    case type_list: {
      let list = ast.value
      context.write('(')
      if (list.length > 0) {
        print(context, list[0])
      }
      for (let i = 1; i < list.length; i++) {
        context.write(' ')
        print(context, list[i])
      }
      context.write(')')
      break
    }
    default:
      throw new Error('not implemented: print type: ' + ast.type)
  }
}

function evaluate(ast: AST): AST {
  return ast
}

if (__filename == process.argv[1]) {
  main()
}
