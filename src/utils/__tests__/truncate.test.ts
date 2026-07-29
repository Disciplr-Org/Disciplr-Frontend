import { describe, it, expect } from 'vitest';
import { truncateMiddle } from '../truncate';

describe('truncateMiddle', () => {
  it('returns empty string for empty input', () => {
    expect(truncateMiddle('')).toBe('');
  });

  it('returns original for short strings', () => {
    expect(truncateMiddle('abc')).toBe('abc');
  });

  it('truncates with default 6/4', () => {
    const addr = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
    expect(truncateMiddle(addr)).toBe('GBBD47...FLA5');
  });

  it('truncates with custom head/tail', () => {
    const addr = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
    expect(truncateMiddle(addr, 4, 4)).toBe('GBBD...FLA5');
  });

  it('returns original when length fits', () => {
    expect(truncateMiddle('1234567890', 6, 4)).toBe('1234567890');
  });
});
