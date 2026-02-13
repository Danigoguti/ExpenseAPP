# Revolut Expense Tracker

A Progressive Web App (PWA) for tracking and categorizing your Revolut bank expenses. Import your transaction history via CSV, classify spending into categories, and visualize your finances with interactive charts.

## Features

- **CSV Import** — Upload Revolut CSV exports to import transactions
- **Auto-Classification** — Smart category suggestions based on merchant name matching
- **Manual Categorization** — Tap any transaction to assign a category; optionally apply to all similar
- **Dashboard Charts** — Donut chart (by category), bar chart (monthly comparison), area chart (spending trend)
- **Time Filters** — Day, Week, Month, Year, or All
- **Category Filters** — Filter by any expense category
- **Search** — Free text search across transactions
- **Offline Support** — All data stored locally in IndexedDB; works without internet
- **iOS PWA** — Install via Safari "Add to Home Screen" for a native app experience

## Tech Stack

- React 18 + TypeScript
- Vite 5 + PWA (vite-plugin-pwa)
- Tailwind CSS
- Recharts (charts)
- Dexie.js (IndexedDB)
- PapaParse (CSV parsing)
- date-fns (date utilities)
- lucide-react (icons)

## Getting Started

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
npm run preview
```

## Install on iOS

1. Open the app URL in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
