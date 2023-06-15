export let symbol = Symbol.for

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
