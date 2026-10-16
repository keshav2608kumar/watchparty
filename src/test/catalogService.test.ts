import { describe, it, expect } from 'vitest';
import { searchCatalog, SAMPLE_CATALOG } from '../services/catalogService';

describe('Catalog Service', () => {
  it('returns all items when query is empty and genre is All', () => {
    const results = searchCatalog('', 'All');
    expect(results.length).toBe(SAMPLE_CATALOG.length);
  });

  it('performs case-insensitive fuzzy filtering on titles and descriptions', () => {
    const results = searchCatalog('tears');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe('Tears of Steel');

    const descResults = searchCatalog('rabbit');
    expect(descResults.some(r => r.title === 'Big Buck Bunny')).toBe(true);
  });

  it('filters by genre properly', () => {
    const sciFiItems = searchCatalog('', 'Sci-Fi');
    expect(sciFiItems.every(item => item.genre.includes('Sci-Fi'))).toBe(true);
  });

  it('sorts by title alphabetically when requested', () => {
    const sorted = searchCatalog('', 'All', 'title');
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].title.localeCompare(sorted[i + 1].title)).toBeLessThanOrEqual(0);
    }
  });
});
