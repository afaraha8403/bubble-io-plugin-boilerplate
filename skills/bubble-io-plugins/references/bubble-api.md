# Bubble Plugin API Reference

Complete reference for the `instance`, `properties`, and `context` objects available in Bubble plugin code.

---

## Table of Contents

1. [The `instance` Object](#1-the-instance-object)
2. [The `properties` Object](#2-the-properties-object)
3. [The `context` Object](#3-the-context-object)
4. [BubbleThing Interface (v4)](#4-bubblething-interface-v4)
5. [BubbleList Interface (v4)](#5-bubblelist-interface-v4)
6. [Custom Data Types (API Connector)](#6-custom-data-types-api-connector)
7. [Plugin API v4 Migration](#7-plugin-api-v4-migration)
8. [Availability Matrix](#8-availability-matrix)

---

## 1. The `instance` Object

Available in **client-side code only** (initialize, update, preview, element actions). Not available in server-side actions.

### `instance.canvas`

jQuery-wrapped `<div>` — the element's outer container. All visual output must go through this.

```javascript
// jQuery usage
instance.canvas.append('<div class="myPlugin-item"></div>');

// Vanilla DOM access
var rawDiv = instance.canvas[0];
rawDiv.appendChild(document.createElement('span'));
```

### `instance.data`

Persistent storage object. Values set here survive across `update()` calls. Use it to track state, cache data, store references to DOM nodes, and hold helper functions.

```javascript
// initialize.js
instance.data.chart = null;
instance.data.lastRenderedData = null;
instance.data.render = function() { /* ... */ };

// update.js — values from initialize persist
if (instance.data.chart) {
  instance.data.chart.update();
}
```

**Important:** `instance.data` is NOT available in `preview.js`. Preview runs in a separate context.

### `instance.publishState(state_id, value)`

Push a value to a Bubble exposed state. The `state_id` must match a state declared in the Plugin Editor.

```javascript
instance.publishState('selected_item', 'item_123');
instance.publishState('total_count', 42);
instance.publishState('is_loading', false);
```

### `instance.triggerEvent(event_name)`

Fire a custom event that Bubble workflows can listen for. The `event_name` must match an event declared in the Plugin Editor.

```javascript
instance.triggerEvent('item_clicked');
instance.triggerEvent('data_loaded');
```

### `instance.publishAutobinding(value)`

For elements with autobinding enabled. Pushes the bound value back to the data source.

```javascript
instance.publishAutobinding(newValue);
```

### `instance.setHeight(height)`

Programmatically set the element's height in pixels. Useful for responsive elements.

```javascript
instance.setHeight(300);
```

### `instance.isResponsive`

Boolean. `true` if the element is configured as responsive in the Plugin Editor.

```javascript
if (instance.isResponsive) {
  instance.setHeight(properties.bubble.width());
}
```

---

## 2. The `properties` Object

Contains all user-defined field values configured in the Plugin Editor.

### User-defined fields

Each field declared in the Plugin Editor appears as `properties.field_name` (using the field's code-friendly name):

```javascript
var title = properties.title;           // Static Text field
var count = properties.item_count;      // Static Number field
var color = properties.bg_color;        // Color field
var enabled = properties.is_enabled;    // Checkbox field
var source = properties.data_source;    // Dynamic value (list or single)
```

### `properties.bubble`

Bubble-specific metadata. Available in `preview.js` and `update.js`.

```javascript
var h = properties.bubble.height();  // Element height in px
var w = properties.bubble.width();   // Element width in px
```

**Note:** In `preview.js`, these return the editor dimensions. In `update.js`, these return the live runtime dimensions.

### Lists (client-side, pre-v4)

Lists arrive as objects with synchronous-looking methods that internally throw `'not ready'` if data hasn't loaded:

```javascript
var list = properties.data_source;
var count = list.length();              // Number (may throw 'not ready')
var items = list.get(0, 10);            // Array of BubbleThings (may throw)
```

### Lists (server-side, v4)

In Plugin API v4, all list methods return **Promises**:

```javascript
var list = properties.data_source;
var count = await list.length();        // Promise<number>
var items = await list.get(0, 10);      // Promise<BubbleThing[]>

// AsyncIterable support (v4)
for await (const item of list) {
  var name = await item.get('name');
}
```

### Option Sets (client-side only)

Option sets arrive as objects with two methods:

```javascript
var option = properties.my_option;
option.listProperties();               // Returns array of field names
option.get('display');                  // Returns value of 'display' field
```

**Option sets are NOT available in server-side actions.**

---

## 3. The `context` Object

Available in all function types, but with different members depending on client vs server.

### `context.keys`

Object containing API keys defined in the plugin's General Settings ("Additional keys"). Users fill these in the Plugins tab of their app.

```javascript
// Server-side action
var apiKey = context.keys['My API Key'];
```

**Security rule:** Access `context.keys` only in server-side actions. Never expose keys in client-side code.

### `context.currentUser`

The currently logged-in user. Returns a `BubbleThing` object.

```javascript
// v4 server-side
var email = await context.currentUser.get('email');
```

### `context.userTimezone`

String representing the user's timezone (v4 SSA).

### `context.uploadContent(fileName, contents, callback)`

Upload a file to Bubble's storage (client-side).

```javascript
context.uploadContent('report.pdf', pdfBlob, function(err, url) {
  if (!err) {
    instance.publishState('file_url', url);
  }
});
```

### `context.isBubbleThing(x)` / `context.isBubbleList(x)`

Type guard functions (v4). Returns `true` if the value is a BubbleThing or BubbleList.

### `context.getThingById(id)`

Fetch a single database thing by its unique ID (v4 SSA). Returns `Promise<BubbleThing | null>`.

```javascript
var thing = await context.getThingById('1672236233855x229135430406542270');
```

### `context.getThingsById(ids)`

Fetch multiple things by ID array (v4 SSA). Returns `Promise<Array<BubbleThing | null>>`.

### `context.v3.request(options)` (deprecated)

Make HTTP requests from server-side actions. Returns `Promise`. **Prefer `fetch` instead.**

```javascript
// Deprecated pattern
var res = await context.v3.request({ url: 'https://api.example.com', json: true });

// Preferred pattern (v4)
var res = await fetch('https://api.example.com');
var data = await res.json();
```

### `context.v3.async(callback)` (deprecated)

Wrap a callback-based function as a Promise. **Prefer `util.promisify` instead.**

---

## 4. BubbleThing Interface (v4)

A single database record from the Bubble app.

```typescript
interface BubbleThing {
  id: string;                               // Unique ID of this thing
  listProperties(): string[];               // Field names on this thing
  get(propertyName: string): Promise<BubbleValue>;  // Get a field value
  getAll(): Promise<Record<string, BubbleValue>>;   // Get all fields at once
}
```

**Built-in fields on every Thing:** `'Slug'`, `'Created Date'`, `'Modified Date'`.

**User things also have:** `'email'`, `'logged_in'`.

```javascript
var thing = items[0];
var name = await thing.get('name');
var allFields = await thing.getAll();       // { name: '...', age: 25, ... }
var id = thing.id;                          // '1672236233855x...'
var fields = thing.listProperties();        // ['name', 'age', 'Created Date', ...]
```

---

## 5. BubbleList Interface (v4)

A list of things from the database. Data is loaded on demand.

```typescript
interface BubbleList {
  length(): Promise<number>;
  get(start: number, length: number): Promise<BubbleThing[]>;
  [Symbol.asyncIterator](): AsyncIterator<BubbleThing>;
}
```

```javascript
var list = properties.data_source;
var count = await list.length();
var page = await list.get(0, 25);

// Iterate with for-await
for await (const item of list) {
  console.log(await item.get('name'));
}
```

---

## 6. Custom Data Types (API Connector)

When a plugin defines a custom data type via its own API Connector and exposes it through an element or action field of type **App Type**, Bubble wraps the value in a BubbleThing-like structure. It is **not** plain JSON and cannot be used directly as a JavaScript object.

To convert it into a usable object with Bubble-compatible keys, follow a three-step process: **parse**, **flatten**, **prefix**.

### 6.1 When this applies

- The plugin defines a custom data type via its **API Connector** (configured in the Plugin Editor).
- An element or action field is set to type **App Type** referencing that custom type.
- The field value arrives in `properties` as a Bubble-wrapped object, not a plain JS object or JSON string.

This does **not** apply to:
- Native Bubble database Things passed as field values (those follow the standard BubbleThing interface in Section 4).
- Server-side actions — SSA receives plain JSON from API Connector responses directly and does not need this conversion.

### 6.2 The three-step conversion

#### Step 1 — Parse (`parseBubbleObject`)

Recursively convert BubbleThings and BubbleLists into plain JavaScript objects and arrays.

Detection uses **duck-typing** based on method existence and arity:
- **BubbleList:** `obj.length` is a function with arity 0, and `obj.get` is a function with arity 2. Iterated via `obj.get(0, obj.length())`.
- **BubbleThing:** `obj.listProperties` is a function with arity 0, and `obj.get` is a function with arity 1. Iterated via `obj.listProperties()` + `obj.get(key)`.

**Do not modify these detection conditions.** They match Bubble's internal object signatures.

#### Step 2 — Flatten (`flattenJson`)

Convert nested objects into flat objects with dot-notation keys:

```
{ authentication: { api_key: 'sk_123' } }
→ { 'authentication.api_key': 'sk_123' }
```

Arrays are **preserved as arrays** at the current key. Items within arrays are individually flattened.

#### Step 3 — Prefix (`addPrefix`)

Prepend `_p_` to every key. This is required because plugin-defined custom types use the `_p_` namespace in Bubble's data binding system.

```
{ 'authentication.api_key': 'sk_123' }
→ { '_p_authentication.api_key': 'sk_123' }
```

### 6.3 Canonical code

All three utility functions must be defined **inline** inside the function body (per code standards — no top-level function declarations).

```javascript
function(instance, properties, context) {
  // ── Step 0: Load data FIRST, before any DOM work ──────────────
  var appTypeField = properties.my_api_type;

  // ── Utility: Parse Bubble object to plain JS ──────────────────
  var parseBubbleObject = function(obj, currentDepth, maxDepth) {
    if (currentDepth > maxDepth) return obj;
    var clone;

    // Detect BubbleList (array-like): length() arity 0, get() arity 2
    if (
      obj &&
      typeof obj.length === 'function' &&
      obj.length.length === 0 &&
      typeof obj.get === 'function' &&
      obj.get.length === 2
    ) {
      clone = [];
      var items = obj.get(0, obj.length());
      for (var i = 0; i < items.length; i++) {
        clone.push(parseBubbleObject(items[i], currentDepth + 1, maxDepth));
      }
      return clone;
    }

    // Detect BubbleThing (object-like): listProperties() arity 0, get() arity 1
    if (
      obj &&
      typeof obj.listProperties === 'function' &&
      obj.listProperties.length === 0 &&
      typeof obj.get === 'function' &&
      obj.get.length === 1
    ) {
      clone = {};
      var props = obj.listProperties();
      for (var j = 0; j < props.length; j++) {
        clone[props[j]] = parseBubbleObject(obj.get(props[j]), currentDepth + 1, maxDepth);
      }
      return clone;
    }

    return obj;
  };

  // ── Utility: Flatten nested objects to dot-notation keys ──────
  var flattenJson = function(obj) {
    var flattenHelper = function(obj, prefix) {
      prefix = prefix || '';
      var flattened = {};

      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          var newKey = prefix ? prefix + '.' + key : key;
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (Array.isArray(obj[key])) {
              flattened[newKey] = obj[key].map(function(item) {
                return typeof item === 'object' && item !== null
                  ? flattenHelper(item)
                  : item;
              });
            } else {
              var nested = flattenHelper(obj[key], newKey);
              for (var nk in nested) {
                if (Object.prototype.hasOwnProperty.call(nested, nk)) {
                  flattened[nk] = nested[nk];
                }
              }
            }
          } else {
            flattened[newKey] = obj[key];
          }
        }
      }

      return flattened;
    };
    return flattenHelper(obj);
  };

  // ── Utility: Add _p_ prefix to all keys ───────────────────────
  var addPrefix = function(json) {
    var result = {};
    for (var key in json) {
      if (Object.prototype.hasOwnProperty.call(json, key)) {
        var value = json[key];
        if (Array.isArray(value)) {
          result['_p_' + key] = value.map(function(item) {
            return typeof item === 'object' && item !== null
              ? addPrefix(item)
              : item;
          });
        } else if (typeof value === 'object' && value !== null) {
          result['_p_' + key] = addPrefix(value);
        } else {
          result['_p_' + key] = value;
        }
      }
    }
    return result;
  };

  // ── Execute the three-step conversion ─────────────────────────
  var parsed = parseBubbleObject(appTypeField, 0, Infinity);
  var flattened = flattenJson(parsed);
  var prefixed = addPrefix(flattened);

  // ── Publish both states ───────────────────────────────────────
  instance.publishState('formatted_object', prefixed);              // object — for Bubble data binding
  instance.publishState('formatted_object_raw', JSON.stringify(parsed));  // string — for debugging / custom parsing
}
```

### 6.4 Caveats

1. **Client-side only.** This pattern applies to `update.js` and element actions. Server-side actions receive plain JSON from API Connector responses directly.

2. **`'not ready'` applies.** `parseBubbleObject` calls `.get()` and `.length()` on Bubble objects, which may throw `'not ready'`. Follow the standard rule: perform all data access at the **top** of the function, before any DOM mutations.

3. **Duck-typing is fragile.** The BubbleList/BubbleThing detection in `parseBubbleObject` relies on method existence and arity (`function.length`). Do not rename, wrap, or modify these conditions.

4. **Publish both states.** The object state (`formatted_object`) is what Bubble app developers bind to in their workflows. The string state (`formatted_object_raw`) provides the raw parsed data for debugging or custom parsing. Both should be declared as exposed states in the Plugin Editor.

---

## 7. Plugin API v4 Migration

Plugin API v4 migrates from synchronous Fibers to async/await Promises.

### What changed

| Function | v3 (old) | v4 (new) |
|---|---|---|
| Server-side action signature | `function(properties, context)` | `async function(properties, context)` |
| `context.request` | `context.request(opts)` | `await context.v3.request(opts)` or use `fetch` |
| `context.async` | `context.async(cb)` | `await context.v3.async(cb)` or use `util.promisify` |
| `thing.get('field')` | Returns value directly | `await thing.get('field')` — returns Promise |
| `list.get(start, len)` | Returns array directly | `await list.get(start, len)` — returns Promise |
| `list.length()` | Returns number directly | `await list.length()` — returns Promise |

### How to enable v4

Set the Bubble Plugin API Version to **4** in the "Shared" tab → "Dependencies" dropdown of the Plugin Editor.

### v3 to v4 migration example

<bad_pattern>
```javascript
// v3: synchronous-looking (uses Fibers behind the scenes)
function(properties, context) {
  var response = context.request({
    url: 'https://api.example.com/data',
    json: true
  });
  var count = properties.my_list.length();
  return { result: response.body.value, count: count };
}
```
</bad_pattern>

<good_pattern>
```javascript
// v4: explicit async/await
async function(properties, context) {
  var response = await fetch('https://api.example.com/data');
  var data = await response.json();
  var count = await properties.my_list.length();
  return { result: data.value, count: count };
}
```
</good_pattern>

### Client-side code is unaffected

The v4 changes apply **only to server-side actions**. Client-side code (`initialize.js`, `update.js`, `preview.js`, element actions) still uses the synchronous-looking API with Bubble's internal `'not ready'` exception mechanism.

---

## 8. Availability Matrix

What's available where:

| Member | initialize | update | preview | Element Action | Client Action | Server Action |
|---|---|---|---|---|---|---|
| `instance.canvas` | Yes | Yes | Yes | Yes | No | No |
| `instance.data` | Yes | Yes | **No** | Yes | No | No |
| `instance.publishState` | Yes | Yes | No | Yes | No | No |
| `instance.triggerEvent` | Yes | Yes | No | Yes | No | No |
| `instance.setHeight` | Yes | Yes | Yes | No | No | No |
| `properties.*` | No | Yes | Yes | Yes | Yes | Yes |
| `properties.bubble.*` | No | Yes | Yes | No | No | No |
| `context.keys` | Yes | Yes | No | Yes | Yes | Yes |
| `context.currentUser` | Yes | Yes | No | Yes | Yes | Yes |
| `context.uploadContent` | Yes | Yes | No | Yes | Yes | No |
| `context.getThingById` | No | No | No | No | No | Yes (v4) |
| `context.v3.request` | No | No | No | No | No | Yes |
| jQuery (`$`) | Yes | Yes | Yes | Yes | Yes | No |
