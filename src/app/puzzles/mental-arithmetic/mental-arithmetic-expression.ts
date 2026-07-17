type ArithmeticExpressionNode =
  | { kind: 'number'; value: string }
  | { kind: 'group'; expression: ArithmeticExpressionNode }
  | { kind: 'square-root'; radicand: ArithmeticExpressionNode }
  | {
      kind: 'binary';
      operator: '+' | '-' | 'x' | '/' | '^';
      left: ArithmeticExpressionNode;
      right: ArithmeticExpressionNode;
    };

export function arithmeticExpressionToLatex(expression: string): string {
  return renderLatex(new ArithmeticExpressionParser(tokenize(expression)).parse());
}

class ArithmeticExpressionParser {
  private position = 0;

  constructor(private readonly tokens: string[]) {}

  parse(): ArithmeticExpressionNode {
    const expression = this.parseAdditionAndSubtraction();

    if (this.peek() !== undefined) {
      throw new Error(`Jeton inattendu : ${this.peek()}`);
    }

    return expression;
  }

  private parseAdditionAndSubtraction(): ArithmeticExpressionNode {
    let left = this.parseMultiplicationAndDivision();

    while (this.peek() === '+' || this.peek() === '-') {
      const operator = this.consume() as '+' | '-';
      left = {
        kind: 'binary',
        operator,
        left,
        right: this.parseMultiplicationAndDivision(),
      };
    }

    return left;
  }

  private parseMultiplicationAndDivision(): ArithmeticExpressionNode {
    let left = this.parsePower();

    while (this.peek() === 'x' || this.peek() === '/') {
      const operator = this.consume() as 'x' | '/';
      left = {
        kind: 'binary',
        operator,
        left,
        right: this.parsePower(),
      };
    }

    return left;
  }

  private parsePower(): ArithmeticExpressionNode {
    const left = this.parsePrimary();

    if (this.peek() !== '^') {
      return left;
    }

    this.consume('^');
    return {
      kind: 'binary',
      operator: '^',
      left,
      right: this.parsePower(),
    };
  }

  private parsePrimary(): ArithmeticExpressionNode {
    const token = this.peek();

    if (token === undefined) {
      throw new Error('Expression arithmétique incomplète.');
    }

    if (/^\d+$/.test(token)) {
      this.consume();
      return { kind: 'number', value: token };
    }

    if (token === 'sqrt') {
      this.consume('sqrt');
      this.consume('(');
      const radicand = this.parseAdditionAndSubtraction();
      this.consume(')');
      return { kind: 'square-root', radicand };
    }

    if (token === '(') {
      this.consume('(');
      const expression = this.parseAdditionAndSubtraction();
      this.consume(')');
      return { kind: 'group', expression };
    }

    throw new Error(`Valeur inattendue : ${token}`);
  }

  private peek(): string | undefined {
    return this.tokens[this.position];
  }

  private consume(expected?: string): string {
    const token = this.tokens[this.position];

    if (token === undefined || (expected !== undefined && token !== expected)) {
      throw new Error(`Jeton attendu : ${expected ?? 'valeur'}`);
    }

    this.position += 1;
    return token;
  }
}

function tokenize(expression: string): string[] {
  const tokens: string[] = [];
  let position = 0;

  while (position < expression.length) {
    const character = expression[position];

    if (/\s/.test(character)) {
      position += 1;
      continue;
    }

    if (expression.startsWith('sqrt', position)) {
      tokens.push('sqrt');
      position += 4;
      continue;
    }

    if (/\d/.test(character)) {
      let end = position + 1;

      while (end < expression.length && /\d/.test(expression[end])) {
        end += 1;
      }

      tokens.push(expression.slice(position, end));
      position = end;
      continue;
    }

    if ('()+-x/^'.includes(character)) {
      tokens.push(character);
      position += 1;
      continue;
    }

    throw new Error(`Caractère arithmétique non reconnu : ${character}`);
  }

  return tokens;
}

function renderLatex(node: ArithmeticExpressionNode): string {
  if (node.kind === 'number') {
    return node.value;
  }

  if (node.kind === 'group') {
    return `\\left(${renderLatex(node.expression)}\\right)`;
  }

  if (node.kind === 'square-root') {
    return `\\sqrt{${renderWithoutOuterGroup(node.radicand)}}`;
  }

  if (node.operator === '/') {
    return `\\frac{${renderWithoutOuterGroup(node.left)}}{${renderWithoutOuterGroup(node.right)}}`;
  }

  if (node.operator === '^') {
    return `${renderLatex(node.left)}^{${renderWithoutOuterGroup(node.right)}}`;
  }

  const operator = node.operator === 'x' ? '\\times' : node.operator;
  return `${renderLatex(node.left)} ${operator} ${renderLatex(node.right)}`;
}

function renderWithoutOuterGroup(node: ArithmeticExpressionNode): string {
  return renderLatex(node.kind === 'group' ? node.expression : node);
}
