# Testing Guidelines

## Overview

This document defines testing standards for the To Do App. All test contributions must follow these guidelines to ensure consistent, reliable, and maintainable test coverage across the monorepo.

---

## Test Types Summary

| Type | Framework | Location | File Pattern | Run Command |
|---|---|---|---|---|
| Unit (backend) | Jest | `packages/backend/__tests__/` | `*.test.js` | `npm run test:backend` |
| Unit (frontend) | Jest + React Testing Library | `packages/frontend/src/__tests__/` | `*.test.js` | `npm run test:frontend` |
| Integration | Jest + Supertest | `packages/backend/__tests__/integration/` | `*.test.js` | `npm run test:integration` |
| E2E | Playwright | `tests/e2e/` | `*.spec.js` | `npm run test:e2e` |
| All | — | — | — | `npm run test:all` |

---

## Port Configuration

| Service | Port | Configured In |
|---|---|---|
| Backend (Express) | `3030` (default, overridden by `PORT` env var) | `packages/backend/src/index.js` |
| Frontend (React dev server) | `3000` (Create React App default) | `react-scripts start` |
| Frontend proxy (API calls) | Proxied to `http://localhost:3030` | `packages/frontend/package.json` → `"proxy"` |

- When running E2E tests, both the frontend (`3000`) and backend (`3030`) servers must be running.
- Integration tests interact with the Express app directly via Supertest and do **not** require the server to be listening on a port.
- Unit tests do not require any running services.

---

## Unit Tests

### Backend Unit Tests

- **Framework**: Jest
- **Location**: `packages/backend/__tests__/`
- **File pattern**: `*.test.js` (exclude files inside `integration/` subdirectory)
- **File naming**: Match the source file being tested (e.g., `app.test.js` tests `src/app.js`)
- **Run**: `npm run test:backend` (from repo root) or `jest --detectOpenHandles` (from `packages/backend/`)

**Guidelines:**
- Import and test the Express `app` and `db` exports from `src/app.js` directly; do not start a real HTTP server.
- Close the database connection in `afterAll` to prevent open handle warnings:
  ```js
  afterAll(() => { if (db) db.close(); });
  ```
- Use `supertest` to make HTTP assertions against the app object directly.
- Reset or re-seed any test data within each test or using `beforeEach`/`afterEach` hooks to keep tests independent.
- Cover happy paths, validation errors (400), not-found errors (404), and edge cases.

### Frontend Unit Tests

- **Framework**: Jest + React Testing Library + Mock Service Worker (MSW)
- **Location**: `packages/frontend/src/__tests__/`
- **File pattern**: `*.test.js`
- **File naming**: Match the component or module being tested (e.g., `App.test.js` for `App.js`)
- **Run**: `npm run test:frontend` (from repo root)

**Guidelines:**
- Use `@testing-library/react` (`render`, `screen`, `waitFor`) for rendering and querying components.
- Use `@testing-library/user-event` for simulating user interactions (typing, clicking).
- Use MSW (`msw/node` + `setupServer`) to intercept and mock all API calls. Do not make real network requests in unit tests.
- Follow the MSW lifecycle pattern in every test file:
  ```js
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  ```
- Use `act` from React when triggering state changes or async effects.
- Query elements by accessible roles or text (`getByRole`, `getByText`) rather than by CSS classes or IDs.
- Do not test implementation details (internal state, private functions); test observable UI behavior.

---

## Integration Tests

- **Framework**: Jest + Supertest
- **Location**: `packages/backend/__tests__/integration/`
- **File pattern**: `*.test.js`
- **File naming**: Name by the API resource or workflow being tested (e.g., `items-api.test.js`)
- **Run**: `npm run test:integration` (from repo root)

**Guidelines:**
- Use `supertest` with the real Express app to send HTTP requests and assert on responses.
- Do **not** mock the database; use the real in-memory SQLite database to verify end-to-end data flows within the backend.
- Close the database connection in `afterAll`:
  ```js
  afterAll(() => { if (db) db.close(); });
  ```
- Use a helper function (`createItem`, etc.) to set up prerequisite data rather than hard-coding IDs.
- Each test should be self-contained: create any data it needs and clean up or rely on the in-memory DB resetting between runs.
- Assert on HTTP status codes, response body shape, and data correctness.
- Cover all API endpoints defined in `packages/backend/src/app.js`.

---

## End-to-End (E2E) Tests

- **Framework**: Playwright
- **Location**: `tests/e2e/`
- **File pattern**: `*.spec.js`
- **File naming**: Name by the user journey being tested (e.g., `todo-workflow.spec.js`)
- **Run**: `npm run test:e2e` (from repo root)
- **Install browsers**: `npm run test:e2e:install` (first-time setup; installs Chromium)

**Guidelines:**
- Use **Playwright only**; do not introduce other browser automation frameworks.
- Test with **one browser** only (Chromium).
- Implement the **Page Object Model (POM)** pattern: create a class per page or significant UI section to encapsulate selectors and interactions.
  ```
  tests/e2e/
    pages/
      TodoPage.js      ← Page Object
    todo-workflow.spec.js
  ```
- Limit the suite to **5–8 tests** covering critical user journeys. Prioritize quality and reliability over quantity.
- Each test must be **isolated and independent**: do not share state between tests; use `beforeEach` to navigate to a known state.
- Before running E2E tests, ensure both the frontend (port `3000`) and backend (port `3030`) servers are running.
- Avoid hardcoded `waitForTimeout` delays; use `waitForSelector`, `waitForResponse`, or Playwright's built-in auto-waiting.
- Assert on visible UI outcomes (text content, element visibility) rather than internal state or network responses alone.

---

## General Guidelines

- **Test isolation**: Every test must be able to run independently and in any order. Do not rely on test execution order or shared mutable state.
- **Descriptive naming**: Use `describe` blocks to group related tests and `it`/`test` labels that read as plain English sentences describing expected behavior.
- **Coverage**: The backend Jest config collects coverage automatically (`collectCoverage: true`). Aim to maintain meaningful coverage of all API route handlers and validation logic.
- **No real network calls in unit/integration tests**: Mock external dependencies at the boundary (MSW for frontend, in-memory SQLite for backend).
- **Clean up resources**: Always close database connections, stop mock servers, and release any other resources in `afterAll` hooks to avoid open handle warnings.
- **CI compatibility**: All tests must pass with `npm run test:all`. Do not commit tests that are known to be flaky or skipped without justification.
