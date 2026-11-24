export function greatestCommonDivisor(first: number, second: number): number {
  while (second !== 0) {
    [first, second] = [second, first % second];
  }
  return first;
}
