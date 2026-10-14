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
  'home.contents.title': 'On this site',
  'home.contents.lessons.title': 'Lessons and grammar',
  'home.contents.lessons.body': 'Every video from the channel in order, with a grammar reference.',
  'home.contents.materials.title': 'Materials',
  'home.contents.materials.body': 'Worksheets, notes and transcripts to download.',
  'home.contents.practice.title': 'Flashcards and quizzes',
  'home.contents.practice.body': 'Check what you learned, at your own pace.',
  'home.contents.speaking.title': 'Pronunciation and dictionary',
  'home.contents.speaking.body': 'Sounds of Korean, and a quick way to look up a word.',
  'home.contents.news.title': 'Korean news reading',
  'home.contents.news.body': 'Real news in Korean, with words to learn.',
  'home.newLessons.title': 'New lessons',
  'home.newLessons.all': 'All lessons',

  'lesson.watchOnYouTube': 'Watch on YouTube',
  'lesson.comingSoon': 'The full lesson page is being built.',

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
  'home.contents.title': '이 사이트에서',
  'home.contents.lessons.title': '강의와 문법',
  'home.contents.lessons.body': '채널의 모든 영상을 순서대로, 문법 사전과 함께.',
  'home.contents.materials.title': '자료',
  'home.contents.materials.body': '학습지, 노트, 대본을 내려받아요.',
  'home.contents.practice.title': '단어 카드와 퀴즈',
  'home.contents.practice.body': '배운 내용을 내 속도로 확인해요.',
  'home.contents.speaking.title': '발음과 사전',
  'home.contents.speaking.body': '한국어 소리, 그리고 단어를 빠르게 찾는 방법.',
  'home.contents.news.title': '한국어 뉴스 읽기',
  'home.contents.news.body': '배울 단어와 함께 읽는 진짜 한국어 뉴스.',
  'home.newLessons.title': '새 강의',
  'home.newLessons.all': '모든 강의',

  'lesson.watchOnYouTube': '유튜브에서 보기',
  'lesson.comingSoon': '강의 페이지를 준비하고 있어요.',

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
