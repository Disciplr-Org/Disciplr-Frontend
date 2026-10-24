/*
 * Thin client for the Disciplr API (https://github.com/Disciplr Org/Disciplr-backend).
 *
 * The base URL comes from `VITE_API`. When it is unset, the app runs fully offline on the
 * bundled fixtures (see vaultService.ts).
 */
import type { Vault, VaultTransaction, Milestone } from "../types/vault";
import type { VaultActivityRecord } from "./vaultService";
import { verifyCreateIntegrity } from "./createIntegrity";

const raw = (import.meta.env?.VITE_API as string | undefined)?.trim();
export const API_BASE: string | null = raw ? raw.replace(/\/+$/, "") : null;
export const isApiEnabled = (): boolean => API_BASE !== null;

interface ApiMilestone { id: string; title: string; amount: string; dueDate: string; status: string }
export interface ApiVault {
  id: string; name?: string; creator: string; amount: string; status: string; startDate: string; endDate: string;
  verifier: string; successDestination: string; failureDestination: string; createdAt: string; updatedAt: string;
  milestones: ApiMilestone[]; activity?: ApiActivity[];
}

export interface ApiActivity { id: string; type: string; vaultId: string; amount: string; status: string; hash: string; memo: string; createdAt: string }

export type ApiErrorCode = "network" | "timeout" | "aborted" | "http" | "invalid_response";

export class ApiError extends Error {
  constructor(message: string, public status: number, readonly code: ApiErrorCode = "http") {
    super(message);
    this.name = "ApiError";
  }
}

