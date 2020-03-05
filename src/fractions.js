const { isInt, gcd, lcm } = require('./helper');

function Fraction(a, b) {
  if (b === 0) {
    throw new EvalError('Divide By Zero');
  }

  if (!isInt(a) || !isInt(b)) {
    throw new TypeError(
      `Invalid Argument (${a.toString()},${b.toString()}): Divisor and dividend must be of type Integer.`,
    );
  }

  this.numer = a;
  this.denom = b;
}

Fraction.prototype.copy = function copyFraction() {
  return new Fraction(this.numer, this.denom);
};

Fraction.prototype.reduce = function reduceFraction() {
  const copy = this.copy();

  const g = gcd(copy.numer, copy.denom);
  copy.numer /= g;
  copy.denom /= g;

  if (Math.sign(copy.denom) === -1 && Math.sign(copy.numer) === 1) {
    copy.numer *= -1;
    copy.denom *= -1;
  }

  return copy;
};

Fraction.prototype.equalTo = function fractionEqualTo(fraction) {
  if (fraction instanceof Fraction) {
    const thisReduced = this.reduce();
    const thatReduced = fraction.reduce();
    return thisReduced.numer === thatReduced.numer && thisReduced.denom === thatReduced.denom;
  }
  return false;
};

Fraction.prototype.add = function addToFraction(f, simplify = true) {
  let a;
  let b;

  if (f instanceof Fraction) {
    a = f.numer;
    b = f.denom;
  } else if (isInt(f)) {
    a = f;
    b = 1;
  } else {
    throw new TypeError(`Invalid Argument (${f.toString()}): Summand must be of type Fraction or Integer.`);
  }

  const copy = this.copy();

  if (this.denom === b) {
    copy.numer += a;
  } else {
    const m = lcm(copy.denom, b);
    const thisM = m / copy.denom;
    const otherM = m / b;

    copy.numer *= thisM;
    copy.denom *= thisM;

    a *= otherM;

    copy.numer += a;
  }

  return simplify ? copy.reduce() : copy;
};

Fraction.prototype.subtract = function subtractFromFraction(f, simplify = true) {
  const copy = this.copy();

  if (f instanceof Fraction) {
    return copy.add(new Fraction(-f.numer, f.denom), simplify);
  }
  if (isInt(f)) {
    return copy.add(new Fraction(-f, 1), simplify);
  }
  throw new TypeError(`Invalid Argument (${f.toString()}): Subtrahend must be of type Fraction or Integer.`);
};

Fraction.prototype.multiply = function multiplyToFraction(f, simplify = true) {
  let a;
  let b;

  if (f instanceof Fraction) {
    a = f.numer;
    b = f.denom;
  } else if (isInt(f) && f) {
    a = f;
    b = 1;
  } else if (f === 0) {
    a = 0;
    b = 1;
  } else {
    throw new TypeError(
      `Invalid Argument (${f.toString()}): Multiplicand must be of type Fraction or Integer.`,
    );
  }

  const copy = this.copy();

  copy.numer *= a;
  copy.denom *= b;

  return simplify ? copy.reduce() : copy;
};

Fraction.prototype.divide = function divideFromFraction(f, simplify = true) {
  if (f.valueOf() === 0) {
    throw new EvalError('Divide By Zero');
  }

  const copy = this.copy();

  if (f instanceof Fraction) {
    return copy.multiply(new Fraction(f.denom, f.numer), simplify);
  }
  if (isInt(f)) {
    return copy.multiply(new Fraction(1, f), simplify);
  }
  throw new TypeError(`Invalid Argument (${f.toString()}): Divisor must be of type Fraction or Integer.`);
};

Fraction.prototype.pow = function raiseFraction(n, simplify = true) {
  let copy = this.copy();

  if (n >= 0) {
    copy.numer **= n;
    copy.denom **= n;
  } else if (n < 0) {
    copy = copy.pow(Math.abs(n));

    // Switch numerator and denominator
    const tmp = copy.numer;
    copy.numer = copy.denom;
    copy.denom = tmp;
  }

  return simplify ? copy.reduce() : copy;
};

Fraction.prototype.abs = function absoluteFraction() {
  const copy = this.copy();

  copy.numer = Math.abs(copy.numer);
  copy.denom = Math.abs(copy.denom);

  return copy;
};

Fraction.prototype.valueOf = function valueOfFraction() {
  return this.numer / this.denom;
};

Fraction.prototype.toString = function fractionToString() {
  if (this.numer === 0) {
    return '0';
  }
  if (this.denom === 1) {
    return this.numer.toString();
  }
  if (this.denom === -1) {
    return (-this.numer).toString();
  }
  return `${this.numer}/${this.denom}`;
};

Fraction.prototype.toTex = function fractionToTex() {
  if (this.numer === 0) {
    return '0';
  }
  if (this.denom === 1) {
    return this.numer.toString();
  }
  if (this.denom === -1) {
    return (-this.numer).toString();
  }
  return `\\frac{${this.numer}}{${this.denom}}`;
};

Fraction.prototype.isSquareRootRational = function isSquareRootRational() {
  if (this.valueOf() === 0) {
    return true;
  }

  const sqrtNumer = Math.sqrt(this.numer);
  const sqrtDenom = Math.sqrt(this.denom);

  return isInt(sqrtNumer) && isInt(sqrtDenom);
};

Fraction.prototype.isCubeRootRational = function isCubeRootRational() {
  if (this.valueOf() === 0) {
    return true;
  }

  const cbrtNumer = Math.cbrt(this.numer);
  const cbrtDenom = Math.cbrt(this.denom);

  return isInt(cbrtNumer) && isInt(cbrtDenom);
};

module.exports = Fraction;
