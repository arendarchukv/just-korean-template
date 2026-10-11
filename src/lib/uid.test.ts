import { beforeEach, describe, expect, it } from 'vitest';
import { nextId, resetIds } from './uid';

describe('nextId', () => {
  beforeEach(() => resetIds());

  it('returns unique ids in order', () => {
    expect([nextId('shape'), nextId('shape'), nextId('shape')]).toEqual([
      'shape-1',
      'shape-2',
      'shape-3',
    ]);
  });

  it('is deterministic: the same sequence after a reset', () => {
    const first = [nextId('shape'), nextId('shape')];
    resetIds();
    expect([nextId('shape'), nextId('shape')]).toEqual(first);
  });
});
