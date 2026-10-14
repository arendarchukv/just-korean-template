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

  'footer.about': 'About',
  'footer.youtube': 'YouTube',
  'footer.instagram': 'Instagram',
  'footer.contact': 'Contact',
  'footer.kofi': 'Support on Ko-fi',
  'footer.rights': 'All rights reserved.',

  'home.bookClass': 'Book a class',
  'home.watchLessons': 'Watch lessons',
  'home.credentials': 'About the teacher',
  'home.classes.title': 'Classes',
  'home.classes.format': 'Format',
  'home.classes.forWhom': 'For whom',
  'home.classes.how': 'How it works',
  'home.classes.more': 'Classes, prices and FAQ',

  'notice.label': 'Notices',
  'notice.details': 'Details',
  'notice.dismiss': 'Dismiss notice',

  'placeholder.comingSoon': 'Coming soon',
  'placeholder.body': 'This section is being built. Meanwhile, the lessons are on YouTube.',
  'placeholder.backHome': 'Back to home',

  'page.learn.title': 'Learn',
  'page.materials.title': 'Materials',
  'page.classes.title': 'Classes',
  'page.news.title': 'News',
  'page.about.title': 'About',

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

  'footer.about': '소개',
  'footer.youtube': '유튜브',
  'footer.instagram': '인스타그램',
  'footer.contact': '문의',
  'footer.kofi': 'Ko-fi로 후원하기',

  'home.bookClass': '수업 예약',
  'home.watchLessons': '강의 보기',
  'home.credentials': '선생님 소개',
  'home.classes.title': '수업',
  'home.classes.format': '수업 형태',
  'home.classes.forWhom': '대상',
  'home.classes.how': '진행 방식',
  'home.classes.more': '수업 안내와 자주 묻는 질문',

  'notice.label': '공지',
  'notice.details': '자세히',
  'notice.dismiss': '공지 닫기',

  'placeholder.comingSoon': '준비 중',
  'placeholder.body': '이 페이지는 준비 중이에요. 그동안 유튜브에서 강의를 볼 수 있어요.',
  'placeholder.backHome': '홈으로',

  'page.learn.title': '배우기',
  'page.materials.title': '자료',
  'page.classes.title': '수업',
  'page.news.title': '소식',
  'page.about.title': '소개',

  'notFound.title': '페이지를 찾을 수 없어요',
  'notFound.body': '찾으시는 페이지가 없거나 이동되었어요.',
};

export const ui: { en: typeof en; ko: Partial<Record<UIKey, string>> } = { en, ko };
