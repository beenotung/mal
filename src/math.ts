export function lcm(a: number, b: number): number {
  return (a * b) / gcm(a, b)
}

export function gcm(a: number, b: number): number {
  let tmp
  for (;;) {
    if (b === 0) return a
    if (a === b) return a
    if (a < b) {
      tmp = a
      a = b
      b = tmp
    } else {
      tmp = a % b
      a = b
      b = tmp
    }
  }
}
