# Agent Guidelines for Invoice Generator

## Project Overview

A client-side invoice generator built with vanilla HTML, CSS, and JavaScript. No build system - static files only. Uses localStorage for data persistence and jsPDF (CDN) for PDF generation.

**Key Files:**
- `index.html` - Main HTML structure
- `app.js` - Application logic (~2000 lines, IIFE pattern)
- `styles.css` - Styling with CSS custom properties (zinc color palette)

## Commands

**No build/test/lint commands** - This is a static HTML/CSS/JS project without a build system.

**To run:**
```bash
# Simply open in browser
python3 -m http.server 8000  # Optional: serve locally
# Or open index.html directly in browser
```

**Manual testing:**
- Open `index.html` in browser
- Test form functionality
- Verify PDF generation
- Check localStorage persistence

## Code Style Guidelines

### JavaScript

**Module Pattern:**
- Uses IIFE: `(function () { 'use strict'; ... })();`
- All code encapsulated in single IIFE in app.js

**Variable Declarations:**
- Use `const` by default
- Use `let` only when reassignment needed
- Group related declarations together

**Naming Conventions:**
- camelCase for variables and functions: `loadClientList`, `currentInvoiceId`
- UPPER_SNAKE_CASE for constants: `CLIENTS_STORAGE_KEY`
- Descriptive names: `elements.itemsTableBody`, not `el` or `x`

**Functions:**
- Use function declarations: `function init() { ... }`
- Arrow functions for callbacks and short operations: `(e) => formatPhoneNumber(e.target)`
- Async/await for async operations (GitHub API calls)

**Error Handling:**
- Try-catch blocks for async operations
- User-facing error messages via `showStatus()` function
- Console.error for debugging: `console.error('Error:', err)`

**String Formatting:**
- Template literals for interpolation: `` `(${digits})` ``
- Single quotes for regular strings: 'use strict'

**Whitespace & Formatting:**
- 4 spaces for indentation
- Opening brace on same line
- Blank line between logical sections

### CSS

**Custom Properties:**
```css
:root {
  --zinc-50: #fafafa;
  --primary: var(--zinc-900);
  --spacing-md: 1rem;
  --radius: 0.375rem;
}
```

**Naming:**
- kebab-case for classes: `.form-group`, `.nested-tab-btn`
- Semantic naming over presentational: `.card` not `.white-box`

**Organization:**
- CSS variables in :root
- Reset styles next
- Component styles grouped logically
- Utility classes at end

### HTML

- Semantic HTML5 elements: `<section>`, `<header>`, `<main>`
- kebab-case IDs: `senderFirstName`, `itemsTableBody`
- Data attributes for JS hooks: `data-tab`, `data-nested-tab`
- Inline styles only for dynamic values (avoid)

## Architecture Patterns

**State Management:**
- Central state object at top of IIFE
- localStorage for persistence with prefixed keys: `invoice-clients`, `invoice-issuers`
- DOM caching in `elements` object

**Event Handling:**
- Event delegation for dynamic elements
- Named handler functions, not inline
- Cleanup on re-initialization not needed (SPA pattern)

**Data Flow:**
1. User input → DOM
2. Event handlers process
3. Update state
4. Persist to localStorage
5. Update UI

## External Dependencies

**CDN-loaded:**
- jsPDF (PDF generation)
- No package.json or build step

## Security Considerations

- All data client-side only (localStorage)
- GitHub tokens stored in localStorage (user-managed)
- No server-side components
- Sanitize user input before DOM insertion (prevent XSS)

## File Organization

```
/invoice-gen/
├── index.html      # Entry point
├── app.js          # All JavaScript logic
├── styles.css      # All styles
├── README.md       # User documentation
└── GITHUB_BACKUP_SETUP.md  # Setup guide
```

## When Making Changes

1. **Test in browser** - No automated tests
2. **Check localStorage** - Clear if schema changes
3. **Verify PDF output** - Test generation after changes
4. **Mobile responsive** - Check mobile layout
5. **Keep IIFE structure** - Don't introduce modules/build steps
