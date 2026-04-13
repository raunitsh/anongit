# Anonymous Repo Browser Clone

Lean clone of [anonymous.4open.science](https://anonymous.4open.science/) built with React, Vite, Tailwind CSS, Node, and Express.

## Core features

- Import a public GitHub repository URL
- Browse the repository file list
- Preview original file contents
- Export a JSON snapshot for review
- Use authenticated GitHub API requests from the server
- Persist a repository snapshot and generate a shareable URL

## Project structure

- `client/` - React + Vite + Tailwind frontend
- `server/` - Express API that reads public GitHub repositories

## Install

```bash
npm install
npm --prefix client install
npm --prefix server install
```

## GitHub authentication

Create `server/.env` from [server/.env.example](C:/Users/herbalchappal/Documents/anongit/server/.env.example) and set a GitHub personal access token:

```bash
GITHUB_TOKEN=ghp_your_github_token_here
MONGODB_URI=mongodb+srv://username:password@cluster.example.mongodb.net/?retryWrites=true&w=majority
PORT=4000
```

The token is used only by the Express server. This enables authenticated GitHub API requests for higher rate limits and access to repositories the token can read.

## MongoDB persistence

Shared snapshots are stored in MongoDB using `MONGODB_URI`.
The app uses built-in defaults for the database and collection names, so only `MONGODB_URI` is required.

## Run

```bash
npm run dev:server
npm run dev:client
```

The frontend runs on `http://localhost:5173` and proxies `/api` requests to the Express server on `http://localhost:4000`.

## Render deployment

For a single Render web service deployment, use:

```bash
Build Command: npm install && npm --prefix client install && npm --prefix server install && npm --prefix client run build
Start Command: npm start
```

The Express server serves the built frontend from `client/dist` in production.

## Sharing

Use the `Create share link` action in the UI to persist the imported repository on the server and generate a URL like:

```text
http://your-host/?share=<snapshot-id>
```

Anyone who can access the deployed app at that host can open the shared repository from that link.

## Notes

- The app can read public repositories without a token, but authenticated requests are recommended.
- Private repositories can work if `GITHUB_TOKEN` has access to them.
- `Create share link` requires `MONGODB_URI` to be configured on the server.
- Export currently returns a JSON snapshot instead of a ZIP archive.
- Shared snapshots are stored in MongoDB.
- To keep the demo responsive, export is capped at the first 50 files in the repository tree.
