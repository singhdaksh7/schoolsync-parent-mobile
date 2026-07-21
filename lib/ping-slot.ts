// Single-slot "drop-and-resume" buffer for background driver location pings
// (Phase 2B, item 21). Only the most recent position ever matters — the
// backend ping endpoint has no history/backlog concept, so queuing missed
// pings while offline would just replay stale positions once connectivity
// returns. Instead: every new position simply overwrites whatever hasn't
// been sent yet, and a failed/offline send is dropped outright rather than
// retried — the very next location update (~10-15s later, per the driver
// location task's interval) naturally carries a fresher position anyway.
export type Coords = { lat: number; lng: number };

export type LatestPositionSlot = {
  /** Overwrites whatever position was pending — never queues, never appends. */
  set: (coords: Coords) => void;
  /** Returns the pending position (if any) and clears the slot. */
  takeLatest: () => Coords | null;
  /** Read-only peek, does not clear the slot. */
  peek: () => Coords | null;
};

export function createLatestPositionSlot(): LatestPositionSlot {
  let pending: Coords | null = null;
  return {
    set(coords: Coords) {
      pending = coords;
    },
    takeLatest() {
      const value = pending;
      pending = null;
      return value;
    },
    peek() {
      return pending;
    },
  };
}
