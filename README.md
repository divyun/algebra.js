# algebra.js

This is a fork of https://github.com/nicolewhite/algebra.js.

## Quick Start

```js
var expr = new Expression('x');
expr = expr.subtract(3);
expr = expr.add('x');

console.log(expr.toString());
```

```
2x - 3
```

```js
var eq = new Equation(expr, 4);

console.log(eq.toString());
```

```
2x - 3 = 4
```

```js
var x = eq.solveFor('x');

console.log('x = ' + x.toString());
```

```
x = 7/2
```

[Read the full documentation at the project site](http://algebra.js.org).

## Install

### Stable Release

```
npm install algebra.js
```

### Latest Development Release

```
git clone https://github.com/divyun/algebra.js.git
cd algebra.js
```

#### Usage

```js
var algebra = require('./algebra');
```

#### In the Browser

The following will build `algebra.js` in the `build` directory.

```
make bundle
```

The following will build `algebra.min.js` in the `build` directory.

```
make minify
```
