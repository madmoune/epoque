export function isPrime(value: number): boolean {
  if (!Number.isInteger(value) || value < 2) return false;
  for (let factor = 2; factor * factor <= value; factor++) {
    if (value % factor === 0) return false;
  }
  return true;
}
