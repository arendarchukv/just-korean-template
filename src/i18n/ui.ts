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

  'nav.lessons': 'Lessons',
  'nav.practice': 'Practice',
  'nav.materials': 'Materials',
  'nav.classes': 'Classes',
  'nav.bookClass': 'Book a class',
  'nav.support': 'Support',

  'lang.switchTo': 'Switch to English',
  'lang.label': 'Language',

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
  'home.classes.eyebrow': 'Live classes',
  'home.classes.title': 'Study directly with JiEun',
  'home.classes.lead': 'Online classes shaped around your level and goals.',
  'home.classes.ctaText':
    'Prices, schedules and answers to common questions are on the Classes page.',
  'home.classes.forWhom': 'For whom',
  'home.classes.more': 'Classes, prices and FAQ',
  'home.links.eyebrow': 'Free study tools',
  'home.links.title': 'Study tools I recommend',
  'home.links.lead': 'Free sites I use with my students between lessons.',
  'home.links.dictionary': 'Dictionary',
  'home.links.dictionary.text':
    'The Basic Korean Dictionary by the National Institute of Korean Language, with English meanings and examples.',
  'home.links.dictionary.tag': 'Vocabulary',
  'home.links.dictionary.action': 'Open the dictionary',
  'home.links.pronunciation': 'Pronunciation practice',
  'home.links.pronunciation.text':
    'Nuri-Sejong Hakdang: listen to the sounds of Korean and repeat them.',
  'home.links.pronunciation.tag': 'Sounds',
  'home.links.pronunciation.action': 'Practise sounds',
  'home.links.news': 'Korean news',
  'home.links.news.text': 'Real news in Korean from OhmyNews, to practise reading.',
  'home.links.news.tag': 'Reading',
  'home.links.news.action': 'Read the news',
  'home.links.newTab': 'opens in a new tab',
  'home.newLessons.eyebrow': 'From the channel',
  'home.newLessons.title': 'New lessons',
  'home.newLessons.lead': 'The newest videos, with notes and practice here on the site.',
  'home.newLessons.all': 'All lessons',
  'home.newLessons.watch': 'Watch',
  'lessons.read': 'Read',

  'lessons.lead':
    'Every lesson from the channel, grouped the way it is on YouTube. Courses are meant to be watched in order.',
  'lessons.other': 'Other lessons',
  'lessons.playlist': 'Playlist on YouTube',
  'lessons.noVideo': 'Lesson without video',

  'grammar.lead': 'Grammar patterns from the lessons, each with the lessons that explain it.',
  'grammar.search': 'Search patterns',
  'grammar.searchHint': 'e.g. 도록',
  'grammar.noResults': 'No patterns match.',
  'grammar.level.beginner': 'Beginner',
  'grammar.level.intermediate': 'Intermediate',
  'grammar.level.advanced': 'Advanced',

  'materials.lead': 'Worksheets, notes and transcripts to study with. Free to download.',
  'materials.tab.class': 'Class materials',
  'materials.tab.podcast': 'Podcast',
  'materials.tab.self-study': 'Self-study',
  'materials.tab.from-lessons': 'From lessons',
  'materials.type.reading': 'Reading',
  'materials.type.writing': 'Writing',
  'materials.type.listening': 'Listening',
  'materials.type.vocabulary': 'Vocabulary',
  'materials.type.video': 'Video',
  'materials.type.lesson': 'Lesson',
  'materials.col.type': 'Type',
  'materials.col.title': 'Title',
  'materials.col.files': 'Files',
  'materials.col.date': 'Date',
  'materials.filterType': 'Show type',
  'materials.allTypes': 'All types',
  'materials.search': 'Search by title',
  'materials.noResults': 'No materials match.',

  'classes.lead':
    'Live classes with JiEun, all online by video call: one to one, in a small group, or in a group by level.',
  'classes.ask': 'Ask about it',
  'widget.fromLesson': 'From the lesson',
  'deck.flipHint': 'Show the meaning',
  'deck.meaning': 'Meaning',
  'deck.know': 'I know it',
  'deck.again': 'Again',
  'deck.position': 'Card {n} of {total}',
  'deck.knownCount': '{k} known',
  'deck.done': 'You know {k} of {n} cards.',
  'deck.rest': 'Practise the rest',
  'deck.restart': 'Start over',
  'quiz.position': 'Question {n} of {total}',
  'quiz.yourAnswer': 'Your answer',
  'quiz.check': 'Check',
  'quiz.correct': 'Correct',
  'quiz.wrong': 'Not quite',
  'quiz.expected': 'Answer:',
  'quiz.next': 'Next',
  'quiz.seeResult': 'See the result',
  'quiz.result': '{k} of {n} correct.',
  'quiz.best': 'Best score: {b} of {n}',
  'quiz.again': 'Try again',
  'about.portraitAlt': 'Illustrated portrait of JiEun smiling and waving',
  'about.principles': 'How I teach',
  'about.timeline': 'Where I have taught',
  'about.channel': 'The channel',
  'about.channelLink': 'Open the channel',
  'about.cta': 'Learn with me',
  'about.ctaText': 'Join a live class, or start with the free lessons from the channel.',
  'about.toClasses': 'See classes',
  'classes.faq': 'Questions before booking',
  'classes.formats': 'Class formats',
  'classes.steps': 'How to start',
  'classes.ready': 'Not sure which class fits?',
  'classes.readyText': 'Write to JiEun: she will suggest a format and a time that suit you.',
  'classes.contact': 'Ask a question',

  'practice.lead': 'Check what you learned in the lessons. No sign-up needed.',
  'practice.decks': 'Flashcards',
  'practice.quizzes': 'Quizzes',
  'practice.decksText':
    'Turn each card over and say whether you knew it. Your progress stays in this browser.',
  'practice.quizzesText': 'Short quizzes on the lessons, with the answer checked at once.',
  'practice.decksCount': '{n} decks',
  'practice.quizzesCount': '{n} quizzes',
  'practice.open': 'Open',
  'practice.topik': 'TOPIK mock test',
  'practice.topikText':
    'Timed practice in the format of the TOPIK exam, with your score at the end.',
  'practice.soon': 'Coming soon',
  'practice.chooseDeck': 'Choose a deck',
  'practice.chooseQuiz': 'Choose a quiz',
  'practice.fromLessons': 'From lessons',
  'practice.dictionaryField': 'Korean word',
  'practice.dictionaryGo': 'Look up',

  'contact.demo': 'Demo form, nothing is sent',
  'contact.lead': 'Questions about classes or materials? Write to JiEun here.',
  'contact.name': 'Name',
  'contact.email': 'Email',
  'contact.topic': 'Topic',
  'contact.topicChoose': 'Choose a topic',
  'contact.topicClasses': 'Classes',
  'contact.topicMaterials': 'Materials',
  'contact.topicOther': 'Something else',
  'contact.message': 'Message',
  'contact.send': 'Send',
  'contact.demoSent':
    'This is a demo: your message was not sent. The real form (Tally) will go here.',

  'lesson.watchOnYouTube': 'Watch on YouTube',
  'lesson.play': 'Play video',
  'lesson.grammar': 'Grammar in this lesson',
  'lesson.files': 'Files',
  'lesson.practice': 'Practice',
  'lesson.deck': 'Flashcards',
  'lesson.quiz': 'Quiz',
  'lesson.series': 'Series',
  'lesson.prev': 'Previous',
  'lesson.next': 'Next',
  'lesson.kind.pdf': 'PDF',
  'lesson.kind.audio': 'Audio',
  'lesson.kind.transcript': 'Transcript',
  'lesson.cards': 'words',
  'lesson.questions': 'questions',

  'notice.label': 'Notices',
  'notice.details': 'Details',
  'notice.dismiss': 'Dismiss notice',
  'notice.tone.important': 'Important',
  'notice.tone.news': 'New',
  'notice.tone.info': 'Info',

  'placeholder.comingSoon': 'Coming soon',
  'placeholder.body': 'This section is being built. Meanwhile, the lessons are on YouTube.',
  'placeholder.backHome': 'Back to home',

  'page.lessons.title': 'Lessons',
  'page.grammar.title': 'Grammar',
  'page.lessons.eyebrow': 'From the channel',
  'page.grammar.eyebrow': 'Patterns from the lessons',
  'page.materials.eyebrow': 'Free downloads',
  'page.practice.eyebrow': 'Free practice',
  'lessons.course': 'Course · watch in order',
  'lessons.library': 'Playlist',
  'lessons.podcast': 'Podcast',
  'lessons.single': 'Single lessons',
  'page.practice.title': 'Practice',
  'page.materials.title': 'Materials',
  'page.classes.title': 'Classes',
  'page.contact.title': 'Contact',
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

  'nav.lessons': '강의',
  'nav.practice': '연습',
  'nav.materials': '자료',
  'nav.classes': '수업',
  'nav.bookClass': '수업 예약',
  'nav.support': '후원하기',

  'lang.switchTo': '한국어로 보기',
  'lang.label': '언어', // TODO(ko-review)

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
  'home.classes.eyebrow': '실시간 수업', // TODO(ko-review)
  'home.classes.title': '지은 선생님과 직접 공부해요', // TODO(ko-review)
  'home.classes.lead': '레벨과 목표에 맞춘 온라인 수업이에요.', // TODO(ko-review)
  'home.classes.ctaText': '수업료, 시간표, 자주 묻는 질문은 수업 페이지에서 볼 수 있어요.', // TODO(ko-review)
  'home.classes.forWhom': '대상',
  'home.classes.more': '수업 안내와 자주 묻는 질문',
  'home.links.eyebrow': '무료 학습 도구', // TODO(ko-review)
  'home.links.title': '추천 학습 도구', // TODO(ko-review)
  'home.links.lead': '수업 사이에 학생들과 함께 쓰는 무료 사이트예요.', // TODO(ko-review)
  'home.links.dictionary': '사전', // TODO(ko-review)
  'home.links.dictionary.text': '국립국어원 한국어기초사전이에요. 영어 뜻과 예문을 볼 수 있어요.', // TODO(ko-review)
  'home.links.dictionary.tag': '어휘', // TODO(ko-review)
  'home.links.dictionary.action': '사전 열기', // TODO(ko-review)
  'home.links.pronunciation': '발음 연습', // TODO(ko-review)
  'home.links.pronunciation.text': '누리-세종학당에서 한국어 소리를 듣고 따라 해 보세요.', // TODO(ko-review)
  'home.links.pronunciation.tag': '발음', // TODO(ko-review)
  'home.links.pronunciation.action': '발음 연습하기', // TODO(ko-review)
  'home.links.news': '한국어 뉴스', // TODO(ko-review)
  'home.links.news.text': '오마이뉴스의 진짜 한국어 뉴스로 읽기를 연습해요.', // TODO(ko-review)
  'home.links.news.tag': '읽기', // TODO(ko-review)
  'home.links.news.action': '뉴스 읽기', // TODO(ko-review)
  'home.links.newTab': '새 탭에서 열림', // TODO(ko-review)
  'home.newLessons.eyebrow': '채널에서', // TODO(ko-review)
  'home.newLessons.title': '새 강의',
  'home.newLessons.lead': '새 영상과 함께 사이트에서 노트와 연습 문제를 볼 수 있어요.', // TODO(ko-review)
  'home.newLessons.all': '모든 강의',
  'home.newLessons.watch': '보기', // TODO(ko-review)
  'lessons.read': '읽기', // TODO(ko-review)

  'lessons.lead':
    '강의는 유튜브 채널과 같은 방식으로 정리했어요. 코스는 순서대로 보는 걸 추천해요.',
  'lessons.other': '기타 강의',
  'lessons.playlist': '유튜브 재생목록',
  'lessons.noVideo': '영상 없는 강의',

  'grammar.lead': '강의에 나온 문법과 그 문법을 설명하는 강의를 모았어요.', // TODO(ko-review)
  'grammar.search': '문법 검색',
  'grammar.searchHint': '예: 도록',
  'grammar.noResults': '맞는 문법이 없어요.',
  'grammar.level.beginner': '초급',
  'grammar.level.intermediate': '중급',
  'grammar.level.advanced': '고급',

  'materials.lead': '공부할 때 쓰는 학습지, 노트, 대본이에요. 무료로 내려받으세요.',
  'materials.tab.class': '수업 보조 자료',
  'materials.tab.podcast': '팟캐스트 자료',
  'materials.tab.self-study': '공부 자료',
  'materials.tab.from-lessons': '강의 자료',
  'materials.type.reading': '읽기',
  'materials.type.writing': '쓰기',
  'materials.type.listening': '듣기',
  'materials.type.vocabulary': '단어',
  'materials.type.video': '영상',
  'materials.type.lesson': '강의',
  'materials.col.type': '분류',
  'materials.col.title': '제목',
  'materials.col.files': '파일',
  'materials.col.date': '작성일',
  'materials.filterType': '분류 선택',
  'materials.allTypes': '전체 보기',
  'materials.search': '제목으로 검색',
  'materials.noResults': '맞는 자료가 없어요.', // TODO(ko-review)

  'classes.lead':
    '지은 선생님과 함께하는 온라인 화상 수업이에요. 1:1, 소그룹, 레벨별 그룹 수업이 있어요.', // TODO(ko-review)
  'classes.ask': '수업 문의하기',
  'widget.fromLesson': '관련 강의',
  'deck.flipHint': '뜻 보기',
  'deck.meaning': '뜻',
  'deck.know': '알아요',
  'deck.again': '다시',
  'deck.position': '{total}장 중 {n}번째',
  'deck.knownCount': '{k}장 알아요',
  'deck.done': '{n}장 중 {k}장을 알아요.',
  'deck.rest': '남은 카드 연습하기',
  'deck.restart': '처음부터',
  'quiz.position': '{total}문제 중 {n}번',
  'quiz.yourAnswer': '답',
  'quiz.check': '확인',
  'quiz.correct': '정답이에요',
  'quiz.wrong': '아쉬워요',
  'quiz.expected': '정답:',
  'quiz.next': '다음',
  'quiz.seeResult': '결과 보기',
  'quiz.result': '{n}문제 중 {k}문제 맞았어요.',
  'quiz.best': '최고 점수: {n}문제 중 {b}문제',
  'quiz.again': '다시 풀기',
  'about.portraitAlt': '웃으며 손을 흔드는 지은 선생님 일러스트',
  'about.principles': '수업 방식',
  'about.timeline': '가르쳐 온 곳',
  'about.channel': '유튜브 채널',
  'about.channelLink': '채널 열기',
  'about.cta': '함께 배워요',
  'about.ctaText': '실시간 수업에 참여하거나, 채널의 무료 강의로 시작해 보세요.',
  'about.toClasses': '수업 보기',
  'classes.faq': '예약 전에 자주 묻는 질문',
  'classes.formats': '수업 형태',
  'classes.steps': '시작하는 방법',
  'classes.ready': '어떤 수업이 맞을지 고민되나요?', // TODO(ko-review)
  'classes.readyText': '지은 선생님에게 문의하면 나에게 맞는 수업과 시간을 추천해 드려요.', // TODO(ko-review)
  'classes.contact': '문의하기',

  'practice.lead': '강의에서 배운 내용을 확인해 보세요. 가입은 필요 없어요.',
  'practice.decks': '단어 카드',
  'practice.quizzes': '퀴즈',
  'practice.decksText': '카드를 뒤집어 보고 알았는지 표시해요. 진도는 이 브라우저에 저장돼요.', // TODO(ko-review)
  'practice.quizzesText': '강의 내용을 짧은 퀴즈로 확인하고 바로 정답을 볼 수 있어요.', // TODO(ko-review)
  'practice.decksCount': '단어 카드 {n}개', // TODO(ko-review)
  'practice.quizzesCount': '퀴즈 {n}개', // TODO(ko-review)
  'practice.open': '열기', // TODO(ko-review)
  'practice.topik': 'TOPIK 모의고사', // TODO(ko-review)
  'practice.topikText': 'TOPIK 시험 형식으로 시간을 재며 연습하고, 마지막에 점수를 확인해요.', // TODO(ko-review)
  'practice.soon': '준비 중', // TODO(ko-review)
  'practice.chooseDeck': '카드 묶음 고르기', // TODO(ko-review)
  'practice.chooseQuiz': '퀴즈 고르기', // TODO(ko-review)
  'practice.fromLessons': '강의에서', // TODO(ko-review)
  'practice.dictionaryField': '한국어 단어',
  'practice.dictionaryGo': '찾기',

  'contact.demo': '데모 양식, 실제로 보내지지 않아요',
  'contact.lead': '수업이나 자료에 대해 궁금한 점이 있나요? 여기에 남겨 주세요.',
  'contact.name': '이름',
  'contact.email': '이메일',
  'contact.topic': '주제',
  'contact.topicChoose': '주제를 선택하세요',
  'contact.topicClasses': '수업',
  'contact.topicMaterials': '자료',
  'contact.topicOther': '기타',
  'contact.message': '메시지',
  'contact.send': '보내기',
  'contact.demoSent':
    '데모예요: 메시지가 보내지지 않았어요. 여기에 실제 양식(Tally)이 들어갈 거예요.',

  'lesson.watchOnYouTube': '유튜브에서 보기',
  'lesson.play': '영상 재생',
  'lesson.grammar': '이 강의의 문법',
  'lesson.files': '자료',
  'lesson.practice': '연습',
  'lesson.deck': '단어 카드',
  'lesson.quiz': '퀴즈',
  'lesson.series': '시리즈',
  'lesson.prev': '이전',
  'lesson.next': '다음',
  'lesson.kind.pdf': 'PDF',
  'lesson.kind.audio': '오디오',
  'lesson.kind.transcript': '대본',
  'lesson.cards': '단어',
  'lesson.questions': '문제',

  'notice.label': '공지',
  'notice.details': '자세히',
  'notice.dismiss': '공지 닫기',
  'notice.tone.important': '중요',
  'notice.tone.news': '새 소식',
  'notice.tone.info': '안내',

  'placeholder.comingSoon': '준비 중',
  'placeholder.body': '이 페이지는 준비 중이에요. 그동안 유튜브에서 강의를 볼 수 있어요.',
  'placeholder.backHome': '홈으로',

  'page.lessons.title': '강의',
  'page.grammar.title': '문법',
  'page.lessons.eyebrow': '채널에서', // TODO(ko-review)
  'page.grammar.eyebrow': '강의에 나온 문법', // TODO(ko-review)
  'page.materials.eyebrow': '무료 자료', // TODO(ko-review)
  'page.practice.eyebrow': '무료 연습', // TODO(ko-review)
  'lessons.course': '코스 · 순서대로 보기', // TODO(ko-review)
  'lessons.library': '재생목록', // TODO(ko-review)
  'lessons.podcast': '팟캐스트', // TODO(ko-review)
  'lessons.single': '단독 강의', // TODO(ko-review)
  'page.practice.title': '연습',
  'page.materials.title': '자료',
  'page.classes.title': '수업',
  'page.contact.title': '문의',
  'page.about.title': '소개',

  'notFound.title': '페이지를 찾을 수 없어요',
  'notFound.body': '찾으시는 페이지가 없거나 이동되었어요.',
};

export const ui: { en: typeof en; ko: Partial<Record<UIKey, string>> } = { en, ko };
