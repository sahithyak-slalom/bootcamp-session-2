# Functional Requirements

## Sources

These requirements were derived by inspecting the existing source code and documentation in this repository. No separate requirements document existed; the following files were used as the basis for this specification:

| File | Contribution |
|---|---|
| [docs/project-overview.md](project-overview.md) | Project context, test strategy, monorepo structure |
| [packages/backend/src/app.js](../packages/backend/src/app.js) | All API endpoints, request validation, error handling, data model, seed data |
| [packages/backend/src/index.js](../packages/backend/src/index.js) | Server port configuration |
| [packages/backend/__tests__/app.test.js](../packages/backend/__tests__/app.test.js) | Confirmed expected API behavior, edge cases, and error responses |
| [packages/frontend/src/App.js](../packages/frontend/src/App.js) | UI layout, state management, user interactions, API integration |
| [packages/frontend/src/App.css](../packages/frontend/src/App.css) | UI structure and section layout |
| [packages/frontend/public/index.html](../packages/frontend/public/index.html) | Application entry point and page metadata |
| [packages/frontend/src/__tests__/App.test.js](../packages/frontend/src/__tests__/App.test.js) | Confirmed expected frontend rendering and interaction behavior |
| [package.json](../package.json) | Monorepo configuration, dependency overview |

---

## Overview

The application is a full-stack To Do app that allows users to manage a list of tasks. It consists of a React frontend and an Express/SQLite backend, communicating via a REST API.

---

## 1. Item Management

### 1.1 View Items
- The application shall retrieve and display all items from the database when the page loads.
- Each item shall display its name.
- While items are being loaded, the UI shall display a loading indicator.
- If the retrieval fails, the UI shall display an error message.

### 1.2 Add Item
- The user shall be able to enter a name for a new item using a text input field.
- The user shall be able to submit the new item by clicking an "Add Item" button.
- Upon successful submission, the new item shall appear in the list without requiring a page reload.
- If no name is provided or the name is empty, the backend shall reject the request with a `400 Bad Request` response.
- If the request fails, the UI shall display an error message.

### 1.3 Delete Item
- Each item in the list shall have a "Delete" button.
- Clicking the "Delete" button shall remove the item from the list immediately without requiring a page reload.
- If the specified item does not exist, the backend shall return a `404 Not Found` response.
- If an invalid (non-numeric) item ID is provided, the backend shall return a `400 Bad Request` response.

---

## 2. Backend API

### 2.1 Health Check
- `GET /` shall return a `200 OK` response with a status and message confirming the service is running.

### 2.2 Get All Items
- `GET /api/items` shall return a `200 OK` response with an array of all items.
- Each item in the response shall include: `id`, `name`, and `created_at`.

### 2.3 Create Item
- `POST /api/items` shall accept a JSON body containing a `name` field.
- On success, the endpoint shall return a `201 Created` response with the newly created item object.
- If `name` is missing or empty, the endpoint shall return a `400 Bad Request` response.

### 2.4 Delete Item
- `DELETE /api/items/:id` shall remove the item with the specified `id`.
- On success, the endpoint shall return a `200 OK` response with a confirmation message and the deleted item's `id`.
- If `id` is not a valid number, the endpoint shall return a `400 Bad Request` response.
- If no item with the given `id` exists, the endpoint shall return a `404 Not Found` response.

---

## 3. Data

### 3.1 Data Model
- Items shall be stored in a table named `items` with the following fields:

| Field | Type | Description |
|---|---|---|
| `id` | Integer, auto-increment | Unique identifier |
| `name` | Text, required | Name of the item |
| `created_at` | Timestamp | Creation timestamp, defaults to current time |

### 3.2 Initial Data
- On startup, the database shall be seeded with three default items: `Item 1`, `Item 2`, and `Item 3`.
- The database is in-memory and resets on each server restart.

---

## 4. User Interface

### 4.1 Layout
- The UI shall display a header with the application title and a subtitle.
- The UI shall include a section for adding new items.
- The UI shall include a section that lists all current items retrieved from the backend.

### 4.2 Feedback
- The UI shall show a loading state while fetching items from the API.
- The UI shall show inline error messages when API requests fail.

---

## 5. Non-Functional Requirements

### 5.1 CORS
- The backend shall accept cross-origin requests from all origins to support local frontend development.

### 5.2 Logging
- The backend shall log all incoming HTTP requests in development mode.

### 5.3 Frontend Proxy
- The frontend development server shall proxy API requests to `http://localhost:3030`.
