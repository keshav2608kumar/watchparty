import { describe, it, expect } from 'vitest';
import { formatTime, parseYouTubeId, detectMediaType, normalizeCustomMediaUrl } from '../utils/formatters';

describe('Formatters & Media Parsers', () => {
  it('formats seconds into mm:ss and hh:mm:ss strings', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(45)).toBe('0:45');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(734)).toBe('12:14');
    expect(formatTime(3665)).toBe('1:01:05');
  });

  it('correctly parses YouTube video IDs from various formats including shorts and raw IDs', () => {
    expect(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://www.youtube.com/live/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://example.com/video.mp4')).toBe(null);
  });

  it('detects media type accurately', () => {
    expect(detectMediaType('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
    expect(detectMediaType('https://www.youtube.com/shorts/aqz-KE-bpKQ')).toBe('youtube');
    expect(detectMediaType('https://vjs.zencdn.net/v/oceans.mp4')).toBe('html5');
  });

  it('normalizes cloud preview URLs to direct streaming binaries', () => {
    // Google Drive
    const gdrive = normalizeCustomMediaUrl('https://drive.google.com/file/d/1A2B3C4D5E/view?usp=sharing');
    expect(gdrive.url).toBe('https://drive.google.com/uc?export=download&id=1A2B3C4D5E');
    expect(gdrive.type).toBe('html5');

    // Dropbox
    const dropbox = normalizeCustomMediaUrl('https://www.dropbox.com/s/xyz123/video.mp4?dl=0');
    expect(dropbox.url).toBe('https://www.dropbox.com/s/xyz123/video.mp4?raw=1');
    expect(dropbox.type).toBe('html5');

    // Protocol prepending
    const noProtocol = normalizeCustomMediaUrl('vjs.zencdn.net/v/oceans.mp4');
    expect(noProtocol.url).toBe('https://vjs.zencdn.net/v/oceans.mp4');
  });
});

