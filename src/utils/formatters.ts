import { MediaType } from '../types/room';

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  const paddedSeconds = remainingSeconds.toString().padStart(2, '0');

  if (hours > 0) {
    const paddedMinutes = minutes.toString().padStart(2, '0');
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${minutes}:${paddedSeconds}`;
}

export function formatTimestamp(timestampMs: number): string {
  if (!timestampMs) return '';
  const date = new Date(timestampMs);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Robust YouTube video ID parser supporting watch, embed, shorts, live, youtu.be, and bare IDs.
 */
export function parseYouTubeId(input: string): string | null {
  if (!input) return null;
  const url = input.trim().replace(/^[<"']|[>"']$/g, '');

  // If user passed a direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  // Regex covering watch, embed, shorts, live, youtu.be, and query parameters
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/;
  const match = url.match(regExp);
  if (match && match[1]) {
    return match[1];
  }

  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
      const v = parsed.searchParams.get('v');
      if (v && v.length === 11) return v;
      const parts = parsed.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && last.length === 11) return last;
    }
  } catch {
    // ignore invalid URL strings
  }

  return null;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Normalizes custom video inputs, converting cloud preview pages (Google Drive, Dropbox)
 * to direct streamable binaries, and resolving YouTube formats.
 */
export function normalizeCustomMediaUrl(rawUrl: string): { url: string; type: MediaType } {
  if (!rawUrl) return { url: '', type: 'html5' };
  let url = rawUrl.trim().replace(/^[<"']|[>"']$/g, '');

  if (url.startsWith('local://') || url.startsWith('blob:')) {
    return {
      url,
      type: 'html5',
    };
  }

  const ytId = parseYouTubeId(url);
  if (ytId) {
    return {
      url: `https://www.youtube.com/watch?v=${ytId}`,
      type: 'youtube',
    };
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  // Auto-convert Google Drive preview links to direct streaming downloads
  const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdriveMatch && gdriveMatch[1]) {
    return {
      url: `https://drive.google.com/uc?export=download&id=${gdriveMatch[1]}`,
      type: 'html5',
    };
  }

  // Auto-convert Dropbox preview links (dl=0) to direct binary streams (raw=1)
  if (url.includes('dropbox.com') && url.includes('dl=0')) {
    return {
      url: url.replace('dl=0', 'raw=1'),
      type: 'html5',
    };
  }

  return {
    url,
    type: 'html5',
  };
}

export function detectMediaType(url: string): MediaType {
  return normalizeCustomMediaUrl(url).type;
}
