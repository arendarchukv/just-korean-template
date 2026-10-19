/**
 * About the teacher: the home about block (greeting, intro, credentials, photo).
 * Hardcoded on purpose: it changes rarely, so it is not in Pages CMS (only the main content is).
 * One version per interface language (`pick(TEACHER, lang)`); translations.test.ts checks that
 * every language has every item.
 *
 * Draft for review: JiEun should rewrite the greeting and intro in her own words. Numbers are from the channel page on 2026-10-14. Korean: TODO(ko-review).
 */
import type { Localized } from '../i18n/localized';

/**
 * Her photo for the home hero lives in src/assets/teacher-photo.png (her profile photo, cut out).
 * To use another one from R2 instead, paste its https:// link here (and add the domain to
 * image.domains in astro.config.mjs).
 */
export const TEACHER_PHOTO = '';

type TeacherText = {
  greeting: string;
  intro: string;
  photoAlt: string;
  credentials: string[];
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
      '26K+ subscribers on YouTube',
    ],
  },
  ko: {
    greeting: '안녕하세요, 지은이에요',
    intro:
      '유튜브와 실시간 수업에서 진짜 일상 한국어를 가르쳐요. 무엇을 말하는지뿐 아니라 왜 그렇게 말하는지까지, 짧고 명확하게 설명해요.',
    photoAlt: 'Just Korean 선생님 지은',
    credentials: ['한국어교육 석사', '한국어 교원 자격증 보유', '유튜브 구독자 2.6만 명 이상'],
  },
  // TODO(es-review): machine-drafted.
  es: {
    greeting: 'Hola, soy JiEun',
    intro:
      'Enseño coreano real y cotidiano en YouTube y en clases en directo. Lecciones cortas y claras que explican no solo qué decir, sino por qué.',
    photoAlt: 'JiEun, profesora de Just Korean',
    credentials: [
      'Máster en Enseñanza del Coreano',
      'Profesora de coreano certificada',
      'Más de 26 000 suscriptores en YouTube',
    ],
  },
  // TODO(id-review): machine-drafted.
  id: {
    greeting: 'Halo, saya JiEun',
    intro:
      'Saya mengajar bahasa Korea sehari-hari yang nyata di YouTube dan di kelas langsung. Pelajaran singkat dan jelas yang menjelaskan bukan hanya apa yang harus dikatakan, tetapi juga alasannya.',
    photoAlt: 'JiEun, guru Just Korean',
    credentials: [
      'Magister Pendidikan Bahasa Korea',
      'Guru bahasa Korea bersertifikat',
      'Lebih dari 26 ribu pelanggan di YouTube',
    ],
  },
  // TODO(uk-review): machine-drafted.
  uk: {
    greeting: 'Привіт, я JiEun',
    intro:
      'Я навчаю справжньої повсякденної корейської на YouTube і на живих заняттях. Короткі зрозумілі уроки, які пояснюють не лише що сказати, а й чому.',
    photoAlt: 'JiEun, викладачка Just Korean',
    credentials: [
      'Магістерський ступінь з викладання корейської',
      'Сертифікована викладачка корейської',
      'Понад 26 тис. підписників на YouTube',
    ],
  },
};

/** How many lessons the home page shows under "New lessons". */
export const NEW_LESSONS_COUNT = 3;
