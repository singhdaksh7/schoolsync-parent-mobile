// Authenticated PDF download for report cards. apiRequest() (lib/api-client.ts)
// always calls response.json(), so a binary PDF response needs its own raw
// fetch — same bearer auth, same error mapping (parseCostGuardError), same
// timeout/network-error semantics as every other request.
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL, API_CONFIG_ERROR, ApiError, NetworkError, TimeoutError, UnauthorizedError } from './api-client';
import { parseCostGuardError } from './cost-guard-error';

const PDF_CACHE_DIR = `${FileSystem.cacheDirectory}schoolsync-report-cards/`;
const DOWNLOAD_TIMEOUT_MS = 30_000;

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Pure JS base64 encoder — avoids depending on `btoa` (not guaranteed in the
 * Hermes runtime) or Node's `Buffer` (not available in Hermes either). */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : undefined;
    result += BASE64_CHARS[b1 >> 2];
    result += BASE64_CHARS[((b1 & 0x03) << 4) | (b2 !== undefined ? b2 >> 4 : 0)];
    result += b2 !== undefined ? BASE64_CHARS[((b2 & 0x0f) << 2) | (b3 !== undefined ? b3 >> 6 : 0)] : '=';
    result += b3 !== undefined ? BASE64_CHARS[b3 & 0x3f] : '=';
  }
  return result;
}

export interface DownloadedPdf {
  uri: string;
  cleanup: () => Promise<void>;
}

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(PDF_CACHE_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(PDF_CACHE_DIR, { intermediates: true });
}

/** Downloads a bearer-authenticated PDF into a private temp cache file. The
 * caller owns the returned `cleanup()` — report cards are never kept
 * indefinitely (see clearPdfCache for the broader sweep). */
export async function downloadAuthenticatedPdf(path: string, token: string, filename: string): Promise<DownloadedPdf> {
  if (API_CONFIG_ERROR) throw new Error(API_CONFIG_ERROR);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted) throw new TimeoutError();
    throw new NetworkError(err instanceof Error ? err.message : 'Network request failed.', err);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let body: unknown = {};
    try {
      body = await response.json();
    } catch {
      // error responses on this route are JSON; a non-JSON body just means an empty error object here.
    }
    const parsed = parseCostGuardError(response, body);
    if (response.status === 401) throw new UnauthorizedError(parsed.message, parsed.code);
    throw new ApiError(parsed.message, response.status, parsed.code, parsed.retryAfterSeconds);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = arrayBufferToBase64(arrayBuffer);

  await ensureDir();
  const uri = `${PDF_CACHE_DIR}${filename}`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });

  return { uri, cleanup: () => FileSystem.deleteAsync(uri, { idempotent: true }) };
}

export async function openOrSharePdf(uri: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (available) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
}

/** Sweeps the whole private PDF cache directory — call on logout and
 * opportunistically on app start, so a downloaded report card is never kept
 * indefinitely on-device. */
export async function clearPdfCache(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PDF_CACHE_DIR);
  if (info.exists) await FileSystem.deleteAsync(PDF_CACHE_DIR, { idempotent: true });
}
