const Fraction = require('../src/fractions');
const { Expression } = require('../src/expressions');
const algebra = require('../src/algebra');

describe('An expression initialized with an alphabetic variable name', () => {
  const x = new Expression('x');

  it('initializes', () => {
    expect(x).toBeDefined();
  });

  it('is initalized with an empty array of constants', () => {
    expect(x.constants.length).toEqual(0);
  });

  it('is initalized with one term', () => {
    expect(x.terms.length).toEqual(1);
  });
});

describe('An expression initialized with a greek letter variable name', () => {
  let lambda = new Expression('lambda');
  lambda = lambda.add(3);
  lambda = lambda.multiply(5);

  it('initializes', () => {
    expect(lambda).toBeDefined();
  });

  it('converts to tex properly', () => {
    expect(lambda.toTex()).toEqual('5\\lambda + 15');
  });

  it('converts to string properly, even though it looks weird', () => {
    expect(lambda.toString()).toEqual('5lambda + 15');
  });

  it('works with algebra.toTex', () => {
    expect(algebra.toTex(lambda)).toEqual('5\\lambda + 15');
  });
});

describe('An expression initialized with nothing', () => {
  const x = new Expression();

  it('initializes', () => {
    expect(x).toBeDefined();
  });

  it('is initalized with an empty array of constants', () => {
    expect(x.constants.length).toEqual(0);
  });

  it('is initalized with zero terms', () => {
    expect(x.terms.length).toEqual(0);
  });
});

describe('An expression initialized with an invalid variable', () => {
  it('should throw InvalidArgument', () => {
    expect(() => new Expression([1, 2, 3])).toThrow(
      'Invalid Argument (1,2,3): Argument must be of type String, Integer, Fraction or Term.',
    );
  });
});

describe('Expression addition', () => {
  const x = new Expression('x');
  const y = new Expression('y');
  const z = new Expression('z');

  it('should allow adding other expressions', () => {
    const answer = x.add(y);

    expect(answer.toString()).toEqual('x + y');
  });

  it('should properly combine the constant of two expressions', () => {
    const newx = x.add(3); // x + 3
    const newy = y.add(new Fraction(1, 4)); // y + 1/4
    const answer = newx.add(newy); // x + 3 + y + 1/4 => x + y + 13/4

    expect(answer.toString()).toEqual('x + y + 13/4');
  });

  it('should properly combine the terms of two expressions - linear', () => {
    const expr1 = x.add(y).add(z); // x + y + z
    const expr2 = z.add(y); // z + y

    const answer = expr1.add(expr2); // x + y + z + z + y = x + 2y + 2z

    expect(answer.toString()).toEqual('x + 2y + 2z');
  });

  it('should properly combine the terms of two expressions - nonlinear', () => {
    const expr1 = x.multiply(x); // x^2
    const expr2 = x
      .multiply(x)
      .add(y)
      .add(2); // x^2 + y + 2

    const answer = expr1.add(expr2); // x^2 + (x^2 + y + 2) = 2x^2 + y + 2

    expect(answer.toString()).toEqual('2x^2 + y + 2');
  });

  it('should properly combine the terms of two expressions - crossproducts', () => {
    const expr1 = x.multiply(y); // xy
    const expr2 = y
      .multiply(x)
      .add(x)
      .add(2); // yx + x + 2

    const answer = expr1.add(expr2); // xy + (yx + x + 2) = 2xy + x + 2

    expect(answer.toString()).toEqual('2xy + x + 2');
  });

  it('should properly remove terms when canceled out', () => {
    const expr1 = x.add(y).add(z); // x + y + z
    const expr2 = z.subtract(y); // z - y

    const answer = expr1.add(expr2); // x + y + z + z - y = x + 2z

    expect(answer.toString()).toEqual('x + 2z');
  });

  it('should allow adding fractions', () => {
    const answer = x.add(new Fraction(1, 3));

    expect(answer.toString()).toEqual('x + 1/3');
  });

  it('should allow adding integers', () => {
    const answer = x.add(3);

    expect(answer.toString()).toEqual('x + 3');
  });

  it('should not allow adding floats', () => {
    expect(() => {
      x.add(0.25);
    }).toThrow(
      'Invalid Argument (0.25): Summand must be of type String, Expression, Term, Fraction or Integer.',
    );
  });

  it('should allow adding variables passed in as strings - same var', () => {
    const answer = x.add('x').add(3);

    expect(answer.toString()).toEqual('2x + 3');
  });

  it('should allow adding variables passed in as strings - different var', () => {
    const answer = x.add('y').add(3);

    expect(answer.toString()).toEqual('x + y + 3');
  });

  it('should return unsimplified terms if simplify=false', () => {
    const answer = x.add(3).add('x', false);

    expect(answer.toString()).toEqual('x + x + 3');
  });

  it('should return unsimplified constants if simplify=false', () => {
    const answer = x.add(3).add(3, false);

    expect(answer.toString()).toEqual('x + 3 + 3');
  });
});

