const GITHUB_API = "https://api.github.com";
const githubToken = process.env.GITHUB_TOKEN;

function parseRepoUrl(repoUrl) {
  let url;

  try {
    url = new URL(repoUrl);
  } catch {
    throw new Error("Please provide a valid GitHub repository URL.");
  }

  if (url.hostname !== "github.com") {
    throw new Error("Only github.com repository URLs are supported.");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error("Repository URL must include both owner and repository.");
  }

  return {
    owner: parts[0],
    repo: parts[1].replace(/\.git$/i, "")
  };
}

async function githubRequest(path) {
  const headers = {
    "User-Agent": "anonymous-repo-clone",
    Accept: "application/vnd.github+json"
  };

  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  const response = await fetch(`${GITHUB_API}${path}`, {
    headers
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let message = `GitHub request failed: ${response.status}`;

    if (response.status === 401) {
      message = "GitHub authentication failed. Check that GITHUB_TOKEN is valid.";
    } else if (response.status === 403) {
      message = githubToken
        ? "GitHub denied the request. The token may be missing required access or the rate limit may be exhausted."
        : "GitHub denied the request. Add GITHUB_TOKEN to raise rate limits and access protected repositories.";
    } else if (response.status === 404) {
      message = githubToken
        ? "Repository or file not found. Confirm the token can access it."
        : "Repository or file not found. Private repositories require GITHUB_TOKEN on the server.";
    }

    throw new Error(`${message}${errorBody ? ` (${errorBody})` : ""}`);
  }

  return response.json();
}

async function getRepoMetadata(owner, repo) {
  const data = await githubRequest(`/repos/${owner}/${repo}`);

  return {
    owner: data.owner.login,
    repo: data.name,
    branch: data.default_branch
  };
}

async function getRepoTree(owner, repo, branch) {
  const data = await githubRequest(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  return data.tree || [];
}

async function getFileContent(owner, repo, path, branch) {
  const encodedPath = path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  const data = await githubRequest(`/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`);

  if (!data.content) {
    return "";
  }

  return Buffer.from(data.content, "base64").toString("utf-8");
}

export { getFileContent, getRepoMetadata, getRepoTree, parseRepoUrl };
