const base = "";

export async function api<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers: HeadersInit = { ...(init?.headers as Record<string, string>) };
  let body = init?.body;
  if (init?.json !== undefined) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
    body = JSON.stringify(init.json);
  }
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers,
    body,
    credentials: "include",
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: string }).error)
        : res.statusText;
    throw new Error(msg);
  }
  return data as T;
}
