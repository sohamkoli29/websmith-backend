# WebSmith Backend

The backend API for **WebSmith**, built with Node.js. It serves the REST API consumed by the [WebSmith frontend](https://github.com/sohamkoli29/websmith-frontend).

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup Guide](#setup-guide)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Connecting the Frontend](#connecting-the-frontend)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Entry point:** `server.js`
- **Source code:** `src/`
- **Config:** environment variables via `.env`

> Update this section with your exact database, auth, and storage choices (for example MongoDB, PostgreSQL, Supabase, JWT, Multer, Cloudinary).

---

## Prerequisites

- **Node.js** v18 or higher (v20+ recommended) — [Download](https://nodejs.org/)
- **npm** v9 or higher
- **Git**
- Your database instance (local or cloud) as required by the project

```bash
node -v
npm -v
git --version
```

---

## Setup Guide

### 1. Clone the repository

```bash
git clone https://github.com/sohamkoli29/websmith-backend.git
cd websmith-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the environment file

```bash
# macOS / Linux
cp .env.example .env    # if an example file exists
touch .env              # otherwise

# Windows (PowerShell)
New-Item .env -ItemType File
```

Add your values (see [Environment Variables](#environment-variables)):

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 4. Start the server

```bash
# Development
npm run dev

# Production
npm start
```

If `npm run dev` is not defined in `package.json`, run directly:

```bash
node server.js
```

### 5. Verify it works

The API should now be running at **http://localhost:5000**. Open it in a browser or test with curl:

```bash
curl http://localhost:5000
```

---

## Environment Variables

Create a `.env` file in the project root. Never commit it.

| Variable      | Description                                   | Example                 |
| ------------- | --------------------------------------------- | ----------------------- |
| `PORT`        | Port the server listens on                    | `5000`                  |
| `NODE_ENV`    | Runtime environment                           | `development`           |
| `CLIENT_URL`  | Frontend origin allowed by CORS               | `http://localhost:5173` |

Add any additional variables your code reads (database URI, JWT secret, storage keys, etc.), for example:

```env
# DATABASE_URL=...
# JWT_SECRET=...
```

---

## Available Scripts

| Command         | Description                                   |
| --------------- | --------------------------------------------- |
| `npm start`     | Start the server in production mode           |
| `npm run dev`   | Start the server with auto-reload (if defined) |

Check `package.json` for the full list of scripts.

---

## Project Structure

```
websmith-backend/
├── src/               # Application source (routes, controllers, models, middleware, etc.)
├── .gitignore
├── package.json
├── package-lock.json
└── server.js          # Server entry point
```

---

## API Overview

Base URL (local): `http://localhost:5000/api`

Document your endpoints here, for example:

| Method | Endpoint          | Description        |
| ------ | ----------------- | ------------------ |
| GET    | `/api/health`     | Health check       |
| POST   | `/api/auth/login` | Log in a user      |

---

## Connecting the Frontend

1. Start this backend (default `http://localhost:5000`).
2. In the frontend repo, set in `.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. Ensure `CLIENT_URL` here matches the frontend origin (`http://localhost:5173` for Vite dev) so CORS allows requests.

---

## Deployment

Works on any Node.js host (Render, Railway, Fly.io, a VPS, etc.).

1. Push the repo to GitHub.
2. Create a new web service and connect the repository.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all environment variables in the host's dashboard.
6. Set `CLIENT_URL` to your deployed frontend URL.

---

## Troubleshooting

**Port already in use**
Change `PORT` in `.env`, or stop the process using it.

**CORS errors from the frontend**
Make sure `CLIENT_URL` exactly matches the frontend origin (no trailing slash).

**`Cannot find module`**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Environment variables are `undefined`**
Confirm `.env` is in the project root and the server is restarted after edits.

---

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

No license specified yet. Add a `LICENSE` file (e.g., MIT).

---

**Author:** [Soham Koli](https://github.com/sohamkoli29)
