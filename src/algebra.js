const Fraction = require('./fractions');
const { Expression } = require('./expressions');
const Equation = require('./equations');
const Parser = require('./parser');

const parse = function parse(input) {
  const parser = new Parser();
  const result = parser.parse(input);
  return result;
};

const toTex = function toTex(input) {
  if (input instanceof Fraction || input instanceof Expression || input instanceof Equation) {
    return input.toTex();
  }
  if (input instanceof Array) {
    return input.map((e) => (e instanceof Fraction ? e.toTex() : e.toString())).join();
  }
  return input.toString();
};

module.exports = {
  Fraction,
  Expression,
  Equation,
  parse,
  toTex,
};