describe('Expression subtraction', () => {
  const x = new Expression('x');
  const y = new Expression('y');
  const z = new Expression('z');

  it('should allow subtracting other expressions', () => {
    const answer = x.subtract(y);

    expect(answer.toString()).toEqual('x - y');
  });

  it('should properly combine the constant of two expressions - linear', () => {
    const newx = x.subtract(3); // x - 3
    const newy = y.subtract(new Fraction(1, 4)); // y - 1/4

    const answer = newx.subtract(newy); // x - 3 - y - (-1/4) => x - y - 12/4 + 1/4 => x - y - 11/4

    expect(answer.toString()).toEqual('x - y - 11/4');
  });

  it('should properly combine the terms of two expressions - nonlinear', () => {
    const expr1 = x.multiply(x); // x^2
    let expr2 = x.multiply(x);
    expr2 = expr2.add(y).add(2); // x^2 + y + 2

    const answer = expr1.subtract(expr2); // x^2 - (x^2 + y + 2) = -y - 2

    expect(answer.toString()).toEqual('-y - 2');
  });

  it('should properly combine the terms of two expressions - crossproducts', () => {
    const expr1 = x.multiply(y); // xy
    const expr2 = y
      .multiply(x)
      .add(x)
      .add(2); // yx + x + 2

    const answer = expr1.subtract(expr2); // xy - (yx + x + 2) = -x - 2

    expect(answer.toString()).toEqual('-x - 2');
  });

  it('should properly remove terms when canceled out', () => {
    const expr1 = x.subtract(y).subtract(z); // x - y - z
    const expr2 = z.subtract(y); // z - y

    const answer = expr1.subtract(expr2); // x - y - z - (z - y) = x - 2z

    expect(answer.toString()).toEqual('x - 2z');
  });

  it('should allow subtracting fractions', () => {
    const answer = x.subtract(new Fraction(1, 3));

    expect(answer.toString()).toEqual('x - 1/3');
  });

  it('should allow subtracting integers', () => {
    const answer = x.subtract(3);

    expect(answer.toString()).toEqual('x - 3');
  });

  it('should not allow subtracting floats', () => {
    expect(() => {
      x.subtract(0.25);
    }).toThrow('Invalid Argument (0.25): Argument must be of type String, Integer, Fraction or Term.');
  });

  it('should allow subtracting variables passed in as strings - same var', () => {
    const answer = x.subtract('x').add(3);

    expect(answer.toString()).toEqual('3');
  });

  it('should allow subtracting variables passed in as strings - different var', () => {
    const answer = x.subtract('y').add(3);

    expect(answer.toString()).toEqual('x - y + 3');
  });

  it('should return unsimplified terms if simplify=false', () => {
    const answer = x.subtract(3).subtract(x, false);

    expect(answer.toString()).toEqual('x - x - 3');
  });

  it('should return unsimplified constants if simplify=false', () => {
    const answer = x.subtract(3).subtract(3, false);

    expect(answer.toString()).toEqual('x - 3 - 3');
  });
});

