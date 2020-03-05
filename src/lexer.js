/*
  The lexer module is a slightly modified version of the handwritten lexer by Eli Bendersky.
  The parts not needed like comments and quotes were deleted and some things modified.
  Comments are left unchanged, the original lexer can be found here:
  http://eli.thegreenplace.net/2013/07/16/hand-written-lexer-in-javascript-compared-to-the-regex-based-ones
*/

function Lexer() {
  this.pos = 0;
  this.buf = null;
  this.buflen = 0;

  // Operator table, mapping operator -> token name
  this.optable = {
    '+': 'PLUS',
    '-': 'MINUS',
    '*': 'MULTIPLY',
    '/': 'DIVIDE',
    '^': 'POWER',
    '(': 'L_PAREN',
    ')': 'R_PAREN',
    '=': 'EQUALS',
  };
}

// Initialize the Lexer's buffer. This resets the lexer's internal
// state and subsequent tokens will be returned starting with the
// beginning of the new buffer.
Lexer.prototype.input = function lexerInput(buf) {
  this.pos = 0;
  this.buf = buf;
  this.buflen = buf.length;
};

// Get the next token from the current buffer. A token is an object with
// the following properties:
// - type: name of the pattern that this token matched (taken from rules).
// - value: actual string value of the token.
// - pos: offset in the current buffer where the token starts.
//
// If there are no more tokens in the buffer, returns null. In case of
// an error throws Error.
Lexer.prototype.token = function lexerToken() {
  this.skipNonTokens();
  if (this.pos >= this.buflen) {
    return null;
  }

  // The char at this.pos is part of a real token. Figure out which.
  const c = this.buf.charAt(this.pos);
  // Look it up in the table of operators
  const op = this.optable[c];
  if (op !== undefined) {
    const { pos } = this;
    this.pos += 1;
    if (op === 'L_PAREN' || op === 'R_PAREN') {
      return { type: 'PAREN', value: op, pos };
    }
    return { type: 'OPERATOR', value: op, pos };
  }
  // Not an operator - so it's the beginning of another token.
  if (Lexer.isAlpha(c)) {
    return this.processIdentifier();
  }
  if (Lexer.isDigit(c)) {
    return this.processNumber();
  }
  throw new SyntaxError(`Token error at character ${c} at position ${this.pos}`);
};

Lexer.isDigit = function isLexerDigit(c) {
  return c >= '0' && c <= '9';
};

Lexer.isAlpha = function isLexerAlpha(c) {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
};

Lexer.isAlphanum = function isLexerAlphanum(c) {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9');
};

Lexer.prototype.processDigits = function processDigits(position) {
  let endpos = position;
  while (endpos < this.buflen && Lexer.isDigit(this.buf.charAt(endpos))) {
    endpos += 1;
  }
  return endpos;
};

Lexer.prototype.processNumber = function processNumber() {
  // Read characters until a non-digit character appears
  let endpos = this.processDigits(this.pos);
  // If it's a decimal point, continue to read digits
  if (this.buf.charAt(endpos) === '.') {
    endpos = this.processDigits(endpos + 1);
  }
  // Check if the last read character is a decimal point.
  // If it is, ignore it and proceed
  if (this.buf.charAt(endpos - 1) === '.') {
    throw new SyntaxError(`Decimal point without decimal digits at position ${endpos - 1}`);
  }
  // construct the NUMBER token
  const tok = {
    type: 'NUMBER',
    value: this.buf.substring(this.pos, endpos),
    pos: this.pos,
  };
  this.pos = endpos;
  return tok;
};

Lexer.prototype.processIdentifier = function processIdentifier() {
  let endpos = this.pos + 1;
  while (endpos < this.buflen && Lexer.isAlphanum(this.buf.charAt(endpos))) {
    endpos += 1;
  }

  const tok = {
    type: 'IDENTIFIER',
    value: this.buf.substring(this.pos, endpos),
    pos: this.pos,
  };
  this.pos = endpos;
  return tok;
};

Lexer.prototype.skipNonTokens = function skipNonTokens() {
  while (this.pos < this.buflen) {
    const c = this.buf.charAt(this.pos);
    if (c === ' ' || c === '\t' || c === '\r' || c === '\n') {
      this.pos += 1;
    } else {
      break;
    }
  }
};

module.exports = Lexer;
