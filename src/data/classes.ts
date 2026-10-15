/**
 * Classes: formats, how to start, and FAQ. Hardcoded on purpose: this page changes rarely, so it
 * is not in Pages CMS (only the main content is). Used by the Classes page and the home classes
 * block. One version per interface language (`pick(CLASSES, lang)`); translations.test.ts checks
 * that every language has every item.
 *
 * Draft for review: the facts (lengths, group sizes), steps and FAQ wording are placeholders based
 * on the old site; JiEun should check them before launch. Korean: TODO(ko-review).
 */
import type { Localized } from '../i18n/localized';

export type ClassFormat = {
  name: string;
  forWhom: string;
  how: string;
  facts: { label: string; value: string }[];
};

type ClassesText = {
  formats: ClassFormat[];
  steps: { title: string; text: string }[];
  faq: { question: string; answer: string }[];
};

export const CLASSES: Localized<ClassesText> = {
  en: {
    formats: [
      {
        name: '1:1 private class',
        forWhom: 'Any level, any goal',
        how: 'A level test first, then materials chosen for you.',
        facts: [
          { label: 'Group size', value: '1 student' },
          { label: 'Length', value: '50 minutes' },
          { label: 'Level', value: 'Any' },
          { label: 'Materials', value: 'Chosen after a level test' },
          { label: 'Where', value: 'Online, video call' },
        ],
      },
      {
        name: 'Small group',
        forWhom: 'Two or three friends who learn together',
        how: "A plan shaped around your group's level and goals.",
        facts: [
          { label: 'Group size', value: '2–3 students' },
          { label: 'Length', value: '60 minutes' },
          { label: 'Level', value: 'The same for the group' },
          { label: 'Materials', value: "Planned for your group's goals" },
          { label: 'Where', value: 'Online, video call' },
        ],
      },
      {
        name: 'Group class',
        forWhom: 'Learners at the same level',
        how: 'A fixed curriculum by level and topic; join when a new class opens.',
        facts: [
          { label: 'Group size', value: 'Small groups by level' },
          { label: 'Length', value: '60 minutes' },
          { label: 'Level', value: 'Set for each group' },
          { label: 'Materials', value: 'A course curriculum' },
          { label: 'Where', value: 'Online, video call' },
        ],
      },
    ],
    steps: [
      {
        title: 'Book or write',
        text: 'Pick a time for a private class, or send a question if you are not sure which format fits.',
      },
      {
        title: 'A short level test',
        text: 'A few minutes of conversation and questions, so the lessons start at the right place.',
      },
      {
        title: 'Your first class',
        text: 'You get a plan and materials for your level, and we start learning.',
      },
    ],
    faq: [
      {
        question: 'How do I know my level?',
        answer:
          'Before the first private class there is a short level test, so the lessons start at the right place.',
      },
      {
        question: 'Where do the classes take place?',
        answer: 'Online, by video call. You only need a computer or tablet with a camera.',
      },
      {
        question: 'Can I join a group class that has already started?',
        answer:
          'Group classes follow a curriculum, so joining in the middle is limited. New groups open regularly.',
      },
      {
        question: 'Which time zone are the classes in?',
        answer:
          'The schedule changes during the year; current times are shown in the notices at the top of the site.',
      },
    ],
  },
  ko: {
    formats: [
      {
        name: '1:1 개인 수업',
        forWhom: '모든 레벨, 모든 목표',
        how: '레벨 테스트 후 나에게 맞는 교재로 진행해요.',
        facts: [
          { label: '인원', value: '1명' },
          { label: '수업 시간', value: '50분' },
          { label: '레벨', value: '상관없음' },
          { label: '교재', value: '레벨 테스트 후 선정' },
          { label: '장소', value: '온라인 화상 수업' },
        ],
      },
      {
        name: '소수 그룹 수업',
        forWhom: '함께 배우고 싶은 친구 2~3명',
        how: '그룹의 레벨과 목표에 맞춘 계획으로 진행해요.',
        facts: [
          { label: '인원', value: '2~3명' },
          { label: '수업 시간', value: '60분' },
          { label: '레벨', value: '그룹 모두 같은 레벨' },
          { label: '교재', value: '그룹의 목표에 맞춰 계획' },
          { label: '장소', value: '온라인 화상 수업' },
        ],
      },
      {
        name: '단체 수업',
        forWhom: '같은 레벨의 학습자',
        how: '레벨별·주제별로 정해진 커리큘럼으로 진행해요. 새 반이 열릴 때 신청하세요.',
        facts: [
          { label: '인원', value: '레벨별 소규모 그룹' },
          { label: '수업 시간', value: '60분' },
          { label: '레벨', value: '반마다 정해짐' },
          { label: '교재', value: '코스 커리큘럼' },
          { label: '장소', value: '온라인 화상 수업' },
        ],
      },
    ],
    steps: [
      {
        title: '예약하거나 문의하기',
        text: '개인 수업 시간을 고르거나, 어떤 수업이 맞을지 잘 모르겠다면 질문을 보내 주세요.',
      },
      {
        title: '짧은 레벨 테스트',
        text: '몇 분 동안 대화하고 질문에 답하면 알맞은 단계에서 수업을 시작할 수 있어요.',
      },
      {
        title: '첫 수업',
        text: '레벨에 맞는 계획과 교재를 받고 공부를 시작해요.',
      },
    ],
    faq: [
      {
        question: '제 레벨은 어떻게 알 수 있나요?',
        answer: '첫 개인 수업 전에 짧은 레벨 테스트가 있어서 알맞은 단계에서 시작할 수 있어요.',
      },
      {
        question: '수업은 어디에서 하나요?',
        answer: '온라인 화상 수업이에요. 카메라가 있는 컴퓨터나 태블릿만 있으면 돼요.',
      },
      {
        question: '이미 시작한 단체 수업에 들어갈 수 있나요?',
        answer:
          '단체 수업은 커리큘럼에 따라 진행되기 때문에 중간 참여가 제한돼요. 새 반은 정기적으로 열려요.',
      },
      {
        question: '수업 시간은 어느 시간대 기준인가요?',
        answer:
          '시간표는 1년 동안 바뀌어요. 현재 수업 시간은 사이트 맨 위의 공지에서 확인할 수 있어요.',
      },
    ],
  },
};