describe('Expression multiplication', () => {
  const x = new Expression('x');
  const y = new Expression('y');

  it('should allow multiplying by a fraction', () => {
    const answer = x.multiply(new Fraction(1, 3));

    expect(answer.toString()).toEqual('1/3x');
  });

  it('should allow multiplying by an integer', () => {
    const answer = x.multiply(5);

    expect(answer.toString()).toEqual('5x');
  });

  it('should not allow multiplying by floats', () => {
    expect(() => {
      x.multiply(0.25);
    }).toThrow(
      'Invalid Argument (0.25): Multiplicand must be of type String, Expression, Term, Fraction or Integer.',
    );
  });

  it('should allow multiplying by another expression', () => {
    const newX = x.add(y); // x + y
    const newY = y.add(x); // y + x

    const answer = newX.multiply(newY); // (x + y) * (y + x) = x^2 + xy + xy + y^2 = x^2 + y^2 + 2xy
    expect(answer.toString()).toEqual('x^2 + y^2 + 2xy');
  });

  it('should combine like terms correctly after multiplying by another expression', () => {
    const newX = x.add(3); // x + 3

    let newY = y.add(4); // y + 4
    newY = newY.add(newX); // y + x + 7

    const answer = newX.multiply(newY); // (x + 3) * (y + x + 7) =
    // xy + x^2 + 7x + 3y + 3x + 21 =
    // x^2 + xy + 10x + 3y + 21

    expect(answer.toString()).toEqual('x^2 + xy + 10x + 3y + 21');
  });

  it('should remove terms that cancel out', () => {
    const newX = x.add(y); // x + y
    const newY = x.subtract(y); // x - y

    const answer = newX.multiply(newY); // (x + y) * (x - y) =
    // x^2 - xy + xy - y^2 =
    // x^2 - y^2

    expect(answer.toString()).toEqual('x^2 - y^2');
  });

  it('should multiply by variables passed in as strings - same var', () => {
    const answer = x.multiply('x');

    expect(answer.toString()).toEqual('x^2');
  });

  it('should multiply by variables passed in as strings - different var', () => {
    const answer = x.multiply('y');

    expect(answer.toString()).toEqual('xy');
  });

  it('should allow for unsimplified terms - single var', () => {
    let answer = x.multiply(x);
    answer = answer.multiply(x, false); // x^2x

    expect(answer.toString()).toEqual('x^2x');
  });

  it('should allow for unsimplified terms - var and constant', () => {
    let answer = x.add(x, false); // x + x
    answer = answer.multiply(5, false); // 5x + 5x

    expect(answer.toString()).toEqual('5x + 5x');
  });

  it('should allow for unsimplified terms - multiple vars and constant', () => {
    let answer = x.add(y); // x + y
    answer = answer.multiply(2); // 2x + 2y
    answer = answer.add(5); // 2x + 2y + 5

    answer = answer.multiply(3, false); // 3 * 2x + 3 * 2y + 15

    expect(answer.toString()).toEqual('3 * 2x + 3 * 2y + 3 * 5');
  });
});

describe('Expression division', () => {
  const x = new Expression('x');
  const y = new Expression('y');

  it('should allow dividing by a fraction', () => {
    const answer = x.divide(new Fraction(1, 3));

    expect(answer.toString()).toEqual('3x');
  });

  it('should allow dividing by an integer', () => {
    const answer = x.divide(5);

    expect(answer.toString()).toEqual('1/5x');
  });

  it('should allow dividing monomial expressions', () => {
    expect(x.divide(y).toString()).toEqual('xy^-1');
  });

  it('should not allow division of a multinominal denomenator', () => {
    const multi = new Expression('x').add(3);

    expect(() => {
      x.divide(multi);
    }).toThrow('Invalid Argument ((x)/(x + 3)): Only monomial expressions can be divided.');
  });

  it('should not allow division of a multinominal numenator', () => {
    const multi = new Expression('x').add(3);

    expect(() => {
      multi.divide(x);
    }).toThrow('Invalid Argument ((x + 3)/(x)): Only monomial expressions can be divided.');
  });

  it('should throw an exception if dividing by zero', () => {
    expect(() => {
      x.divide(0);
    }).toThrow('Divide By Zero');
  });

  it('should allow for unsimplified terms and constants', () => {
    const exp1 = new Expression('x').multiply(2); // 2x
    const exp2 = new Expression('x').multiply(4); // 4x

    let answer = exp1.add(exp2, false); // 2x + 4x

    answer = answer.add(2, false);
    answer = answer.add(4, false); // 2x + 4x + 2 + 4

    answer = answer.divide(2, false); // 2/2x + 4/2x + 2/2 + 4/2

    expect(answer.toString()).toEqual('2/2x + 4/2x + 2/2 + 4/2');
  });
});

