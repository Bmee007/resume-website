# Borina Keo — Resume Website

Personal resume website for Borina Keo, ERP & WMS AI Integration Leader.

## Tech Stack

- [Astro 5.x](https://astro.build/) — static site generator
- [Tailwind CSS v4](https://tailwindcss.com/) — utility-first CSS (CSS-first config via `@theme`)
- [Playwright](https://playwright.dev/) — end-to-end test suite

## Development

```bash
# Install dependencies
npm install

# Start dev server at http://localhost:4321
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests (requires dev server running)
npx playwright test
```

## Project Structure

```
src/
  layouts/    — Base layout with <head>, fonts, and slot
  pages/      — Astro page routes
  styles/     — Global CSS with design tokens (@theme)
public/       — Static assets (favicon, etc.)
tests/        — Playwright smoke tests
```
