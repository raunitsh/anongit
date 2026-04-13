function TreeButton({ entry, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition ${
        isActive
          ? "bg-zinc-800 text-zinc-100"
          : "text-zinc-300 hover:bg-zinc-800/70 hover:text-white"
      }`}
    >
      <span className="truncate text-sm">{entry.displayPath}</span>
      <span className="ml-3 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
        {entry.type}
      </span>
    </button>
  );
}

export default function FileTree({ entries, activePath, onSelect }) {
  const files = entries.filter((entry) => entry.type === "blob");

  return (
    <div className="h-full rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-100">Files</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
          {files.length} files
        </span>
      </div>
      <div className="h-[calc(100vh-15rem)] min-h-[24rem] space-y-2 overflow-auto pr-1">
        {files.length ? (
          files.map((entry) => (
            <TreeButton
              key={entry.path}
              entry={entry}
              isActive={activePath === entry.path}
              onSelect={onSelect}
            />
          ))
        ) : (
          <p className="rounded-md border border-dashed border-zinc-800 p-4 text-sm text-zinc-400">
            Import a repository to see files here.
          </p>
        )}
      </div>
    </div>
  );
}
