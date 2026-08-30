import { describe, it, expect } from 'vitest';
import { movingAverage } from '../movingAverage';

describe('movingAverage', () => {
  it('returns an empty array for an empty input series', () => {
    expect(movingAverage([], 3)).toEqual([]);
  });

  it('returns the single value unchanged for a one-element series', () => {
    expect(movingAverage([42], 3)).toEqual([42]);
  });

  it('acts as the identity function when window is 1', () => {
    const values = [10, 20, 30, 40];
    expect(movingAverage(values, 1)).toEqual(values);
  });

  it('treats window <= 0 the same as window = 1 (identity)', () => {
    const values = [5, 15, 25];
    expect(movingAverage(values, 0)).toEqual(values);
    expect(movingAverage(values, -3)).toEqual(values);
  });

  it('uses partial windows when window exceeds the series length', () => {
    // window (10) > values.length (4): every point averages over
    // all values available up to that index (cumulative average).
    const values = [2, 4, 6, 8];
    const result = movingAverage(values, 10);
    expect(result).toEqual([
      2,          // [2]
      3,          // avg(2,4)
      4,          // avg(2,4,6)
      5,          // avg(2,4,6,8)
    ]);
  });

  it('computes a trailing average with partial windows at the start for a typical series', () => {
    // window = 3, series longer than window:
    // idx0: avg([1])          = 1
    // idx1: avg([1,2])        = 1.5
    // idx2: avg([1,2,3])      = 2
    // idx3: avg([2,3,4]) trailing full window = 3
    // idx4: avg([3,4,5]) trailing full window = 4
    const values = [1, 2, 3, 4, 5];
    const result = movingAverage(values, 3);
    expect(result).toEqual([1, 1.5, 2, 3, 4]);
  });
});



