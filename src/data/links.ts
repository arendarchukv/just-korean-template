/**
 * Outside sites the home page links to directly (no scripts, no previews). Hardcoded: they change
 * rarely, so they are not in Pages CMS.
 */
export const QUICK_LINKS = [
  // Basic Korean Dictionary with English meanings (also searchable from the Practice page).
  { key: 'dictionary', icon: 'book', href: 'https://krdict.korean.go.kr/eng/' },
  // 누리-세종학당: pronunciation practice.
  { key: 'pronunciation', icon: 'sound', href: 'https://nuri.iksi.or.kr/' },
  // Korean news to read.
  { key: 'news', icon: 'news', href: 'https://www.ohmynews.com/' },
] as const;