describe('Expression printing to string', () => {
  it("should put a negative sign on the first term if it's negative", () => {
    let x = new Expression('x');
    x = x.multiply(-1);
    x = x.add(3);

    expect(x.toString()).toEqual('-x + 3');
  });

  it('should get the signs right', () => {
    let x = new Expression('x');
    const y = new Expression('y');
    const z = new Expression('z');

    x = x
      .add(y)
      .subtract(z)
      .add(5);

    expect(x.toString()).toEqual('x + y - z + 5');
  });

  it("should omit the constant if it's 0", () => {
    let x = new Expression('x');
    x = x.add(3);
    x = x.subtract(3);

    expect(x.toString()).toEqual('x');
  });

  it('should only print the constant if all the other terms have been cancelled out', () => {
    const x = new Expression('x');
    const y = new Expression('y');

    const expr1 = x.add(y).subtract(3); // x + y - 3
    const expr2 = x.add(y); // x + y

    const answer = expr1.subtract(expr2); // x + y - 3 - (x + y) = -3

    expect(answer.toString()).toEqual('-3');
  });

  it('should allows you to pass in options', () => {
    let x = new Expression('x');
    const y = new Expression('y');
    const z = new Expression('z');

    x = x
      .multiply(y)
      .subtract(z.multiply(x))
      .add(5); // x*y - z*y + 5

    expect(x.toString({ implicit: true })).toEqual('x*y - z*x + 5');
  });
});

describe('Expression printing to tex', () => {
  it("should put a negative sign on the first term if it's negative", () => {
    let x = new Expression('x');
    x = x.multiply(-1);
    x = x.add(3);

    expect(x.toTex()).toEqual('-x + 3');
  });

  it('should get the signs right', () => {
    let x = new Expression('x');
    const y = new Expression('y');
    const z = new Expression('z');

    x = x
      .add(y)
      .subtract(z)
      .add(5);

    expect(x.toTex()).toEqual('x + y - z + 5');
  });

  it("should omit the constant if it's 0", () => {
    let x = new Expression('x');
    x = x.add(3);
    x = x.subtract(3);

    expect(x.toTex()).toEqual('x');
  });

  it('should only print the constant if all the other terms have been cancelled out', () => {
    const x = new Expression('x');
    const y = new Expression('y');

    const expr1 = x.add(y).subtract(3); // x + y - 3
    const expr2 = x.add(y); // x + y

    const answer = expr1.subtract(expr2); // x + y - 3 - (x + y) = -3

    expect(answer.toTex()).toEqual('-3');
  });

  it('should print 0 if the expression was initialized with nothing', () => {
    const x = new Expression();
    expect(x.toTex()).toEqual('0');
  });

  it('prints unsimplified expressions correctly', () => {
    let exp = new Expression('x').add('x', false);
    exp = exp.multiply(new Fraction(3, 4), false); // 3/4x + 3/4x
    exp = exp.add(2, false);
    exp = exp.add(5, false); // 3/4x + 3/4x + 2 + 5

    expect(exp.toTex()).toEqual('\\frac{3}{4}x + \\frac{3}{4}x + 2 + 5');
  });

  it('allows you to pass in options', () => {
    let exp = new Expression('x');
    exp = exp.multiply(new Fraction(3, 4)); // 3/4x
    exp = exp.multiply(new Fraction(2, 3), false); // 2/3 * 3/4x

    expect(exp.toTex({ multiplication: 'times' })).toEqual('\\frac{2}{3} \\times \\frac{3}{4}x');
  });

  it('brings the negatives to the front of the term when there are fractions', () => {
    let expr = new Expression('x').add('y'); // x + y
    expr = expr.multiply(new Fraction(-9, 10)); // -9/10x - 9/10y
    expr = expr.subtract(new Fraction(3, 4)); // -9/10x - 9/10y - 3/4

    expect(expr.toTex()).toEqual('-\\frac{9}{10}x - \\frac{9}{10}y - \\frac{3}{4}');
  });

  it('works with algebra.toTex', () => {
    const x = new Expression('x').add(2);
    expect(algebra.toTex(x)).toEqual('x + 2');
  });
});

