/**
 * Site-wide settings that are not UI copy.
 * Empty `href` values are placeholders (TBD) and render as inert links.
 */
export const SITE = {
  name: 'Just Korean',
  nameKo: '그냥 한국어',
} as const;

export const SOCIAL_LINKS = {
  youtube: '', // TBD: e.g. https://www.youtube.com/@JustKorean
  instagram: '', // TBD
  contact: '', // TBD: Tally form
  kofi: '', // TBD
} as const;

export type SocialKey = keyof typeof SOCIAL_LINKS;
