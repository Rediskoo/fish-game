type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    },
    credentials: "include"
  });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as ApiResponse<T>)
    : ({ ok: false, error: (await response.text()) || response.statusText || "Request failed" } satisfies ApiResponse<T>);

  if (!payload.ok) {
    throw new Error(payload.error);
  }

  return payload.data;
}
