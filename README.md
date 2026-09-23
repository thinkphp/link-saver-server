# Link Saver Server

Backend for the **Link Saver** application, built with Node.js, Express, and PostgreSQL.

The backend uses PostgreSQL locally through Docker and Neon PostgreSQL in production. The Express application is deployed to Vercel as a serverless application.

---

## 🛠️ Technologies

* Node.js
* Express
* PostgreSQL
* Neon PostgreSQL
* `@neondatabase/serverless`
* CORS
* dotenv
* Vercel

---

## 📁 Project Structure

```text
link-saver-server/
├── index.js
├── package.json
├── package-lock.json
├── vercel.json
├── .gitignore
└── .env
```

> `.env` must not be committed to GitHub because it contains sensitive information such as the database connection string.

---

# 🚀 Local Installation

## 1. Clone the repository

```bash
git clone <repository-url>
```

Navigate into the project:

```bash
cd link-saver-server
```

---

## 2. Install dependencies

```bash
npm install
```

Main dependencies:

```text
express
cors
@neondatabase/serverless
dotenv
```

---

# 🗄️ Local PostgreSQL

For local development, PostgreSQL runs inside a Docker container.

The PostgreSQL server is available locally at:

```text
localhost:5432
```

Local configuration:

```text
Host: localhost
Port: 5432
User: postgres
Password: postgres
Database: link_saver_db
```

The local database is:

```text
link_saver_db
```

---

## Database Table

The application uses a `links` table:

```sql
CREATE TABLE links (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Table structure:

```text
id
title
url
created_at
```

---

# 🔐 Environment Variables

The main environment variable used by the backend is:

```env
DATABASE_URL=...
```

For local development, create a `.env` file:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/link_saver_db
```

For production, `DATABASE_URL` is configured in Vercel and contains the Neon PostgreSQL connection string.

> Do not use the local `localhost` connection string in Vercel.

---

# 🔒 .gitignore

The `.gitignore` file should contain:

```gitignore
.env
node_modules
```

This prevents:

* sensitive environment variables from being pushed to GitHub;
* `node_modules` from being committed.

---

# 📦 package.json

The project uses the following start script:

```json
{
    "scripts": {
        "start": "node index.js"
    }
}
```

Start the server locally with:

```bash
npm start
```

---

# 🌐 Express API

The Express application is initialized in `index.js`.

```js
const express = require("express");
const cors = require("cors");
const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

const app = express();
```

---

# 🔐 CORS

The frontend is deployed on Vercel at:

```text
https://react-vite-link-saver.vercel.app
```

The backend allows requests from this origin:

```js
app.use(
    cors({
        origin: "https://react-vite-link-saver.vercel.app",
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
    })
);
```

CORS is required because the frontend and backend are separate applications running on different domains.

---

# 📄 JSON Middleware

Express needs to be able to parse JSON request bodies:

```js
app.use(express.json());
```

This allows the backend to process requests such as:

```json
{
    "title": "React Documentation",
    "url": "https://react.dev"
}
```

The data can then be accessed with:

```js
const { title, url } = req.body;
```

---

# 🗄️ Neon Database Connection

The production backend uses:

```text
@neondatabase/serverless
```

The database connection is created with:

```js
const sql = neon(process.env.DATABASE_URL);
```

The database connection string is not hardcoded in the application.

It is loaded from:

```text
DATABASE_URL
```

---

# 🛣️ API Routes

The backend currently provides three endpoints:

| Method | Endpoint     | Description                       |
| ------ | ------------ | --------------------------------- |
| GET    | `/`          | Checks whether the API is running |
| GET    | `/api/links` | Returns all saved links           |
| POST   | `/api/links` | Creates a new link                |

---

# GET `/`

A simple health-check endpoint.

Request:

```http
GET /
```

Response:

```json
{
    "message": "Link Saver API is running"
}
```

