export function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b)
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
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
