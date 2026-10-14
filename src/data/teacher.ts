/**
 * About the teacher: used by the home about block, the About page and the Classes page.
 * Hardcoded on purpose: it changes rarely, so it is not in Pages CMS (only the main content is).
 *
 * Draft for review: JiEun should rewrite the greeting, intro, story, principles and timeline in
 * her own words. Numbers are from the channel page on 2026-10-14.
 */

export const TEACHER = {
  greeting: "Hi, I'm JiEun",
  intro:
    'I teach real, everyday Korean on YouTube and in live classes. Short, clear lessons that explain not only what to say, but why.',
  /** Her photo: upload to R2 and paste the https:// link (also add the domain to image.domains). */
  photo: '',
  photoAlt: 'JiEun, teacher of Just Korean',
  credentials: [
    'MA in Korean Language Education',
    'Certified Korean language teacher',
    'Taught in Hong Kong, the Netherlands and Spain',
    '26K+ subscribers on YouTube',
  ],
  story: [
    'I started Just Korean to share the Korean people really speak: the small differences between two endings, the way a sentence sounds in a café rather than in a textbook.',
    'Over the years I have taught students in Hong Kong, the Netherlands and Spain, online and in person. The videos on the channel grew out of the questions they asked me in class.',
  ],
  principles: [
    {
      title: 'Side by side',
      text: 'Patterns that look alike are explained together, so you know which one to use and when.',
    },
    {
      title: 'Real sentences',
      text: 'Examples come from everyday life, said the way Koreans say them.',
    },
    {
      title: 'Small steps',
      text: 'Short lessons you can watch in a break and practise straight away.',
    },
  ],
  timeline: [
    { place: 'Hong Kong', text: 'Korean classes for adult learners.' },
    { place: 'The Netherlands', text: 'Private and group classes.' },
    { place: 'Spain', text: 'Classes and the Just Korean channel today.' },
  ],
  channel: [
    { value: '234', label: 'video lessons' },
    { value: '26K+', label: 'subscribers' },
    { value: '54', label: 'grammar videos' },
  ],
} as const;

/** How many lessons the home page shows under "New lessons". */
export const NEW_LESSONS_COUNT = 3;
