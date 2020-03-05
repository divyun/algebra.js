import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

export default [
  // browser-friendly UMD build
  {
    input: 'src/algebra.js',
    output: [
      {
        name: 'algebra',
        file: pkg.browser,
        format: 'umd',
      },
      {
        name: 'algebra',
        file: pkg.browser.replace('.js', '.min.js'),
        format: 'umd',
        plugins: [terser({ module: true })],
      },
    ],
    plugins: [resolve(), commonjs()],
  },

  {
    input: 'src/algebra.js',
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' },
    ],
    plugins: [resolve(), commonjs()],
  },
];
