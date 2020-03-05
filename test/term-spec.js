const { Term } = require('../src/expressions');
const { Variable } = require('../src/expressions');
const Fraction = require('../src/fractions');

describe('Terms', () => {
  const x = new Variable('x');
  const t = new Term(x);

  it('are initialized with one variable', () => {
    expect(t.variables.length).toEqual(1);
  });

  it('are initialized with an array of coefficients', () => {
    expect(t.coefficients[0].equalTo(new Fraction(1, 1))).toBe(true);
  });

  it('can be initialized with nothing', () => {
    const term = new Term();

    expect(term.variables.length).toEqual(0);
    expect(term.coefficients[0].equalTo(new Fraction(1, 1))).toBe(true);
  });

  it("can't be initialized with an integer", () => {
    expect(() => Term(5)).toThrow('Invalid Argument (5): Term initializer must be of type Variable.');
  });

  it("can't be initialized with a float", () => {
    expect(() => Term(5.1)).toThrow('Invalid Argument (5.1): Term initializer must be of type Variable.');
  });

  it("can't be initialized with a string", () => {
    expect(() => Term('x')).toThrow('Invalid Argument (x): Term initializer must be of type Variable.');
  });
});

describe('Term addition', () => {
  const x = new Variable('x');
  const y = new Variable('y');

  it('combines like-terms correctly', () => {
    const t1 = new Term(x);
    const t2 = new Term(x);

    const answer = t1.add(t2);
    expect(answer.toString()).toEqual('2x');
  });

  it('throws an error if trying to combine unlike terms', () => {
    const t1 = new Term(x);
    const t2 = new Term(y);

    expect(() => {
      t1.add(t2);
    }).toThrow(
      'Invalid Argument (y): Summand must be of type String, Expression, Term, Fraction or Integer.',
    );
  });
});

describe('Term subtraction', () => {
  const x = new Variable('x');
  const y = new Variable('y');

  it('combines like-terms correctly', () => {
    const t1 = new Term(x);
    const t2 = new Term(x);

    t1.coefficients = [new Fraction(2, 1)];

    const answer = t1.subtract(t2);
    expect(answer.toString()).toEqual('x');
  });

  it('throws an error if trying to combine unlike terms', () => {
    const t1 = new Term(x);
    const t2 = new Term(y);

    expect(() => {
      t1.subtract(t2);
    }).toThrow(
      'Invalid Argument (y): Subtrahend must be of type String, Expression, Term, Fraction or Integer.',
    );
  });
});

describe('Term multiplication', () => {
  it('combines coefficients correctly', () => {
    const x = new Variable('x');
    const t1 = new Term(x);
    const t2 = new Term(x);

    t1.coefficients = [new Fraction(2, 1)];
    t2.coefficients = [new Fraction(3, 1)];

    const answer = t1.multiply(t2);
    expect(answer.toString()).toEqual('6x^2');
  });

  it('combines degrees correctly', () => {
    const x = new Variable('x');
    x.degree = 2;
    const t1 = new Term(x);
    x.degree = 3;
    const t2 = new Term(x);

    const answer = t1.multiply(t2);
    expect(answer.toString()).toEqual('x^5');
  });

  it('combines unlike terms correctly', () => {
    const x = new Variable('x');
    const y = new Variable('y');
    const t1 = new Term(x);
    const t2 = new Term(y);

    t1.coefficients = [new Fraction(2, 1)];
    t2.coefficients = [new Fraction(3, 1)];

    const answer = t1.multiply(t2);
    expect(answer.toString()).toEqual('6xy');
  });

  it('allows multiplication of integers', () => {
    const x = new Variable('x');
    const t = new Term(x);

    const answer = t.multiply(2);
    expect(answer.toString()).toEqual('2x');
  });

  it('allows multiplication of fractions', () => {
    const x = new Variable('x');
    const t = new Term(x);

    const answer = t.multiply(new Fraction(2, 3));
    expect(answer.toString()).toEqual('2/3x');
  });

  it("doesn't allow multiplication of floats", () => {
    const x = new Variable('x');
    const t = new Term(x);

    expect(() => {
      t.multiply(0.5);
    }).toThrow(
      'Invalid Argument (0.5): Multiplicand must be of type String, Expression, Term, Fraction or Integer.',
    );
  });

  it('allows unsimplified coefficients', () => {
    const x = new Variable('x');
    let t = new Term(x);

    t = t.multiply(5);
    t = t.multiply(3, false);

    expect(t.toString()).toEqual('3 * 5x');
  });

  it('allows unsimplified variables', () => {
    const x = new Variable('x');
    const t1 = new Term(x);
    const t2 = new Term(x);

    const answer = t1.multiply(t2, false);

    expect(answer.toString()).toEqual('xx');
  });
});

describe('Term division', () => {
  it('allows division of integers', () => {
    const x = new Variable('x');
    const t = new Term(x);

    const answer = t.divide(3);
    expect(answer.toString()).toEqual('1/3x');
  });

  it('allows division of fractions', () => {
    const x = new Variable('x');
    const t = new Term(x);

    const answer = t.divide(new Fraction(2, 3));
    expect(answer.toString()).toEqual('3/2x');
  });

  it("doesn't allow division of floats", () => {
    const x = new Variable('x');
    const t = new Term(x);

    expect(() => {
      t.divide(0.5);
    }).toThrow('Invalid Argument (0.5): Argument must be of type Fraction or Integer.');
  });

  it('allows unsimplified terms', () => {
    const x = new Variable('x');
    const t = new Term(x);

    let answer = t.multiply(2); // 2x
    answer = answer.divide(4, false); // 2/4x

    expect(answer.toString()).toEqual('2/4x');
  });
});

