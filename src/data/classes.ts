/**
 * Classes: formats, how to start, and FAQ. Hardcoded on purpose: this page changes rarely, so it
 * is not in Pages CMS (only the main content is). Used by the Classes page and the home classes block.
 *
 * Draft for review: the facts (lengths, group sizes), steps and FAQ wording are placeholders based
 * on the old site; JiEun should check them before launch.
 */

export type ClassFormat = {
  name: string;
  forWhom: string;
  how: string;
  facts: { label: string; value: string }[];
};

export const FORMATS: ClassFormat[] = [
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
];

export const STEPS: { title: string; text: string }[] = [
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
];

export const FAQ: { question: string; answer: string }[] = [
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
];
