# Fix: Horizontal Scrollbar Not Visible in DataTable

## File to modify
`src/components/DataTable.tsx`

## Problem
The horizontal scrollbar for the table is not visible when content overflows.

## Requirements

1. **Make the horizontal scrollbar visible and styled** — dark theme friendly (dark thumb, subtle track).
2. **Add custom scrollbar CSS** — either as a Tailwind `@layer` in the global CSS or inline via a style tag. Specs:
   - Thumb: `#4b5563` (gray-600)
   - Track: transparent
   - Height: `6px`
   - Border-radius: `3px`
3. **Apply the custom scrollbar class** to the `overflow-x-auto` wrapper div around the `<table>`.
4. **Cross-browser support:**
   - `::-webkit-scrollbar` / `::-webkit-scrollbar-thumb` / `::-webkit-scrollbar-track` for Chrome/Safari/Edge
   - `scrollbar-width: thin` and `scrollbar-color: #4b5563 transparent` for Firefox
5. **Do not** break any existing layout, pagination, selection, or search functionality.
6. **Do not** change any other components — only `DataTable.tsx` (and optionally `src/app/globals.css` if needed for a reusable class).
