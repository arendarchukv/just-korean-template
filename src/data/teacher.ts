/**
 * About the teacher: used by the home about block, the About page and the Classes page.
 * Hardcoded on purpose: it changes rarely, so it is not in Pages CMS (only the main content is).
 * One version per interface language (`pick(TEACHER, lang)`); translations.test.ts checks that
 * every language has every item.
 *
 * Draft for review: JiEun should rewrite the greeting, intro, story, principles and timeline in
 * her own words. Numbers are from the channel page on 2026-10-14. Korean: TODO(ko-review).
 */
import type { Localized } from '../i18n/localized';

/** Her photo: upload to R2 and paste the https:// link (also add the domain to image.domains). */
export const TEACHER_PHOTO = '';

type TeacherText = {
  greeting: string;
  intro: string;
  photoAlt: string;
  credentials: string[];
  story: string[];
  principles: { title: string; text: string }[];
  timeline: { place: string; text: string }[];
  channel: { value: string; label: string }[];
};

export const TEACHER: Localized<TeacherText> = {
  en: {
    greeting: "Hi, I'm JiEun",
    intro:
      'I teach real, everyday Korean on YouTube and in live classes. Short, clear lessons that explain not only what to say, but why.',
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
  },
  ko: {
    greeting: '안녕하세요, 지은이에요',
    intro:
      '유튜브와 실시간 수업에서 진짜 일상 한국어를 가르쳐요. 무엇을 말하는지뿐 아니라 왜 그렇게 말하는지까지, 짧고 명확하게 설명해요.',
    photoAlt: 'Just Korean 선생님 지은',
    credentials: [
      '한국어교육 석사',
      '한국어 교원 자격증 보유',
      '홍콩, 네덜란드, 스페인에서 강의',
      '유튜브 구독자 2.6만 명 이상',
    ],
    story: [
      '사람들이 실제로 쓰는 한국어를 나누고 싶어서 Just Korean을 시작했어요. 비슷한 두 어미의 작은 차이, 교과서가 아니라 카페에서 들리는 문장의 느낌 같은 것들이요.',
      '그동안 홍콩, 네덜란드, 스페인에서 온라인과 오프라인으로 학생들을 가르쳤어요. 채널의 영상은 수업 시간에 학생들이 했던 질문에서 시작되었어요.',
    ],
    principles: [
      {
        title: '나란히 비교하기',
        text: '비슷해 보이는 문법을 함께 설명해서 언제 무엇을 써야 하는지 알 수 있어요.',
      },
      {
        title: '진짜 문장',
        text: '예문은 일상생활에서, 한국 사람들이 실제로 말하는 그대로 가져와요.',
      },
      {
        title: '작은 걸음',
        text: '쉬는 시간에 볼 수 있는 짧은 강의라서 보고 나서 바로 연습할 수 있어요.',
      },
    ],
    timeline: [
      { place: '홍콩', text: '성인 학습자를 위한 한국어 수업.' },
      { place: '네덜란드', text: '개인 수업과 그룹 수업.' },
      { place: '스페인', text: '수업, 그리고 지금의 Just Korean 채널.' },
    ],
    channel: [
      { value: '234', label: '영상 강의' },
      { value: '26K+', label: '구독자' },
      { value: '54', label: '문법 영상' },
    ],
  },
};

/** How many lessons the home page shows under "New lessons". */
export const NEW_LESSONS_COUNT = 3;
