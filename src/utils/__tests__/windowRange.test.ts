import { describe, expect, it } from 'vitest';
import { getWindowRange, sliceWindow } from '../windowRange';

const baseOptions = {
  scrollTop: 0,
  rowHeight: 50,
  viewportHeight: 200,
  threshold: 10,
  overscan: 2,
};

describe('getWindowRange', () => {
  it('returns an empty non-windowed range for zero rows', () => {
    expect(getWindowRange({ ...baseOptions, total: 0 })).toEqual({
      start: 0,
      end: 0,
      beforeHeight: 0,
      afterHeight: 0,
      totalHeight: 0,
      visibleCount: 0,
      isWindowed: false,
    });
  });

  it('does not window lists below or at the threshold', () => {
    expect(getWindowRange({ ...baseOptions, total: 9 })).toMatchObject({
      start: 0,
      end: 9,
      visibleCount: 9,
      isWindowed: false,
    });

    expect(getWindowRange({ ...baseOptions, total: 10 })).toMatchObject({
      start: 0,
      end: 10,
      visibleCount: 10,
      isWindowed: false,
    });
  });

  it('windows a large list at the top with overscan after the viewport', () => {
    expect(getWindowRange({ ...baseOptions, total: 100 })).toMatchObject({
      start: 0,
      end: 6,
      beforeHeight: 0,
      afterHeight: 4700,
      visibleCount: 6,
      isWindowed: true,
    });
  });

  it('windows a large list around the current scroll position', () => {
    expect(getWindowRange({ ...baseOptions, total: 100, scrollTop: 1000 })).toMatchObject({
      start: 18,
      end: 26,
      beforeHeight: 900,
      afterHeight: 3700,
      visibleCount: 8,
      isWindowed: true,
    });
  });

  it('clamps the range at the end of the list', () => {
    expect(getWindowRange({ ...baseOptions, total: 20, scrollTop: 2000 })).toMatchObject({
      start: 14,
      end: 20,
      beforeHeight: 700,
      afterHeight: 0,
      visibleCount: 6,
      isWindowed: true,
    });
  });
});

describe('sliceWindow', () => {
  it('returns the original items when the range is not windowed', () => {
    const items = ['a', 'b', 'c'];
    const range = getWindowRange({ ...baseOptions, total: items.length });

    expect(sliceWindow(items, range)).toBe(items);
  });

  it('returns only the visible window when windowed', () => {
    const items = Array.from({ length: 20 }, (_, index) => index);
    const range = getWindowRange({ ...baseOptions, total: items.length, scrollTop: 500 });

    expect(sliceWindow(items, range)).toEqual([8, 9, 10, 11, 12, 13, 14, 15]);
  });
});