This endpoint is useful for quickly checking whether the backend is running correctly.

---

# GET `/api/links`

Returns all saved links from the database.

Request:

```http
GET /api/links
```

SQL query:

```sql
SELECT *
FROM links
ORDER BY created_at DESC
```

Express implementation:

```js
app.get("/api/links", async (req, res) => {
    try {
        const links = await sql`
            SELECT *
            FROM links
            ORDER BY created_at DESC
        `;

        res.json(links);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Server error",
        });
    }
});
```

If there are no saved links, the response is:

```json
[]
```

If links exist:

```json
[
    {
        "id": 1,
        "title": "React Documentation",
        "url": "https://react.dev",
        "created_at": "2026-09-23T10:00:00.000Z"
    }
]
```

---

# POST `/api/links`

Creates a new link.

Request:

```http
POST /api/links
Content-Type: application/json
```

Request body:

```json
{
    "title": "React Documentation",
    "url": "https://react.dev"
}
```

The backend extracts the data:

```js
const { title, url } = req.body;
```

and inserts it into PostgreSQL:

```sql
INSERT INTO links (title, url)
VALUES (...)
RETURNING *
```

Implementation:

```js
app.post("/api/links", async (req, res) => {
    try {
        const { title, url } = req.body;

        const links = await sql`
            INSERT INTO links (title, url)
            VALUES (${title}, ${url})
            RETURNING *
        `;

        res.status(201).json(links[0]);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Server error",
        });
    }
});
```

Successful response:

```json
{
    "id": 1,
    "title": "React Documentation",
    "url": "https://react.dev",
    "created_at": "2026-09-23T10:00:00.000Z"
}
```

HTTP status:

```text
201 Created
```

---

# 🛡️ Error Handling

Database operations are wrapped in `try/catch` blocks:

```js
try {
    // database operation
} catch (error) {
    console.error(error);

    res.status(500).json({
        error: "Server error",
    });
}
```

If a database error occurs, the client receives:

```json
{
    "error": "Server error"
}
```

The actual error is logged by the backend:

```js
console.error(error);
```

---

# 📄 Current `index.js`

The current backend implementation:

```js
const express = require("express");
const cors = require("cors");
const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

const app = express();

app.use(
    cors({
        origin: "https://react-vite-link-saver.vercel.app",
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
    })
);

app.use(express.json());

const sql = neon(process.env.DATABASE_URL);

app.get("/", (req, res) => {
    res.json({
        message: "Link Saver API is running",
    });
});

app.get("/api/links", async (req, res) => {
    try {
        const links = await sql`
            SELECT *
            FROM links
            ORDER BY created_at DESC
        `;

        res.json(links);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Server error",
        });
    }
});

app.post("/api/links", async (req, res) => {
    try {
        const { title, url } = req.body;

        const links = await sql`
            INSERT INTO links (title, url)
            VALUES (${title}, ${url})
            RETURNING *
        `;

        res.status(201).json(links[0]);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Server error",
        });
    }
});

module.exports = app;
```

---

# ☁️ Vercel Deployment

The backend is deployed to Vercel.

Unlike a traditional Express server, the application does not use:

```js
app.listen(3000);
```

Instead, the Express application is exported:

```js
module.exports = app;
```

Vercel runs the Express application as a serverless function.

---

# ⚙️ `vercel.json`

The Vercel configuration is:

```json
{
    "version": 2,
    "builds": [
        {
            "src": "index.js",
            "use": "@vercel/node"
        }
    ],
    "routes": [
        {
            "src": "/(.*)",
            "dest": "index.js"
        }
    ]
}
```

This tells Vercel to:

1. use `index.js` as the entry point;
2. run it as a Node.js serverless function;
3. forward incoming requests to the Express application.

---

# 🌍 Vercel Environment Variables

The following environment variable must be configured in Vercel:

```text
DATABASE_URL
```

Its value should be the Neon PostgreSQL connection string.

