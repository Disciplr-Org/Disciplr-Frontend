/**
 * Thin client for the Disciplr API (https://github.com/Disciplr-Org/Disciplr-backend).
 *
 * The base URL comes from `VITE_API`. When it is unset, the app runs fully offline on the
 * bundled fixtures (see vaultService.ts).
 */
import type { Vault, VaultTransaction, Milestone } from "../types/vault";
import type { VaultActivityRecord } from "./vaultService";
import { verifyCreateIntegrity } from "./createIntegrity";
import { formatDate, formatUsdc } from "../utils/format";
import { withTimeout, ConnectTimeoutError } from "../utils/withTimeout";

export const getRawApiBase = (): string | null => {
  const raw = (import.meta.env?.VITE_API as string | undefined)?.trim();
  return raw ? raw.replace(/\/+$/, "") : null;
};

export const API_BASE: string | null = getRawApiBase();
export const isApiEnabled = (): boolean => getRawApiBase() !== null;


interface ApiMilestone { id: string; title: string; amount: string; dueDate: string; status: string }
export interface ApiVault {
  id: string; name?: string; creator: string; amount: string; status: string; startDate: string; endDate: string;
  verifier: string; successDestination: string; failureDestination: string; createdAt: string; updatedAt: string;
  milestones: ApiMilestone[]; activity?: ApiActivity[];
}

export interface ApiActivity { id: string; type: string; vaultId: string; amount: string; status: string; hash: string; memo: string; createdAt: string }

import { useConnectivityStore } from "./connectivity";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details: string[] = [],
    public serverError?: string,
    public attempts: number = 1,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
export const DEFAULT_MAX_RETRIES = 2;
export const DEFAULT_BASE_BACKOFF_MS = 300;
export const RETRYABLE_STATUSES = new Set([502, 503, 504]);

export type SleepFn = (ms: number, signal?: AbortSignal) => Promise<void>;

export interface FetchPolicyOptions {
  timeoutMs?: number;
  maxRetries?: number;
  baseBackoffMs?: number;
  sleep?: SleepFn;
  random?: () => number;
  fetchImpl?: typeof fetch;
}

export interface FetchPolicyResult {
  response: Response;
  attempts: number;
}

function createAbortError(signal?: AbortSignal): Error {
  if (signal?.reason instanceof Error) {
    return signal.reason;
  }
  const err = new Error("The operation was aborted.");
  err.name = "AbortError";
  return err;
}

function isAbortError(err: unknown, signal?: AbortSignal): boolean {
  if (signal?.aborted) return true;
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name?: unknown }).name === "AbortError"
  );
}

/**
 * Computes jittered exponential backoff in milliseconds.
 * Full-half jitter: [0.5 * base * 2^retryIndex, base * 2^retryIndex].
 */
export function computeBackoffMs(
  retryIndex: number,
  baseMs: number = DEFAULT_BASE_BACKOFF_MS,
  random: () => number = Math.random,
): number {
  const exponential = baseMs * 2 ** retryIndex;
  const jitter = 0.5 + random() * 0.5;
  return Math.round(exponential * jitter);
}