describe('Expression evaluation with one variable - linear', () => {
  let x = new Expression('x');
  x = x.add(3);

  it('should allow evaluating at integers', () => {
    const answer = x.eval({ x: 2 });

    expect(answer.toString()).toEqual('5');
  });

  it('should allow evaluating at fractions', () => {
    const answer = x.eval({ x: new Fraction(1, 5) });

    expect(answer.toString()).toEqual('16/5');
  });

  it('should not allow evaluating at floats', () => {
    expect(() => {
      x.eval({ x: 1.2 });
    }).toThrow('Invalid Argument (1.2): Can only evaluate Expressions or Fractions.');
  });
});

describe('Expression evaluation with one variable - nonlinear', () => {
  const x = new Expression('x');
  const x2 = x
    .multiply(x)
    .add(x)
    .add(3); // x^2 + x + 3

  it('should allow evaluating at integers', () => {
    const answer = x2.eval({ x: 2 }); // 2^2 + 2 + 3 = 9

    expect(answer.toString()).toEqual('9');
  });

  it('should allow evaluating at fractions', () => {
    const answer = x2.eval({ x: new Fraction(1, 5) }); // (1/5)^2 + 1/5 + 3 = 81/25

    expect(answer.toString()).toEqual('81/25');
  });
});

describe('Expression evaluation with multiple variables - linear', () => {
  const x = new Expression('x');
  const y = new Expression('y');
  const z = x.add(y); // x + y

  it('should return an expression when not substituting all the variables', () => {
    const answer = z.eval({ x: 3 });

    expect(answer.toString()).toEqual('y + 3');
  });

  it('should return a fraction when substituting all the variables', () => {
    const answer = z.eval({ x: 3, y: new Fraction(1, 2) });

    expect(answer.toString()).toEqual('7/2');
  });

  it('should return a fraction when substituting variables out of order', () => {
    const answer = z.eval({ y: new Fraction(1, 2), x: 3 });

    expect(answer.toString()).toEqual('7/2');
  });
});

describe('Expression evaluation with multiple variables - nonlinear', () => {
  const x = new Expression('x');
  const y = new Expression('y');

  it('should return an expression when not substituting all the variables', () => {
    const x1 = x
      .multiply(x)
      .add(x)
      .subtract(y); // x^2 + x - y

    const answer = x1.eval({ x: 3 }); // 3^2 + 3 - y = -y + 12

    expect(answer.toString()).toEqual('-y + 12');
  });

  it('should return a fraction when substituting all the variables', () => {
    const x1 = x
      .multiply(x)
      .add(x)
      .subtract(y); // x^2 + x - y

    const answer = x1.eval({ x: 3, y: new Fraction(1, 2) }); // 3^2 + 3 - 1/2 = 23/2

    expect(answer.toString()).toEqual('23/2');
  });

  it('should return a fraction when substituting variables out of order', () => {
    const x1 = x
      .multiply(x)
      .add(x)
      .subtract(y); // x^2 + x - y

    const answer = x1.eval({ y: new Fraction(1, 2), x: 3 });

    expect(answer.toString()).toEqual('23/2');
  });
});

describe('Expression evaluation with multiple variables - crossproducts', () => {
  const x = new Expression('x');
  const y = new Expression('y');

  it('should return an expression when not substituting all the variables', () => {
    const x1 = x
      .multiply(x)
      .multiply(y)
      .add(x); // x^2y + x

    const answer = x1.eval({ x: 3 }); // 3^2y + 3 = 9y + 3

    expect(answer.toString()).toEqual('9y + 3');
  });

  it('should return a reduced fraction when substituting all the variables', () => {
    const x1 = x
      .multiply(x)
      .multiply(y)
      .add(x); // x^2y + x

    const answer = x1.eval({ y: new Fraction(1, 2), x: 3 }); // 3^2 * (1/2) + 3 = 15/2

    expect(answer.toString()).toEqual('15/2');
  });
});

