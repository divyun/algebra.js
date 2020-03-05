const { Expression } = require('./expressions');
const { isInt } = require('./helper');
const Fraction = require('./fractions');

function Complex(real, imaginary) {
  if (real instanceof Fraction && imaginary instanceof Fraction) {
    this.real = real;
    this.imaginary = imaginary;
  } else {
    throw new TypeError(
      `Invalid Argument (${real.toString()}, ${imaginary.toString()}): Real and imaginary parts must be of type Fraction.`,
    );
  }
}

Complex.prototype.copy = function complexCopy() {
  return new Complex(this.real, this.imaginary);
};

Complex.prototype.add = function complexAdd(a) {
  const copy = this.copy();

  if (a instanceof Fraction || isInt(a)) {
    copy.real = copy.real.add(a);
  } else if (a instanceof Complex) {
    copy.real = copy.real.add(a.real);
    copy.imaginary = copy.imaginary.add(a.imaginary);
  } else {
    throw new TypeError(
      `Invalid Argument (${a.toString()}): Summand must be of type Complex, Fraction or Integer.`,
    );
  }

  return copy;
};

Complex.prototype.subtract = function complexSubtract(a) {
  const copy = this.copy();

  if (a instanceof Fraction || isInt(a)) {
    copy.real = copy.real.subtract(a);
  } else if (a instanceof Complex) {
    copy.real = copy.real.subtract(a.real);
    copy.imaginary = copy.imaginary.subtract(a.imaginary);
  } else {
    throw new TypeError(
      `Invalid Argument (${a.toString()}): Subtrahend must be of type Complex, Fraction or Integer.`,
    );
  }

  return copy;
};

Complex.prototype.multiply = function complexMultiply(multiplyWith) {
  if (multiplyWith instanceof Fraction || isInt(multiplyWith)) {
    const copy = this.copy();
    copy.real = copy.real.multiply(multiplyWith);
    copy.imaginary = copy.imaginary.multiply(multiplyWith);
    return copy;
  }
  if (multiplyWith instanceof Complex) {
    const expr1 = new Expression('i').multiply(this.imaginary).add(this.real);
    const expr2 = new Expression('i').multiply(multiplyWith.imaginary).add(multiplyWith.real);
    const foil = expr1.multiply(expr2);
    const { a, b, c } = foil.getQadraticCoefficients();

    const real = a.multiply(-1).add(c);
    return new Complex(real, b);
  }
  throw new TypeError(
    `Invalid Argument (${multiplyWith.toString()}): Multiplicand must be of type Complex, Fraction or Integer.`,
  );
};

Complex.prototype.divide = function complexDivide(a) {
  if (a instanceof Fraction || isInt(a)) {
    const copy = this.copy();
    copy.real = copy.real.divide(a);
    copy.imaginary = copy.imaginary.divide(a);
    return copy;
  }
  if (a instanceof Complex) {
    const conjugate = new Complex(a.real, a.imaginary.multiply(-1));
    const numerator = this.multiply(conjugate);
    const denominator = a.multiply(conjugate).real;
    return numerator.divide(denominator);
  }
  throw new TypeError(
    `Invalid Argument (${a.toString()}): Divisor must be of type Complex, Fraction or Integer.`,
  );
};

module.exports = Complex;
