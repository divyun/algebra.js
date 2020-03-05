const Fraction = require('./fractions');
const { isInt } = require('./helper');
const { GREEK_LETTERS } = require('./helper');

function Variable(variable) {
  if (typeof variable !== 'string') {
    throw new TypeError(
      `Invalid Argument (${variable.toString()}): Variable initalizer must be of type String.`,
    );
  }
  this.variable = variable;
  this.degree = 1;
}

function Term(variable) {
  if (variable instanceof Variable) {
    this.variables = [variable.copy()];
  } else if (typeof variable === 'undefined') {
    this.variables = [];
  } else {
    throw new TypeError(
      `Invalid Argument (${variable.toString()}): Term initializer must be of type Variable.`,
    );
  }

  this.coefficients = [new Fraction(1, 1)];
}

function Expression(variable) {
  this.constants = [];

  if (typeof variable === 'string') {
    const v = new Variable(variable);
    const t = new Term(v);
    this.terms = [t];
  } else if (isInt(variable)) {
    this.constants = [new Fraction(variable, 1)];
    this.terms = [];
  } else if (variable instanceof Fraction) {
    this.constants = [variable];
    this.terms = [];
  } else if (variable instanceof Term) {
    this.terms = [variable];
  } else if (typeof variable === 'undefined') {
    this.terms = [];
  } else {
    throw new TypeError(
      `Invalid Argument (${variable.toString()}): Argument must be of type String, Integer, Fraction or Term.`,
    );
  }
}

Expression.prototype.constant = function expressionConstant() {
  return this.constants.reduce((p, c) => p.add(c), new Fraction(0, 1));
};

Expression.prototype.simplify = function expressionSimplify() {
  const copy = this.copy();

  // simplify all terms
  copy.terms = copy.terms.map((t) => t.simplify());

  copy.sort();
  copy.combineLikeTerms();
  copy.moveTermsWithDegreeZeroToConstants();
  copy.removeTermsWithCoefficientZero();
  copy.constants = copy.constant().valueOf() === 0 ? [] : [copy.constant()];

  return copy;
};

Expression.prototype.copy = function expressionCopy() {
  const copy = new Expression();

  // copy all constants
  copy.constants = this.constants.map((c) => c.copy());
  // copy all terms
  copy.terms = this.terms.map((t) => t.copy());

  return copy;
};

Expression.prototype.add = function expressionAdd(a, simplify) {
  const thisExp = this.copy();

  if (typeof a === 'string' || a instanceof Term || isInt(a) || a instanceof Fraction) {
    const exp = new Expression(a);
    return thisExp.add(exp, simplify);
  }
  if (a instanceof Expression) {
    const keepTerms = a.copy().terms;

    thisExp.terms = thisExp.terms.concat(keepTerms);
    thisExp.constants = thisExp.constants.concat(a.constants);
    thisExp.sort();
  } else {
    throw new TypeError(
      `Invalid Argument (${a.toString()}): Summand must be of type String, Expression, Term, Fraction or Integer.`,
    );
  }

  return simplify || simplify === undefined ? thisExp.simplify() : thisExp;
};

Expression.prototype.subtract = function expressionSubtract(a, simplify) {
  const negative = a instanceof Expression ? a.multiply(-1) : new Expression(a).multiply(-1);
  return this.add(negative, simplify);
};

Expression.prototype.multiply = function expressionMultiply(a, simplify) {
  const thisExp = this.copy();

  if (typeof a === 'string' || a instanceof Term || isInt(a) || a instanceof Fraction) {
    const exp = new Expression(a);
    return thisExp.multiply(exp, simplify);
  }

  if (a instanceof Expression) {
    const thatExp = a.copy();
    const newTerms = [];

    thisExp.terms.forEach((thisTerm) => {
      thatExp.terms.forEach((thatTerm) => newTerms.push(thisTerm.multiply(thatTerm, simplify)));

      thatExp.constants.forEach((thatConst) => newTerms.push(thisTerm.multiply(thatConst, simplify)));
    });

    thatExp.terms.forEach((thatTerm) =>
      thisExp.constants.forEach((thisConst) => newTerms.push(thatTerm.multiply(thisConst, simplify))),
    );

    const newConstants = [];

    thisExp.constants.forEach((thisConst) => {
      thatExp.constants.forEach((thatConst) => {
        let t = new Term();
        t = t.multiply(thatConst, false);
        t = t.multiply(thisConst, false);
        newTerms.push(t);
      });
    });

    thisExp.constants = newConstants;
    thisExp.terms = newTerms;
    thisExp.sort();
  } else {
    throw new TypeError(
      `Invalid Argument (${a.toString()}): Multiplicand must be of type String, Expression, Term, Fraction or Integer.`,
    );
  }

  return simplify || simplify === undefined ? thisExp.simplify() : thisExp;
};

