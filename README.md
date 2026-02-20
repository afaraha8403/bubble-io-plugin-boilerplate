# Bubble.io Plugin Boilerplate with ESLint & AI Agent Skills

This boilerplate provides a structured and modern starting point for developing plugins for Bubble.io. It comes pre-configured with ESLint for reliable code linting and formatting.

Most importantly, this boilerplate utilizes **AI Coding Agent Skills** (`bubble-io-plugins`), providing your AI development agent with built-in access to Bubble's specific coding standards, platform rules, API references, and boilerplate templates.

## Features

- **Standard Project Structure:** A clean, organized folder structure that clearly maps your local code to the Bubble Plugin Editor text fields (elements, actions, and client/server execution).
- **ESLint Integration:** Pre-configured with a modern flat config (`eslint.config.mjs`) including Bubble-specific global variables (`instance`, `properties`, `context`) to prevent false positives and enforce best practices.
- **VS Code Ready:** Includes settings to automatically format and fix linting errors upon save using the official ESLint extension.
- **AI-Assisted Development with Agent Skills:** Includes the `bubble-io-plugins` skill which gives AI tools deep context on the Bubble platform architecture.
- **Starter Templates:** Quickstart boilerplate files provided for runtime elements (`initialize.js`, `update.js`, `preview.js`, `header.html`) and client/server actions.

## Getting Started

Follow these steps to get your development environment up and running.

### Prerequisites

- **Node.js and npm:** Make sure you have Node.js and npm installed on your system.
- **Visual Studio Code:** This boilerplate is optimized for use with VS Code.
- **AI Coding Agent:** Use an AI coding assistant capable of reading project skills (e.g. Opencode, Cline, Cursor, etc.).

### Installation

1.  **Download or Clone:** Get a copy of this boilerplate on your local machine.
2.  **Install VS Code Extension:** In VS Code, navigate to the **Extensions** tab and install the official **ESLint** extension (`dbaeumer.vscode-eslint`).
3.  **Run Setup Script:** Open a terminal in VS Code and run the following command to install ESLint and the necessary packages.
    ```bash
    npm run setup:eslint
    ```
4.  **Restart VS Code:** Reload the VS Code window to ensure the ESLint server starts and applies your workspace settings.

## AI-Assisted Development with Agent Skills

The true power of this boilerplate lies in its inclusion of the `bubble-io-plugins` skill. 

When you ask an AI development agent to help you build or modify your plugin, it will automatically load the specific rules, API references, or templates required for that task.

### How it Works

The skill is located in the `skills/bubble-io-plugins` directory and contains:
*   **Platform Rules (`bubble-platform.md`):** Instructions on element lifecycle, DOM mutations, data loading patterns, and Bubble's hard limits.
*   **API Reference (`bubble-api.md`):** Deep dives into Bubble-specific types (`BubbleThing`, `BubbleList`) and properties (`instance`, `context`).
*   **Action Guide (`actions-guide.md`):** Best practices for Server-Side Actions (SSA) vs Client-Side actions, including async/await standards for Plugin API v4.
*   **Templates (`assets/templates/`):** A library of starting structures for your javascript and HTML files.

Whenever you prompt your agent, it intelligently references these guides. For example, if you ask it to "create a new visual element," the agent will pull from the corresponding setup files and the `bubble-platform.md` reference to ensure the code relies correctly on `instance.canvas` instead of `document.body`.

## Project Structure

```text
    📁project-root
        ├── 📁actions              # Action files
        │   ├── 📁client           # Client-side workflows
        │   └── 📁server           # Server-side actions
        ├── 📁elements             # Visual UI elements
        │   ├── 📁example-1
        │   └── 📁example-2
        ├── 📁skills               # AI Agent Skills
        │   └── 📁bubble-io-plugins
        ├── .vscode                # VS Code workspace settings
        │   └── settings.json
        ├── eslint.config.mjs      # ESLint configuration
        ├── package.json           # Scripts and dependencies
        └── README.md
```

### Note on Deployment
There is no build step or package publishing required. Code written in this boilerplate is meant to be directly copied into the corresponding function fields in the Bubble Plugin Editor.

## License

This boilerplate is licensed under the MIT License.
