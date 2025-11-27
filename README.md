# Car Rental Service (Vite + React)

This project is a simple car rental service single-page app with a small backend for demo purposes.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Quick start

1. Install dependencies

```bash
npm install
```

    - Note: this project uses a JSON-backed `lowdb` (no native compiled dependencies) by default; data is persisted in `server/db.json`. If you switch to MongoDB, use `DB_KIND=mongo` and set `MONGO_URI`.

2. Start development server (front + back)

```bash
npm run dev
```

The Vite dev server runs on http://localhost:5173 and proxies `/api` requests to http://localhost:5000 by default.

Bookings are persisted in a local JSON (lowdb) file (`server/db.json`) by default, so they survive server restarts when the file exists. If `server/images.json` exists, it will be imported into the DB on startup.

## Structure

- `src/` - React frontend code
- `server/` - Express backend code
- `public/` - Static assets

## Commands

- `npm run dev` — run Vite and server concurrently
- `npm run server` — run server only
- `npm run build` — build frontend for production

If `concurrently` is not recognized, try the following:

1. Make sure you've installed dependencies from the project root:

```cmd
cd C:\Users\HP\Desktop\car-rental-service
npm install
```

2. Start the servers separately if needed (two terminals):

```cmd
npm run dev:backend
```

and in another terminal:

```cmd
npm run dev:frontend
```

If `concurrently` still fails after `npm install`, run it with npx:

```cmd
npx concurrently "npm run dev:backend" "npm run dev:frontend"
```

Or install `concurrently` globally as a last resort:

```cmd
npm install -g concurrently
```

## Notes

- This project uses React Router for client-side routing and Axios to talk with the backend API.

Currency

- All `pricePerDay` values are shown using Indian Rupees (INR). Prices in the dataset are treated as INR and are displayed using the `₹` symbol and local formatting.

Enjoy!

## Publishing to GitHub

You can publish this project to your GitHub account using either the GitHub web UI or the `gh` CLI.

1. Create a new repository via the web UI:

   - Go to https://github.com/new and create a new repository with a name of your choice.
   - Copy the repository HTTPS URL (e.g., `https://github.com/<username>/car-rental-service.git`).
   - Follow the steps below from your project folder in a `cmd.exe` terminal.

2. Or use the GitHub CLI (if installed):

   ```cmd
   gh repo create <username>/car-rental-service --public --source=. --remote=origin --push
   ```

3. Push manually via git (cmd.exe):

   ```cmd
   cd C:\Users\HP\Desktop\car-rental-service
   git init
   git add .
   git commit -m "Initial commit: Car rental service"
   git branch -M main
   git remote add origin https://github.com/<username>/car-rental-service.git
   git push -u origin main
   ```

4. Do not commit local runtime DB or secrets:

   - `server/db.json` is ignored by `.gitignore` to avoid committing runtime bookings or personal data. If you want to share seed data, use `server/db.example.json` instead.
   - Add environment variables to `.env` locally and never commit them. An example file `.env.example` is included.

5. Optional: set up GitHub Actions, branch protection, and secrets on the repo for CI/CD.

If you want, I can prepare a `gh` command and add an optional `scripts/publish-to-github.cmd` helper that initializes the repo and pushes for you — tell me if you'd like that.

## Images: how to add images for cars

Add images in `public/cars/` so the dev server (Vite) can serve them from `/cars/<filename>`.

1. Copy image files into `public/cars/` (supported formats include `.jpg`, `.png`, `.svg`).
2. Use the image path in `server/data.js` for the `image` field for each car, for example:

```js
image: "/cars/mazda_cx5.svg";
```

3. Recommended size: make assets around 1200x600 or smaller; Vite serves static files directly from `public/`.
4. If your image file is not present or fails to load, the UI falls back to a default placeholder `/cars/placeholder.svg`.

Example: if you add `public/cars/my_car.png` then set `image: '/cars/my_car.png'` in `server/data.js` to use it.

Note: If you change `server/data.js`, you may need to restart the backend (`npm run dev:backend`) and refresh the browser.

## Testing the API with curl

```bash
# list cars
curl http://localhost:5000/api/cars

# create booking
curl -X POST http://localhost:5000/api/bookings -H "Content-Type: application/json" -d '{"carId":1,"startDate":"2025-12-01","endDate":"2025-12-03","customer":{"name":"Alice"}}'

# list bookings
curl http://localhost:5000/api/bookings
```
