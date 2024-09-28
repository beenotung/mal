import readline from 'readline'
import { parse } from './parse'
import { AST } from './ast'
import { RootEnvironment } from './evaluate'

export async function repl() {
  let inputLineFeed = getInputLineFeed()
  let inputFeed = mapInputFeed(inputLineFeed)
  let rootEnv = new RootEnvironment()
  for await (let input of inputFeed) {
    if (input.type == 'symbol' && input.value == '.exit') {
      inputLineFeed.throw('stop')
      break
    }
    let output = rootEnv.evaluate(input)
    print(output)
  }
}

async function* getInputLineFeed() {
  let io = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  try {
    for (;;) {
      let line = await new Promise<string>((resolve, reject) => {
        io.question('> ', resolve)
      })
      line = line.trim()
      if (line) {
        yield line
      }
    }
  } catch (error) {
    if (error == 'stop') {
      io.close()
      return
    }
    throw error
  }
}

async function* mapInputFeed(inputLineFeed: AsyncGenerator<string>) {
  for await (let line of inputLineFeed) {
    let ast = parse(line)
    yield ast
  }
}

export function print(ast: AST) {
  console.dir(ast)
}
