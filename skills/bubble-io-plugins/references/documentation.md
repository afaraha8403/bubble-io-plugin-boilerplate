# Documentation Standards

These rules apply when writing or reviewing any documentation: JSDoc comments, setup files, README, CHANGELOG, marketplace descriptions, or field tooltips.

---

## 1. Code Documentation (JSDoc)

### Placement

JSDoc comments go **inside** the function wrapper, not above it. The wrapper itself is a Bubble convention — placing JSDoc outside it would be lost when copying the function body to the Bubble Editor.

### What to document

| Element | Requirement |
|---|---|
| Helper functions | Purpose and expected behavior. |
| Parameters | `@param {type} name - description`. For Bubble properties, describe the expected structure explicitly (e.g., `@param {object} properties - Requires 'data_source' (list of Contacts)`). |
| Return values | `@returns {type} description` for any function that returns data. |
| Complex logic | Inline comment explaining **why** the logic exists, not just what it does. Required for: nested loops, complex regex, manual DOM calculations, workarounds for Bubble quirks. |

### Example

```javascript
function(instance, properties, context) {
  /**
   * Formats a Bubble date into a short locale string.
   * Bubble dates arrive as ISO strings but may be null if the field is empty.
   * @param {string|null} isoDate - ISO 8601 date string from Bubble
   * @returns {string} Formatted date or empty string
   */
  function formatDate(isoDate) {
    if (!isoDate) return '';
    return new Date(isoDate).toLocaleDateString();
  }
}
```

---

## 2. Setup Files (element-setup.md, action-setup.md)

Every element and action directory must contain a setup file that serves as the bridge between the local codebase and the Bubble Plugin Editor.

### Root-level plugin-setup.md

If the project contains a `plugin-setup.md` in the root, it serves as the high-level architectural overview. It should document:

- Global API keys strategy (which keys, how they are accessed via `context.keys`).
- Shared library dependencies (what is loaded in Shared Header and why).
- A list of all Elements and Actions contained in the repo.

### Source of truth principle

- **Bubble Plugin Editor** is the source of truth for the *existence* of fields, IDs, and configuration checkboxes.
- **Local repository** is the source of truth for *code logic* and *architectural reasoning*.
- **Do not** duplicate every Bubble Editor field verbatim into markdown. This creates maintenance drift. Document only what is needed for a developer to understand and deploy the component.

### Required content

#### Build Map

A table mapping local files to Bubble Editor targets. Use this exact format:

```markdown
| Local File | Bubble Editor Target | Notes |
|---|---|---|
| initialize.js | Function: initialize | Setup DOM, event listeners. |
| update.js | Function: update | Handle data changes, rendering. |
| preview.js | Function: preview | Bubble Editor canvas placeholder. |
| header.html | Header: Element Header | CDN links. Wrap CSS in <style> tags. |
| styles.css | Header: Shared Header / Element Header | Wrap in <style> tags before pasting. |
```

#### Element Configuration

Document using a **nested list** (not tables) in this fixed order:

1. **Fields** — For each field:
   - Name (code ID)
   - Caption (UI label)
   - Type (text, number, boolean, etc.)
   - Is a list (yes/no)
   - Default value
   - Supported values or options (what the field accepts)

2. **Exposed States** — Name, caption, type, format of returned data.

3. **Events** — Name, caption, when it triggers.

4. **Actions** — Name, description, and parameters (using the same field structure above).

#### Non-obvious configurations

Document *only* things that are not self-evident. Example: "We use the ID `result_box` because ChartJS requires a strict ID selector, not a class."

For Events and Exposed States, you only need detailed documentation in the setup file if they trigger complex internal logic in `update.js`. Simple pass-through states (e.g., exposing a text value directly from a property) do not require extended explanation.

---

## 3. End-User Documentation

End-user docs target Bubble app developers who install the plugin. They go into the Bubble Marketplace listing and field tooltips.

### Marketplace description

1. **Headline:** One concise sentence stating what the plugin does.
2. **Gap:** Two blank lines after the headline.
3. **Details:** Features, benefits, and use cases.

### Field tooltips

- **Every field** in the Bubble Editor must have a tooltip.
- Explain **what the field controls**, not just its data type.
- Avoid technical jargon. Write for someone who may not know JavaScript.
- Include input format when relevant (e.g., "Enter your API key (starts with 'sk_')").

### Error documentation

- Document every exposed "Error" state the plugin publishes.
- Document every event that fires on failure, with enough context for the user to build a workflow around it (e.g., "The 'Payment Failed' event fires when the charge is declined. Use it to show an error message to your app user.").

---

## 4. Changelog

- **File:** `CHANGELOG.md` in the project root.
- **Format:** [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) conventions.
- **Granularity:** Focus on logic and behavior changes (e.g., "Fixed memory leak in update function when data source changes rapidly"). Skip trivial config changes (e.g., "Changed field label from 'Input' to 'Text Input'").

---

## 5. README

The root `README.md` is the entry point for developers cloning this boilerplate. It should contain:

1. One-line project description.
2. Setup instructions (prerequisites, `npm install`, ESLint setup).
3. How to create a new element or action (link to workflow docs if applicable).
4. How to deploy to the Bubble Plugin Editor (copy/paste process).
5. How to test using the Bubble Plugin Editor test app workflow.

---

## 6. Publishing and Versioning

### Deploying

When deploying via the Plugin Editor's **Settings** tab:

1. Select a **change type**: major (breaking), minor (new feature), or patch (bug fix).
2. Write a **caption** describing the change — this is shown to users when they are prompted to upgrade.
3. Click deploy — Bubble generates a version number and notifies installed users.

### License

- **MIT (open source):** Plugin is free on the marketplace, code is visible and copyable. **Once published as open source, this cannot be reverted to private.**
- **Private:** Plugin can be paid or restricted. You must explicitly authorize specific apps to access it.

### Post-deploy considerations

- Monitor reviews and bug reports after publishing.
- Changing API call return types after publishing can be a **non-backward-compatible** change — document it as a breaking change.
- When cloning an app that has access to a private plugin, Bubble does not remove the plugin from the clone.
