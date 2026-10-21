export type Issue = { path: string; message: string };

export type Failure = { ok: false; status: number; message: string; issues?: Issue[]; usedBy?: string[] };
export type Result<T> = (T & { ok: true }) | Failure;

/** Thin fetch wrapper: always resolves, never throws, and bounces to the login page on 401. */
export async function api<T = object>(url: string, init?: RequestInit): Promise<Result<T>> {
  try {
    const res = await fetch(url, { credentials: 'same-origin', ...init });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.status === 401 && !url.includes('/login')) {
      window.location.href = '/admin/login';
    }
    if (res.ok && data.ok !== false) return data as Result<T>;
    return {
      ok: false,
      status: res.status,
      message: typeof data.message === 'string' ? data.message : `Request failed (${res.status})`,
      issues: Array.isArray(data.issues) ? (data.issues as Issue[]) : undefined,
      usedBy: Array.isArray(data.usedBy) ? (data.usedBy as string[]) : undefined,
    };
  } catch {
    return { ok: false, status: 0, message: 'Network error — is the server running?' };
  }
}

export const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export type MediaItem = {
  name: string;
  url: string;
  size: number;
  modifiedAt: string;
  type: string;
  kind: 'image' | 'pdf';
  usedBy: string[];
};

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
