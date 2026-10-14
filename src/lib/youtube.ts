const ID = /^[\w-]{11}$/;

/** Video id from a pasted YouTube link (watch, youtu.be, shorts, embed, live) or a bare id. */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (ID.test(value)) return value;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, '');
  if (host === 'youtu.be') {
    const id = url.pathname.split('/')[1] ?? '';
    return ID.test(id) ? id : null;
  }
  if (host !== 'youtube.com') return null;
  const v = url.searchParams.get('v');
  if (v && ID.test(v)) return v;
  const match = /^\/(?:shorts|embed|live)\/([\w-]{11})(?:\/|$)/.exec(url.pathname);
  return match ? match[1] : null;
}

export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** 640×480 thumbnail (always present), cropped to 16:9 for the lesson player. */
export function youtubeThumbnailLarge(id: string): string {
  return `https://i.ytimg.com/vi/${id}/sddefault.jpg`;
}
