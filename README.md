# Calculadora de Teoría de Conjuntos

Aplicación web para analizar expresiones de teoría de conjuntos. Desarrollada en JavaScript vanilla como proyecto del curso de Matemática Discreta — CENFOTEC.

---

## Cómo usar

### 1. Abrir la aplicación
Abre el archivo `index.html` en cualquier navegador moderno, o levanta un servidor local:

```bash
python3 -m http.server 8080
# luego abre http://localhost:8080
```

### 2. Definir el universo U _(opcional, requerido para complemento)_
Ingresa los elementos separados por coma en el campo **Universo U** y presiona **Guardar U**.

```
Ej: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
```

### 3. Definir los conjuntos
La calculadora inicia con el conjunto **A** listo para llenar. Puedes:
- Ingresar los elementos separados por coma y presionar **Guardar** (o Enter).
- Presionar **+ Agregar conjunto** para añadir B, C, D… hasta Z.
- Presionar **✕** en cualquier tarjeta para eliminar ese conjunto.

```
Ej: A = 1, 2, 3, 4, 5
    B = 2, 4, 6, 8
    C = 1, 3, 5, 7, 9
```

### 4. Escribir la expresión
Usa el campo **Expresión** para escribir la operación que deseas calcular.

**Botones de operadores** — insertan el símbolo en el cursor:

| Botón | Operación | Alias de teclado |
|-------|-----------|-----------------|
| `∪ Unión` | Unión | `\|` |
| `∩ Intersección` | Intersección | `&` |
| `− Diferencia` | Diferencia | `-` |
| `△ Dif. Simétrica` | Diferencia simétrica | `^` |
| `' Complemento` | Complemento (postfix) | `'` |
| `(` `)` | Agrupación | `(` `)` |

**Botones de conjuntos** (verde) — insertan la letra del conjunto en el cursor.

También puedes escribir directamente en el campo usando el teclado.

### 5. Evaluar
Presiona **Evaluar →** o la tecla **Enter**.

La calculadora mostrará:
- El **conjunto resultado** en notación `{a, b, c}` (o `∅` si está vacío).
- La **cardinalidad** `|R| = n`.
- Una **conclusión** en español describiendo la operación realizada.

---

## Ejemplos

| Expresión | Resultado esperado* |
|-----------|-------------------|
| `A ∪ B` | Todos los elementos de A o B |
| `A ∩ B` | Elementos comunes a A y B |
| `A - B` | Elementos de A que no están en B |
| `A △ B` | Elementos en A o B, pero no en ambos |
| `A'` | Elementos de U que no están en A |
| `(A ∪ B) ∩ C'` | Expresión compuesta con 3 conjuntos |
| `((A ∩ B)' △ C) - (A ∪ B)'` | Expresión compleja anidada |

_*El resultado varía según los elementos que definas._

---

## Arquitectura

```
Expresión (texto)
       │
       ▼
┌─────────────┐
│  Tokenizer  │  Convierte el texto en tokens (∪, ∩, A, (, )…)
└──────┬──────┘
       │ tokens[]
       ▼
┌─────────────┐
│   Parser    │  Construye el Árbol de Sintaxis Abstracta (AST)
└──────┬──────┘     respetando la precedencia de operadores:
       │ AST        complemento > ∩ > − > △ > ∪
       ▼
┌─────────────┐
│  Evaluator  │  Recorre el AST y aplica las operaciones
└──────┬──────┘  consultando SetStore para obtener cada conjunto
       │ Set
       ▼
┌──────────────────┐
│  ConclusionGen   │  Genera la descripción en español
└──────────────────┘

SetStore — almacén central de conjuntos definidos por el usuario
SetOps   — funciones puras: union, intersection, difference, complement, symmetricDifference
```

### Estructura de archivos

```
├── index.html          — Interfaz (HTML + CSS)
└── js/
    ├── parser.js       — Tokenizer + Parser (análisis de expresiones)
    ├── sets.js         — SetOps + SetStore (operaciones y almacén)
    ├── evaluator.js    — Evaluator + ConclusionGen (resultado y conclusión)
    └── app.js          — App (controlador DOM)
```

---

## Manejo de errores

La calculadora muestra un mensaje en rojo cuando:
- Se usa un conjunto que no fue definido.
- Se usa complemento sin haber definido el universo U.
- La expresión tiene un error de sintaxis (paréntesis sin cerrar, operador doble, etc.).