export function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(createAbortError(signal));
  }
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(createAbortError(signal));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function fetchWithPolicy(
  url: string,
  init?: RequestInit,
  policy?: FetchPolicyOptions,
): Promise<FetchPolicyResult> {
  const method = (init?.method ?? "GET").toUpperCase();
  const isIdempotent = method === "GET";
  const maxRetries = isIdempotent ? (policy?.maxRetries ?? DEFAULT_MAX_RETRIES) : 0;
  const timeoutMs = policy?.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const baseBackoffMs = policy?.baseBackoffMs ?? DEFAULT_BASE_BACKOFF_MS;
  const sleep = policy?.sleep ?? defaultSleep;
  const random = policy?.random ?? Math.random;
  const fetchFn = policy?.fetchImpl ?? fetch;
  const callerSignal = init?.signal ?? undefined;

  if (callerSignal?.aborted) {
    throw createAbortError(callerSignal);
  }

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const attemptController = new AbortController();
    let timedOut = false;

    const onCallerAbort = () => {
      attemptController.abort(callerSignal?.reason);
    };

    if (callerSignal) {
      if (callerSignal.aborted) {
        throw createAbortError(callerSignal);
      }
      callerSignal.addEventListener("abort", onCallerAbort, { once: true });
    }

    let res: Response;
    try {
      const wrapped = withTimeout(
        fetchFn(url, { ...init, signal: attemptController.signal }),
        timeoutMs,
        () => {
          timedOut = true;
          attemptController.abort();
        },
      );
      res = await wrapped;
    } catch (err) {
      if (callerSignal?.aborted || (!timedOut && isAbortError(err))) {
        throw err;
      }
      if (timedOut || err instanceof ConnectTimeoutError) {
        throw new ApiError(
          `Request timed out after ${timeoutMs}ms.`,
          0,
          [],
          undefined,
          attempt,
        );
      }
      if (attempt <= maxRetries) {
        const delay = computeBackoffMs(attempt - 1, baseBackoffMs, random);
        await sleep(delay, callerSignal);
        continue;
      }
      throw new ApiError("Could not reach the Disciplr API.", 0, [], undefined, attempt);
    } finally {
      callerSignal?.removeEventListener("abort", onCallerAbort);
    }

    if (RETRYABLE_STATUSES.has(res.status) && attempt <= maxRetries) {
      const delay = computeBackoffMs(attempt - 1, baseBackoffMs, random);
      await sleep(delay, callerSignal);
      continue;
    }

    return { response: res, attempts: attempt };
  }

  throw new ApiError("Could not reach the Disciplr API.", 0, [], undefined, maxRetries + 1);
}

export function classifyCreateError(err: unknown): "rejected" | "unknown" {
  if (
    err instanceof ApiError &&
    err.status >= 400 &&
    err.status < 500 &&
    err.status !== 408 &&
    err.status !== 429
  ) {
    return "rejected";
  }
  return "unknown";
}

