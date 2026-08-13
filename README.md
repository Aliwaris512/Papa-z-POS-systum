# Papa-z POS System

A lightweight Point of Sale (POS) system for fast-food shops and small restaurants. Designed for speed, offline-first operation, and easy menu updates.

Purpose
- Streamline order taking, kitchen tickets, and daily reconciliation.
- Reduce wait times and order mistakes.

Tech stack
- Frontend: React (JSX) for the renderer UI.
- Backend: Node.js for local API and business logic.
- Storage: lightweight local storage (JSON/SQLite) for fast local operations.
- Build: npm for package management.

How it works (high level)
- Staff select items from the menu, adjust quantities, and send orders to the backend.
- Orders are recorded locally and can be printed or displayed for the kitchen.
- Payments update sales records immediately; card integrations can be added.

Highlights
- Offline-first: continues to accept orders when internet is unavailable.
- Simple menu editing via JSON files for quick updates.
- Small, fast, and suitable for low-cost hardware.

Quick start
1. Install dependencies:

```
cd restaurant-pos
npm install
```

2. Run (development):

```
npm start
```

3. Build for production:

```
npm run build
```

Want screenshots, a demo GIF, or a developer-focused technical summary? See the LinkedIn post or open an issue in the repo.

---
Licensed: add your preferred license.
