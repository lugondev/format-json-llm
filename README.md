# format-json-llm

A small JS module + web UI to convert between **JSON** and **TOON**
([Token-Oriented Object Notation](https://toonformat.dev)) and to generate
**schemas** (standard JSON Schema + a compact TOON schema) you can paste into an
LLM prompt so the model understands your request/response format.

TOON is a compact, token-efficient encoding of JSON designed for LLM prompts —
fewer tokens than JSON for the same data, especially for arrays of objects.

## Features

- **Bidirectional convert:** JSON → TOON and TOON → JSON.
- **Schema generation:**
  - JSON Schema (draft 2020-12) inferred from a sample value.
  - Compact TOON schema, e.g. `users:[]{id:int,name:str}`.
- **Token comparison:** JSON vs TOON token counts and the percentage saved
  (via `gpt-tokenizer`).
- **Live UI:** two-panel editor, debounced realtime conversion, delimiter /
  indent / strict / keyFolding options, swap source, copy output, and friendly
  error messages.

## Getting started

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # production build into dist/
npm test         # run the Vitest suite
```

## Project structure

```
src/
  core/            # pure logic, zero DOM (unit-tested)
    toon.js        # jsonToToon / toonToJson (wraps @toon-format/toon)
    schema-json.js # toJsonSchema -> JSON Schema 2020-12
    schema-toon.js # toToonSchema -> compact type signature
    tokens.js      # countTokens / compareTokens
    index.js       # aggregated core API
  ui/              # DOM + events
    panels.js      # builds the shell, output/error/token setters
    controls.js    # reads encode/decode options, debounce, clipboard
    app.js         # wiring + render loop
  main.js          # entry point
tests/             # Vitest (core unit tests + jsdom UI integration tests)
```

## Core API

```js
import {
  jsonToToon, toonToJson,
  toJsonSchema, toToonSchema,
  countTokens, compareTokens,
} from './src/core/index.js';

jsonToToon(jsonString, opts)  // -> { ok, toon, error }
toonToJson(toonString, opts)  // -> { ok, json, value, error }
toJsonSchema(value)           // -> JSON Schema object (draft 2020-12)
toToonSchema(value)           // -> compact signature string
compareTokens(jsonText, toon) // -> { jsonTokens, toonTokens, savedPercent }
```

Encode/decode options are passed straight through to
[`@toon-format/toon`](https://www.npmjs.com/package/@toon-format/toon)
(`delimiter`, `indent`, `keyFolding`, `strict`, `expandPaths`).

## License

MIT