Expression.prototype.divide = function divideFromEquation(a, simplify) {
  if (a instanceof Fraction || isInt(a)) {
    if (a.valueOf() === 0) {
      throw new EvalError('Divide By Zero');
    }

    const copy = this.copy();

    copy.terms.forEach((thisTerm, i) => {
      copy.terms[i].coefficients = thisTerm.coefficients.map((coeff) => coeff.divide(a, simplify));
    });

    // divide every constant by a
    copy.constants = copy.constants.map((c) => c.divide(a, simplify));

    return copy;
  }
  if (a instanceof Expression) {
    // Simplify both expressions
    let num = this.copy().simplify();
    const denom = a.copy().simplify();

    // Total amount of terms and constants
    const numTotal = num.terms.length + num.constants.length;
    const denomTotal = denom.terms.length + denom.constants.length;

    // Check if both terms are monomial
    if (numTotal === 1 && denomTotal === 1) {
      // Devide coefficients
      const numCoef = num.terms[0].coefficients[0];
      const denomCoef = denom.terms[0].coefficients[0];

      // The expressions have just been simplified - only one coefficient per term
      num.terms[0].coefficients[0] = numCoef.divide(denomCoef, simplify);
      denom.terms[0].coefficients[0] = new Fraction(1, 1);

      // Cancel variables
      num.terms[0].variables.forEach((numVar, numIndex) => {
        denom.terms[0].variables.forEach((denomVar, denomIndex) => {
          if (numVar.variable === denomVar.variable) {
            // Use the rule for division of powers
            num.terms[0].variables[numIndex].degree -= denomVar.degree;
            denom.terms[0].variables[denomIndex].degree = 0;
          }
        });
      });

      // Invers all degrees of remaining variables
      denom.terms[0].variables.forEach((_, i) => {
        denom.terms[0].variables[i].degree *= -1;
      });

      // Multiply the inversed variables to the numenator
      num = num.multiply(denom, simplify);

      return num;
    }
    throw new TypeError(
      `Invalid Argument ((${num.toString()})/(${denom.toString()})): Only monomial expressions can be divided.`,
    );
  } else {
    throw new TypeError(`Invalid Argument (${a.toString()}): Divisor must be of type Fraction or Integer.`);
  }
};

Expression.prototype.pow = function raiseExpression(a, simplify) {
  if (isInt(a)) {
    let copy = this.copy();

    if (a === 0) {
      return new Expression().add(1);
    }

    for (let i = 1; i < a; i += 1) {
      copy = copy.multiply(this, simplify);
    }

    copy.sort();

    return simplify || simplify === undefined ? copy.simplify() : copy;
  }
  throw new TypeError(`Invalid Argument (${a.toString()}): Exponent must be of type Integer.`);
};

Expression.prototype.eval = function evalExpression(values, simplify) {
  const exp = new Expression();
  exp.constants = simplify ? [this.constant()] : this.constants.slice();

  // add all evaluated terms of this to exp
  return this.terms.reduce((p, c) => p.add(c.eval(values, simplify), simplify), exp);
};

Expression.prototype.summation = function experssionSummation(variable, lower, upper, simplify) {
  const thisExpr = this.copy();
  let newExpr = new Expression();
  for (let i = lower; i < upper + 1; i += 1) {
    const sub = {};
    sub[variable] = i;
    newExpr = newExpr.add(thisExpr.eval(sub, simplify), simplify);
  }
  return newExpr;
};

