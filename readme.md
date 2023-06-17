# mal (make-a-lisp) practice

## Expressions

| Type     | Example                |
| -------- | ---------------------- |
| integer  | 1                      |
| float    | 0.5                    |
| rational | 1/2                    |
| string   | "string with \" quote" |
| keyword  | :kebab-case?           |
| symbol   | kebab-case?            |
| list     | (+ 2 3)                |

## Built-In Data Types

| Data Type | Example Creation Expression |
| --------- | --------------------------- |
| list      | (list 2 3)                  |
| Array     | (new-array 2 3)             |
| Set       | (new-set 2 3)               |

## To Do

- [ ] Variable
- [ ] Boolean
- [ ] Array
- [ ] Object
- [ ] Map
- [ ] Set
- [ ] Date
- [ ] Function

## Math Functions

The math functions support operating on both real number and rational number

### Variadic Operators

| operator | 0 arg | 1 arg      | 2..k arg            |
| -------- | ----- | ---------- | ------------------- |
| +        | 0     | 1st        | sum of all args     |
| -        | 0     | negate 1st | 1st - 2nd ... - kth |
| \*       | 1     | 1st        | product of all args |
| /        | 1     | 1st        | 1st / 2nd ... / kth |

### Javascript Math Functions

abs, acos, asin, atan, atan2, ceil, cos, exp, floor, log, max, min, pow, random, round, sin, sqrt, tan

## Reference

https://github.com/kanaka/mal