Example:

```text
DATABASE_URL=<Neon connection string>
```

The actual connection string must not be committed to GitHub.

---

# 🧪 Testing the API

After deployment, test the health endpoint:

```text
GET /
```

Expected response:

```json
{
    "message": "Link Saver API is running"
}
```

Then test:

```text
GET /api/links
```

If the database is empty:

```json
[]
```

---

# 🔄 Application Architecture

The production architecture is:

```text
┌──────────────────────────────┐
│        React Frontend        │
│            Vercel            │
└──────────────┬───────────────┘
               │
               │ HTTP
               ▼
┌──────────────────────────────┐
│       Express Backend        │
│            Vercel            │
└──────────────┬───────────────┘
               │
               │ DATABASE_URL
               ▼
┌──────────────────────────────┐
│       Neon PostgreSQL        │
│          Production          │
└──────────────────────────────┘
```

---

# 💻 Local Development

For local development:

```text
React
  ↓
localhost:5173
  ↓
Express
  ↓
localhost:3000
  ↓
PostgreSQL Docker
  ↓
link_saver_db
```

Local environment variable:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/link_saver_db
```

---

# ☁️ Production

In production:

```text
React
  ↓
Vercel
  ↓
Express / Vercel
  ↓
Neon PostgreSQL
```

Production environment variable:

```text
DATABASE_URL=<Neon connection string>
```

---

# 🔀 Local vs Production

The application uses separate databases for local development and production.

| Environment | Backend           | Database             |
| ----------- | ----------------- | -------------------- |
| Local       | Express locally   | PostgreSQL in Docker |
| Production  | Express on Vercel | Neon PostgreSQL      |

Data stored in the local PostgreSQL database is not automatically available in Neon.

The `links` table must exist separately in the Neon database.

---

# 🧩 Dependencies

Install the main dependencies with:

```bash
npm install express cors @neondatabase/serverless dotenv
```

---

# ▶️ Start the Server Locally

After configuring `.env`:

```bash
npm start
```

The local server runs at:

```text
http://localhost:3000
```

Test the API:

```text
http://localhost:3000/
```

and:

```text
http://localhost:3000/api/links
```

---

# 🔑 Deployment Checklist

Before deploying, make sure the repository contains:

```text
index.js
package.json
package-lock.json
vercel.json
.gitignore
```

Also make sure the following environment variable is configured in Vercel:

```text
DATABASE_URL
```

The local `.env` file should **not** be committed to GitHub.

---

# 📌 API Summary

## Health Check

```http
GET /
```

Response:

```json
{
    "message": "Link Saver API is running"
}
```

## Get Links

```http
GET /api/links
```

Returns an array of saved links.

Example:

```json
[
    {
        "id": 1,
        "title": "Example",
        "url": "https://example.com",
        "created_at": "..."
    }
]
```

## Create Link

```http
POST /api/links
Content-Type: application/json
```

Body:

```json
{
    "title": "Example",
    "url": "https://example.com"
}
```

Response:

```json
{
    "id": 1,
    "title": "Example",
    "url": "https://example.com",
    "created_at": "..."
}
```

---

# 🔐 Security Notes

Never commit sensitive information to the repository, including:

```text
DATABASE_URL
passwords
API keys
secrets
.env
```

Use environment variables for sensitive configuration.

CORS is restricted to the deployed frontend:

```text
https://react-vite-link-saver.vercel.app
```

---

# 📚 Project Status

The backend currently includes:

* [x] Express
* [x] PostgreSQL
* [x] Local PostgreSQL with Docker
* [x] Neon PostgreSQL for production
* [x] Environment variables
* [x] CORS
* [x] `GET /`
* [x] `GET /api/links`
* [x] `POST /api/links`
* [x] Error handling
* [x] Vercel deployment
* [x] Serverless Express
* [x] Separate local and production databases
* [x] GitHub-ready project structure




