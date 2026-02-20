# Bubble.io Platform Rules

These rules govern how code interacts with the Bubble.io runtime. They apply whenever you write or review `initialize.js`, `update.js`, `preview.js`, `header.html`, or any element/action code.

---

## 1. Naming and Metadata

- **Plugin public name and description** must be unique, intuitive, and clearly outline any prerequisites (e.g., required API keys, Bubble plan level).
- **Element names** must be consistent and predictable across the project. Use the same naming convention for all elements.

---

## 2. Element Lifecycle

Bubble elements have a strict lifecycle. Understand it before writing any code.

| Phase | File | Runs | Arguments |
|---|---|---|---|
| Initialize | `initialize.js` | **Once**, when element first loads | `instance`, `context` |
| Update | `update.js` | **Every time** a property changes **or data finishes loading** | `instance`, `properties`, `context` |
| Preview | `preview.js` | In the **Bubble Editor only** | `instance`, `properties` |

### Rules

- **initialize.js** is for one-time setup: create DOM nodes, attach event listeners, initialize `instance.data`.
- **update.js** must be **idempotent**. It will be called many times. Never assume it runs only once.
- **update.js re-runs** not only when properties change, but also when **any data requested by the function finishes loading** from the server. This is part of Bubble's internal suspension mechanism (see Section 4).
- There is **no destroy hook**. Clean up resources (timers, listeners) manually before re-attaching.

### Positive example — initialize.js

```javascript
// Set up data store and create root DOM node once.
instance.data.isReady = false;
instance.data.container = $('<div class="myPlugin-root"></div>');
instance.canvas.append(instance.data.container);
```

### Negative example — initialize.js

```javascript
// WRONG: Rendering logic does not belong in initialize.
// It will not re-run when properties change.
instance.canvas.append('<div>' + properties.title + '</div>');
```

---

## 3. DOM and Canvas

All visual output must go through `instance.canvas`.

- **Append to `instance.canvas`** (jQuery object) or `instance.canvas[0]` (vanilla DOM).
- **Never append to `document.body`** unless building a fixed-position overlay (modal, tooltip). Even then, clean it up.
- **CSS class prefixing is mandatory.** Use a project-specific prefix on every class name to avoid collisions with the host Bubble app's styles.

<good_pattern>
```javascript
instance.canvas.append('<div class="acmeChart-wrapper"></div>');
```
</good_pattern>

<bad_pattern>
```javascript
// Collides with any app that also has a class called "wrapper".
instance.canvas.append('<div class="wrapper"></div>');
```
</bad_pattern>

---

## 4. Data Loading (Bubble Lists)

Bubble passes data to plugins as "lists" that may not be fully loaded yet. Rather than using callbacks, Bubble uses a **thrown exception as control flow** to pause and re-run your function.

### How it works internally

1. Your code calls `properties.my_list.get(0, 10)`.
2. If the data hasn't arrived from the server yet, Bubble **throws a special error** (message: `'not ready'`) that terminates your function immediately.
3. Bubble kicks off an async fetch in the background.
4. Once the data arrives, Bubble **re-runs your entire function from the top**.
5. This time the data is available, and execution continues past the `.get()` call.

### Critical rules

1. **Load all data at the top of the function**, before any DOM mutations or side effects. If data isn't ready, your function will be terminated and re-run. You don't want partial DOM updates.

2. **Do NOT catch the `'not ready'` exception.** Wrapping Bubble data access in a `try/catch` silently swallows the suspension mechanism and the element renders with incomplete data.

3. **If you must use try/catch**, re-throw the `'not ready'` error:

```javascript
try {
  var items = properties.data_source;
  var slice = items.get(0, items.length());
  renderChart(slice);
} catch (err) {
  if (err.message === 'not ready') throw err; // Re-throw Bubble's error
  console.error('Render error:', err);         // Handle your own errors
}
```

4. **Do NOT use async callbacks** inside plugin functions. Code inside `$(document).ready()`, `setTimeout(fn, 0)`, or similar wrappers will break Bubble's dependency detection — it won't know your function needs data.

