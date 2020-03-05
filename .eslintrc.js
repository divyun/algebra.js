module.exports = {
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  env: {
    jasmine: true,
  },
  plugins: ['prettier', 'jasmine'],
  rules: {
    'prettier/prettier': ['error'],
  },
  root: true,
};
