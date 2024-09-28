import { repl } from './repl'

async function main() {
  await repl()
}

main().catch(e => console.error(e))
