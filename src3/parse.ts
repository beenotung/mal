import { AST } from './ast'

export class Parser {
  constructor(public input: string, public offset = 0) {}

  parse(): AST.Any {
    let { input } = this
    for (; this.offset < input.length; ) {
      this.parse_whitespace()
      if (this.offset >= input.length) break
      let char = input[this.offset]
      switch (char) {
        case '"':
        case "'":
          return this.parse_string()
        case '[': {
          this.offset++
          let value = this.parse_list_body(']')
          return { type: 'array', value }
        }
        case '(': {
          this.offset++
          let value = this.parse_list_body(')')
          return { type: 'list', value }
        }
        default: {
          if ('0' <= char && char <= '9') {
            return this.parse_number()
          }
          return this.parse_symbol()
        }
      }
    }
    throw new IncompleteInputParserError(this)
  }

  parse_whitespace() {
    let { input, offset } = this
    loop: for (; offset < input.length; ) {
      let char = input[offset]
      switch (char) {
        case ' ':
        case '\t':
        case '\n':
        case '\r':
          // whitespace
          offset++
          continue
        default:
          break loop
      }
    }
    this.offset = offset
  }

  parse_number(): AST.Integer | AST.Float {
    let ast = this.parse_integer()
    if (this.input[this.offset] == '.') {
      let a = ast.value
      this.offset += 1
      let b = this.parse_integer().value
      let value = +(a + '.' + b)
      return { type: 'float', value }
    }
    return ast
  }

  parse_integer(): AST.Integer {
    let { input, offset } = this
    let value = 0
    for (; offset < input.length; ) {
      let char = input[offset]
      if ('0' <= char && char <= '9') {
        value = value * 10 + +char
        offset++
      } else {
        break
      }
    }
    this.offset = offset
    return { type: 'integer', value }
  }

  parse_string(): AST.String {
    let { input, offset } = this
    let quote = input[offset]
    offset += 1
    let value = ''
    for (; offset < input.length; offset++) {
      let char = input[offset]
      if (char == quote) {
        offset++
        break
      }
      if (char == '\\') {
        offset++
        value += input[offset]
      } else {
        value += char
      }
    }
    this.offset = offset
    return { type: 'string', value }
  }

  parse_list_body(end_char: string): AST.Any[] {
    let { input } = this
    let value: AST.Any[] = []
    for (; this.offset < input.length; ) {
      let char = input[this.offset]
      if (char == end_char) {
        this.offset += 1
        return value
      }
      let ast = this.parse()
      value.push(ast)
      this.parse_whitespace()
      char = input[this.offset]
      if (char == ',') {
        this.offset += 1
        this.parse_whitespace()
      }
    }
    throw new IncompleteInputParserError(this, end_char)
  }

  parse_symbol(): AST.Symbol {
    let { input, offset } = this
    let value = ''
    loop: for (; offset < input.length; offset++) {
      let char = input[offset]
      switch (char) {
        case ' ':
        case '\t':
        case '\n':
        case '\r':
          // whitespace
          break loop
        case ')':
          // end of symbol and invoked list
          break loop
        default:
          value += char
      }
    }
    this.offset = offset
    return { type: 'symbol', value }
  }
}

export class IncompleteInputParserError extends Error {
  constructor(public parser: Parser, public missing?: string) {
    super('not enough input to be parsed')
  }
}

export class ExtraInputParserError extends Error {
  constructor(public parser: Parser, public ast?: AST) {
    super('got extra input not fully parsed')
  }
}

export function parse(input: string, offset: number = 0): AST.Any {
  let parser = new Parser(input, offset)
  let ast = parser.parse()
  if (parser.offset < input.length) {
    throw new ExtraInputParserError(parser, ast)
  }
  return ast
}