Expression.prototype.toString = function expressionToString(options) {
  const str = `${this.terms.reduce(
    (acc, term) => `${acc}${(term.coefficients[0].valueOf() < 0 ? ' - ' : ' + ') + term.toString(options)}`,
    '',
  )}${this.constants.reduce(
    (acc, constant) => `${acc}${(constant.valueOf() < 0 ? ' - ' : ' + ') + constant.abs().toString()}`,
    '',
  )}`;

  if (str.substring(0, 3) === ' - ') {
    return `-${str.substring(3, str.length)}`;
  }
  if (str.substring(0, 3) === ' + ') {
    return str.substring(3, str.length);
  }
  return '0';
};

Expression.prototype.toTex = function expressionToTex(dict) {
  const str = `${this.terms.reduce(
    (acc, term) => `${acc}${(term.coefficients[0].valueOf() < 0 ? ' - ' : ' + ') + term.toTex(dict)}`,
    '',
  )}${this.constants.reduce(
    (acc, constant) => `${acc}${(constant.valueOf() < 0 ? ' - ' : ' + ') + constant.abs().toTex()}`,
    '',
  )}`;

  if (str.substring(0, 3) === ' - ') {
    return `-${str.substring(3, str.length)}`;
  }
  if (str.substring(0, 3) === ' + ') {
    return str.substring(3, str.length);
  }
  return '0';
};

Expression.prototype.removeTermsWithCoefficientZero = function removeTermsWithCoefficientZeroFromExpression() {
  this.terms = this.terms.filter((t) => t.coefficient().reduce().numer !== 0);
  return this;
};

Expression.prototype.combineLikeTerms = function combineLikeTerms() {
  function alreadyEncountered(term, encountered) {
    return encountered.some((e) => term.canBeCombinedWith(e));
  }

  const newTerms = [];
  const encountered = [];

  this.terms.forEach((thisTerm, i) => {
    if (alreadyEncountered(thisTerm, encountered)) {
      return;
    }

    const newTerm = this.terms.slice(i + 1).reduce((term, thatTerm) => {
      if (!term.canBeCombinedWith(thatTerm)) {
        return term;
      }
      return term.add(thatTerm);
    }, thisTerm);

    encountered.push(newTerm);
    newTerms.push(newTerm);
  });

  this.terms = newTerms;
  return this;
};

Expression.prototype.moveTermsWithDegreeZeroToConstants = function moveTermsWithDegreeZeroToConstants() {
  const keepTerms = [];
  let constant = new Fraction(0, 1);

  this.terms.forEach((thisTerm) => {
    if (thisTerm.variables.length === 0) {
      constant = constant.add(thisTerm.coefficient());
    } else {
      keepTerms.push(thisTerm);
    }
  });

  this.constants.push(constant);
  this.terms = keepTerms;
  return this;
};

Expression.prototype.sort = function sortExpression() {
  function sortTerms(a, b) {
    const x = a.maxDegree();
    const y = b.maxDegree();

    if (x === y) {
      const m = a.variables.length;
      const n = b.variables.length;

      return n - m;
    }
    return y - x;
  }

  this.terms = this.terms.sort(sortTerms);
  return this;
};

Expression.prototype.hasVariable = function expressionHasVariable(variable) {
  return this.terms.some((term) => term.hasVariable(variable));
};

Expression.prototype.hasOnlyVariable = function expressionHasOnlyVariable(variable) {
  return this.terms.every((term) => term.onlyHasVariable(variable));
};

Expression.prototype.hasNoCrossProductsWithVariable = function expressionHasNoCrossProductsWithVariable(
  variable,
) {
  return !this.terms.some((term) => term.hasVariable(variable) && !term.onlyHasVariable(variable));
};

Expression.prototype.hasNoCrossProducts = function expressionHasNoCrossProducts() {
  return this.terms.every(({ variables }) => variables.length <= 1);
};

Expression.prototype.getMaxDegree = function getExperssionsMaxDegree() {
  return this.terms.reduce((p, c) => Math.max(p, c.maxDegree()), 1);
};

Expression.prototype.getMaxDegreeOfVariable = function getMaxDegreeOfVariable(variable) {
  return this.terms.reduce((p, c) => Math.max(p, c.maxDegreeOfVariable(variable)), 1);
};

Expression.prototype.getQadraticCoefficients = function getExpressionsQadraticCoefficients() {
  // This function isn't used until everything has been moved to the LHS in Equation.solve.
  let a;
  let b = new Fraction(0, 1);

  this.terms.forEach((thisTerm) => {
    a = thisTerm.maxDegree() === 2 ? thisTerm.coefficient().copy() : a;
    b = thisTerm.maxDegree() === 1 ? thisTerm.coefficient().copy() : b;
  });

  const c = this.constant();

  return { a, b, c };
};

