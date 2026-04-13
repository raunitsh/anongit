export default function RepoForm({
  repoUrl,
  onRepoUrlChange,
  onSubmit,
  isLoading
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
    >
      <label className="mb-2 block text-sm font-medium text-zinc-200">
        Public GitHub repository URL
      </label>
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          type="url"
          required
          value={repoUrl}
          onChange={(event) => onRepoUrlChange(event.target.value)}
          placeholder="https://github.com/owner/repository"
          className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-zinc-100 px-5 py-3 font-semibold text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Importing..." : "Create anonymous view"}
        </button>
      </div>
    </form>
  );
}
