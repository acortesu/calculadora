'use strict';

// ── SetOps ────────────────────────────────────────────────────────────────────
// Funciones puras sobre Set nativos de JS.
// Los elementos se normalizan a string al guardarlos en SetStore.

const SetOps = {
  union(A, B) {
    return new Set([...A, ...B]);
  },

  intersection(A, B) {
    return new Set([...A].filter(x => B.has(x)));
  },

  difference(A, B) {
    return new Set([...A].filter(x => !B.has(x)));
  },

  complement(A, U) {
    return new Set([...U].filter(x => !A.has(x)));
  },

  symmetricDifference(A, B) {
    return new Set([
      ...[...A].filter(x => !B.has(x)),
      ...[...B].filter(x => !A.has(x)),
    ]);
  },

  // Devuelve el conjunto formateado como "{1, 2, 3}" o "∅".
  // Ordena numéricamente si todos los elementos son números, lexicográficamente si no.
  format(S) {
    if (S.size === 0) return '∅';
    const arr = [...S];
    const allNumeric = arr.every(x => x.trim() !== '' && !isNaN(Number(x)));
    const sorted = allNumeric
      ? arr.sort((a, b) => Number(a) - Number(b))
      : arr.sort((a, b) => a.localeCompare(b));
    return `{${sorted.join(', ')}}`;
  },
};

// ── SetStore ──────────────────────────────────────────────────────────────────
// Almacén central de conjuntos definidos por el usuario.
// Internamente usa un Map<string, Set<string>>.

const SetStore = (() => {
  const _store = new Map();

  return {
    define(name, elements) {
      _store.set(name, new Set(elements.map(e => String(e).trim())));
    },
    get(name)    { return _store.get(name) ?? null; },
    remove(name) { _store.delete(name); },
    list()       { return [..._store.entries()].map(([name, set]) => ({ name, set })); },
  };
})();