Expression.prototype.getCubicCoefficients = function getExperssionsCubicCoefficients() {
  // This function isn't used until everything has been moved to the LHS in Equation.solve.
  let a;
  let b = new Fraction(0, 1);
  let c = new Fraction(0, 1);

  this.terms.forEach((thisTerm) => {
    a = thisTerm.maxDegree() === 3 ? thisTerm.coefficient().copy() : a;
    b = thisTerm.maxDegree() === 2 ? thisTerm.coefficient().copy() : b;
    c = thisTerm.maxDegree() === 1 ? thisTerm.coefficient().copy() : c;
  });

  const d = this.constant();
  return { a, b, c, d };
};

Term.prototype.coefficient = function termsCoeffient() {
  // calculate the product of all coefficients
  return this.coefficients.reduce((p, c) => p.multiply(c), new Fraction(1, 1));
};

Term.prototype.simplify = function simplifyTerm() {
  const copy = this.copy();
  copy.coefficients = [this.coefficient()];
  copy.combineVars();
  return copy.sort();
};

Term.prototype.combineVars = function combineTermsVars() {
  const uniqueVars = {};

  this.variables.forEach((thisVar) => {
    if (thisVar.variable in uniqueVars) {
      uniqueVars[thisVar.variable] += thisVar.degree;
    } else {
      uniqueVars[thisVar.variable] = thisVar.degree;
    }
  });

  const newVars = Object.keys(uniqueVars).map((v) => {
    const newVar = new Variable(v);
    newVar.degree = uniqueVars[v];
    return newVar;
  });

  this.variables = newVars;
  return this;
};

Term.prototype.copy = function copyTerm() {
  const copy = new Term();
  copy.coefficients = this.coefficients.map((c) => c.copy());
  copy.variables = this.variables.map((v) => v.copy());
  return copy;
};

Term.prototype.add = function addToTerm(term) {
  if (term instanceof Term && this.canBeCombinedWith(term)) {
    const copy = this.copy();
    copy.coefficients = [copy.coefficient().add(term.coefficient())];
    return copy;
  }
  throw new TypeError(
    `Invalid Argument (${term.toString()}): Summand must be of type String, Expression, Term, Fraction or Integer.`,
  );
};

Term.prototype.subtract = function subtractFromTerm(term) {
  if (term instanceof Term && this.canBeCombinedWith(term)) {
    const copy = this.copy();
    copy.coefficients = [copy.coefficient().subtract(term.coefficient())];
    return copy;
  }
  throw new TypeError(
    `Invalid Argument (${term.toString()}): Subtrahend must be of type String, Expression, Term, Fraction or Integer.`,
  );
};

Term.prototype.multiply = function multiplyToTerm(a, simplify) {
  const thisTerm = this.copy();

  if (a instanceof Term) {
    thisTerm.variables = thisTerm.variables.concat(a.variables);
    thisTerm.coefficients = a.coefficients.concat(thisTerm.coefficients);
  } else if (isInt(a) || a instanceof Fraction) {
    const newCoef = isInt(a) ? new Fraction(a, 1) : a;

    if (thisTerm.variables.length === 0) {
      thisTerm.coefficients.push(newCoef);
    } else {
      thisTerm.coefficients.unshift(newCoef);
    }
  } else {
    throw new TypeError(
      `Invalid Argument (${a.toString()}): Multiplicand must be of type String, Expression, Term, Fraction or Integer.`,
    );
  }

  return simplify || simplify === undefined ? thisTerm.simplify() : thisTerm;
};

Term.prototype.divide = function divideFromTerm(a, simplify) {
  if (isInt(a) || a instanceof Fraction) {
    const thisTerm = this.copy();
    thisTerm.coefficients = thisTerm.coefficients.map((c) => c.divide(a, simplify));
    return thisTerm;
  }
  throw new TypeError(`Invalid Argument (${a.toString()}): Argument must be of type Fraction or Integer.`);
};