describe('Expression evaluation with other expressions', () => {
  it('works with no coefficient', () => {
    const x = new Expression('x').add(2); // x + 2
    const sub = new Expression('y').add(4); // y + 4

    const answer = x.eval({ x: sub }); // (y + 4) + 2 = y + 6
    expect(answer.toString()).toEqual('y + 6');
  });

  it('works with a coefficient', () => {
    const x = new Expression('x').multiply(2).add(2); // 2x + 2
    const sub = new Expression('y').add(4); // y + 4

    const answer = x.eval({ x: sub }); // 2(y + 4) + 2 = 2y + 8 + 2 = 2y + 10
    expect(answer.toString()).toEqual('2y + 10');
  });

  it('works with cross products', () => {
    const x = new Expression('x').multiply('y').add(2); // xy + 2
    const sub = new Expression('y').add(4); // y + 4

    const answer = x.eval({ x: sub }); // (y + 4)y + 2 = y^2 + 4y + 2
    expect(answer.toString()).toEqual('y^2 + 4y + 2');
  });

  it('works with powers', () => {
    const x = new Expression('x')
      .multiply('x')
      .add('x')
      .add(2); // x^2 + x + 2
    const sub = new Expression('y').add(4); // y + 4

    const answer = x.eval({ x: sub }); // (y + 4)^2 + (y + 4) + 2 = y^2 + 9y + 22
    expect(answer.toString()).toEqual('y^2 + 9y + 22');
  });
});

describe('Expression evaluation with unsimplified expressions', () => {
  it('works with multiple of the same variable', () => {
    const exp = new Expression('x').add('x', false); // x + x
    const answer = exp.eval({ x: 2 }, false);

    expect(answer.toString()).toEqual('2 + 2');
  });

  it('works with multiples of different variables', () => {
    const exp = new Expression('x').add('x', false).add('y', false); // x + x + y
    const answer = exp.eval({ x: 2 }, false);
    expect(answer.toString()).toEqual('y + 2 + 2');
  });

  it('works with cross products', () => {
    let exp = new Expression('x').multiply('y'); // xy
    exp = exp.add(exp, false); // xy + xy
    const answer = exp.eval({ x: 2 }, false);
    expect(answer.toString()).toEqual('2y + 2y');
  });

  it("works when there's multiple coefficients", () => {
    const exp = new Expression('x').multiply(5).multiply(4, false); // 4 * 5x
    const answer = exp.eval({ x: 2 }, false);
    expect(answer.toString()).toEqual('4 * 5 * 2');
  });

  it('works when substituting in another expression', () => {
    const exp = new Expression('x').multiply('x', false); // xx
    const sub = new Expression('y').add(4); // y + 4

    const answer = exp.eval({ x: sub }, false);
    expect(answer.toString()).toEqual('yy + 4y + 4y + 4 * 4');
  });

  it('simplifies correctly when simplify is true for eval', () => {
    const exp = new Expression('x').multiply('x', false); // xx
    const sub = new Expression('y').add(4); // y + 4

    const answer = exp.eval({ x: sub }, true);
    expect(answer.toString()).toEqual('y^2 + 8y + 16');
  });
});

describe('Checking for cross products in expressions', () => {
  it('should return true if there are no cross products', () => {
    const expr = new Expression('x').add('y');
    const cross = expr.hasNoCrossProductsWithVariable('x');
    expect(cross).toBe(true);
  });

  it('should return false if there are cross products', () => {
    const expr = new Expression('x').multiply('y').add('x');
    const cross = expr.hasNoCrossProductsWithVariable('x');
    expect(cross).toBe(false);
  });
});

describe('Raising expressions to powers', () => {
  const x = new Expression('x').add(2);

  it('should return 1 if power is 0', () => {
    const answer = x.pow(0);
    expect(answer.toString()).toEqual('1');
  });

  it('should return the original expression if power is 1', () => {
    const answer = x.pow(1);
    expect(answer.toString()).toEqual('x + 2');
  });

  it('should work with power 2', () => {
    const answer = x.pow(2);
    expect(answer.toString()).toEqual('x^2 + 4x + 4');
  });

  it('should work with power 3', () => {
    const answer = x.pow(3);
    expect(answer.toString()).toEqual('x^3 + 6x^2 + 12x + 8');
  });

  it('should allow unsimplified expression', () => {
    const answer = x.pow(2, false);

    expect(answer.toString()).toEqual('xx + 2x + 2x + 2 * 2');
  });

  it('should not allow floats', () => {
    expect(() => {
      x.pow(0.25);
    }).toThrow('Invalid Argument (0.25): Exponent must be of type Integer.');
  });
});

