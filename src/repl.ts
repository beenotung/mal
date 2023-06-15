import readline from 'readline'
import { parse } from './reader'
import { symbol } from './token'

let io = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

export function repl() {
  read(input => {
    try {
      let ast = parse(input)
      console.log('parse result:', ast)
      let result = evaluate(ast)
      print(result)
    } catch (error) {
      console.error('parse error:', error)
    }
    repl()
  })
}

function read(cb: (input: string) => void) {
  io.question('> ', cb)
}

function evaluate(ast: any) {
  return symbol('evaluate not implemented')
}

function print(result: any) {
  console.log(result)
}
