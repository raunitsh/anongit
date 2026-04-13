function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMappings(owner, repo, tree) {
  const pathMap = new Map();
  for (const entry of tree) {
    if (entry.path) {
      pathMap.set(entry.path, entry.path);
    }
  }

  return {
    repoName: "anonymous-repo",
    replacements: buildReplacementTable(owner, repo, pathMap),
    pathMap
  };
}

function buildReplacementTable(owner, repo, pathMap) {
  const table = [
    { from: owner, to: "anonymous-owner" },
    { from: repo, to: "anonymous-repo" }
  ];

  return table.filter((entry, index, array) => {
    if (!entry.from) {
      return false;
    }

    return array.findIndex((candidate) => candidate.from === entry.from) === index;
  });
}

function anonymizeContent(content, replacements) {
  return content;
}

function buildEntryList(tree, pathMap) {
  return tree
    .filter((entry) => entry.path)
    .map((entry) => ({
      path: entry.path,
      anonymizedPath: pathMap.get(entry.path),
      displayPath: entry.path,
      type: entry.type,
      size: entry.size || 0
    }))
    .sort((left, right) => {
      if (left.type !== right.type) {
        return left.type === "tree" ? -1 : 1;
      }

      return left.anonymizedPath.localeCompare(right.anonymizedPath);
    });
}

function buildStats(tree) {
  return tree.reduce(
    (stats, entry) => {
      if (entry.type === "blob") {
        stats.files += 1;
      }

      if (entry.type === "tree") {
        stats.directories += 1;
      }

      return stats;
    },
    { files: 0, directories: 0 }
  );
}

export { anonymizeContent, buildEntryList, buildMappings, buildStats };
