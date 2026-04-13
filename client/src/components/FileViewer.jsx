import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const extensionToLanguage = {
  h: "c",
  hpp: "cpp",
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  json: "json",
  css: "css",
  html: "markup",
  md: "markdown",
  py: "python",
  java: "java",
  c: "c",
  cpp: "cpp",
  cs: "csharp",
  go: "go",
  rs: "rust",
  php: "php",
  rb: "ruby",
  sh: "bash",
  yml: "yaml",
  yaml: "yaml",
  xml: "xml"
};

function getLanguage(path = "") {
  const extension = path.split(".").pop()?.toLowerCase();
  return extensionToLanguage[extension] || "text";
}

export default function FileViewer({ file, isLoading }) {
  return (
    <div className="h-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 px-5 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            File
          </p>
          <h2 className="mt-1 text-base font-semibold text-zinc-100">
            {file?.displayPath || "No file selected"}
          </h2>
        </div>
      </div>

      <div className="min-h-[calc(100vh-12rem)] overflow-auto bg-zinc-900">
        {isLoading ? (
          <p className="p-5 text-sm text-zinc-400">Loading file...</p>
        ) : file ? (
          <SyntaxHighlighter
            language={getLanguage(file.displayPath)}
            style={oneDark}
            customStyle={{
              margin: 0,
              minHeight: "calc(100vh - 12rem)",
              background: "#18181b",
              padding: "1.25rem",
              fontSize: "0.9rem",
              lineHeight: 1.65
            }}
            wrapLongLines
            showLineNumbers
          >
            {file.content}
          </SyntaxHighlighter>
        ) : (
          <p className="p-5 text-sm text-zinc-400">
            Choose a file from the sidebar to inspect its contents.
          </p>
        )}
      </div>
    </div>
  );
}
