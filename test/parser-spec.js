const Parser = require('../src/parser.js');
const algebra = require('../src/algebra.js');

const { Expression } = algebra;
const { Fraction } = algebra;
const { Equation } = algebra;

describe('Input validity', () => {
  const p = new Parser();

  it('should throw an error if the input contains invalid divisions.', () => {
    const input = '1/(x-3)=1';
    expect(() => {
      p.parse(input);
    }).toThrow(new Error('Invalid Argument (x - 3): Divisor must be of type Integer or Fraction.'));
  });

  it('does not accept special characters', () => {
    const input = '2+4*x-€';
    expect(() => {
      p.parse(input);
    }).toThrow(new Error('Token error at character € at position 6'));
  });

  it('does not accept variable names with numbers', () => {
    const input = '2+4x';
    expect(p.parse(input)).toNotEqual(new Expression('4x').add(2));
  });

  it('does not accept operators without operands', () => {
    const input = '+';
    expect(() => {
      p.parse(input);
    }).toThrow(new Error('Missing operand'));
  });

  it('should ignore newlines', () => {
    const input = '2+z \n = 5';
    const lhs = new Expression('z').add(2);
    const rhs = new Expression(5);
    expect(p.parse(input)).toEqual(new Equation(lhs, rhs));
  });

  it('should accept words as variable names', () => {
    const input = '2+alpha = 5';
    const lhs = new Expression('alpha').add(2);
    const rhs = new Expression(5);
    expect(p.parse(input)).toEqual(new Equation(lhs, rhs));
  });

  it('should work from the algebra module', () => {
    const input = '2+alpha = 5';
    const lhs = new Expression('alpha').add(2);
    const rhs = new Expression(5);
    expect(algebra.parse(input)).toEqual(new Equation(lhs, rhs));
  });

  it('should not accept incomplete decimal numbers', () => {
    const input = '2. + x * 4';
    expect(() => {
      p.parse(input);
    }).toThrow(new Error('Decimal point without decimal digits at position 1'));
  });

  it('should not accept short notation for decimals x with 0 > x < 1', () => {
    const input = '.2 + x * 4';
    expect(() => {
      p.parse(input);
    }).toThrow(new Error('Token error at character . at position 0'));
  });

  it('should treat decimal numbers correctly', () => {
    const input = '2.0 + 4.5';
    const expr = new Expression(13).divide(2);
    expect(algebra.parse(input)).toEqual(expr);
  });

  it('should treat decimal numbers correctly', () => {
    const input = '0.0';
    const expr = new Expression(0);
    expect(algebra.parse(input)).toEqual(expr);
  });

  it('should treat negative numbers correctly', () => {
    const input = 'x = -4';
    const eqn = new Equation(new Expression('x'), new Expression(-4));
    expect(algebra.parse(input)).toEqual(eqn);
  });

  it('should parse terms following negative terms correctly', () => {
    const input = '-2*x+3y=4';
    const eqn = new Equation(
      new Expression('x').multiply(-2).add(new Expression('y').multiply(3)),
      new Expression(4),
    );
    expect(algebra.parse(input)).toEqual(eqn);
  });
});

describe('Operators', () => {
  const p = new Parser();
  it('should parse = as equations', () => {
    const input = '2+x = 5';
    const lhs = new Expression('x').add(2);
    const rhs = new Expression(5);
    expect(p.parse(input)).toEqual(new Equation(lhs, rhs));
  });

  it('should parse - correctly', () => {
    const input = '2-x = 5';
    const lhs = new Expression(2).subtract(new Expression('x'));
    const rhs = new Expression(5);
    expect(p.parse(input).toString()).toEqual(new Equation(lhs, rhs).toString());
  });

  it('should parse / correctly', () => {
    const input = 'x/2 = 8';
    const lhs = new Expression('x').divide(2);
    const rhs = new Expression(8);
    expect(p.parse(input)).toEqual(new Equation(lhs, rhs));
  });

  it('should parse / correctly', () => {
    const input = 'x/5/3';
    const lhs = new Expression('x').divide(5).divide(3);
    expect(p.parse(input)).toEqual(lhs);
  });

  it('should parse ^ correctly', () => {
    const input = 'x^2 = 16';
    const lhs = new Expression('x').pow(2);
    const rhs = new Expression(16);
    expect(p.parse(input)).toEqual(new Equation(lhs, rhs));
  });
});

describe('Parenthesis', () => {
  const p = new Parser();
  it('should parse and reduce parenthesis correctly', () => {
    const input = '(2)*((4)+((x)))';
    expect(p.parse(input)).toEqual(new Expression('x').add(4).multiply(2));
  });

  it('should throw an errow if there is an extra opening parenthesis', () => {
    const input = '2-(4*x';
    expect(() => {
      p.parse(input);
    }).toThrow(new Error('Unbalanced Parenthesis'));
  });

  it('should throw an errow if there is an extra closing parenthesis', () => {
    const input = '2+4*x)';
    expect(() => {
      p.parse(input);
    }).toThrow(new Error('Unbalanced Parenthesis'));
  });
});

describe('Order of operations', () => {
  const p = new Parser();

  it('should execute * before +', () => {
    const input = '2 * x + 2 + 4 * 3';
    expect(p.parse(input)).toEqual(
      new Expression('x')
        .multiply(2)
        .add(2)
        .add(12),
    );
  });

  it('should execute () before +', () => {
    const input = '2 * x * (3 + 4)';
    expect(p.parse(input)).toEqual(new Expression('x').multiply(2).multiply(7));
  });

  it("should execute * and / in the order that they're seen", () => {
    const input = '2 * x / (4 + 3)';
    expect(p.parse(input)).toEqual(new Expression('x').multiply(2).divide(7));
  });

  it('should treat consecutive parentheses as multiplication', () => {
    const input = '(x + 2)(x + 2)';
    let e1 = new Expression('x').add(2);
    e1 = e1.multiply(e1);
    expect(algebra.parse(input)).toEqual(e1);
  });

  it('should treat integers adjacent to parentheses as multiplication', () => {
    const input = '5(x+2)';
    let e1 = new Expression('x').add(2);
    e1 = e1.multiply(5);
    expect(algebra.parse(input)).toEqual(e1);
  });

  it('should treat integers adjacent to parentheses as multiplication', () => {
    const input = '(x+2)5';
    let e1 = new Expression('x').add(2);
    e1 = e1.multiply(5);
    expect(algebra.parse(input)).toEqual(e1);
  });

  it('should be able to raise expressions wrapped in parentheses', () => {
    const input = '(x+2)^2';
    const exp = new Expression('x').add(2).pow(2);

    expect(algebra.parse(input)).toEqual(exp);
  });
  it('power has a higher operator precedence than multiplication ', () => {
    const input = 'a*x^2';
    const exp = new Expression('a').multiply(new Expression('x').pow(2));

    expect(algebra.parse(input).toString()).toEqual(exp.toString());
  });

  it('power has a higher operator precedence than multiplication when the multiply operator is missing', () => {
    const input = '(3/2)x^2';
    const exp = new Expression('x').pow(2).multiply(new Fraction(3, 2));

    expect(algebra.parse(input).toString()).toEqual(exp.toString());
  });
});
