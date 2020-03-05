function gcd(x, y) {
  return y ? gcd(y, x % y) : x;
}

function lcm(x, y) {
  return (x * y) / gcd(x, y);
}

function isInt(thing) {
  return typeof thing === 'number' && thing % 1 === 0;
}

function round(decimal, places = 2) {
  const x = 10 ** places;
  return Math.round(parseFloat(decimal) * x) / x;
}

const GREEK_LETTERS = [
  'alpha',
  'beta',
  'gamma',
  'Gamma',
  'delta',
  'Delta',
  'epsilon',
  'varepsilon',
  'zeta',
  'eta',
  'theta',
  'vartheta',
  'Theta',
  'iota',
  'kappa',
  'lambda',
  'Lambda',
  'mu',
  'nu',
  'xi',
  'Xi',
  'pi',
  'Pi',
  'rho',
  'varrho',
  'sigma',
  'Sigma',
  'tau',
  'upsilon',
  'Upsilon',
  'phi',
  'varphi',
  'Phi',
  'chi',
  'psi',
  'Psi',
  'omega',
  'Omega',
];

exports.gcd = gcd;
exports.lcm = lcm;
exports.isInt = isInt;
exports.round = round;
exports.GREEK_LETTERS = GREEK_LETTERS;
