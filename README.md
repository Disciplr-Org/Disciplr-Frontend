# disciplr-frontend

Web app for [Disciplr](https://github.com/your-org/Disciplr): programmable time-locked capital vaults on Stellar.

## What it does

- **Home:** Overview and quick links to create or view vaults.
- **Vaults:** List your productivity vaults (placeholder until backend is wired).
- **Create Vault:** Form to define amount (USDC), deadline, success/failure Stellar addresses (UI only; backend/contract integration pending).

## Tech stack

- **React 18** + **TypeScript**
- **Vite** for build and dev server
- **React Router** for routes
- CSS variables for theming (dark theme by default)

## Local setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Install and run

```bash
# From repo root
cd disciplr-frontend
npm install
npm run dev
```

App runs at **http://localhost:5173**. API requests to `/api` are proxied to `http://localhost:3000` (configure in `vite.config.ts`).

### Scripts

| Command     | Description              |
|------------|--------------------------|
| `npm run dev`    | Start dev server        |
| `npm run build`  | TypeScript + Vite build |
| `npm run preview`| Preview production build |
| `npm run lint`   | Run ESLint              |

## Project layout

```
disciplr-frontend/
├── public/
├── src/
│   ├── components/   # Layout, shared UI
│   ├── pages/        # Home, Vaults, CreateVault
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Merging into a remote

This directory is a separate git repo. To push to your own remote:

```bash
cd disciplr-frontend
git remote add origin <your-disciplr-frontend-repo-url>
git push -u origin main
```

Replace `<your-disciplr-frontend-repo-url>` with your actual repository URL.
