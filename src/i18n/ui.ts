export const languages = {
  en: 'English',
  ko: '한국어',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'en';

const en = {
  'site.tagline': 'The channel teaches, the site helps you learn.',
  'site.description':
    'Learning companion for the Just Korean YouTube channel: courses in order, a grammar reference, practice and class materials.',
  'site.ogImageAlt': 'Just Korean logo beside cut-paper shapes in blue and teal',

  'a11y.skipToContent': 'Skip to content',
  'a11y.home': 'Just Korean, home',
  'a11y.mainNav': 'Main',
  'a11y.footerNav': 'Footer',
  'a11y.menu': 'Menu',

  'nav.learn': 'Learn',
  'nav.materials': 'Materials',
  'nav.classes': 'Classes',
  'nav.news': 'News',
  'nav.bookClass': 'Book a class',

  'lang.switchTo': 'Switch to English',

  'theme.toDark': 'Switch to dark theme',
  'theme.toLight': 'Switch to light theme',

  'footer.youtube': 'YouTube',
  'footer.instagram': 'Instagram',
  'footer.contact': 'Contact',
  'footer.kofi': 'Support on Ko-fi',
  'footer.rights': 'All rights reserved.',

  'home.eyebrow': 'Learning companion for the Just Korean channel',
  'home.title': 'Learn Korean, one clear lesson at a time',
  'home.lead':
    'Short, clear lessons from the Just Korean channel, organised into courses, with notes, practice and materials for every video.',
  'home.ctaStart': 'Start learning',
  'home.ctaClasses': 'Book a class',
  'home.featuresTitle': 'What you will find here',
  'home.feature.courses.title': 'Courses in order',
  'home.feature.courses.body':
    'Follow a series from the first video to the last and keep track of what you have watched.',
  'home.feature.grammar.title': 'Grammar reference',
  'home.feature.grammar.body':
    'Look up a pattern such as 아/어 봤자 and find its meaning, formation, examples and video.',
  'home.feature.practice.title': 'Practice',
  'home.feature.practice.body': 'Key expressions, quizzes and flashcards for each lesson.',
  'home.feature.materials.title': 'Materials',
  'home.feature.materials.body': 'PDF notes, transcripts and audio attached to the videos.',

  'placeholder.comingSoon': 'Coming soon',
  'placeholder.body': 'This section is being built. Meanwhile, the lessons are on YouTube.',
  'placeholder.backHome': 'Back to home',

  'page.learn.title': 'Learn',
  'page.materials.title': 'Materials',
  'page.classes.title': 'Classes',
  'page.news.title': 'News',

  'notFound.title': 'Page not found',
  'notFound.body': 'The page you are looking for does not exist or has moved.',
} as const;

export type UIKey = keyof typeof en;

// TODO(ko-review): machine-drafted for design testing. JiEun should review before launch.
// Missing keys fall back to English.
const ko: Partial<Record<UIKey, string>> = {
  'site.tagline': '채널에서 배우고, 사이트에서 익혀요.',
  'site.description':
    'Just Korean 유튜브 채널의 학습 도우미: 순서대로 보는 코스, 문법 사전, 연습 문제, 수업 자료.',
  'site.ogImageAlt': '파란색과 청록색 종이 오림 도형 옆의 Just Korean 로고',

  'a11y.skipToContent': '본문으로 건너뛰기',
  'a11y.home': 'Just Korean 홈',
  'a11y.mainNav': '주 메뉴',
  'a11y.footerNav': '하단 메뉴',
  'a11y.menu': '메뉴',

  'nav.learn': '배우기',
  'nav.materials': '자료',
  'nav.classes': '수업',
  'nav.news': '소식',
  'nav.bookClass': '수업 예약',

  'lang.switchTo': '한국어로 보기',

  'theme.toDark': '다크 모드로 전환',
  'theme.toLight': '라이트 모드로 전환',

  'footer.youtube': '유튜브',
  'footer.instagram': '인스타그램',
  'footer.contact': '문의',
  'footer.kofi': 'Ko-fi로 후원하기',

  'home.eyebrow': 'Just Korean 채널의 학습 도우미',
  'home.title': '한 번에 하나씩, 명확하게 배우는 한국어',
  'home.lead':
    'Just Korean 채널의 짧고 명확한 강의를 코스별로 정리했어요. 영상마다 노트, 연습 문제, 자료가 함께 있어요.',
  'home.ctaStart': '공부 시작하기',
  'home.ctaClasses': '수업 예약',
  'home.featuresTitle': '이곳에서 할 수 있는 것',
  'home.feature.courses.title': '순서대로 보는 코스',
  'home.feature.courses.body': '시리즈를 처음부터 끝까지 따라가고, 본 영상을 기록해요.',
  'home.feature.grammar.title': '문법 사전',
  'home.feature.grammar.body': '아/어 봤자 같은 문법을 찾아 의미, 활용, 예문, 영상을 확인해요.',
  'home.feature.practice.title': '연습',
  'home.feature.practice.body': '강의마다 핵심 표현, 퀴즈, 단어 카드가 있어요.',
  'home.feature.materials.title': '자료',
  'home.feature.materials.body': '영상에 딸린 PDF 노트, 대본, 오디오를 받아요.',

  'placeholder.comingSoon': '준비 중',
  'placeholder.body': '이 페이지는 준비 중이에요. 그동안 유튜브에서 강의를 볼 수 있어요.',
  'placeholder.backHome': '홈으로',

  'page.learn.title': '배우기',
  'page.materials.title': '자료',
  'page.classes.title': '수업',
  'page.news.title': '소식',

  'notFound.title': '페이지를 찾을 수 없어요',
  'notFound.body': '찾으시는 페이지가 없거나 이동되었어요.',
};

export const ui: { en: typeof en; ko: Partial<Record<UIKey, string>> } = { en, ko };