5. **Fetch partial data.** Use `list.get(startIndex, length)` to fetch only the slice you need. Never call `.get(0, list.length())` on a large dataset without capping it.

<good_pattern>
```javascript
// Load data FIRST — before any DOM work.
var items = properties.data_source;
var count = items.length();
var slice = items.get(0, Math.min(count, 50));

// Now safe to modify DOM and try/catch your own logic.
try {
  renderChart(slice);
} catch (e) {
  console.error('Render error:', e);
}
```
</good_pattern>

<bad_pattern>
```javascript
// WRONG: DOM mutation happens before all data is loaded.
instance.data.container.empty(); // This runs on EVERY re-execution!
var items = properties.data_source;
var slice = items.get(0, items.length()); // May throw 'not ready' here
renderChart(slice); // Never reached on first run, DOM already cleared
```
</bad_pattern>

---

## 5. Asynchronous External Libraries

When your element depends on an external library (loaded via `header.html`), the library may not be ready when `update.js` first runs.

### Pattern: Ready-flag with explicit re-render

1. In `initialize.js`, set `instance.data.isReady = false`.
2. In `update.js`, guard with `if (!instance.data.isReady) return;`.
3. In the library's load callback, set `instance.data.isReady = true` **and** explicitly call your render function or trigger a Bubble event.

**Critical:** Setting the flag alone does NOT cause `update.js` to re-run. You must explicitly invoke rendering.

```javascript
// header.html — load library idempotently
if (!window.ChartJS) {
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/chart.js';
  s.onload = function () { window.ChartJS = true; };
  document.head.appendChild(s);
}
```

```javascript
// initialize.js
instance.data.isReady = false;
instance.data.render = function () { /* rendering logic */ };
```

```javascript
// update.js
if (!instance.data.isReady) {
  if (window.ChartJS) {
    instance.data.isReady = true;
  } else {
    return; // Library not loaded yet; exit silently.
  }
}
instance.data.render();
```

---

## 6. Header Content

Headers inject content into the `<head>` of the page. There are two types with different scopes.

### Element Header (`elements/<name>/header.html`)

Injected **only on pages that use this specific element**. Use for:
- Element-specific CDN libraries
- Element-specific CSS (wrapped in `<style>` tags)
- Scripts that only this element needs

### Shared Plugin Header (root `header.html`)

Injected on **ALL pages** of any app using the plugin, even pages that don't use any element from it. Use for:
- Analytics snippets (Google Analytics, Facebook Pixel)
- Truly global dependencies shared by multiple elements
- Dynamic keys: use `_*_KEY_NAME_*_` syntax — Bubble replaces this at runtime with the value the user enters in the Plugins tab

```html
<!-- Shared header with dynamic key -->
<script>
  (function() {
    var key = '_*_TRACKING_ID_*_';
    // Analytics initialization using the key...
  })();
</script>
```

### Rules for both header types

1. **Idempotency is mandatory.** Bubble may re-execute headers multiple times. Before injecting a `<script>` tag, check if the library already exists on `window`.
2. **Valid tags:** only `<script>`, `<meta>`, and `<link>`. Any other HTML (e.g., `<div>`, `<style>` outside of script) will be auto-moved to `<body>` by the browser's HTML parser.
3. **Use `async` or `defer`** on script tags to avoid blocking page load.
4. **Prefer Element Header** over Shared Header. Only use Shared Header for truly global dependencies.

```html
<!-- CORRECT: Idempotent script injection in Element Header -->
<script>
if (!window.MyLib) {
  var s = document.createElement('script');
  s.src = 'https://cdn.example.com/mylib.min.js';
  s.async = true;
  document.head.appendChild(s);
}
</script>
```

---

## 7. Event Handling

- **Namespace all DOM events** using the pattern `eventName.pluginPrefix_${instanceId}`.
- **Remove previous listeners** before attaching new ones to prevent duplicates on re-render.

```javascript
// Clean up then re-attach.
var ns = '.acmeChart_' + instance.data.uniqueId;
instance.canvas.off('click' + ns);
instance.canvas.on('click' + ns, '.acmeChart-bar', handleBarClick);
```

