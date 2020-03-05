const { Variable } = require('../src/expressions');

describe('A variable', () => {
  const x = new Variable('x');

  it('is initalized with a variable name', () => {
    expect(x.variable).toEqual('x');
  });

  it('is initialized with a degree of 1', () => {
    expect(x.degree).toEqual(1);
  });

  it('should throw an error if initialized with an integer', () => {
    expect(() => new Variable(5)).toThrow(
      'Invalid Argument (5): Variable initalizer must be of type String.',
    );
  });

  it('should throw an error if initialized with a float', () => {
    expect(() => new Variable(5.1)).toThrow(
      'Invalid Argument (5.1): Variable initalizer must be of type String.',
    );
  });
});

describe('Variable printing to string', () => {
  const x = new Variable('x');

  it('should print just the variable when the degree is 1', () => {
    expect(x.toString()).toEqual('x');
  });

  it("should print the degree if it's greater than 1", () => {
    x.degree = 2;
    expect(x.toString()).toEqual('x^2');
  });

  it('should print an empty string if the degree is 0', () => {
    x.degree = 0;
    expect(x.toString()).toEqual('');
  });
});

describe('Variable printing to tex', () => {
  const x = new Variable('x');

  it('should print just the variable when the degree is 1', () => {
    expect(x.toTex()).toEqual('x');
  });

  it("should print the degree if it's greater than 1", () => {
    x.degree = 2;
    expect(x.toTex()).toEqual('x^{2}');
  });

  it('should print an empty string if the degree is 0', () => {
    x.degree = 0;
    expect(x.toTex()).toEqual('');
  });
});
