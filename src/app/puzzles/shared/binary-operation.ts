export const BINARY_OPERATORS = ['+', '−', '×', '÷'] as const;
export type BinaryOperator = (typeof BINARY_OPERATORS)[number];

export const OPERATOR_NAMES: Readonly<Record<BinaryOperator, string>> = {
  '+': 'Addition',
  '−': 'Soustraction',
  '×': 'Multiplication',
  '÷': 'Division',
};

export function applyBinaryOperation(
  left: number,
  operator: BinaryOperator,
  right: number,
): number {
  switch (operator) {
    case '+':
      return left + right;
    case '−':
      return left - right;
    case '×':
      return left * right;
    case '÷':
      return left / right;
  }
}