describe('Term sorting', () => {
  it('sorts variables by degree', () => {
    const x = new Term(new Variable('x'));
    const y = new Term(new Variable('y'));
    const t = y.multiply(x).multiply(x); // yx^2
    t.sort();
    expect(t.toString()).toEqual('x^2y');
  });
});

describe('Term simplification', () => {
  it('should combine terms', () => {
    const x = new Variable('x');
    const y = new Variable('y');

    let t = new Term(x);

    t = t.multiply(new Term(x), false);
    t = t.multiply(new Term(y), false);
    t = t.multiply(new Term(x), false); // xxyx

    t.combineVars();

    expect(t.toString()).toEqual('x^3y');
  });

  it('should combine coefficients', () => {
    const x = new Variable('x');

    let t = new Term(x);

    t = t.multiply(5, false);
    t = t.multiply(3, false); // 3 * 5x

    t = t.simplify();

    expect(t.toString()).toEqual('15x');
  });
});

describe('Term evaluation', () => {
  it('should work when there is one coefficient and simplify = false', () => {
    const x = new Variable('x');
    let t = new Term(x);
    t = t.multiply(3);
    t = t.multiply(5, false); // 5 * 3x

    const e = t.eval({ x: 2 }, false);

    expect(e.toString()).toEqual('5 * 3 * 2');
  });

  it('should work when there is more than 1 coefficient and more than 1 variable and simplify = false', () => {
    const x = new Variable('x');
    const y = new Variable('y');
    let t = new Term(x);

    t = t.multiply(new Term(y)); // xy
    t = t.multiply(3); // 3xy
    t = t.multiply(5, false); // 5 * 3xy
    t = t.multiply(6, false); // 6 * 5 * 3xy

    const answer = t.eval({ x: 2 }, false); // 6 * 5 * 3 * 2y
    expect(answer.toString()).toEqual('6 * 5 * 3 * 2y');
  });

  it('works with negative numbers', () => {
    const x = new Variable('x');
    const y = new Variable('y');
    let t = new Term(x);

    t = t.multiply(new Term(y)); // xy
    t = t.multiply(3); // 3xy
    t = t.multiply(5, false); // 5 * 3xy

    t = t.multiply(6, false); // 6 * 5 * 3xy

    const answer = t.eval({ x: -2 }, false); // 6 * 5 * 3 * -2y

    expect(answer.toString()).toEqual('6 * 5 * 3 * -2y');
  });
});

describe('Term printing to TeX', () => {
  it('works with unsimplified coefficients and uses cdot by default', () => {
    const x = new Variable('x');
    let t = new Term(x);

    t = t.multiply(new Fraction(2, 3));
    t = t.multiply(new Fraction(3, 4), false); // 3/4 * 2/3x

    expect(t.toTex()).toEqual('\\frac{3}{4} \\cdot \\frac{2}{3}x');
  });

  it('allows you to pass in options', () => {
    const x = new Variable('x');
    let t = new Term(x);

    t = t.multiply(new Fraction(2, 3));
    t = t.multiply(new Fraction(3, 4), false); // 3/4 * 2/3x

    expect(t.toTex({ multiplication: 'times' })).toEqual('\\frac{3}{4} \\times \\frac{2}{3}x');
  });

  it('prints the absolute value when the term is negative - integer', () => {
    const x = new Variable('x');
    const t = new Term(x);
    const z = new Term(x)
      .subtract(t)
      .subtract(t)
      .subtract(t);
    expect(z.toTex()).toEqual('2x');
  });

  it('prints the absolute value when the term is negative - fraction', () => {
    const x = new Variable('x');
    const t = new Term(x);
    const z = t.multiply(new Fraction(-9, 10));
    expect(z.toTex()).toEqual('\\frac{9}{10}x');
  });
});

describe('Term printing to to string', () => {
  it('implicit should be disabled by default', () => {
    const x = new Variable('x');
    const y = new Variable('y');
    let t = new Term(x);

    t = t.multiply(new Term(y)); // x*y

    expect(t.toString()).toEqual('xy');
  });

  it('implicit should add * between variables', () => {
    const x = new Variable('x');
    const y = new Variable('y');
    let t = new Term(x);

    t = t.multiply(new Term(y)); // x*y

    expect(t.toString({ implicit: true })).toEqual('x*y');
  });

  it('implicit should add * between the coefficient and the variables', () => {
    const x = new Variable('x');
    let t = new Term(x);

    t = t.multiply(3); // 3*x

    expect(t.toString({ implicit: true })).toEqual('3*x');
  });

  it('implicit should ignore a variable with degree 0', () => {
    const x = new Variable('x');
    x.degree = 0;
    let t = new Term(x);

    t = t.multiply(3).multiply(new Term(new Variable('y'))); // 3*(x^0)*y

    expect(t.toString({ implicit: true })).toEqual('3*y');
  });
});
