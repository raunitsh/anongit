import "dotenv/config";
import crypto from "crypto";
import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
  anonymizeContent,
  buildEntryList,
  buildMappings,
  buildStats
} from "./anonymize.js";
import {
  getFileContent,
  getRepoMetadata,
  getRepoTree,
  parseRepoUrl
} from "./github.js";
import { isStorageConfigured, readSnapshot, saveSnapshot } from "./storage.js";

const app = express();
const port = process.env.PORT || 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "../../client/dist");

app.use(cors());
app.use(express.json());

async function resolveRepository(repoUrl, requestedBranch) {
  const { owner, repo } = parseRepoUrl(repoUrl);
  const metadata = await getRepoMetadata(owner, repo);
  const branch = requestedBranch || metadata.branch;
  const tree = await getRepoTree(owner, repo, branch);
  const mappings = buildMappings(owner, repo, tree);

  return {
    owner,
    repo,
    branch,
    tree,
    mappings
  };
}

function createSnapshotSummary(snapshot) {
  return {
    shareId: snapshot.shareId,
    sharedAt: snapshot.sharedAt,
    repo: snapshot.repo,
    entries: snapshot.entries,
    stats: snapshot.stats
  };
}

async function buildPersistedSnapshot(repoUrl, requestedBranch) {
  const repository = await resolveRepository(repoUrl, requestedBranch);
  const entries = buildEntryList(repository.tree, repository.mappings.pathMap);
  const files = [];

  for (const entry of repository.tree.filter((item) => item.type === "blob")) {
    const content = await getFileContent(
      repository.owner,
      repository.repo,
      entry.path,
      repository.branch
    );

    files.push({
      path: entry.path,
      displayPath: entry.path,
      content: anonymizeContent(content, repository.mappings.replacements)
    });
  }

  return {
    shareId: crypto.randomUUID(),
    sharedAt: new Date().toISOString(),
    repo: {
      owner: repository.owner,
      repo: repository.repo,
      branch: repository.branch,
      anonymizedName: repository.mappings.repoName,
      sourceUrl: repoUrl
    },
    entries,
    stats: buildStats(repository.tree),
    files
  };
}

app.get("/api/health", async (_request, response) => {
  response.json({
    ok: true,
    githubAuthConfigured: Boolean(process.env.GITHUB_TOKEN),
    mongoConfigured: await isStorageConfigured()
  });
});

app.post("/api/repos/import", async (request, response) => {
  try {
    const { repoUrl, branch } = request.body;
    const repository = await resolveRepository(repoUrl, branch);

    response.json({
      repo: {
        owner: repository.owner,
        repo: repository.repo,
        branch: repository.branch,
        anonymizedName: repository.mappings.repoName
      },
      entries: buildEntryList(repository.tree, repository.mappings.pathMap),
      stats: buildStats(repository.tree)
    });
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

app.post("/api/repos/share", async (request, response) => {
  try {
    const { repoUrl, branch } = request.body;
    const snapshot = await buildPersistedSnapshot(repoUrl, branch);
    await saveSnapshot(snapshot.shareId, snapshot);

    response.json({
      ...createSnapshotSummary(snapshot),
      shareUrl: `${request.protocol}://${request.get("host")}/?share=${snapshot.shareId}`
    });
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

app.get("/api/shared/:id", async (request, response) => {
  try {
    const snapshot = await readSnapshot(request.params.id);
    response.json(createSnapshotSummary(snapshot));
  } catch (error) {
    response.status(404).json({ error: "Shared repository not found." });
  }
});

app.get("/api/shared/:id/file", async (request, response) => {
  try {
    const { path } = request.query;

    if (!path) {
      throw new Error("path is required.");
    }

    const snapshot = await readSnapshot(request.params.id);
    const file = snapshot.files.find((entry) => entry.path === path);

    if (!file) {
      throw new Error("File not found in shared repository.");
    }

    response.json({ file });
  } catch (error) {
    response.status(error.message === "path is required." ? 400 : 404).json({
      error: error.message === "path is required."
        ? error.message
        : "Shared file not found."
    });
  }
});

app.get("/api/repos/file", async (request, response) => {
  try {
    const { owner, repo, branch, path } = request.query;

    if (!owner || !repo || !branch || !path) {
      throw new Error("owner, repo, branch, and path are required.");
    }

    const tree = await getRepoTree(owner, repo, branch);
    const mappings = buildMappings(owner, repo, tree);
    const content = await getFileContent(owner, repo, path, branch);

    response.json({
      file: {
        originalPath: path,
        anonymizedPath: mappings.pathMap.get(path) || path,
        displayPath: path,
        content: anonymizeContent(content, mappings.replacements)
      }
    });
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

app.post("/api/repos/export", async (request, response) => {
  try {
    const { repoUrl, branch } = request.body;
    const repository = await resolveRepository(repoUrl, branch);
    const files = repository.tree.filter((entry) => entry.type === "blob").slice(0, 50);
    const exportedFiles = [];

    for (const file of files) {
      const content = await getFileContent(
        repository.owner,
        repository.repo,
        file.path,
        repository.branch
      );

      exportedFiles.push({
        path: repository.mappings.pathMap.get(file.path) || file.path,
        content: anonymizeContent(content, repository.mappings.replacements)
      });
    }

    const payload = {
      repo: {
        owner: "anonymous-owner",
        repo: repository.mappings.repoName,
        branch: repository.branch
      },
      exportedAt: new Date().toISOString(),
      files: exportedFiles
    };

    response.setHeader("Content-Type", "application/json");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${repository.mappings.repoName}.json"`
    );
    response.send(JSON.stringify(payload, null, 2));
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

app.use(express.static(clientDistPath));

app.get("*", (request, response, next) => {
  if (request.path.startsWith("/api/")) {
    next();
    return;
  }

  response.sendFile(path.join(clientDistPath, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Anonymous repo server listening on port ${port}`);
});
