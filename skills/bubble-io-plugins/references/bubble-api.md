# Bubble Plugin API Reference

Complete reference for the `instance`, `properties`, and `context` objects available in Bubble plugin code.

---

## Table of Contents

1. [The `instance` Object](#1-the-instance-object)
2. [The `properties` Object](#2-the-properties-object)
3. [The `context` Object](#3-the-context-object)
4. [BubbleThing Interface (v4)](#4-bubblething-interface-v4)
5. [BubbleList Interface (v4)](#5-bubblelist-interface-v4)
6. [Plugin API v4 Migration](#6-plugin-api-v4-migration)
7. [Availability Matrix](#7-availability-matrix)

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

## 6. Plugin API v4 Migration

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

## 7. Availability Matrix

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
