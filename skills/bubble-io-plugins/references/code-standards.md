# Code Standards

These rules apply to **all JavaScript files** in this project. They cover language usage, security, and performance.

---

## 1. Language and Style

### Tooling

- **Linter:** ESLint (flat config, `eslint.config.mjs`).
- **Run manually:** `npm run lint` to check, `npm run lint:fix` to auto-fix.
- **VS Code:** Auto-fixes on save via `.vscode/settings.json` (`source.fixAll.eslint`).
- **Scope:** Linting covers both `**/*.js` and `**/*.html` files (via `eslint-plugin-html`).

### ESLint config (`eslint.config.mjs`)

This is the canonical config for this project. Do not modify it without good reason.

```js
import js from '@eslint/js';
import htmlPlugin from 'eslint-plugin-html';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.html'],
    plugins: {
      html: htmlPlugin,
      import: importPlugin
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        instance: 'readonly',
        properties: 'readonly',
        context: 'readonly',
        $: 'readonly',
        jQuery: 'readonly'
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    rules: {
      'linebreak-style': 0,
      'func-names': 0,
      'space-before-function-paren': ['error', {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always'
      }],
      'no-param-reassign': ['error', { props: false }],
      'consistent-return': 0,
      'prefer-const': 'off',
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      eqeqeq: 'error',
      'no-unused-vars': 'warn',
    }
  }
];
```

### Configured globals

The following identifiers are declared as globals in `eslint.config.mjs` and must not be redeclared. They are provided by the Bubble runtime at execution time:

| Global | Source |
|---|---|
| `instance` | Bubble element runtime |
| `properties` | Bubble element runtime |
| `context` | Bubble element runtime |
| `$` / `jQuery` | Bubble's bundled jQuery |
| All standard browser globals | `globals.browser` |

### Enforced syntax rules

The following rules are set in `eslint.config.mjs` and are not negotiable:

| Rule | Enforced behaviour |
|---|---|
| `semi` | Semicolons **required** (`'always'`). |
| `quotes` | **Single quotes** required. |
| `eqeqeq` | `===` and `!==` only — `error` on `==` / `!=`. |
| `no-unused-vars` | Warning on unused variables. Remove or prefix with `_`. |
| `prefer-const` | Off — `var` and `let` are permitted where appropriate. |
| `no-param-reassign` | Reassigning parameter variables is an error; reassigning their properties is allowed (`props: false`). |
| `space-before-function-paren` | No space before `(` for named/anonymous functions; space required for async arrow functions. |
| `func-names` | Off — anonymous functions are permitted (common in Bubble wrappers). |
| `consistent-return` | Off — mixed return patterns are permitted. |
| `linebreak-style` | Off — Windows and Unix line endings both accepted. |
| `ecmaVersion` | `'latest'` — full ES2022+ syntax permitted. |

### Scoping

Define helper functions **inside** the main execution block. Do not define functions at the top level of a file — this would pollute the global scope when the code runs inside Bubble's environment.

### Forbidden async patterns in plugin functions

Do NOT use `$(document).ready()`, `setTimeout(fn, 0)`, or similar async callbacks inside `initialize.js`, `update.js`, or action functions. These break Bubble's internal data dependency detection — Bubble won't know your function needs data and will not re-run it when the data arrives.

<bad_pattern>
```javascript
// WRONG: Breaks Bubble's dependency detection.
$(document).ready(function() {
  var items = properties.data_source.get(0, 10);
  renderItems(items);
});
```
</bad_pattern>

<good_pattern>
```javascript
function(instance, properties, context) {
  function formatCurrency(value) {
    return '$' + value.toFixed(2);
  }
  // Use formatCurrency here...
}
```
</good_pattern>

<bad_pattern>
```javascript
// WRONG: This leaks into the global scope inside Bubble.
function formatCurrency(value) {
  return '$' + value.toFixed(2);
}

function(instance, properties, context) {
  formatCurrency(42);
}
```
</bad_pattern>

---

## 2. Security

These rules are **strictly enforced**. Violations are blocking — code must not be merged or deployed until fixed.

### 2.1 No dynamic code execution

- **Forbidden:** `eval()`, `new Function()`, `setTimeout` with a string argument.
- **Why:** These open the door to arbitrary code injection.

### 2.2 XSS prevention

- **Prefer `textContent`** over `innerHTML` for inserting user-provided data.
- If `innerHTML` is unavoidable, **sanitize all input** before insertion.
- Never construct HTML strings by concatenating unsanitized variables.

<good_pattern>
```javascript
var el = document.createElement('span');
el.textContent = properties.user_input; // Safe: text only, no HTML parsing.
container.appendChild(el);
```
</good_pattern>

<bad_pattern>
```javascript
// WRONG: Direct user input into innerHTML enables XSS.
container.innerHTML = '<span>' + properties.user_input + '</span>';
```
</bad_pattern>

### 2.3 Secrets management

- **Never** place API keys, tokens, or credentials in client-side code (`initialize.js`, `update.js`, `header.html`).
- Use **Server-Side Actions** and access secrets via `context.keys`.
- If a plugin requires an API key from the user, document it in the element setup and access it through Bubble's server-side `context.keys` mechanism.

### 2.4 HTTPS only

All external network requests (script sources, API calls, image URLs) must use `https://`. No exceptions.

---

## 3. Performance

### 3.1 Server-side filtering

Never fetch a large Bubble list into JavaScript to filter it client-side. Advise users to use Bubble's database search constraints. Client-side filtering wastes Workload Units and degrades performance.

### 3.2 Event listener hygiene

- Namespace all DOM events: `click.pluginName_${id}`.
- Remove previous listeners before re-attaching to prevent accumulation across `update()` calls.

### 3.3 Avoid unnecessary re-renders

In `update.js`, compare incoming `properties` against stored state before doing expensive DOM operations. Skip rendering if nothing relevant changed.

```javascript
// Skip re-render if the data hasn't changed.
var newData = JSON.stringify(properties.data_source);
if (instance.data.lastData === newData) return;
instance.data.lastData = newData;
// Proceed with rendering...
```

### 3.4 Lazy initialization

Do not pre-load or pre-compute resources that might never be needed. Initialize expensive objects (charts, maps, editors) only when the element becomes visible or receives data for the first time.

---

## 4. Error Handling

- Use `try/catch` for **your own logic errors** (null references, type mismatches, rendering failures).
- **Never** catch Bubble's internal "Pending Data" exception (see `bubble-platform.md` Section 4).
- If you **must** wrap data-accessing code in `try/catch`, re-throw the `'not ready'` error:

```javascript
try {
  var items = properties.data_source.get(0, 50);
  renderChart(items);
} catch (err) {
  if (err.message === 'not ready') throw err; // Let Bubble handle it
  console.error('Render error:', err);          // Handle your own errors
  instance.publishState('error_message', err.message);
}
```

- Log errors with `console.error()` and provide enough context to diagnose the issue.
- Where appropriate, expose an error state via `instance.publishState('error_message', e.message)` so Bubble workflows can react.
