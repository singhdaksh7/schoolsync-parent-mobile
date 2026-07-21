// Shared background-job polling engine (frozen cadence contract):
//   0-1 minute:  5s
//   1-5 minutes: 15s
//   5+ minutes:  30s
//   terminal:    stop
// Pure/testable — no direct React/AppState dependency; hooks/useJobPoller.ts
// wires this to foreground/background lifecycle for actual screens.
import type { JobStatusResponse, JobStatusValue } from './types';

export function isTerminalJobStatus(status: JobStatusValue): boolean {
  return status === 'COMPLETED' || status === 'FAILED';
}

export function pollIntervalMs(elapsedMs: number): number {
  if (elapsedMs < 60_000) return 5_000;
  if (elapsedMs < 5 * 60_000) return 15_000;
  return 30_000;
}

export type JobPollerOptions = {
  fetchStatus: () => Promise<JobStatusResponse>;
  onUpdate: (result: JobStatusResponse) => void;
  onError?: (error: unknown) => void;
  /** Injectable for deterministic tests. */
  now?: () => number;
  setTimeoutFn?: typeof setTimeout;
  clearTimeoutFn?: typeof clearTimeout;
};

/** One active job's polling lifecycle. Never exposes job internals beyond
 * what JobStatusResponse already carries (status/progress/item counts) —
 * the caller decides what to render. */
export class JobPoller {
  private readonly fetchStatus: () => Promise<JobStatusResponse>;
  private readonly onUpdate: (result: JobStatusResponse) => void;
  private readonly onError?: (error: unknown) => void;
  private readonly now: () => number;
  private readonly setTimeoutFn: typeof setTimeout;
  private readonly clearTimeoutFn: typeof clearTimeout;

  private startedAt: number;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = true;
  private lastStatus: JobStatusValue | null = null;

  constructor(options: JobPollerOptions) {
    this.fetchStatus = options.fetchStatus;
    this.onUpdate = options.onUpdate;
    this.onError = options.onError;
    this.now = options.now ?? Date.now;
    this.setTimeoutFn = options.setTimeoutFn ?? setTimeout;
    this.clearTimeoutFn = options.clearTimeoutFn ?? clearTimeout;
    this.startedAt = this.now();
  }

  get isStopped(): boolean {
    return this.stopped;
  }

  get isTerminal(): boolean {
    return this.lastStatus !== null && isTerminalJobStatus(this.lastStatus);
  }

  /** Starts polling now (immediate fetch, then scheduled per the cadence). */
  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    this.startedAt = this.now();
    this.tick();
  }

  /** Pauses the timer without discarding state — resume() picks the cadence
   * back up from the ORIGINAL start time, not a fresh countdown. */
  pause(): void {
    if (this.timer) this.clearTimeoutFn(this.timer);
    this.timer = null;
  }

  /** Foreground resume: re-fetch immediately (never wait out the remaining
   * interval after coming back from background). */
  resume(): void {
    if (this.stopped || this.isTerminal) return;
    this.pause();
    this.tick();
  }

  stop(): void {
    this.stopped = true;
    this.pause();
  }

  private async tick(): Promise<void> {
    if (this.stopped) return;
    try {
      const result = await this.fetchStatus();
      if (this.stopped) return;
      this.lastStatus = result.status;
      this.onUpdate(result);
      if (isTerminalJobStatus(result.status)) {
        this.stop();
        return;
      }
    } catch (error) {
      if (this.stopped) return;
      this.onError?.(error);
      // Transient failure — keep polling on the same cadence rather than
      // stopping (a network blip must not silently abandon a real job).
    }
    if (this.stopped) return;
    const elapsed = this.now() - this.startedAt;
    const delay = pollIntervalMs(elapsed);
    this.timer = this.setTimeoutFn(() => this.tick(), delay);
  }
}
