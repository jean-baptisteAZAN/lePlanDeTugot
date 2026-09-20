export type VideoInfo = {
  title: string;
  channel: string | null;
  thumbnailUrl: string | null;
};

const OEMBED_URL = 'https://www.youtube.com/oembed';
const OEMBED_TIMEOUT_MS = 8000;

type OembedResponse = {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
};

export function parseVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, '');
  const segments = url.pathname.split('/').filter((segment) => segment.length > 0);

  if (host === 'youtu.be') {
    return segments[0] ?? null;
  }
  if (host !== 'youtube.com' && host !== 'm.youtube.com' && host !== 'music.youtube.com') {
    return null;
  }
  if (segments[0] === 'watch') {
    return url.searchParams.get('v');
  }
  if (segments[0] === 'shorts' || segments[0] === 'embed' || segments[0] === 'live') {
    return segments[1] ?? null;
  }
  return null;
}

export function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export async function fetchVideoInfo(videoId: string): Promise<VideoInfo | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OEMBED_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${OEMBED_URL}?url=${encodeURIComponent(watchUrl(videoId))}&format=json`,
      { signal: controller.signal },
    );
    if (!response.ok) {
      return null;
    }
    const json = (await response.json()) as OembedResponse;
    if (!json.title) {
      return null;
    }
    return {
      title: json.title,
      channel: json.author_name ?? null,
      thumbnailUrl: json.thumbnail_url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
