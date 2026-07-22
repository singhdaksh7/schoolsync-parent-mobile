import { createLatestPositionSlot } from '@/lib/ping-slot';

describe('createLatestPositionSlot — drop-and-resume background ping buffer', () => {
  it('starts empty', () => {
    const slot = createLatestPositionSlot();
    expect(slot.peek()).toBeNull();
    expect(slot.takeLatest()).toBeNull();
  });

  it('set() then takeLatest() returns exactly what was set', () => {
    const slot = createLatestPositionSlot();
    slot.set({ lat: 1, lng: 2 });
    expect(slot.takeLatest()).toEqual({ lat: 1, lng: 2 });
  });

  it('takeLatest() clears the slot — a second call returns null', () => {
    const slot = createLatestPositionSlot();
    slot.set({ lat: 1, lng: 2 });
    slot.takeLatest();
    expect(slot.takeLatest()).toBeNull();
  });

  it('multiple set() calls before a take overwrite in place — no queue is built up', () => {
    const slot = createLatestPositionSlot();
    slot.set({ lat: 1, lng: 1 });
    slot.set({ lat: 2, lng: 2 });
    slot.set({ lat: 3, lng: 3 });
    // Only the last position is ever retrievable — earlier ones are gone,
    // never replayed.
    expect(slot.takeLatest()).toEqual({ lat: 3, lng: 3 });
    expect(slot.takeLatest()).toBeNull();
  });

  it('peek() does not clear the slot', () => {
    const slot = createLatestPositionSlot();
    slot.set({ lat: 5, lng: 6 });
    expect(slot.peek()).toEqual({ lat: 5, lng: 6 });
    expect(slot.peek()).toEqual({ lat: 5, lng: 6 });
    expect(slot.takeLatest()).toEqual({ lat: 5, lng: 6 });
  });

  it('a position set after a failed send is picked up by the next takeLatest (resume, no replay of the failed one)', () => {
    const slot = createLatestPositionSlot();
    slot.set({ lat: 1, lng: 1 });
    const failedSend = slot.takeLatest(); // simulate an offline/failed POST
    expect(failedSend).toEqual({ lat: 1, lng: 1 });
    // Nothing re-queues the failed position — the slot stays empty until a
    // fresh location update arrives.
    expect(slot.peek()).toBeNull();
    slot.set({ lat: 2, lng: 2 });
    expect(slot.takeLatest()).toEqual({ lat: 2, lng: 2 });
  });
});