async function request<T>(
  path: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const baseUrl = getRawApiBase();
  if (!baseUrl) throw new ApiError("API not configured", 0);
  const { timeoutMs, ...fetchInit } = init ?? {};
  let res: Response;
  let attempts: number;
  try {
    const result = await fetchWithPolicy(
      `${baseUrl}${path}`,
      {
        ...fetchInit,
        headers: { "content-type": "application/json", ...(fetchInit.headers ?? {}) },
      },
      timeoutMs !== undefined ? { timeoutMs } : undefined,
    );
    res = result.response;
    attempts = result.attempts;
  } catch (err) {
    if (isAbortError(err, fetchInit.signal ?? undefined)) {
      throw err;
    }
    useConnectivityStore.getState().reportApiFailure(0);
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError("Could not reach the Disciplr API.", 0);
  }
  const body = (await res.json().catch(() => ({}))) as {
    error?: unknown;
    details?: unknown;
    data?: T;
  };
  if (!res.ok) {
    if (res.status >= 500) {
      useConnectivityStore.getState().reportApiFailure(res.status);
    }
    const serverError = typeof body.error === "string" ? body.error : undefined;
    const details = Array.isArray(body.details)
      ? body.details.filter((detail): detail is string => typeof detail === "string")
      : [];
    throw new ApiError(
      [serverError, ...details].filter(Boolean).join(": ") || `HTTP ${res.status}`,
      res.status,
      details,
      serverError,
      attempts,
    );
  }
  return body.data as T;
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
    description: `${formatUsdc(m.amount)} USDC, due ${formatDate(m.dueDate)}`,
    criteria: m.title,
    status: m.status === "completed" ? "validated" : m.status === "failed" ? "failed" : "pending",
    dueDate: m.dueDate,
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

export interface VaultFilter { creator?: string; status?: string }

/** Builds `?creator=..&status=..` with every value URI-encoded; empty when no filter is set. */
export function buildVaultQuery(filter?: VaultFilter): string {
  const parts: string[] = [];
  if (filter?.creator) parts.push(`creator=${encodeURIComponent(filter.creator)}`);
  if (filter?.status) parts.push(`status=${encodeURIComponent(filter.status)}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

export const apiListVaults = async (
  filter?: VaultFilter,
  signal?: AbortSignal,
): Promise<Vault[]> => {
  if (!isApiEnabled()) throw new ApiError("API not configured", 0);
  return (await request<ApiVault[]>(`/vaults${buildVaultQuery(filter)}`, signal ? { signal } : undefined)).map(toVault);
};

/** Raw `/transactions` feed (all vaults); callers filter to the vaults they own. */
export const apiListTransactions = (): Promise<ApiActivity[]> => {
  if (!isApiEnabled()) throw new ApiError("API not configured", 0);
  return request<ApiActivity[]>("/transactions");
};

export async function apiGetVault(id: string): Promise<Vault | undefined> {
  if (!isApiEnabled()) throw new ApiError("API not configured", 0);
  try {
    return toVault(await request<ApiVault>(`/vaults/${encodeURIComponent(id)}`));
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return undefined;
    throw e;
  }
}

export async function apiCreateVault(input: {
  name: string; amount: number; deadline: string; creator: string; verifier: string;
  successAddress: string; failureAddress: string; milestones: { title: string }[];
}): Promise<Vault> {
  if (!isApiEnabled()) throw new ApiError("API not configured", 0);
  const per = input.amount / Math.max(1, input.milestones.length);
  const start = Date.now();
  const end = new Date(input.deadline).getTime();
  const step = (end - start) / Math.max(1, input.milestones.length);
  const v = await request<ApiVault>("/vaults", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      creator: input.creator,
      verifier: input.verifier,
      amount: input.amount,
      endDate: new Date(end).toISOString(),
      successDestination: input.successAddress,
      failureDestination: input.failureAddress,
      milestones: input.milestones.map((m, i) => ({
        title: m.title,
        amount: Number(per.toFixed(7)),
        dueDate: new Date(start + step * (i + 1)).toISOString(),
      })),
    }),
  });
  const vault = toVault(v);
  verifyCreateIntegrity(
    {
      creator: input.creator,
      verifier: input.verifier,
      amount: input.amount,
      successAddress: input.successAddress,
      failureAddress: input.failureAddress,
    },
    v,
    vault,
  );
  return vault;
}


export async function apiValidateNextMilestone(vault: Vault, actor: string): Promise<void> {
  if (!isApiEnabled()) throw new ApiError("API not configured", 0);
  const next = vault.milestones.find((m) => m.status === "pending");
  if (!next) throw new Error("No pending milestone to validate.");
  await request(`/vaults/${encodeURIComponent(vault.id)}/milestones/${encodeURIComponent(next.id)}/validate`, {
    method: "POST",
    body: JSON.stringify({ verifier: actor }),
  });
}

export async function apiFailVault(vault: Vault, actor: string): Promise<void> {
  if (!isApiEnabled()) throw new ApiError("API not configured", 0);
  await request(`/vaults/${encodeURIComponent(vault.id)}/fail`, {
    method: "POST",
    body: JSON.stringify({ verifier: actor }),
  });
}

export interface ListActivityOptions {
  vaultId?: string;
}

export async function apiListActivity(options: ListActivityOptions = {}): Promise<VaultActivityRecord[]> {
  if (!isApiEnabled()) throw new ApiError("API not configured", 0);
  const query = options.vaultId ? `?vaultId=${encodeURIComponent(options.vaultId)}` : "";
  const [acts, vaults] = await Promise.all([
    request<ApiActivity[]>(`/transactions${query}`),
    request<ApiVault[]>("/vaults"),
  ]);
  const names = new Map(vaults.map((v) => [v.id, v] as const));
  return acts.map((a) => {
    const v = names.get(a.vaultId);
    const ts = new Date(a.createdAt);
    return {
      id: a.id,
      type: a.type as VaultActivityRecord["type"],
      vaultId: a.vaultId,
      vault: v ? v.name || a.vaultId : a.vaultId,
      amount: Number(a.amount),
      hash: a.hash,
      status: a.status as VaultActivityRecord["status"],
      from: v?.creator ?? "",
      to: a.type === "redirect" ? (v ? v.failureDestination ?? "" : "") : (v ? v.successDestination ?? "" : ""),
      timestamp: ts,
      memo: a.memo,
    };
  });
}

export interface ApiStats {
  totalVaults: number; active: number; completed: number; failed: number;
  totalLocked: number; totalReleased: number; totalRedirected: number; successRate: number | null;
}

export async function apiStats(creator?: string): Promise<ApiStats> {
  if (!isApiEnabled()) throw new ApiError("API not configured", 0);
  return request(`/stats${buildVaultQuery({ creator })}`);
}
