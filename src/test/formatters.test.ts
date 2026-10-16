import { describe, it, expect } from 'vitest';
import { formatTime, parseYouTubeId, detectMediaType } from '../utils/formatters';

describe('Formatters & Media Parsers', () => {
  it('formats seconds into mm:ss and hh:mm:ss strings', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(45)).toBe('0:45');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(734)).toBe('12:14');
    expect(formatTime(3665)).toBe('1:01:05');
  });

  it('correctly parses YouTube video IDs from various formats', () => {
    expect(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://example.com/video.mp4')).toBe(null);
  });

  it('detects media type accurately', () => {
    expect(detectMediaType('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
    expect(detectMediaType('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4')).toBe('html5');
  });
});
