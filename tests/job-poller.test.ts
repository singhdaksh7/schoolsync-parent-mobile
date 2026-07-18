import { JobPoller, isTerminalJobStatus, pollIntervalMs } from '@/lib/job-poller';
import type { JobStatusResponse } from '@/lib/types';

describe('pollIntervalMs — frozen cadence contract', () => {
  it('polls every 5s in the first minute', () => {
    expect(pollIntervalMs(0)).toBe(5_000);
    expect(pollIntervalMs(59_999)).toBe(5_000);
  });

  it('polls every 15s between 1 and 5 minutes', () => {
    expect(pollIntervalMs(60_000)).toBe(15_000);
    expect(pollIntervalMs(4 * 60_000)).toBe(15_000);
  });

  it('polls every 30s after 5 minutes', () => {
    expect(pollIntervalMs(5 * 60_000)).toBe(30_000);
    expect(pollIntervalMs(60 * 60_000)).toBe(30_000);
  });
});

describe('isTerminalJobStatus', () => {
  it('COMPLETED and FAILED are terminal; PENDING and RUNNING are not', () => {
    expect(isTerminalJobStatus('COMPLETED')).toBe(true);
    expect(isTerminalJobStatus('FAILED')).toBe(true);
    expect(isTerminalJobStatus('PENDING')).toBe(false);
    expect(isTerminalJobStatus('RUNNING')).toBe(false);
  });
});

describe('JobPoller — lifecycle', () => {
  let currentTime = 0;
  const now = () => currentTime;

  beforeEach(() => {
    currentTime = 0;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function statusResult(overrides: Partial<JobStatusResponse> = {}): JobStatusResponse {
    return { status: 'RUNNING', totalItems: 10, processedItems: 0, ...overrides };
  }

  it('fetches immediately on start, then again after the first-minute 5s interval', async () => {
    const fetchStatus = jest.fn().mockResolvedValue(statusResult());
    const onUpdate = jest.fn();
    const poller = new JobPoller({ fetchStatus, onUpdate, now, setTimeoutFn: setTimeout, clearTimeoutFn: clearTimeout });

    poller.start();
    await Promise.resolve();
    await Promise.resolve();
    expect(fetchStatus).toHaveBeenCalledTimes(1);

    currentTime += 5_000;
    await jest.advanceTimersByTimeAsync(5_000);
    expect(fetchStatus).toHaveBeenCalledTimes(2);

    poller.stop();
  });

  it('stops polling once a terminal status is received', async () => {
    const fetchStatus = jest.fn().mockResolvedValue(statusResult({ status: 'COMPLETED' }));
    const onUpdate = jest.fn();
    const poller = new JobPoller({ fetchStatus, onUpdate, now, setTimeoutFn: setTimeout, clearTimeoutFn: clearTimeout });

    poller.start();
    await Promise.resolve();
    await Promise.resolve();
    expect(fetchStatus).toHaveBeenCalledTimes(1);
    expect(poller.isStopped).toBe(true);
    expect(poller.isTerminal).toBe(true);

    await jest.advanceTimersByTimeAsync(60_000);
    expect(fetchStatus).toHaveBeenCalledTimes(1); // no further polling after terminal
  });

  it('pause() stops the timer without discarding elapsed-time state; resume() re-fetches immediately', async () => {
    const fetchStatus = jest.fn().mockResolvedValue(statusResult());
    const onUpdate = jest.fn();
    const poller = new JobPoller({ fetchStatus, onUpdate, now, setTimeoutFn: setTimeout, clearTimeoutFn: clearTimeout });

    poller.start();
    await Promise.resolve();
    await Promise.resolve();
    expect(fetchStatus).toHaveBeenCalledTimes(1);

    poller.pause();
    currentTime += 30_000;
    await jest.advanceTimersByTimeAsync(30_000);
    expect(fetchStatus).toHaveBeenCalledTimes(1); // paused — no background polling

    poller.resume();
    await Promise.resolve();
    await Promise.resolve();
    expect(fetchStatus).toHaveBeenCalledTimes(2); // foreground resume re-fetches immediately, not a stale wait

    poller.stop();
  });

  it('a transient fetch error does not stop polling', async () => {
    const fetchStatus = jest.fn().mockRejectedValueOnce(new Error('network blip')).mockResolvedValueOnce(statusResult());
    const onUpdate = jest.fn();
    const onError = jest.fn();
    const poller = new JobPoller({ fetchStatus, onUpdate, onError, now, setTimeoutFn: setTimeout, clearTimeoutFn: clearTimeout });

    poller.start();
    await Promise.resolve();
    await Promise.resolve();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(poller.isStopped).toBe(false);

    currentTime += 5_000;
    await jest.advanceTimersByTimeAsync(5_000);
    expect(fetchStatus).toHaveBeenCalledTimes(2);
    expect(onUpdate).toHaveBeenCalledTimes(1);

    poller.stop();
  });
});