---

## 8. Preview Mode

`preview.js` renders a static visual in the Bubble Editor's design canvas so the user can see the element while editing.

### What's available

- `instance.canvas` — the editor canvas (jQuery)
- `instance.isResponsive` — boolean
- `instance.setHeight(px)` — set element height
- `properties.bubble.height()` — element height in the editor (returns number)
- `properties.bubble.width()` — element width in the editor (returns number)

### What's NOT available

- `instance.data` — does not exist in preview context
- `context` — not passed to preview
- External libraries — do not load CDNs in preview

### Rules

- Keep it simple — a placeholder image or styled div.
- Do NOT call external APIs or load heavy libraries.
- Size the placeholder to match `properties.bubble.height()` and `properties.bubble.width()`.

### Working example

```javascript
var box = $('<div style="text-align: center; display: flex; align-items: center; justify-content: center;"></div>');
instance.canvas.append(box);
box.css('height', properties.bubble.height() + 'px');
box.css('width', properties.bubble.width() + 'px');
box.css('background-color', '#f0f0f0');
box.css('border', '1px dashed #ccc');
box.text('My Plugin Element');

if (instance.isResponsive) {
  instance.setHeight(properties.bubble.width());
}
```

---

## 9. Function Wrapper Rule (Deployment)

Local files contain a `function(instance, properties, context) { ... }` wrapper for IDE support (autocomplete, linting). **When pasting code into the Bubble Plugin Editor, copy only the function body** — Bubble provides its own wrapper.

The only exception: if you are replacing the entire text area contents including the function signature (rare).

---

## 10. Exposed States and Events

- Use `instance.publishState('state_name', value)` to push data from the plugin to the Bubble app.
- Use `instance.triggerEvent('event_name')` to fire events that Bubble workflows can listen for.
- Both of these are the **only** ways to communicate outward from a plugin element.
- **Initialize states early.** Bubble runs initialization code that evaluates all dynamic properties. If a conditional property depends on the element's own state, it creates a circular dependency. Avoid this by initializing states in `initialize.js`:

```javascript
// initialize.js — set default state values to avoid circular deps
instance.publishState('selected_id', null);
instance.publishState('is_loading', false);
```

---

## 11. Testing and Debugging

Testing is performed in the **Bubble Plugin Editor** using a test app. There is no local test harness.

### Testing workflow

1. In the Plugin Editor, assign a test app (or create one).
2. Click **"Go to test app"** — this refreshes the test app with the latest plugin code.
3. Test in **edit mode** (to verify preview rendering and Property Editor fields).
4. Test in **run mode** (to verify live data, events, and interactions).

### Debugging tools

**`debugger` statement:** Insert in your code. When browser DevTools are open, execution pauses at that line.

```javascript
// update.js — temporary debugging
debugger; // Remove before publishing!
var items = properties.data_source;
```

**Disable minification:** In the test app URL, append `?bubble_debug_mode=true` to disable code minification. This makes stack traces readable and lets you step through your actual code in DevTools.

**Console logging:** Log the runtime objects to inspect their shape:

```javascript
// Temporary — remove before publishing
console.log('update called', {
  instance: instance,
  properties: properties,
  context: context
});
```

**Bubble Debugger:** Use the built-in Bubble debugger (Ctrl+Shift+B in the test app) to step through workflows and see which events fire.

---

## 12. Hard Limits for Plugin Developers

These are Bubble system limits that directly affect plugin behavior:

| Limit | Value | Impact |
|---|---|---|
| Workflow timeout | 300 seconds (5 min) | SSA must complete within this window |
| API response size | 50 MB | Outgoing API calls from plugins cannot exceed this |
| API call auto-retry | >150 seconds | If an API call takes longer, Bubble may auto-retry — design idempotent operations |
| Elements + events + actions per page | 10,000 combined | Plugin elements count toward this |
| List storage on a single thing | 10,000 records | Prefer `Do a search for` over stored lists |
| Text field size | 10 million characters | Per field in the database |
| SSA file input encoding | ~1.25x size (base64) | Avoid files >5MB; use file URLs instead |
