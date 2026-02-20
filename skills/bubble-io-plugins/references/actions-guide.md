# Actions Guide — Client-Side vs Server-Side

This guide covers when and how to use each action type in Bubble plugins.

---

## 1. Client-Side Actions

Run **in the user's browser**. Have access to the DOM, jQuery, and `instance` (for element-bound actions).

### Function signature

```javascript
// Element action (bound to a specific element)
function(instance, properties, context) { }

// Standalone workflow action (not bound to an element)
function(properties, context) { }
```

### When to use

- Page interactions and DOM manipulation
- Sending analytics/tracking events (Facebook Pixel, Google Analytics)
- Tokenizing credit cards (Stripe.js, Braintree)
- Triggering element-specific UI changes
- Reading option sets (not available server-side)

### Option set access (client-side only)

```javascript
var option = properties.my_option_set;
var fields = option.listProperties();  // ['display', 'value', ...]
var label = option.get('display');     // 'My Option Label'
```

### Limitations

- **No access to `context.keys`** for secret API keys — use server-side actions for anything requiring authentication
- Code is visible in the browser — **never put secrets in client-side actions**
- Subject to browser security restrictions (CORS, etc.)

---

## 2. Server-Side Actions (SSA)

Run **on Bubble's Node.js server**. No DOM, no jQuery, no `instance`. Ideal for secure operations.

### Function signature (Plugin API v4)

```javascript
async function(properties, context) {
  // All data access requires await
  var count = await properties.my_list.length();
  return { result_field: 'value' };
}
```

### When to use

- External API calls requiring authentication (`context.keys`)
- Heavy computation (matching algorithms, data processing)
- Operations that need to return data to subsequent workflow steps
- Anything involving secrets, tokens, or private keys
- Database lookups via `context.getThingById()`

### Using Node modules

1. In the Plugin Editor, check **"This action uses node modules"**
2. Paste your `package.json` (only the `dependencies` section is used)
3. Click the build link — Bubble creates a deployment package (may take a few minutes)
4. Use `require()` inside your function:

```javascript
async function(properties, context) {
  var stripe = require('stripe')(context.keys['Stripe Secret Key']);
  var charge = await stripe.charges.create({
    amount: properties.amount,
    currency: 'usd',
    source: properties.token
  });
  return { charge_id: charge.id };
}
```

### Returning data

SSA can return data for subsequent workflow actions. Define return fields in the Plugin Editor, then return an object with matching keys:

```javascript
async function(properties, context) {
  var result = await fetch('https://api.example.com/calc');
  var data = await result.json();
  return {
    total: data.total,
    status: data.status
  };
}
```

### Limitations

- **No DOM, no jQuery, no `instance`** — server environment only
- **Cannot access option sets** — they are a client-side construct
- **Files are base64-encoded** (~1.25x size increase) — avoid passing files >5MB through SSA; use file URLs instead
- **API response size limit:** 50MB per outgoing API call
- **Timeout:** workflows time out after 300 seconds (5 minutes)
- **Auto-retry:** if an API call takes >150 seconds to respond, Bubble may auto-retry it — design idempotent operations

---

## 3. Decision Table — When to Use Which

| Need | Use |
|---|---|
| Access DOM / `instance.canvas` | Client-side |
| Access API secrets (`context.keys`) | Server-side |
| Call external API with authentication | Server-side |
| Trigger analytics / tracking pixel | Client-side |
| Heavy computation or data processing | Server-side |
| Return data for next workflow step | Server-side |
| Read option sets | Client-side |
| Tokenize a credit card (Stripe.js) | Client-side |
| Upload a file to Bubble storage | Client-side (`context.uploadContent`) |
| Look up a thing by ID | Server-side (`context.getThingById`) |

---

## 4. Element Actions vs Workflow Actions

### Element actions

Attached to a specific element instance in the Plugin Editor's "Actions" section. They receive `instance` and can interact with the element's DOM and exposed states.

```javascript
// Reset the element's chart
function(instance, properties, context) {
  if (instance.data.chart) {
    instance.data.chart.destroy();
    instance.data.chart = null;
  }
  instance.publishState('chart_ready', false);
}
```

Local file: `elements/<element-name>/actions/<action-name>.js`

### Workflow actions (standalone)

Added in the Plugin Editor's **Actions** tab (not under an element). They do NOT receive `instance`. They appear as regular workflow actions in any Bubble app using the plugin.

- **Client-side workflow action:** `function(properties, context) { }`
- **Server-side workflow action:** `async function(properties, context) { }`

Local files:
- `actions/client/<action-name>/client.js`
- `actions/server/<action-name>/server.js`
