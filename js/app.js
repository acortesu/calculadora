'use strict';

// ── App Controller ────────────────────────────────────────────────────────────
// Conecta los módulos de lógica (parser, sets, evaluator) con el DOM.
// Depende de: Tokenizer, Parser (js/parser.js)
//             SetOps, SetStore   (js/sets.js)
//             Evaluator, ConclusionGen (js/evaluator.js)

const App = {
  _usedLetters: new Set(),

  init() {
    this._bindUniversePanel();
    this._bindSetsPanel();
    this._bindExpressionPanel();
    this._addSet(); // inicia con el conjunto A ya presente
  },

  // ── Universo ──────────────────────────────────────────────────────

  _bindUniversePanel() {
    document.getElementById('universe-save-btn').addEventListener('click', () => {
      this._saveUniverse();
    });
    document.getElementById('universe-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') this._saveUniverse();
    });
  },

  _saveUniverse() {
    const raw = document.getElementById('universe-input').value.trim();
    const elements = this._parseElements(raw);
    if (!elements) {
      this._showError('El universo U no puede estar vacío.');
      return;
    }
    const newU = new Set(elements.map(e => String(e).trim()));
    const violations = SetStore.list()
      .filter(({ name }) => name !== 'U')
      .map(({ name, set }) => ({ name, outside: [...set].filter(x => !newU.has(x)) }))
      .filter(v => v.outside.length > 0);
    if (violations.length > 0) {
      const detail = violations
        .map(v => `${v.name} contiene {${v.outside.join(', ')}}`)
        .join('; ');
      this._showError(`No se puede definir U: ${detail} fuera del universo propuesto.`);
      return;
    }
    SetStore.define('U', elements);
    document.getElementById('universe-display').textContent =
      `U = ${SetOps.format(SetStore.get('U'))}`;
    this._hideError();
  },

  // ── Conjuntos ─────────────────────────────────────────────────────

  _bindSetsPanel() {
    document.getElementById('add-set-btn').addEventListener('click', () => {
      this._addSet();
    });
  },

  _addSet() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l => l !== 'U');
    const next = letters.find(l => !this._usedLetters.has(l));
    if (!next) {
      this._showError('Se alcanzó el límite máximo de conjuntos (A–Z, excepto U).');
      return;
    }
    this._usedLetters.add(next);
    document.getElementById('sets-container').appendChild(this._createSetCard(next));
    this._updateSetShortcuts();
  },

  _createSetCard(name) {
    const card = document.createElement('div');
    card.className = 'set-card';
    card.dataset.name = name;

    const label = document.createElement('span');
    label.className = 'set-label';
    label.textContent = name;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'set-input';
    input.placeholder = 'Ej: 1, 2, 3';
    input.style.flex = '1';
    input.style.minWidth = '120px';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-primary';
    saveBtn.textContent = 'Guardar';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-danger';
    removeBtn.title = `Eliminar conjunto ${name}`;
    removeBtn.textContent = '✕';

    const display = document.createElement('span');
    display.className = 'set-display';

    const save = () => {
      const raw = input.value.trim();
      const elements = this._parseElements(raw);
      if (!elements) {
        this._showError(`El conjunto ${name} no puede estar vacío.`);
        return;
      }
      const U = SetStore.get('U');
      if (U) {
        const outside = elements.map(e => String(e).trim()).filter(x => !U.has(x));
        if (outside.length > 0) {
          this._showError(
            `El conjunto ${name} contiene elementos fuera del universo U: {${outside.join(', ')}}.`
          );
          return;
        }
      }
      SetStore.define(name, elements);
      display.textContent = `= ${SetOps.format(SetStore.get(name))}`;
      this._hideError();
    };

    saveBtn.addEventListener('click', save);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') save(); });

    removeBtn.addEventListener('click', () => {
      SetStore.remove(name);
      this._usedLetters.delete(name);
      card.remove();
      this._updateSetShortcuts();
    });

    card.append(label, input, saveBtn, removeBtn, display);
    return card;
  },

  // ── Expresión ─────────────────────────────────────────────────────

  _bindExpressionPanel() {
    document.querySelectorAll('[data-op]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._insertAtCursor(btn.dataset.op);
      });
    });

    document.getElementById('clear-expr-btn').addEventListener('click', () => {
      document.getElementById('expression-input').value = '';
      this._hideError();
      document.getElementById('result-panel').classList.add('hidden');
    });

    document.getElementById('evaluate-btn').addEventListener('click', () => {
      this._evaluate();
    });

    const exprInput = document.getElementById('expression-input');
    exprInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') this._evaluate();
    });
    exprInput.addEventListener('input', () => this._hideError());
  },

  _insertAtCursor(text) {
    const input = document.getElementById('expression-input');
    const start = input.selectionStart;
    const end   = input.selectionEnd;
    input.value = input.value.slice(0, start) + text + input.value.slice(end);
    const pos = start + text.length;
    input.setSelectionRange(pos, pos);
    input.focus();
  },

  _updateSetShortcuts() {
    const container = document.getElementById('set-shortcut-buttons');
    container.innerHTML = '';
    [...this._usedLetters].sort().forEach(name => {
      const btn = document.createElement('button');
      btn.className = 'btn-set-shortcut';
      btn.textContent = name;
      btn.title = `Insertar ${name}`;
      btn.addEventListener('click', () => this._insertAtCursor(name));
      container.appendChild(btn);
    });
  },

  // ── Evaluación ────────────────────────────────────────────────────

  _evaluate() {
    const raw = document.getElementById('expression-input').value.trim();
    if (!raw) return;
    try {
      const tokens     = Tokenizer.tokenize(raw);
      const ast        = Parser.parse(tokens);
      const result     = Evaluator.evaluate(ast);
      const conclusion = ConclusionGen.generate(ast, result);
      this._renderResult(result, conclusion);
    } catch (e) {
      this._showError(e.message);
      document.getElementById('result-panel').classList.add('hidden');
    }
  },

  _renderResult(set, conclusion) {
    this._hideError();
    document.getElementById('result-set-display').textContent = SetOps.format(set);
    document.getElementById('result-cardinality').textContent = `|R| = ${set.size}`;
    document.getElementById('result-conclusion').textContent  = conclusion;
    const panel = document.getElementById('result-panel');
    panel.classList.remove('hidden');
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  // ── Utilidades ────────────────────────────────────────────────────

  _parseElements(raw) {
    if (!raw) return null;
    const els = raw.split(',').map(e => e.trim()).filter(e => e !== '');
    return els.length > 0 ? els : null;
  },

  _showError(msg) {
    document.getElementById('error-message').textContent = msg;
    document.getElementById('error-banner').classList.remove('hidden');
  },

  _hideError() {
    document.getElementById('error-banner').classList.add('hidden');
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
