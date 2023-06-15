import util from 'util'
import { symbol } from './symbol'

export function parse(input: string) {
  let rest = input.trim()

  if (rest.length === 0) return symbol('empty')

  let char_type = parse_char_type(rest[0])
  switch (char_type) {
    case digit:
      return check_parse_result(parse_number(rest))
    case string_quote:
      return check_parse_result(parse_string(rest))
    default:
      throw new ParseError({ when: 'parse', rest })
  }
}

type ParseResult = {
  value: any
  rest: string
}

function check_parse_result(result: ParseResult) {
  if (result.rest.length === 0) {
    return result.value
  }
  throw new ParseError({ when: 'parse', ...result })
}

let digit = symbol('digit')
let string_quote = symbol('string-quote')
let whitespace = symbol('whitespace')
let open_bracket = symbol('open-bracket')
let close_bracket = symbol('close-bracket')
let empty = symbol('empty')
let other = symbol('other')

function parse_char_type(char: string) {
  switch (char) {
    case undefined:
      return empty
    case '(':
      return open_bracket
    case ')':
      return close_bracket
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
      return digit
    case '"':
      return string_quote
    case ' ':
    case '\n':
    case '\t':
      return whitespace
    default:
      return other
  }
}

export type AST = Num

export type Num =
  | number
  | { type: 'rational-number'; left: number; right: number }

function parse_number(rest: string) {
  let when = 'parse_number(left)'
  let left_result = parse_float(rest)
  let value: Num = left_result.number
  rest = left_result.rest

  if (rest[0] === '/') {
    rest = rest.slice(1)
    when = 'parse_number(right)'
    let right_result = parse_float(rest)
    value = {
      type: 'rational-number',
      left: left_result.number,
      right: right_result.number,
    }
    rest = right_result.rest
  }

  let rest_char_type = parse_char_type(rest[0])

  switch (rest_char_type) {
    case whitespace:
      rest = rest.trim()
      break
    case empty:
    case close_bracket:
      break
    default:
      throw new ParseError({ when, value, rest_char_type, rest })
  }

  return { value, rest }
}

function parse_float(rest: string) {
  let number = parseFloat(rest)
  rest = rest.slice(String(number).length)
  return { number, rest }
}

function parse_string(rest: string) {
  let value = ''
  let char
  let len = rest.length
  let offset = 0
  for (;;) {
    offset++
    if (offset >= len) {
      throw new ParseError({
        when: 'parse_string',
        message: 'missing terminating string quote',
        value,
        rest,
      })
    }
    char = rest[offset]
    switch (char) {
      case '"':
        rest = rest.slice(offset + 1)
        return { value, rest }
      case '\\':
        if (offset + 1 >= len) {
          throw new ParseError({
            when: 'parse_string',
            message: 'missing char after escape sequence',
            value,
            rest,
          })
        }
        offset++
        char = rest[offset]
        break
    }
    value += char
  }
}

type ContextType<T extends object = {}> = T & { when: string; rest: string }

export class ParseError<Context extends ContextType> extends Error {
  constructor(public context: Context) {
    super(util.inspect(context))
  }
}