const { Expression, Variable, Term } = require('./expressions');
const Fraction = require('./fractions');
const { isInt } = require('./helper');

function Equation(lhs, rhs) {
  if (lhs instanceof Expression) {
    this.lhs = lhs;

    if (rhs instanceof Expression) {
      this.rhs = rhs;
    } else if (rhs instanceof Fraction || isInt(rhs)) {
      this.rhs = new Expression(rhs);
    } else {
      throw new TypeError(
        `Invalid Argument (${rhs.toString()}): Right-hand side must be of type Expression, Fraction or Integer.`,
      );
    }
  } else {
    throw new TypeError(`Invalid Argument (${lhs.toString()}): Left-hand side must be of type Expression.`);
  }
}

Equation.prototype.solveFor = function solveEquationFor(variable) {
  if (!this.lhs.hasVariable(variable) && !this.rhs.hasVariable(variable)) {
    throw new TypeError(
      `Invalid Argument (${variable.toString()}): Variable does not exist in the equation.`,
    );
  }

  // If the equation is linear and the variable in question can be isolated through arithmetic, solve.
  if (this.isLinear() || this.canVariableBeIsolated(variable)) {
    const solvingFor = new Term(new Variable(variable));
    let newLhs = new Expression();
    let newRhs = new Expression();

    this.rhs.terms.forEach((term) => {
      if (term.canBeCombinedWith(solvingFor)) {
        newLhs = newLhs.subtract(term);
      } else {
        newRhs = newRhs.add(term);
      }
    });

    this.lhs.terms.forEach((term) => {
      if (term.canBeCombinedWith(solvingFor)) {
        newLhs = newLhs.add(term);
      } else {
        newRhs = newRhs.subtract(term);
      }
    });

    newRhs = newRhs.subtract(this.lhs.constant());
    newRhs = newRhs.add(this.rhs.constant());

    if (newLhs.terms.length === 0) {
      if (!newLhs.constant().equalTo(newRhs.constant())) {
        throw new EvalError('No Solution');
      }
      return new Fraction(1, 1);
    }

    newRhs = newRhs.divide(newLhs.terms[0].coefficient());

    if (newRhs.terms.length === 0) {
      return newRhs.constant().reduce();
    }

    newRhs.sort();
    return newRhs;

    // Otherwise, move everything to the LHS.
  }

  let newLhs = this.lhs.copy();
  newLhs = newLhs.subtract(this.rhs);

  // If there are no terms left after this rearrangement and the constant is 0, there are infinite solutions.
  // Otherwise, there are no solutions.
  if (newLhs.terms.length === 0) {
    if (newLhs.constant().valueOf() !== 0) {
      throw new EvalError('No Solution');
    }
    return [new Fraction(1, 1)];
  }

  // Otherwise, check degree and solve.
  if (this.isQuadratic(variable)) {
    const coeff = newLhs.getQadraticCoefficients();
    let { a, b } = coeff;
    const { c } = coeff;
    // Calculate the discriminant, b^2 - 4ac.
    const discriminant = b.pow(2).subtract(a.multiply(c).multiply(4));

    // If the discriminant is greater than or equal to 0, there is at least one real root.
    if (discriminant.valueOf() >= 0) {
      // If the discriminant is equal to 0, there is one real root: -b / 2a.
      if (discriminant.valueOf() === 0) {
        return [
          b
            .multiply(-1)
            .divide(a.multiply(2))
            .reduce(),
        ];
      }

      // If the discriminant is greater than 0, there are two real roots:
      // (-b - √discriminant) / 2a
      // (-b + √discriminant) / 2a
      let squareRootDiscriminant;

      // If the answers will be rational, return reduced Fraction objects.
      if (discriminant.isSquareRootRational()) {
        squareRootDiscriminant = discriminant.pow(0.5);
        const root1 = b
          .multiply(-1)
          .subtract(squareRootDiscriminant)
          .divide(a.multiply(2));
        const root2 = b
          .multiply(-1)
          .add(squareRootDiscriminant)
          .divide(a.multiply(2));
        return [root1.reduce(), root2.reduce()];
      }

      // If the answers will be irrational, return numbers.
      squareRootDiscriminant = Math.sqrt(discriminant.valueOf());
      a = a.valueOf();
      b = b.valueOf();

      const root1 = (-b - squareRootDiscriminant) / (2 * a);
      const root2 = (-b + squareRootDiscriminant) / (2 * a);
      return [root1, root2];
    }

    // If the discriminant is negative, there are no real roots.
    return [];
  }

  if (this.isCubic(variable)) {
    const { a, b, c, d } = newLhs.getCubicCoefficients();

    // Calculate D and D0.
    let D = a
      .multiply(b)
      .multiply(c)
      .multiply(d)
      .multiply(18);
    D = D.subtract(
      b
        .pow(3)
        .multiply(d)
        .multiply(4),
    );
    D = D.add(b.pow(2).multiply(c.pow(2)));
    D = D.subtract(a.multiply(c.pow(3)).multiply(4));
    D = D.subtract(
      a
        .pow(2)
        .multiply(d.pow(2))
        .multiply(27),
    );

    const D0 = b.pow(2).subtract(a.multiply(c).multiply(3));

    // Check for special cases when D = 0.

    if (D.valueOf() === 0) {
      // If D = D0 = 0, there is one distinct real root, -b / 3a.
      if (D0.valueOf() === 0) {
        const root1 = b.multiply(-1).divide(a.multiply(3));

        return [root1.reduce()];
      }

      // Otherwise, if D0 != 0, there are two distinct real roots.
      // 9ad - bc / 2D0
      // 4abc - 9a^2d - b^3 / aD0
      let root1 = a
        .multiply(b)
        .multiply(c)
        .multiply(4);
      root1 = root1.subtract(
        a
          .pow(2)
          .multiply(d)
          .multiply(9),
      );
      root1 = root1.subtract(b.pow(3));
      root1 = root1.divide(a.multiply(D0));

      const root2 = a
        .multiply(d)
        .multiply(9)
        .subtract(b.multiply(c))
        .divide(D0.multiply(2));

      return [root1.reduce(), root2.reduce()];
    }

    // Otherwise, use a different method for solving.
    const f = (3 * (c / a) - b ** 2 / a ** 2) / 3;
    let g = (2 * b ** 3) / a ** 3;
    g -= (9 * b * c) / a ** 2;
    g += (27 * d) / a;
    g /= 27;
    const h = g ** 2 / 4 + f ** 3 / 27;

    /*
    if f = g = h = 0 then roots are equal (has been already taken care of!)
    if h>0, only one real root
    if h<=0, all three roots are real
    */

    if (h > 0) {
      const R = -(g / 2) + Math.sqrt(h);
      const S = Math.cbrt(R);
      const T = -(g / 2) - Math.sqrt(h);
      const U = Math.cbrt(T);
      let root1 = S + U - b / (3 * a);

      /* Round off the roots if the difference between absolute value of ceil and number is < e-15 */
      if (root1 < 0) {
        const Croot1 = Math.floor(root1);
        if (root1 - Croot1 < 1e-15) root1 = Croot1;
      } else if (root1 > 0) {
        const Croot1 = Math.ceil(root1);
        if (Croot1 - root1 < 1e-15) root1 = Croot1;
      }

      return [root1];
    }

    const i = Math.sqrt(g ** 2 / 4 - h);
    const j = Math.cbrt(i);

    const k = Math.acos(-(g / (2 * i)));
    const L = -j;
    const M = Math.cos(k / 3);
    const N = Math.sqrt(3) * Math.sin(k / 3);
    const P = -(b / (3 * a));

    let root1 = 2 * j * Math.cos(k / 3) - b / (3 * a);
    let root2 = L * (M + N) + P;
    let root3 = L * (M - N) + P;

    /* Round off the roots if the difference between absolute value of ceil and number is < e-15 */

    if (root1 < 0) {
      const Croot1 = Math.floor(root1);
      if (root1 - Croot1 < 1e-15) root1 = Croot1;
    } else if (root1 > 0) {
      const Croot1 = Math.ceil(root1);
      if (Croot1 - root1 < 1e-15) root1 = Croot1;
    }

    if (root2 < 0) {
      const Croot2 = Math.floor(root2);
      if (root2 - Croot2 < 1e-15) root2 = Croot2;
    } else if (root2 > 0) {
      const Croot2 = Math.ceil(root2);
      if (Croot2 - root2 < 1e-15) root2 = Croot2;
    }

    if (root1 < 0) {
      const Croot3 = Math.floor(root3);
      if (root3 - Croot3 < 1e-15) root3 = Croot3;
    } else if (root3 > 0) {
      const Croot3 = Math.ceil(root3);
      if (Croot3 - root3 < 1e-15) root3 = Croot3;
    }

    const roots = [root1, root2, root3].sort((rootA, rootB) => rootA - rootB); // roots in ascending order

    return [...roots];
  }

  return undefined;
};

