# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Set theory calculator — vanilla JavaScript web app (no build step, no dependencies). Coursework for Matemática Discreta, CENFOTEC. User-facing strings are in Spanish.

## Running

Open `index.html` directly, or serve the directory:

```bash
python3 -m http.server 8080
```

There is no build, no package manager, and no test suite.

## Architecture

Pipeline: **text → Tokenizer → Parser (AST) → Evaluator → Set result + Spanish conclusion**.

- [js/parser.js](js/parser.js) — `Tokenizer` and `Parser`. Operator precedence (lowest → highest): `∪` < `△` < `−` < `∩` < `'` (postfix complement). Keyboard aliases: `|` `&` `-` `^` `'` map to the Unicode operators. Set names are single uppercase letters `A`–`Z`.
- [js/sets.js](js/sets.js) — `SetOps` (pure functions: union, intersection, difference, complement, symmetricDifference) and `SetStore` (central store of user-defined sets plus the universe `U`; complement requires `U`).
- [js/evaluator.js](js/evaluator.js) — `Evaluator` walks the AST calling `SetOps` via `SetStore`; `ConclusionGen` produces the Spanish natural-language description of what the expression computed.
- [js/app.js](js/app.js) — DOM controller. Wires the universe input, dynamic set cards (A–Z, add/remove), operator/set insertion buttons (insert at cursor position), and Evaluate action. Renders result as `{a, b, c}` / `∅` with cardinality.

Errors surfaced to the UI: undefined set referenced, complement used without `U` defined, syntax errors (unbalanced parens, adjacent operators, etc.). Keep error messages in Spanish.

When changing operator behavior or precedence, update both the parser and `ConclusionGen` so the described operation matches what was evaluated.
