// Shared HTTP client for the SchoolSync mobile app. All screens should call
// through here rather than `fetch` directly, so base-URL resolution, auth
// headers, timeouts, error mapping, and 401/429 behavior stay in one place.
import { parseCostGuardError } from './cost-guard-error';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/$/, '');
// HTTPS is required for every build (pilot and production alike) — a bearer
// token travels on every request, so a plain-http base URL would leak it in
// transit. Fail closed with a clear config error rather than silently
// downgrading transport security.
export const API_CONFIG_ERROR = !API_BASE_URL
  ? 'Backend API URL is not configured. Set EXPO_PUBLIC_API_URL before running the app.'
  : !/^https:\/\//i.test(API_BASE_URL)
    ? 'Backend API URL must use https:// — refusing to send requests (and bearer tokens) over an insecure connection.'
    : null;

const DEFAULT_TIMEOUT_MS = 20000;

export class ApiError extends Error {
  status: number;
  code: string;
  retryAfterSeconds: number | null;
  constructor(message: string, status: number, code = 'UNKNOWN_ERROR', retryAfterSeconds: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Session expired. Please log in again.', code = 'UNAUTHORIZED') {
    super(message, 401, code);
    this.name = 'UnauthorizedError';
  }
}

export class RateLimitedError extends ApiError {
  constructor(message: string, code: string, retryAfterSeconds: number | null) {
    super(message, 429, code, retryAfterSeconds);
    this.name = 'RateLimitedError';
  }
}

/** Network failure or client-side timeout — distinct from ApiError so callers
 * (notably session bootstrap) can tell "the server rejected this" apart from
 * "we couldn't reach the server," and must not treat the latter as a reason
 * to destroy a stored session. */
export class NetworkError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

export class TimeoutError extends NetworkError {
  constructor(message = 'Request timed out.') {
    super(message);
    this.name = 'TimeoutError';
  }
}

function ensureApiBaseUrl() {
  if (API_CONFIG_ERROR) throw new Error(API_CONFIG_ERROR);
  return API_BASE_URL;
}

// Single global 401 invalidation path (Phase 6 requirement #7): a burst of
// concurrent requests that all come back 401 (e.g. every card on a dashboard
// refreshing at once after the session was revoked server-side) must trigger
// exactly one logout/clear-session/reset-to-login, not one per response.
let unauthorizedHandler: (() => void) | null = null;
let invalidationInFlight = false;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

/** Call after any successful login/session-restore so a future 401 can trigger the handler again. */
export function resetUnauthorizedGuard() {
  invalidationInFlight = false;
}

function triggerUnauthorized() {
  if (invalidationInFlight) return;
  invalidationInFlight = true;
  unauthorizedHandler?.();
}

// In-flight GET de-duplication (Phase 6 requirement #9). Keyed by token +
// path (path already includes the query string), so identical concurrent GETs
// for the same session share one network request/response. Mutations are
// never de-duplicated. Cleared on logout via clearGetDedupCache().
const inFlightGets = new Map<string, Promise<unknown>>();

export function clearGetDedupCache() {
  inFlightGets.clear();
}

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

export interface ApiRequestOptions extends RequestInit {
  /** Milliseconds before the request is aborted as a TimeoutError. Default 20000. */
  timeoutMs?: number;
}

/** Dev/preview-only, PII-safe: never log tokens, headers, cookies, or body
 * content beyond a short sanitized prefix used only to distinguish
 * HTML/empty/truncated bodies from real JSON. */
function logApiDiagnostic(path: string, response: Response, rawText: string, parseOk: boolean, parsed: unknown) {
  if (!__DEV__) return;
  const trimmed = rawText.trimStart();
  const topLevelType = !parseOk
    ? 'unparseable'
    : Array.isArray(parsed)
      ? 'array'
      : parsed === null
        ? 'null'
        : typeof parsed;
  const info: Record<string, unknown> = {
    method: 'GET',
    pathname: path,
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get('Content-Type'),
    contentLength: response.headers.get('Content-Length'),
    rawTextLength: rawText.length,
    jsonParseOk: parseOk,
    topLevelType,
  };
  if (parseOk && topLevelType === 'object') info.topLevelKeys = Object.keys(parsed as Record<string, unknown>);
  if (!parseOk || topLevelType !== 'object') {
    info.emptyBody = rawText.length === 0;
    info.beginsWithAngleBracket = trimmed.startsWith('<');
    info.looksLikeHtml = /^<!doctype html|^<html/i.test(trimmed);
    info.sanitizedPreview = trimmed.slice(0, 120);
  }
  // eslint-disable-next-line no-console
  console.log('[api-client]', JSON.stringify(info));
}

async function doRequest<T>(path: string, options: ApiRequestOptions, token?: string): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = options;
  const isForm = isFormData(init.body);

  const headers: Record<string, string> = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...(init.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${ensureApiBaseUrl()}${path}`, { ...init, headers, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) throw new TimeoutError();
    throw new NetworkError(err instanceof Error ? err.message : 'Network request failed.', err);
  } finally {
    clearTimeout(timeout);
  }

  // Read the body exactly once as text, then attempt to parse it — a
  // Response body can only be consumed a single time, so `.json()` and
  // `.text()` must never both be called on the same response.
  const rawText = await response.text();

  // A JSON parse failure on an error response just means the error body
  // wasn't JSON — {} lets parseCostGuardError fall back to a generic message.
  // On an OK response, though, a parse failure (or an empty body) means the
  // caller would otherwise receive `{}` as if it were a valid T (e.g. `{}` in
  // place of `{ slots: [...] }`), which silently turns required arrays into
  // `undefined` for every consumer. That must surface as an error, not a
  // fabricated empty success payload — see MALFORMED_RESPONSE.
  let payload: unknown;
  let parseOk = true;
  if (rawText.length === 0) {
    parseOk = false;
    payload = {};
  } else {
    try {
      payload = JSON.parse(rawText);
    } catch (parseError) {
      parseOk = false;
      payload = {};
    }
  }

  if (!parseOk) {
    logApiDiagnostic(path, response, rawText, false, undefined);
    if (response.ok) {
      throw new ApiError('Received a malformed response from the server.', response.status, 'MALFORMED_RESPONSE');
    }
    // payload stays {} — parseCostGuardError falls back to a generic message below.
  } else if (__DEV__) {
    logApiDiagnostic(path, response, rawText, true, payload);
  }

  if (!response.ok) {
    const parsed = parseCostGuardError(response, payload);

    if (response.status === 401) {
      triggerUnauthorized();
      throw new UnauthorizedError(parsed.message, parsed.code);
    }
    if (response.status === 429) {
      throw new RateLimitedError(parsed.message, parsed.code, parsed.retryAfterSeconds);
    }
    // 403 and everything else: propagate as a plain ApiError. Callers decide
    // what a permission/feature denial means for their screen — this layer
    // must never log the user out or otherwise treat 403 like 401.
    throw new ApiError(parsed.message, response.status, parsed.code, parsed.retryAfterSeconds);
  }

  return payload as T;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}, token?: string): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') return doRequest<T>(path, options, token);

  const dedupeKey = `${token ?? 'anon'}::${path}`;
  const pending = inFlightGets.get(dedupeKey);
  if (pending) return pending as Promise<T>;

  const promise = doRequest<T>(path, options, token).finally(() => {
    inFlightGets.delete(dedupeKey);
  });
  inFlightGets.set(dedupeKey, promise);
  return promise;
}
