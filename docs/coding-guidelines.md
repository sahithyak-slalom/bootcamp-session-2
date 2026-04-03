# Coding Guidelines

## Overview

This document describes the coding style and quality principles for the To Do App. It is written as a narrative guide so contributors understand not just the rules, but the reasoning behind them. All code contributions — whether to the backend, frontend, or tests — should reflect these principles.

---

## General Philosophy

The codebase values **clarity over cleverness**. Code is read far more often than it is written, so the goal is always to make the next developer's job easier. Avoid unnecessary abstraction, premature optimization, and over-engineering. Solve the problem at hand cleanly, then stop.

Every change should leave the code in a better state than it was found, but only within the scope of the task. Do not refactor unrelated code in the same commit.

---

## Project Structure

The project is organized as a monorepo using npm workspaces. The two packages — `packages/frontend` and `packages/backend` — are completely independent of each other at the code level and communicate only through the REST API. Keep this boundary clean: do not import backend modules into the frontend or vice versa.

```
packages/
  frontend/   ← React app (Create React App)
  backend/    ← Express API server
tests/
  e2e/        ← Playwright end-to-end tests
docs/         ← Project documentation
```

Place new source files in the correct package. Shared utilities are not currently needed; if one becomes necessary, discuss before creating a new shared package.

---

## Backend (Node.js / Express)

### Module Style

The backend uses CommonJS modules (`require` / `module.exports`). Do not mix in ES module syntax (`import` / `export`). Keep this consistent throughout `packages/backend/`.

### Express App Structure

The Express app is defined and configured in `src/app.js` and started in `src/index.js`. This separation allows tests to import and exercise the app without binding to a port. Maintain this pattern: `app.js` exports `{ app, db }`, and `index.js` is the only place that calls `app.listen`.

### Middleware

Global middleware (CORS, JSON body parsing, request logging via Morgan) is registered at the top of `app.js` before any routes. Do not register middleware inside route handlers or conditionally based on route.

### Route Handlers

Each route handler follows a consistent pattern:

1. Extract and validate inputs from `req.params`, `req.body`, or `req.query`.
2. Return early with an appropriate error response (`400`, `404`) if validation fails.
3. Execute the database operation inside a `try/catch` block.
4. Return the result with the correct HTTP status code.
5. Log unexpected errors with `console.error` and return a `500` response.

Keep route handlers focused. If business logic grows complex, extract it into a separate function rather than embedding it inline.

### Input Validation

Validate all user-supplied input at the route boundary before touching the database. For string fields, check that the value is present, is of type `string`, and is not empty after trimming. For numeric IDs from URL params, verify they parse as a valid integer before use. Never pass unvalidated input to a SQL statement.

### Database Access

The project uses `better-sqlite3` with an in-memory SQLite database. Database statements should be prepared once and reused where possible (see the `insertStmt` pattern in `app.js`). Always use parameterized queries — never concatenate user input into SQL strings. The database is reset on every server restart; do not design features that depend on data persisting across restarts.

### Error Responses

Error responses must be JSON objects with an `error` key describing the problem (e.g., `{ "error": "Item name is required" }`). Success responses should include only the data the client needs. Do not expose internal error details or stack traces in responses.

---

## Frontend (React)

### Module Style

The frontend uses ES modules (`import` / `export`), consistent with Create React App conventions. Do not use `require` in frontend source files.

### Component Style

Components are written as **function components** using React hooks. Do not introduce class components. Keep components focused on a single responsibility; if a component grows large, consider splitting it.

### State Management

Local component state is managed with `useState`. Side effects (data fetching on mount) use `useEffect` with an empty dependency array (`[]`). The current architecture manages all state in the top-level `App` component and passes data down as props. Follow this pattern for new features unless the complexity clearly justifies a different approach.

### Data Fetching

API calls use the native `fetch` API. All fetch calls must:

- Be wrapped in `async` functions with `try/catch` error handling.
- Set a loading state before the request and clear it in a `finally` block.
- Update an error state on failure and clear it on success.
- Never leave the UI in an indeterminate state — always handle both success and error paths.

The frontend proxies API requests to the backend via the `"proxy"` setting in `package.json`. Use relative API paths (e.g., `/api/items`) rather than hardcoded `localhost` URLs.

### Event Handlers

Name event handlers with the `handle` prefix followed by the event or action (e.g., `handleSubmit`, `handleDelete`). Prevent default form behavior explicitly with `e.preventDefault()` where forms are involved. Guard against empty or whitespace-only inputs on the client side before sending requests.

### JSX and Rendering

- Use `key` props on all items rendered in a list; use the item's stable `id` field, not the array index.
- Render conditional UI (loading state, error message, empty state) close to the relevant section rather than at the top level.
- Keep JSX readable: if a block becomes deeply nested or complex, extract it into a well-named variable or sub-component.

### Styling

Use CSS classes defined in `App.css` rather than inline styles. Do not introduce CSS-in-JS libraries or utility-class frameworks without team agreement. Follow the color and layout conventions described in [UI Guidelines](ui-guidelines.md).

