'use strict';

// ── Evaluator ─────────────────────────────────────────────────────────────────
// Recorre el AST producido por Parser y devuelve un Set con el resultado.
// Depende de: SetStore, SetOps (js/sets.js) y SetEvalError (js/parser.js).

const Evaluator = {
  evaluate(node) {
    switch (node.type) {
      case 'Identifier': {
        const s = SetStore.get(node.name);
        if (!s) throw new SetEvalError(
          `El conjunto ${node.name} no está definido. Defínalo antes de evaluar.`
        );
        return s;
      }
      case 'Complement': {
        const U = SetStore.get('U');
        if (!U) throw new SetEvalError(
          'El universo U no está definido. Defínalo para usar el complemento.'
        );
        return SetOps.complement(this.evaluate(node.operand), U);
      }
      case 'BinaryOp': {
        const left  = this.evaluate(node.left);
        const right = this.evaluate(node.right);
        switch (node.op) {
          case 'UNION':     return SetOps.union(left, right);
          case 'INTERSECT': return SetOps.intersection(left, right);
          case 'DIFF':      return SetOps.difference(left, right);
          case 'SYMDIFF':   return SetOps.symmetricDifference(left, right);
        }
      }
    }
  }
};

// ── ConclusionGen ─────────────────────────────────────────────────────────────
// Recorre el AST y genera un párrafo explicativo en español.
// Depende de: SetOps (js/sets.js).

const ConclusionGen = {
  generate(ast, resultSet) {
    const exprDesc  = this._describe(ast);
    const formatted = SetOps.format(resultSet);
    const card      = resultSet.size;
    const cardText  = card === 0
      ? 'El resultado es el conjunto vacío (∅), con cardinalidad 0.'
      : card === 1
        ? 'El conjunto resultado tiene cardinalidad |R| = 1 (contiene un único elemento).'
        : `El conjunto resultado tiene cardinalidad |R| = ${card}.`;
    return `Se calculó ${exprDesc}. El conjunto resultante es ${formatted}. ${cardText}`;
  },

  _describe(node) {
    switch (node.type) {
      case 'Identifier':
        return `el conjunto ${node.name}`;
      case 'Complement':
        return `el complemento de ${this._describe(node.operand)} con respecto al universo U`;
      case 'BinaryOp': {
        const l = this._describe(node.left);
        const r = this._describe(node.right);
        switch (node.op) {
          case 'UNION':     return `la unión de ${l} y ${r}`;
          case 'INTERSECT': return `la intersección de ${l} y ${r}`;
          case 'DIFF':      return `la diferencia entre ${l} y ${r}`;
          case 'SYMDIFF':   return `la diferencia simétrica entre ${l} y ${r}`;
        }
      }
    }
  },
};
