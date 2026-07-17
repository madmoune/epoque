import katex from 'katex';
import { arithmeticExpressionToLatex } from './mental-arithmetic-expression';
import {
  MENTAL_ARITHMETIC_TEMPLATE_COUNT,
  createArithmeticProblem,
} from './mental-arithmetic-problem';

describe('arithmeticExpressionToLatex', () => {
  it('renders powers and their following divisions as distinct operations', () => {
    expect(arithmeticExpressionToLatex('(5 + 3)^2 / 2 - 3 x (11 - 9) + 3^2')).toBe(
      '\\frac{\\left(5 + 3\\right)^{2}}{2} - 3 \\times \\left(11 - 9\\right) + 3^{2}',
    );
  });

  it('removes redundant parentheses inside a scientific fraction', () => {
    expect(arithmeticExpressionToLatex('(13^2 - 7^2) / (13 - 7)')).toBe(
      '\\frac{13^{2} - 7^{2}}{13 - 7}',
    );
  });

  it('renders square roots and nested groups', () => {
    expect(arithmeticExpressionToLatex('sqrt(144) x (8 + (3 x 4 - 2))')).toBe(
      '\\sqrt{144} \\times \\left(8 + \\left(3 \\times 4 - 2\\right)\\right)',
    );
  });

  it('rejects characters outside the arithmetic grammar', () => {
    expect(() => arithmeticExpressionToLatex('4 * 3')).toThrow(
      'Caractère arithmétique non reconnu',
    );
  });

  it('renders every generated problem template with KaTeX', () => {
    for (let template = 0; template < MENTAL_ARITHMETIC_TEMPLATE_COUNT; template += 1) {
      let call = 0;
      const random = (): number => {
        call += 1;
        return call === 1 ? (template + 0.5) / MENTAL_ARITHMETIC_TEMPLATE_COUNT : 0.47;
      };
      const latex = arithmeticExpressionToLatex(createArithmeticProblem(random).expression);

      expect(() =>
        katex.renderToString(latex, {
          displayMode: true,
          throwOnError: true,
        }),
      ).not.toThrow();
    }
  });
});
