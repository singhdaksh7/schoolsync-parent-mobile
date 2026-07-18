import { arrayBufferToBase64 } from '@/lib/pdf-download';

function toBuffer(bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

describe('arrayBufferToBase64 — pure JS encoder (no btoa/Buffer dependency)', () => {
  it('matches known base64 values for common byte sequences', () => {
    expect(arrayBufferToBase64(toBuffer([])).length).toBe(0);
    expect(arrayBufferToBase64(new TextEncoder().encode('Man').buffer)).toBe('TWFu');
    expect(arrayBufferToBase64(new TextEncoder().encode('Ma').buffer)).toBe('TWE=');
    expect(arrayBufferToBase64(new TextEncoder().encode('M').buffer)).toBe('TQ==');
    expect(arrayBufferToBase64(new TextEncoder().encode('hello world').buffer)).toBe('aGVsbG8gd29ybGQ=');
  });

  it('round-trips arbitrary binary content losslessly (via atob for verification)', () => {
    const original = Array.from({ length: 37 }, (_, i) => (i * 7) % 256);
    const encoded = arrayBufferToBase64(toBuffer(original));
    const decoded = Buffer.from(encoded, 'base64');
    expect(Array.from(decoded)).toEqual(original);
  });
});
