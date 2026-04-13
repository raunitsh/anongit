import { useEffect, useState } from "react";
import FileTree from "./components/FileTree";
import FileViewer from "./components/FileViewer";
import RepoForm from "./components/RepoForm";
import {
  createShareableSnapshot,
  downloadSnapshot,
  fetchFile,
  fetchSharedFile,
  fetchSharedRepository,
  importRepository
} from "./lib/api";

const defaultRepoUrl = "https://github.com/octocat/Hello-World";

export default function App() {
  const [repoUrl, setRepoUrl] = useState(defaultRepoUrl);
  const [repoData, setRepoData] = useState(null);
  const [selectedPath, setSelectedPath] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState("");
  const [shareId, setShareId] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const activeRepoUrl = repoData?.repo?.sourceUrl || repoUrl;
  const isSharedView = Boolean(shareId);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentShareId = params.get("share");

    if (!currentShareId) {
      return;
    }

    setError("");

    fetchSharedRepository(currentShareId)
      .then((data) => {
        setRepoData(data);
        setShareId(data.shareId);
        setShareUrl(`${window.location.origin}/?share=${data.shareId}`);
        const firstFile = data.entries.find((entry) => entry.type === "blob");
        setSelectedPath(firstFile?.path || "");
      })
      .catch((requestError) => {
        setError(requestError.message);
      });
  }, []);

  async function handleImport(event) {
    event.preventDefault();
    setIsImporting(true);
    setError("");
    setSelectedFile(null);
    setShareId("");
    setShareUrl("");
    window.history.replaceState({}, "", window.location.pathname);

    try {
      const data = await importRepository({ repoUrl });
      setRepoData(data);

      const firstFile = data.entries.find((entry) => entry.type === "blob");
      setSelectedPath(firstFile?.path || "");
    } catch (requestError) {
      setRepoData(null);
      setSelectedPath("");
      setError(requestError.message);
    } finally {
      setIsImporting(false);
    }
  }

  useEffect(() => {
    if (!repoData || !selectedPath) {
      return;
    }

    setIsFileLoading(true);
    setError("");

    const request = shareId
      ? fetchSharedFile(shareId, selectedPath)
      : fetchFile({
          owner: repoData.repo.owner,
          repo: repoData.repo.repo,
          branch: repoData.repo.branch,
          path: selectedPath
        });

    request
      .then((data) => {
        setSelectedFile(data.file);
      })
      .catch((requestError) => {
        setError(requestError.message);
      })
      .finally(() => {
        setIsFileLoading(false);
      });
  }, [repoData, selectedPath]);

  async function handleDownload() {
    if (!repoData) {
      return;
    }

    try {
      setError("");
      const blob = await downloadSnapshot({
        repoUrl: activeRepoUrl,
        branch: repoData.repo.branch
      });
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = `${repoData.repo.anonymizedName}.json`;
      link.click();
      URL.revokeObjectURL(href);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleCreateShareLink() {
    if (!repoData) {
      return;
    }

    try {
      setIsSharing(true);
      setError("");
      const data = await createShareableSnapshot({
        repoUrl: activeRepoUrl,
        branch: repoData.repo.branch
      });
      setRepoData(data);
      setShareId(data.shareId);
      setShareUrl(data.shareUrl);
      window.history.replaceState({}, "", `/?share=${data.shareId}`);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(data.shareUrl);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSharing(false);
    }
  }

  const hasRepository = Boolean(repoData);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col px-4 py-4 md:px-5">
        {!isSharedView ? (
          <header className={hasRepository ? "mb-4" : "mb-8"}>
            {hasRepository ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                      Anonymous Repo Browser
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold text-zinc-100">
                      {repoData.repo.anonymizedName}
                    </h1>
                    <p className="mt-1 text-sm text-zinc-400">
                      {repoData.stats.files} files across {repoData.stats.directories} folders
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 xl:min-w-[52rem] xl:flex-row">
                    <div className="flex-1">
                      <RepoForm
                        repoUrl={repoUrl}
                        onRepoUrlChange={setRepoUrl}
                        onSubmit={handleImport}
                        isLoading={isImporting}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateShareLink}
                      disabled={!repoData || isSharing}
                      className="rounded-md border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSharing ? "Saving..." : "Create share link"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={!repoData}
                      className="rounded-md border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Export snapshot
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">
                      Anonymous Repo Browser
                    </p>
                    <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-100 md:text-5xl">
                      Turn a public GitHub repository into a shareable anonymous review space.
                    </h1>
                    <p className="mt-4 max-w-2xl text-base text-zinc-300 md:text-lg">
                      Import a public repository, browse its files, inspect code with syntax
                      highlighting, and export a lightweight snapshot for review.
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
                  <p className="text-sm font-medium text-zinc-200">What this MVP includes</p>
                  <ul className="mt-4 space-y-3 text-sm text-zinc-300">
                    <li>Public GitHub repo import</li>
                    <li>Unmodified file names and contents</li>
                    <li>Syntax-highlighted file preview</li>
                    <li>JSON export for review</li>
                  </ul>
                </div>
              </div>
            )}
          </header>
        ) : null}

        {!hasRepository && !isSharedView ? (
          <RepoForm
            repoUrl={repoUrl}
            onRepoUrlChange={setRepoUrl}
            onSubmit={handleImport}
            isLoading={isImporting}
          />
        ) : null}

        {error ? (
          <div className="mt-4 rounded-md border border-red-950 bg-red-950/60 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {shareUrl && !isSharedView ? (
          <div className="mt-4 rounded-md border border-emerald-950 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
            Shareable URL:{" "}
            <a href={shareUrl} className="break-all underline underline-offset-2">
              {shareUrl}
            </a>
          </div>
        ) : null}

        <main className={`grid flex-1 gap-4 ${hasRepository ? "xl:grid-cols-[21rem_minmax(0,1fr)]" : "xl:grid-cols-[22rem_minmax(0,1fr)]"}`}>
          <div className="min-h-0">
            <FileTree
              entries={repoData?.entries || []}
              activePath={selectedPath}
              onSelect={(entry) => setSelectedPath(entry.path)}
            />
          </div>

          <div className="min-h-0">
            <FileViewer file={selectedFile} isLoading={isFileLoading} />
          </div>
        </main>
      </div>
    </div>
  );
}
