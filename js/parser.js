'use strict';

// ── Custom Error Classes ──────────────────────────────────────────────────────

class ParseError extends Error {
  constructor(msg) { super(msg); this.name = 'ParseError'; }
}

class SetEvalError extends Error {
  constructor(msg) { super(msg); this.name = 'SetEvalError'; }
}

// ── Token Types ───────────────────────────────────────────────────────────────

const TT = {
  IDENT:      'IDENT',
  UNION:      'UNION',
  INTERSECT:  'INTERSECT',
  DIFF:       'DIFF',
  SYMDIFF:    'SYMDIFF',
  COMPLEMENT: 'COMPLEMENT',
  LPAREN:     'LPAREN',
  RPAREN:     'RPAREN',
  EOF:        'EOF',
};

// ── Tokenizer ─────────────────────────────────────────────────────────────────

const Tokenizer = {
  tokenize(input) {
    const tokens = [];
    let i = 0;
    while (i < input.length) {
      const ch = input[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (/[A-Z]/.test(ch)) {
        tokens.push({ type: TT.IDENT, name: ch, pos: i }); i++;
      } else if (ch === '\u222A' || ch === '|') {
        tokens.push({ type: TT.UNION, pos: i }); i++;
      } else if (ch === '\u2229' || ch === '&') {
        tokens.push({ type: TT.INTERSECT, pos: i }); i++;
      } else if (ch === '-' || ch === '\\') {
        tokens.push({ type: TT.DIFF, pos: i }); i++;
      } else if (ch === '\u25B3' || ch === '^') {
        tokens.push({ type: TT.SYMDIFF, pos: i }); i++;
      } else if (ch === "'") {
        tokens.push({ type: TT.COMPLEMENT, pos: i }); i++;
      } else if (ch === '(') {
        tokens.push({ type: TT.LPAREN, pos: i }); i++;
      } else if (ch === ')') {
        tokens.push({ type: TT.RPAREN, pos: i }); i++;
      } else {
        throw new ParseError(`Carácter inesperado '${ch}' en posición ${i + 1}.`);
      }
    }
    tokens.push({ type: TT.EOF });
    return tokens;
  }
};

// ── Parser (Recursive Descent) ────────────────────────────────────────────────
// Precedencia (mayor → menor):
//   complemento postfix (A')  >  intersección (∩)  >  diferencia (-)
//   >  diferencia simétrica (△)  >  unión (∪)

const Parser = {
  parse(tokens) {
    this._tokens = tokens;
    this._pos = 0;
    const ast = this._parseUnion();
    if (this._peek().type !== TT.EOF) {
      const tok = this._peek();
      throw new ParseError(
        `Token inesperado en posición ${tok.pos + 1}. ¿Falta un operador?`
      );
    }
    return ast;
  },

  _peek()    { return this._tokens[this._pos]; },
  _consume() { return this._tokens[this._pos++]; },

  _expect(type) {
    const tok = this._peek();
    if (tok.type !== type) {
      throw new ParseError(
        `Se esperaba '${type}' pero se encontró '${tok.type}'` +
        (tok.pos !== undefined ? ` en posición ${tok.pos + 1}` : '') + '.'
      );
    }
    return this._consume();
  },

  _parseUnion() {
    let left = this._parseSymDiff();
    while (this._peek().type === TT.UNION) {
      this._consume();
      const right = this._parseSymDiff();
      left = { type: 'BinaryOp', op: 'UNION', left, right };
    }
    return left;
  },

  _parseSymDiff() {
    let left = this._parseDiff();
    while (this._peek().type === TT.SYMDIFF) {
      this._consume();
      const right = this._parseDiff();
      left = { type: 'BinaryOp', op: 'SYMDIFF', left, right };
    }
    return left;
  },

  _parseDiff() {
    let left = this._parseIntersect();
    while (this._peek().type === TT.DIFF) {
      this._consume();
      const right = this._parseIntersect();
      left = { type: 'BinaryOp', op: 'DIFF', left, right };
    }
    return left;
  },

  _parseIntersect() {
    let left = this._parsePostfix();
    while (this._peek().type === TT.INTERSECT) {
      this._consume();
      const right = this._parsePostfix();
      left = { type: 'BinaryOp', op: 'INTERSECT', left, right };
    }
    return left;
  },

  _parsePostfix() {
    let node = this._parsePrimary();
    while (this._peek().type === TT.COMPLEMENT) {
      this._consume();
      node = { type: 'Complement', operand: node };
    }
    return node;
  },

  _parsePrimary() {
    const tok = this._peek();
    if (tok.type === TT.IDENT) {
      this._consume();
      return { type: 'Identifier', name: tok.name };
    }
    if (tok.type === TT.LPAREN) {
      this._consume();
      const expr = this._parseUnion();
      this._expect(TT.RPAREN);
      return expr;
    }
    if (tok.type === TT.EOF) {
      throw new ParseError(
        'Expresión incompleta: se esperaba un conjunto o un paréntesis.'
      );
    }
    throw new ParseError(
      `Se esperaba un conjunto o '(' pero se encontró '${tok.type}'` +
      (tok.pos !== undefined ? ` en posición ${tok.pos + 1}` : '') + '.'
    );
  },
};