describe('Expression sorting', () => {
  it('should sort by degree of the term', () => {
    const x2 = new Expression('x').multiply('x');
    const exp = new Expression('x').add(x2); // x + x^2
    exp.sort();
    expect(exp.toString()).toEqual('x^2 + x');
  });

  it('should sort by the number of variables in the term', () => {
    const x2 = new Expression('x').multiply('x');
    const exp = x2.add(x2.multiply('y')); // x^2 + x^2y
    exp.sort();
    expect(exp.toString()).toEqual('x^2y + x^2');
  });
});

describe('Expression simplification', () => {
  it('should combine terms', () => {
    const exp = new Expression('x').add(2).add('x', false); // x + x + 2

    expect(exp.toString()).toEqual('x + x + 2');

    const sim = exp.simplify();

    expect(sim.toString()).toEqual('2x + 2');
  });

  it('should combine constants', () => {
    const exp = new Expression('x').add(2).add(4, false); // x + 2 + 4

    expect(exp.toString()).toEqual('x + 2 + 4');

    const sim = exp.simplify();

    expect(sim.toString()).toEqual('x + 6');
  });

  it('should combine terms and constants', () => {
    let exp = new Expression('x').add(2);
    exp = exp.add('x', false);
    exp = exp.add(4, false);

    expect(exp.toString()).toEqual('x + x + 2 + 4');

    const sim = exp.simplify();

    expect(sim.toString()).toEqual('2x + 6');
  });

  it('should combine unsimplified terms with multiple coefficients', () => {
    let answer = new Expression('x').add('y'); // x + y
    answer = answer.multiply(2); // 2x + 2y
    answer = answer.add(5); // 2x + 2y + 5

    answer = answer.multiply(3, false); // 3 * 2x + 3 * 2y + 15
    answer = answer.simplify();

    expect(answer.toString()).toEqual('6x + 6y + 15');
  });

  it('should properly move terms with no variables into the constants', () => {
    let answer = new Expression('x').add('x', false); // x + x
    answer = answer.multiply(2, false); // 2x + 2x
    answer = answer.add(5, false); // 2x + 2x + 5
    answer = answer.add(6, false); // 2x + 2x + 5 + 6

    answer = answer.multiply(3, false); // 3 * 2x + 3 * 2x + 3 * 5 + 3 * 6

    answer = answer.simplify(); // 12x + 33

    expect(answer.toString()).toEqual('12x + 33');
  });

  it('should properly simplify if there are only constants', () => {
    let exp = new Expression('x').add(3); // x + 3
    exp = exp.pow(2, false); // xx + 3x + 3x + 3 * 3
    exp = exp.eval({ x: 2 }, false); // 2 * 2 + 3 * 2 + 3 * 2 + 3 * 3

    const ans = exp.simplify();

    expect(ans.toString()).toEqual('25');
  });

  it('should properly simplify expressions where terms show up >= 2 times', () => {
    const exp = new Expression('x').add('y').add(3);
    const unsimplified = exp.pow(3, false);
    const simplified = unsimplified.simplify();

    expect(simplified.toString()).toEqual('x^3 + y^3 + 3x^2y + 3y^2x + 9x^2 + 9y^2 + 18xy + 27x + 27y + 27');
  });
});

describe('Expression summation', () => {
  it('should sum over expressions with one variable', () => {
    const xplus3 = new Expression('x').add(3);
    const ans = xplus3.summation(new Expression('x'), 3, 6);
    expect(ans.toString()).toEqual('30');
  });

  it('should sum over expressions with multiple variables', () => {
    const exp = new Expression('x').add('y').add(3); // x + y + 3

    const answer = exp.summation('x', 3, 6);

    expect(answer.toString()).toEqual('4y + 30');
  });
});
