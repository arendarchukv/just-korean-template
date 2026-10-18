/**
 * The channel's playlists. Hardcoded on purpose: they change rarely, so they are not a Pages CMS
 * form; a lesson picks one by id from a fixed list (`.pages.yml` options must match, tested).
 * Order here is the order on the Lessons page. A course is watched in order (oldest first).
 * Title and description in every interface language (`playlistText(p, lang)`). Korean: TODO(ko-review).
 */
import { pick, type Localized } from '../i18n/localized';
import type { Lang } from '../i18n/ui';

type PlaylistText = { title: string; description: string };

export const PLAYLISTS = [
  {
    id: 'crash-course',
    kind: 'course',
    youtube: 'https://www.youtube.com/playlist?list=PLciVMc5G4V73s1mfuvXEIoK2J5JKHTEkL',
    text: {
      en: {
        title: 'Beginner Korean Crash Course',
        description:
          'Ten short lessons that take you from the alphabet to your first conversations. Watch them in order.',
      },
      ko: {
        title: '초급 한국어 집중 코스',
        description: '한글부터 첫 대화까지 이어지는 짧은 강의 10개예요. 순서대로 보세요.',
      },
      es: {
        title: 'Curso intensivo de coreano para principiantes',
        description:
          'Diez lecciones cortas que te llevan del alfabeto a tus primeras conversaciones. Míralas en orden.',
      },
      id: {
        title: 'Kursus Kilat Bahasa Korea untuk Pemula',
        description:
          'Sepuluh pelajaran singkat dari alfabet hingga percakapan pertamamu. Tonton secara berurutan.',
      },
      uk: {
        title: 'Інтенсивний курс корейської для початківців',
        description: 'Десять коротких уроків від абетки до перших розмов. Дивіться по порядку.',
      },
    },
  },
  {
    id: 'grammar',
    kind: 'library',
    youtube: 'https://www.youtube.com/playlist?list=PLciVMc5G4V70rHatPHL57LXh5GAcIdqL_',
    text: {
      en: {
        title: 'Grammar',
        description: 'Patterns explained side by side, so you know which one to use and when.',
      },
      ko: {
        title: '문법',
        description: '비슷한 문법을 나란히 설명해서 언제 무엇을 써야 하는지 알 수 있어요.',
      },
      es: {
        title: 'Gramática',
        description: 'Estructuras explicadas lado a lado, para que sepas cuál usar y cuándo.',
      },
      id: {
        title: 'Tata Bahasa',
        description: 'Pola dijelaskan berdampingan, supaya kamu tahu mana yang dipakai dan kapan.',
      },
      uk: {
        title: 'Граматика',
        description: 'Конструкції пояснено поруч, щоб ви знали, яку вживати і коли.',
      },
    },
  },
  {
    id: 'speaking',
    kind: 'library',
    youtube: 'https://www.youtube.com/playlist?list=PLciVMc5G4V72KhtyUJea3PFVC69hCaG0a',
    text: {
      en: {
        title: 'Speaking like a Korean',
        description:
          'Everyday ways to give reasons, make plans and share experiences, the way Koreans really say them.',
      },
      ko: {
        title: '한국인처럼 말하기',
        description: '이유, 계획, 경험을 한국 사람들이 실제로 말하는 방식으로 표현해 봐요.',
      },
      es: {
        title: 'Hablar como un coreano',
        description:
          'Formas cotidianas de dar razones, hacer planes y contar experiencias, como lo dicen los coreanos.',
      },
      id: {
        title: 'Berbicara seperti orang Korea',
        description:
          'Cara sehari-hari memberi alasan, membuat rencana, dan bercerita pengalaman, seperti orang Korea mengatakannya.',
      },
      uk: {
        title: 'Говоримо як корейці',
        description:
          'Як пояснювати причини, розповідати про плани й досвід так, як справді говорять корейці.',
      },
    },
  },
  {
    id: 'vocabulary',
    kind: 'library',
    youtube: 'https://www.youtube.com/playlist?list=PLciVMc5G4V71jmNmV1YZRlKEqOnA28IZY',
    text: {
      en: {
        title: 'Vocabulary',
        description: 'Words and expressions grouped by topic, with how and when to use them.',
      },
      ko: {
        title: '어휘',
        description: '주제별로 모은 단어와 표현, 그리고 언제 어떻게 쓰는지 알려 줘요.',
      },
      es: {
        title: 'Vocabulario',
        description: 'Palabras y expresiones por temas, con cómo y cuándo usarlas.',
      },
      id: {
        title: 'Kosakata',
        description: 'Kata dan ungkapan per topik, beserta cara dan kapan memakainya.',
      },
      uk: {
        title: 'Лексика',
        description: 'Слова й вирази за темами: як і коли їх вживати.',
      },
    },
  },
  {
    id: 'pronunciation',
    kind: 'library',
    youtube: 'https://www.youtube.com/playlist?list=PLciVMc5G4V71qW6-8XEXiilH1RriW8bRw',
    text: {
      en: {
        title: 'Pronunciation',
        description:
          'Sounds that are hard for learners, and the rules that change how words are read.',
      },
      ko: {
        title: '발음',
        description: '학습자에게 어려운 소리와 단어를 읽을 때 바뀌는 발음 규칙을 다뤄요.',
      },
      es: {
        title: 'Pronunciación',
        description:
          'Sonidos difíciles para estudiantes y las reglas que cambian cómo se leen las palabras.',
      },
      id: {
        title: 'Pelafalan',
        description: 'Bunyi yang sulit bagi pelajar dan aturan yang mengubah cara kata dibaca.',
      },
      uk: {
        title: 'Вимова',
        description: 'Звуки, складні для тих, хто вчить мову, і правила, що змінюють читання слів.',
      },
    },
  },
  {
    id: 'shadowing',
    kind: 'course',
    youtube: 'https://www.youtube.com/playlist?list=PLciVMc5G4V73j1UccE3Cf-VRbGpoP6aaw',
    text: {
      en: {
        title: 'Shadowing',
        description:
          'Listen and repeat right after the speaker to train your ear and your speaking together. Go in order.',
      },
      ko: {
        title: '쉐도잉',
        description: '듣고 바로 따라 말하면서 듣기와 말하기를 함께 연습해요. 순서대로 해 보세요.',
      },
      es: {
        title: 'Shadowing',
        description:
          'Escucha y repite justo después del hablante para entrenar el oído y el habla a la vez. Síguelos en orden.',
      },
      id: {
        title: 'Shadowing',
        description:
          'Dengarkan dan ulangi tepat setelah pembicara untuk melatih pendengaran dan berbicara sekaligus. Ikuti berurutan.',
      },
      uk: {
        title: 'Шедоуінг',
        description:
          'Слухайте й одразу повторюйте за мовцем, щоб тренувати слух і мовлення разом. Ідіть по порядку.',
      },
    },
  },
  {
    id: 'podcast',
    kind: 'podcast',
    youtube: 'https://www.youtube.com/playlist?list=PLciVMc5G4V7322t47a1iFShAD8SSk_E_2',
    text: {
      en: {
        title: 'Podcast & listening',
        description:
          'Korean culture and travel stories told in natural Korean, for listening practice.',
      },
      ko: {
        title: '팟캐스트와 듣기',
        description: '자연스러운 한국어로 들려주는 한국 문화와 여행 이야기로 듣기를 연습해요.',
      },
      es: {
        title: 'Pódcast y comprensión auditiva',
        description:
          'Cultura coreana e historias de viaje en coreano natural, para practicar la escucha.',
      },
      id: {
        title: 'Podcast & menyimak',
        description:
          'Cerita budaya dan perjalanan Korea dalam bahasa Korea alami, untuk latihan menyimak.',
      },
      uk: {
        title: 'Подкаст і аудіювання',
        description:
          'Розповіді про корейську культуру й подорожі природною корейською, щоб тренувати слух.',
      },
    },
  },
  {
    id: 'reading',
    kind: 'library',
    youtube: 'https://www.youtube.com/playlist?list=PLciVMc5G4V70Wcrs1_XYSLKwW3tcbrLZB',
    text: {
      en: {
        title: 'Reading',
        description:
          'Read a Korean text together, with the words and grammar explained along the way.',
      },
      ko: {
        title: '읽기',
        description: '한국어 글을 함께 읽으면서 단어와 문법을 설명해요.',
      },
      es: {
        title: 'Lectura',
        description:
          'Leemos juntos un texto en coreano y explicamos palabras y gramática por el camino.',
      },
      id: {
        title: 'Membaca',
        description: 'Membaca teks Korea bersama, sambil menjelaskan kata dan tata bahasanya.',
      },
      uk: {
        title: 'Читання',
        description: 'Читаємо корейський текст разом і пояснюємо слова та граматику дорогою.',
      },
    },
  },
  {
    id: 'culture',
    kind: 'library',
    youtube: 'https://www.youtube.com/playlist?list=PLciVMc5G4V70RIie3yuM27DIGMM8Mly6W',
    text: {
      en: {
        title: 'Korean culture',
        description: 'Everyday life and culture in Korea, often with a guest.',
      },
      ko: {
        title: '한국 문화',
        description: '한국의 일상과 문화를 이야기해요. 게스트와 함께할 때도 많아요.',
      },
      es: {
        title: 'Cultura coreana',
        description: 'La vida diaria y la cultura en Corea, a menudo con un invitado.',
      },
      id: {
        title: 'Budaya Korea',
        description: 'Kehidupan sehari-hari dan budaya di Korea, sering bersama tamu.',
      },
      uk: {
        title: 'Корейська культура',
        description: 'Повсякдення й культура Кореї, часто з гостем.',
      },
    },
  },
  {
    id: 'kpop',
    kind: 'library',
    youtube: 'https://www.youtube.com/playlist?list=PLciVMc5G4V721U5jwNaQLPUKSnyMj7n4N',
    text: {
      en: {
        title: 'K-pop',
        description: 'Learn Korean from the lyrics of K-pop songs.',
      },
      ko: {
        title: '케이팝',
        description: '케이팝 노래 가사로 한국어를 배워요.',
      },
      es: {
        title: 'K-pop',
        description: 'Aprende coreano con las letras de canciones de K-pop.',
      },
      id: {
        title: 'K-pop',
        description: 'Belajar bahasa Korea dari lirik lagu K-pop.',
      },
      uk: {
        title: 'K-pop',
        description: 'Вчимо корейську за текстами пісень K-pop.',
      },
    },
  },
] as const satisfies readonly {
  id: string;
  kind: 'course' | 'library' | 'podcast';
  youtube?: string;
  text: Localized<PlaylistText>;
}[];

export type PlaylistId = (typeof PLAYLISTS)[number]['id'];
export const PLAYLIST_IDS = PLAYLISTS.map((p) => p.id) as [PlaylistId, ...PlaylistId[]];

/** A playlist's title and description in the page language (English when missing). */
export function playlistText(playlist: { text: unknown }, lang: Lang): PlaylistText {
  return pick(playlist.text as Localized<PlaylistText>, lang);
}
