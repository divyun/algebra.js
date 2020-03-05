const Lexer = require('./lexer');
const { Expression } = require('./expressions');
const Fraction = require('./fractions');
const Equation = require('./equations');

function Parser() {
  this.lexer = new Lexer();
  this.current_token = null;

  /**
   * Base-grammar:
   *
   * expr   -> expr + term
   *        | expr - term
   *        | - term
   *        | term
   *
   * term   -> term * factor
   *        | term factor
   *        | term / factor
   *        | term ^ factor
   *        | factor
   *
   * factor -> (expr)
   *        | num
   *        | id
   *
   * ===============================
   *
   * Grammar without left recursion -> the grammar actually used
   *
   * eqn         -> expr = expr
   * expr        -> term expr_rest
   * expr_rest   -> + term expr_rest
   *             | - term expr_rest
   *             | ε
   *
   * term        -> factor term_rest
   * term_rest   -> * term term_rest
   *             |   term term_rest
   *             | ^ term term_rest
   *             | / term term_rest
   *             | ε
   *
   * factor      -> (expr)
   *             | num
   *             | id
   *
   * */
}

// Updates the current token to the next input token
Parser.prototype.update = function update() {
  this.current_token = this.lexer.token();
};

// Returns true if the current token matches the keyword
Parser.prototype.match = function match(keyword) {
  if (this.current_token === null) return keyword === 'epsilon';

  switch (keyword) {
    case 'plus':
      return this.current_token.type === 'OPERATOR' && this.current_token.value === 'PLUS';
    case 'minus':
      return this.current_token.type === 'OPERATOR' && this.current_token.value === 'MINUS';
    case 'multiply':
      return this.current_token.type === 'OPERATOR' && this.current_token.value === 'MULTIPLY';
    case 'power':
      return this.current_token.type === 'OPERATOR' && this.current_token.value === 'POWER';
    case 'divide':
      return this.current_token.type === 'OPERATOR' && this.current_token.value === 'DIVIDE';
    case 'equal':
      return this.current_token.type === 'OPERATOR' && this.current_token.value === 'EQUALS';
    case 'lparen':
      return this.current_token.type === 'PAREN' && this.current_token.value === 'L_PAREN';
    case 'rparen':
      return this.current_token.type === 'PAREN' && this.current_token.value === 'R_PAREN';
    case 'num':
      return this.current_token.type === 'NUMBER';
    case 'id':
      return this.current_token.type === 'IDENTIFIER';
    default:
      return false;
  }
};

/*
    Initializes the parser internals and the lexer.
    The input is then parsed according to the grammar described in the
    header comment. The parsing process constructs a abstract syntax tree
    using the classes the algebra.js library provides
*/
Parser.prototype.parse = function parse(input) {
  // pass the input to the lexer
  this.lexer.input(input);
  this.update();
  return this.parseEqn();
};

Parser.prototype.parseEqn = function parseEqn() {
  const ex1 = this.parseExpr();
  if (this.match('equal')) {
    this.update();
    const ex2 = this.parseExpr();
    return new Equation(ex1, ex2);
  }
  if (this.match('epsilon')) {
    return ex1;
  }
  throw new SyntaxError('Unbalanced Parenthesis');
};

Parser.prototype.parseExpr = function parseExpr() {
  const term = this.parseTerm();
  return this.parseExprRest(term);
};

Parser.prototype.parseExprRest = function parseExprRest(term) {
  if (this.match('plus')) {
    this.update();
    const plusterm = this.parseTerm();
    if (term === undefined || plusterm === undefined) throw new SyntaxError('Missing operand');
    return this.parseExprRest(term.add(plusterm));
  }
  if (this.match('minus')) {
    this.update();
    const minusterm = this.parseTerm();
    // This case is entered when a negative number is parsed e.g. x = -4
    if (term === undefined) {
      return this.parseExprRest(minusterm.multiply(-1));
    }
    return this.parseExprRest(term.subtract(minusterm));
  }
  return term;
};

Parser.prototype.parseTerm = function parseTerm() {
  const factor = this.parseFactor();
  return this.parseTermRest(factor);
};

Parser.prototype.parseTermRest = function parseTermRest(factor) {
  if (this.match('multiply')) {
    this.update();
    const mulfactor = this.parseFactor();
    return factor.multiply(this.parseTermRest(mulfactor));
  }
  if (this.match('power')) {
    this.update();
    const powfactor = this.parseFactor();
    // WORKAROUND: algebra.js only allows integers and fractions for raising
    return this.parseTermRest(factor.pow(parseInt(powfactor.toString(), 10)));
  }
  if (this.match('divide')) {
    this.update();
    const devfactor = this.parseFactor();
    // WORKAROUND: algebra.js only allows integers and fractions for division
    return this.parseTermRest(factor.divide(this.convertToFraction(devfactor)));
  }
  if (this.match('epsilon')) {
    return factor;
  }
  // a missing operator between terms is treated like a multiplier
  const mulfactor2 = this.parseFactor();
  if (mulfactor2 === undefined) {
    return factor;
  }
  return factor.multiply(this.parseTermRest(mulfactor2));
};

/**
 * Is used to convert expressions to fractions, as dividing by expressions is not possible
 * */
Parser.prototype.convertToFraction = function convertToFraction(expression) {
  if (expression.terms.length > 0) {
    throw new TypeError(
      `Invalid Argument (${expression.toString()}): Divisor must be of type Integer or Fraction.`,
    );
  } else {
    const c = expression.constants[0];
    return new Fraction(c.numer, c.denom);
  }
};

Parser.prototype.parseFactor = function parseFactor() {
  if (this.match('num')) {
    const num = this.parseNumber();
    this.update();
    return num;
  }
  if (this.match('id')) {
    const id = new Expression(this.current_token.value);
    this.update();
    return id;
  }
  if (this.match('lparen')) {
    this.update();
    const expr = this.parseExpr();
    if (this.match('rparen')) {
      this.update();
      return expr;
    }
    throw new SyntaxError('Unbalanced Parenthesis');
  } else {
    return undefined;
  }
};

// Converts a number token - integer or decimal - to an expression
Parser.prototype.parseNumber = function parseNumber() {
  // Integer conversion
  if (this.current_token.value % 1 === 0) {
    return new Expression(parseInt(this.current_token.value, 10));
  }
  // Split the decimal number to integer and decimal parts
  const splits = this.current_token.value.split('.');
  // count the digits of the decimal part
  const decimals = splits[1].length;
  // determine the multiplication factor
  const factor = 10 ** decimals;
  const floatOp = parseFloat(this.current_token.value);
  // multiply the float with the factor and divide it again afterwards
  // to create a valid expression object
  return new Expression(parseInt(floatOp * factor, 10)).divide(factor);
};

module.exports = Parser;