export interface RequestOptions {
  method?: string;
  body?: BodyInit | null;
  headers?: HeadersInit;
  signal?: AbortSignal;
  timeoutMs?: number;
  retries?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RETRIES_GET = 2;
const MAX_RETRY_AFTER_MS = 5_000;
const BASE_BACKOFF_MS = 300;

function isAbortError(e: unknown): boolean {
  return !!e && typeof e === "object" && (e as { name?: string }).name === "AbortError";
}

/** Combine two abort signals, falling back to a manual combiner when AbortSignal.any is missing. */
function combineSignals(a: AbortSignal | undefined, b: AbortSignal): AbortSignal {
  if (!a) return b;
  const anyFn = (AbortSignal as unknown as { any?: (signals: AbortSignal[]) => AbortSignal }).any;
  if (typeof anyFn === "function") return anyFn([a, b]);
  if (a.aborted) return a;
  if (b.aborted) return b;
  const ctrl = new AbortController();
  const onabort = () => ctrl.abort();
  a.addEventListener("abort", onabort, { once: true });
  b.addEventListener("abort", onabort, { once: true });
  return ctrl.signal;
}

/** Sleep that rejects with an AbortError if the signal aborts during the wait. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function parseRetryAfter(headers: Headers): number | null {
  const v = headers.get("retry-after");
  if (!v) return null;
  const secs = Number(v);
  if (Number.isFinite(secs) && secs >= 0) return Math.min(secs * 1000, MAX_RETRY_AFTER_MS);
  const date = Date.parse(v);
  if (!Number.isNaN(date)) {
    const delta = date - Date.now();
    if (delta > 0) return Math.min(delta, MAX_RETRY_AFTER_MS);
  }
  return null;
}

function backoffMs(attempt: number): number {
  const exp = BASE_BACKOFF_MS * 2 ** attempt;
  const jitter = Math.random() * exp * 0.25;
  return Math.round(exp + jitter);
}

function isRetriableStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504 || status === 429;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  if (!API_BASE) throw new ApiError("API not configured", 0, "network");
  const method = (opts.method ?? "GET").toUpperCase();
  const isIdempotent = method === "GET" || method === "HEAD";
  const maxRetries = isIdempotent ? Math.max(0, opts.retries ?? MAX_RETRIES_GET) : 0;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const hasBody = opts.body !== undefined && opts.body !== null;

  const headers: Record<string, string> = {};
  if (hasBody) headers["content-type"] = "application/json";
  if (opts.headers) {
    const provided = new Headers(opts.headers as HeadersInit);
    provided.forEach((v, k) => { headers[k] = v; });
  }

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (opts.signal?.aborted) throw new ApiError("Request aborted", 0, "aborted");

    const timeoutCtrl = new AbortController();
    const timer = setTimeout(() => timeoutCtrl.abort(), timeoutMs);
    const combined = combineSignals(opts.signal, timeoutCtrl.signal);

    let res: Response;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method,
        body: hasBody ? opts.body : undefined,
        headers,
        signal: combined,
      });
    } catch (e) {
      clearTimeout(timer);
      if (opts.signal?.aborted) throw new ApiError("Request aborted", 0, "aborted");
      if (timeoutCtrl.signal.aborted) throw new ApiError("Request timed out", 0, "timeout");
      if (isAbortError(e)) throw new ApiError("Request aborted", 0, "aborted");
      if (attempt < maxRetries) {
        const wait = backoffMs(attempt);
        attempt++;
        try { await sleep(wait, opts.signal ?? new AbortController().signal); }
        catch { throw new ApiError("Request aborted", 0, "aborted"); }
        continue;
      }
      throw new ApiError("Could not reach the Disciplr API.", 0, "network");
    }
    clearTimeout(timer);

    if (!res.ok) {
      if (isIdempotent && isRetriableStatus(res.status) && attempt < maxRetries) {
        const retryAfter = parseRetryAfter(res.headers);
        const wait = retryAfter ?? backoffMs(attempt);
        attempt++;
        try { await sleep(wait, opts.signal ?? new AbortController().signal); }
        catch { throw new ApiError("Request aborted", 0, "aborted"); }
        continue;
      }
      const errorBody = (await res.json().catch(() => ({}))) as { error?: string; details?: string[] };
      const msg = [errorBody.error, ...(errorBody.details ?? [])].filter(Boolean).join(": ") || `HTTP ${res.status}`;
      throw new ApiError(msg, res.status, "http");
    }

    const body = (await res.json().catch(() => null)) as unknown;
    if (!body || typeof body !== "object" || !("data" in (body as object))) {
      throw new ApiError("Malformed API response", res.status, "invalid_response");
    }
    return (body as { data: T }).data;
  }
}

const toTx = (a: ApiActivity): VaultTransaction => ({
  id: a.id,
  type: a.type as VaultTransaction["type"],
  hash: a.hash,
  timestamp: a.createdAt,
  amount: Number(a.amount),
});

export function toVault(v: ApiVault): Vault {
  const milestones: Milestone[] = v.milestones.map((m) => ({
    id: m.id,
    title: m.title,
    description: `${Number(m.amount).toLocaleString()} USDC, due ${new Date(m.dueDate).toLocaleDateString()}`,
    criteria: m.title,
    status: m.status === "completed" ? "validated" : m.status === "failed" ? "failed" : "pending",
    ...(m.status === "completed" ? { validatedAt: v.updatedAt || v.createdAt } : {}),
  }));
  return {
    id: v.id,
    name: v.name || `Vault ${v.id}`,
    status: v.status as Vault["status"],
    amount: Number(v.amount),
    currency: "USDC",
    createdAt: v.createdAt,
    deadline: v.endDate,
    creatorAddress: v.creator,
    verifierAddress: v.verifier,
    successAddress: v.successDestination,
    failureAddress: v.failureDestination,
    contractAddress: v.creator, // settlement is simulated by the API; no per-vault contract yet
    milestones,
    transactions: (v.activity ?? []).map(toTx),
  };
}

export interface SignalOptions { signal?: AbortSignal }

export const apiListVaults = async (opts: SignalOptions = {}): Promise<Vault[]> =>
  (await request<ApiVault[]>("/vaults", { signal: opts.signal })).map(toVault);

export async function apiGetVault(id: string, opts: SignalOptions = {}): Promise<Vault | undefined> {
  try {
    return toVault(await request<ApiVault>(`/vaults/${encodeURIComponent(id)}`, { signal: opts.signal }));
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return undefined;
    throw e;
  }
}

export async function apiListActivity(opts: SignalOptions = {}): Promise<VaultActivityRecord[]> {
  return request<VaultActivityRecord[]>("/activity", { signal: opts.signal });
}

export async function apiCreateVault(input: unknown, opts: SignalOptions = {}): Promise<Vault> {
  const response = await request<{ vault?: ApiVault } & ApiVault>("/vaults", {
    method: "POST",
    body: JSON.stringify(input),
    signal: opts.signal,
  });
  const candidate = (response as { vault?: ApiVault }).vault ?? (response as ApiVault);
  return toVault(candidate);
}

/**
 * Validate the next pending milestone of a vault.
 * Sends a POST to `/vaults/:id/milestones/next/validate`; not retried since it is not idempotent.
 */
export async function apiValidateNextMilestone(id: string, opts: SignalOptions = {}): Promise<Vault> {
  const response = await request<ApiVault>(`/vaults/${encodeURIComponent(id)}/milestones/next/validate`, {
    method: "POST",
    body: JSON.stringify({}),
    signal: opts.signal,
  });
  return toVault(response);
}

/**
 * Mark a vault as failed.
 * Sends a POST to `/vaults/:id/fail`; not retried since it is not idempotent.
 */
export async function apiFailVault(id: string, opts: SignalOptions = {}): Promise<Vault> {
  const response = await request<ApiVault>(`/vaults/${encodeURIComponent(id)}/fail`, {
    method: "POST",
    body: JSON.stringify({}),
    signal: opts.signal,
  });
  return toVault(response);
}
