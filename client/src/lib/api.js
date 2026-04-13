const jsonHeaders = {
  "Content-Type": "application/json"
};

async function request(path, options = {}) {
  const response = await fetch(path, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export function importRepository(payload) {
  return request("/api/repos/import", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
}

export function createShareableSnapshot(payload) {
  return request("/api/repos/share", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
}

export function fetchSharedRepository(shareId) {
  return request(`/api/shared/${encodeURIComponent(shareId)}`);
}

export function fetchSharedFile(shareId, filePath) {
  const search = new URLSearchParams({ path: filePath });
  return request(`/api/shared/${encodeURIComponent(shareId)}/file?${search.toString()}`);
}

export function fetchFile(params) {
  const search = new URLSearchParams(params);
  return request(`/api/repos/file?${search.toString()}`);
}

export async function downloadSnapshot(payload) {
  const response = await fetch("/api/repos/export", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Export failed");
  }

  return response.blob();
}
