const { gcd } = require('../src/helper');
const { lcm } = require('../src/helper');
const { isInt } = require('../src/helper');
const { round } = require('../src/helper');
const algebra = require('../src/algebra');

describe('Greatest common divisor', () => {
  it('returns 1 when the arguments are 1 and 1', () => {
    const g = gcd(1, 1);
    expect(g).toEqual(1);
  });

  it('returns 2 when the arguments are 2 and 4', () => {
    const g = gcd(4, 2);
    expect(g).toEqual(2);
  });

  it('returns 1 when the arguments are 5 and 7', () => {
    const g = gcd(5, 7);
    expect(g).toEqual(1);
  });
});

describe('Least common multiple', () => {
  it('should return 12 if the arguments are 4 and 6', () => {
    expect(lcm(4, 6)).toEqual(12);
  });

  it('should return 15 if the arguments are 3 and 5', () => {
    expect(lcm(3, 5)).toEqual(15);
  });
});

describe('isInt', () => {
  it("should return false if it's a float", () => {
    expect(isInt(0.5)).toBe(false);
  });

  it("should return false if it's a string", () => {
    expect(isInt('hi')).toBe(false);
  });

  it("should return false if it's undefined", () => {
    expect(isInt()).toBe(false);
  });

  it("should return true if it's an integer", () => {
    expect(isInt(4)).toBe(true);
  });
});

describe('round', () => {
  it('should round integers to themselves', () => {
    expect(round(5)).toEqual(5.0);
  });

  it('should round to 2 decimal places by default', () => {
    expect(round(5.555)).toEqual(5.56);
  });

  it('should round to 0 decimal places correctly', () => {
    expect(round(5.55, 0)).toEqual(6);
  });

  it('should round to 1 decimal places correctly', () => {
    expect(round(5.55, 1)).toEqual(5.6);
  });

  it("should equal itself when rounding to decimal places beyond what's necessary", () => {
    expect(round(5.55, 4)).toEqual(5.55);
  });
});

describe('algebra.toTex', () => {
  it('converts non-algebra.js objects to strings - string', () => {
    const x = 'hello';
    expect(algebra.toTex(x)).toEqual(x.toString());
  });

  it('converts non-algebra.js objects to strings - number', () => {
    const x = 3.5;
    expect(algebra.toTex(x)).toEqual(x.toString());
  });

  it('converts non-algebra.js objects to strings - boolean', () => {
    const x = true;
    expect(algebra.toTex(x)).toEqual(x.toString());
  });
});