Term.prototype.eval = function evalTerm(values, simplify) {
  const copy = this.copy();
  let exp = copy.coefficients.reduce((p, c) => p.multiply(c, simplify), new Expression(1));

  copy.variables.forEach((thisVar) => {
    let ev;

    if (thisVar.variable in values) {
      const sub = values[thisVar.variable];

      if (sub instanceof Fraction || sub instanceof Expression) {
        ev = sub.pow(thisVar.degree);
      } else if (isInt(sub)) {
        ev = sub ** thisVar.degree;
      } else {
        throw new TypeError(`Invalid Argument (${sub}): Can only evaluate Expressions or Fractions.`);
      }
    } else {
      ev = new Expression(thisVar.variable).pow(thisVar.degree);
    }

    exp = exp.multiply(ev, simplify);
  });

  return exp;
};

Term.prototype.hasVariable = function termHasVariable(checkForVariable) {
  return this.variables.some(({ variable }) => checkForVariable === variable);
};

Term.prototype.maxDegree = function getTermsMaxDegree() {
  return this.variables.reduce((p, c) => Math.max(p, c.degree), 1);
};

Term.prototype.maxDegreeOfVariable = function getTermsMaxDegreeOfVariable(variable) {
  return this.variables.reduce((p, c) => (c.variable === variable ? Math.max(p, c.degree) : p), 1);
};

Term.prototype.canBeCombinedWith = function canTermBeCombinedWith(term) {
  const thisVars = this.variables;
  const thatVars = term.variables;

  if (thisVars.length !== thatVars.length) {
    return false;
  }

  return !thisVars.reduce(
    (acc, thisVar) =>
      thatVars.reduce(
        (acc2, thatVar) =>
          acc2 - (thisVar.variable === thatVar.variable && thisVar.degree === thatVar.degree ? 1 : 0),
        acc,
      ),
    thisVars.length,
  );
};

Term.prototype.onlyHasVariable = function termOnlyHasVariable(checkForVariable) {
  return this.variables.every(({ variable }) => variable === checkForVariable);
};

Term.prototype.sort = function sortTerm() {
  function sortVars(a, b) {
    return b.degree - a.degree;
  }

  this.variables = this.variables.sort(sortVars);
  return this;
};

Term.prototype.toString = function termToString(options) {
  const implicit = options && options.implicit;
  let str = '';

  this.coefficients.forEach((coef) => {
    if (coef.abs().numer !== 1 || coef.abs().denom !== 1) {
      str += ` * ${coef.toString()}`;
    }
  });

  str = this.variables.reduce((p, c) => {
    if (implicit && !!p) {
      const vStr = c.toString();
      return vStr ? `${p}*${vStr}` : p;
    }
    return p.concat(c.toString());
  }, str);
  str = str.substring(0, 3) === ' * ' ? str.substring(3, str.length) : str;
  str = str.substring(0, 1) === '-' ? str.substring(1, str.length) : str;

  return str;
};

Term.prototype.toTex = function termToTex({ multiplication = 'cdot' } = {}) {
  const op = ` \\${multiplication} `;

  let str = this.coefficients.reduce(
    (p, coef) => (coef.abs().numer !== 1 || coef.abs().denom !== 1 ? `${p}${op + coef.toTex()}` : p),
    '',
  );
  str = this.variables.reduce((p, c) => p.concat(c.toTex()), str);

  str = str.substring(0, op.length) === op ? str.substring(op.length, str.length) : str;
  str = str.substring(0, 1) === '-' ? str.substring(1, str.length) : str;
  str = str.substring(0, 7) === '\\frac{-' ? `\\frac{${str.substring(7, str.length)}` : str;

  return str;
};

Variable.prototype.copy = function copyVariable() {
  const copy = new Variable(this.variable);
  copy.degree = this.degree;
  return copy;
};

Variable.prototype.toString = function variableToString() {
  const { degree, variable } = this;

  if (degree === 0) {
    return '';
  }
  if (degree === 1) {
    return variable;
  }
  return `${variable}^${degree}`;
};

Variable.prototype.toTex = function variableToTex() {
  const { degree } = this;
  let { variable } = this;

  if (GREEK_LETTERS.indexOf(variable) > -1) {
    variable = `\\${variable}`;
  }

  if (degree === 0) {
    return '';
  }
  if (degree === 1) {
    return variable;
  }
  return `${variable}^{${degree}}`;
};

module.exports = {
  Expression,
  Term,
  Variable,
};