---

## Naming Conventions

| Context | Convention | Example |
|---|---|---|
| JS variables and functions | camelCase | `fetchData`, `newItem`, `handleDelete` |
| React components | PascalCase | `App`, `TodoItem` |
| CSS class names | kebab-case | `add-item-section`, `delete-btn` |
| Test description strings | Plain English sentence | `"should return 400 if name is missing"` |
| Test files | Match source file name | `app.test.js` for `app.js` |
| E2E spec files | User journey name | `todo-workflow.spec.js` |

---

## Formatting

Consistent formatting reduces cognitive overhead when reading diffs and switching between files. The project does not currently enforce formatting via a tool like Prettier, so contributors should follow these rules manually:

- Use **2-space indentation** throughout — both JavaScript and CSS files.
- Use **single quotes** for strings in JavaScript (`'value'`), except in JSX attribute values where double quotes are conventional (`className="App"`).
- Always include a **semicolon** at the end of statements.
- Keep lines to a **reasonable length** (aim for 100 characters or fewer). Break long expressions — especially JSX props or chained method calls — across multiple lines for readability.
- Place a **blank line between logical blocks** inside functions (e.g., between variable declarations, the fetch call, and the return statement). Do not add blank lines between every single statement.
- End every file with a **single trailing newline**.

---

## Import Organization

Imports at the top of a file should be grouped and ordered consistently:

1. **External packages** (e.g., `react`, `express`, `better-sqlite3`)
2. **Internal modules** (relative imports from the same package, e.g., `./App.css`, `../src/app`)

Leave a blank line between groups. Within each group, order imports alphabetically by package/path name. Do not leave unused imports in the file.

**Backend example:**
```js
// 1. External packages
const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const Database = require('better-sqlite3');

// 2. Internal modules
const { config } = require('./config');
```

**Frontend example:**
```js
// 1. External packages
import React, { useState, useEffect } from 'react';

// 2. Internal modules
import './App.css';
```

---

## Linter

The project uses **ESLint** for static analysis:

- The frontend (`packages/frontend`) inherits ESLint configuration from Create React App via `"eslintConfig": { "extends": ["react-app", "react-app/jest"] }` in its `package.json`. This configuration is enforced automatically during `react-scripts build` and surfaces warnings during `react-scripts test`.
- The backend does not currently have a dedicated ESLint config but should be treated as if the default Node.js ESLint rules apply.

**Rules to follow:**
- Do not disable ESLint rules with `// eslint-disable` comments unless absolutely necessary, and always add a comment explaining why.
- Fix linter warnings before committing — do not let warnings accumulate. A warning today becomes a buried defect tomorrow.
- Treat `no-unused-vars` and `no-undef` violations as errors; they almost always indicate a real problem.

---

## Code Quality

### DRY (Don't Repeat Yourself)

If the same logic appears in more than one place, extract it. Common patterns to watch for:

- **Repeated fetch boilerplate**: If multiple components or handlers share the same request/error/loading pattern, extract a shared helper or custom hook.
- **Duplicate validation logic**: If the same input check (e.g., "name must not be empty") is needed in more than one route, extract it into a named validation function.
- **Copy-pasted test setup**: Shared test fixtures or helper functions (e.g., `createItem`) should be defined once and imported, not duplicated across test files.

Apply DRY judiciously — extracting a helper is only worthwhile if the duplication is real and the abstraction makes intent clearer. Don't over-abstract for the sake of removing a two-line pattern that appears twice.

### Keep Functions Small

Functions and route handlers should do one thing. If a function needs several paragraphs of comments to explain what it does, it is probably doing too much. Extract logical sub-steps into well-named helpers.

### Avoid Magic Values

Avoid unexplained numeric literals or hardcoded strings scattered through the code. If a value has meaning (e.g., a port number, a status code string, a seed item name), either give it a named constant or make its purpose obvious from the surrounding context.

### Console Logging

Use `console.error` for unexpected errors in both the frontend and backend. Do not leave `console.log` debug statements in committed code. Morgan handles HTTP request logging on the backend automatically.

### No Dead Code

Do not commit commented-out code, unused imports, or unreachable branches. If code is being preserved for reference, use a code comment explaining why; otherwise delete it.

---

## Dependencies

- Do not add new `npm` dependencies without a clear reason. Each dependency increases the attack surface and maintenance burden.
- Prefer packages that are already in use (e.g., `supertest`, `msw`) before introducing new ones for similar purposes.
- Add runtime dependencies to the relevant package's `dependencies`; add test/build-only tools to `devDependencies`.
- Run `npm install` from the repo root to ensure all workspaces are in sync after updating `package.json`.

---

## Security

- Never trust user input. Validate and sanitize all data at the point it enters the system (API route handlers).
- Use parameterized queries for all database operations — never interpolate user-supplied values into SQL strings directly.
- Do not log or return sensitive information in error messages or API responses.
- Keep dependencies up to date and review changelogs when upgrading, especially for packages handling HTTP or data parsing.
