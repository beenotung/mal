import readline from 'readline'
import { evaluate } from './evaluate'
import { parse } from './reader'

let io = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

export function repl() {
  read(input => {
    try {
      let ast = parse(input)
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

function print(result: any) {
  console.log(result)
}
