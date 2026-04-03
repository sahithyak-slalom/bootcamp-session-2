# UI Guidelines

## Overview

This document defines the core UI guidelines for the To Do App. All frontend contributions should follow these standards to ensure a consistent, accessible, and maintainable user interface.

---

## Layout

- The application shall use a centered, single-column layout with a maximum width of `800px` and `20px` of horizontal padding.
- Content shall be divided into clearly separated sections: a header, an "Add Item" section, and an "Items" list section.
- Sections shall use consistent vertical spacing (`20px` gap) and shall not overlap.

---

## Color Palette

| Role | Value | Usage |
|---|---|---|
| Primary background (header) | `#282c34` | App header background |
| Primary accent | `#61dafb` | Primary button background |
| Primary accent (hover) | `#21a1c9` | Primary button hover state |
| Danger | `#f44336` | Delete button background |
| Danger (hover) | `#d32f2f` | Delete button hover state |
| Section background | `#f5f5f5` | Card/section backgrounds |
| Border | `#ddd` | Input borders, list item dividers |
| Error text | `#d32f2f` | Inline error messages |
| Header text | `#ffffff` | Text on dark header backgrounds |
| Body text | Default browser | General body content |

---

## Typography

- The application title (`h1`) inside the header shall use `1.8rem` font size with no margin.
- Section headings (`h2`) shall clearly label each content area.
- Button labels shall use `font-weight: bold`.
- Error messages shall use `font-weight: bold` and the danger color (`#d32f2f`).

---

## Components

### Header
- The header shall have a dark background (`#282c34`), white text, `8px` border radius, and `20px` padding.
- It shall display the application title (`h1`) and a short subtitle (`p`).

### Sections / Cards
- Each section shall use a light background (`#f5f5f5`), `8px` border radius, `20px` padding, and a subtle box shadow (`0 2px 4px rgba(0,0,0,0.1)`).

### Form (Add Item)
- The add-item form shall display an input and a submit button side-by-side using flexbox with a `10px` gap.
- The text input shall be flexible (`flex: 1`), have `8px` padding, a `1px solid #ddd` border, and a `4px` border radius.
- The submit button shall use the primary accent color.

### Buttons
- All buttons shall have `8px 16px` padding, a `4px` border radius, no border, and a pointer cursor.
- **Primary button** (e.g., "Add Item"): background `#61dafb`, text `#282c34`, bold font. Hover: `#21a1c9`.
- **Danger button** (e.g., "Delete"): background `#f44336`, white text, `6px 12px` padding, `0.8rem` font size. Hover: `#d32f2f`.

### Item List
- The list shall use no list-style and no padding.
- Each list item shall display the item name on the left and its Delete button on the right using `space-between` flex alignment.
- List items shall be separated by a `1px solid #ddd` bottom border; the last item shall have no bottom border.
- Each list item shall have `10px` vertical padding.

---

## Feedback States

- **Loading**: Display the text `Loading data...` while items are being fetched from the API.
- **Error**: Display an inline error message styled with the `error` class (bold, `#d32f2f` text) immediately below the relevant section when an API request fails.
- Both loading and error states shall be shown within the items section, not in a modal or overlay.

---

## Accessibility

- All interactive elements (buttons, inputs) shall be keyboard-navigable and focusable.
- Form inputs shall include a descriptive `placeholder` attribute (e.g., `"Enter item name"`).
- Buttons shall have clear, descriptive labels (e.g., `"Add Item"`, `"Delete"`).
- Color alone shall not be the only means of conveying state (e.g., error messages shall include text, not just a color change).

---

## Responsive Design

- The layout shall remain usable on viewports narrower than `800px` by allowing the centered container to shrink naturally with padding.
- The add-item form may wrap the input and button onto separate lines on very small screens.

---

## Do's and Don'ts

**Do:**
- Use the defined color palette for all new UI elements.
- Keep section and form layouts consistent with the existing flexbox patterns.
- Show clear loading and error feedback for every async operation.

**Don't:**
- Introduce new fonts, icon libraries, or UI frameworks without team agreement.
- Use inline styles; prefer CSS classes.
- Add modals, toasts, or overlays unless explicitly required by a functional requirement.