Equation.prototype.eval = function equationEval(values) {
  return new Equation(this.lhs.eval(values), this.rhs.eval(values));
};

Equation.prototype.toString = function equationToString(options) {
  return `${this.lhs.toString(options)} = ${this.rhs.toString(options)}`;
};

Equation.prototype.toTex = function equationToTex() {
  return `${this.lhs.toTex()} = ${this.rhs.toTex()}`;
};

Equation.prototype.getMaxDegree = function getMaxDegree() {
  const lhsMax = this.lhs.getMaxDegree();
  const rhsMax = this.rhs.getMaxDegree();
  return Math.max(lhsMax, rhsMax);
};

Equation.prototype.getMaxDegreeOfVariable = function getMaxDegreeOfVariable(variable) {
  return Math.max(this.lhs.getMaxDegreeOfVariable(variable), this.rhs.getMaxDegreeOfVariable(variable));
};

Equation.prototype.canVariableBeIsolated = function canVariableBeIsolated(variable) {
  return this.getMaxDegreeOfVariable(variable) === 1 && this.hasNoCrossProductsWithVariable(variable);
};

Equation.prototype.hasNoCrossProductsWithVariable = function equationHasNoCrossProductsWithVariable(
  variable,
) {
  return (
    this.lhs.hasNoCrossProductsWithVariable(variable) && this.rhs.hasNoCrossProductsWithVariable(variable)
  );
};

Equation.prototype.hasNoCrossProducts = function hasNoCrossProducts() {
  return this.lhs.hasNoCrossProducts() && this.rhs.hasNoCrossProducts();
};

Equation.prototype.hasOnlyVariable = function hasOnlyVariable(variable) {
  return this.lhs.hasOnlyVariable(variable) && this.rhs.hasOnlyVariable(variable);
};

Equation.prototype.isLinear = function isEquationLinear() {
  return this.getMaxDegree() === 1 && this.hasNoCrossProducts();
};

Equation.prototype.isQuadratic = function isEquationQuadratic(variable) {
  return this.getMaxDegree() === 2 && this.hasOnlyVariable(variable);
};

Equation.prototype.isCubic = function isEquationCubic(variable) {
  return this.getMaxDegree() === 3 && this.hasOnlyVariable(variable);
};

module.exports = Equation;
