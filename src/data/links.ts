/**
 * Outside sites the home page links to directly (no scripts, no previews). Hardcoded: they change
 * rarely, so they are not in Pages CMS. Each card has a cut-paper shape in its corner (design system).
 */
export const QUICK_LINKS = [
  // Basic Korean Dictionary with English meanings (also searchable from the Practice page).
  {
    key: 'dictionary',
    icon: 'book',
    shape: 'grid',
    tone: 'brand',
    href: 'https://krdict.korean.go.kr/eng/',
  },
  // 누리-세종학당: pronunciation practice.
  {
    key: 'pronunciation',
    icon: 'sound',
    shape: 'wave',
    tone: 'teal',
    href: 'https://nuri.iksi.or.kr/',
  },
  // Korean news to read.
  { key: 'news', icon: 'news', shape: 'arch', tone: 'indigo', href: 'https://www.ohmynews.com/' },
] as const;
