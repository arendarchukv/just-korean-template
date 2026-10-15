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
  /** How many people take part, drawn as dots on the card (decorative; `forWhom` says it). */
  people: number;
  /** The card's button: book a private class (TidyCal) or ask about a group (contact). */
  action: 'book' | 'ask';
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
        people: 1,
        action: 'book',
        forWhom: 'Any level, any goal',
        how: 'A level test first, then materials chosen for you.',
        facts: [
          { label: 'Length', value: '50 minutes' },
          { label: 'Level', value: 'Any' },
          { label: 'Materials', value: 'Chosen after a level test' },
        ],
      },
      {
        name: 'Small group',
        people: 3,
        action: 'ask',
        forWhom: 'Two or three friends who learn together',
        how: "A plan shaped around your group's level and goals.",
        facts: [
          { label: 'Length', value: '60 minutes' },
          { label: 'Level', value: 'The same for the group' },
          { label: 'Materials', value: "Planned for your group's goals" },
        ],
      },
      {
        name: 'Group class',
        people: 6,
        action: 'ask',
        forWhom: 'Learners at the same level',
        how: 'A fixed curriculum by level and topic; join when a new class opens.',
        facts: [
          { label: 'Length', value: '60 minutes' },
          { label: 'Level', value: 'Set for each group' },
          { label: 'Materials', value: 'A course curriculum' },
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
        people: 1,
        action: 'book',
        forWhom: '모든 레벨, 모든 목표',
        how: '레벨 테스트 후 나에게 맞는 교재로 진행해요.',
        facts: [
          { label: '수업 시간', value: '50분' },
          { label: '레벨', value: '상관없음' },
          { label: '교재', value: '레벨 테스트 후 선정' },
        ],
      },
      {
        name: '소수 그룹 수업',
        people: 3,
        action: 'ask',
        forWhom: '함께 배우고 싶은 친구 2~3명',
        how: '그룹의 레벨과 목표에 맞춘 계획으로 진행해요.',
        facts: [
          { label: '수업 시간', value: '60분' },
          { label: '레벨', value: '그룹 모두 같은 레벨' },
          { label: '교재', value: '그룹의 목표에 맞춰 계획' },
        ],
      },
      {
        name: '단체 수업',
        people: 6,
        action: 'ask',
        forWhom: '같은 레벨의 학습자',
        how: '레벨별·주제별로 정해진 커리큘럼으로 진행해요. 새 반이 열릴 때 신청하세요.',
        facts: [
          { label: '수업 시간', value: '60분' },
          { label: '레벨', value: '반마다 정해짐' },
          { label: '교재', value: '코스 커리큘럼' },
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
  // TODO(es-review): machine-drafted.
  es: {
    formats: [
      {
        name: 'Clase particular 1:1',
        people: 1,
        action: 'book',
        forWhom: 'Cualquier nivel, cualquier objetivo',
        how: 'Primero una prueba de nivel y después materiales elegidos para ti.',
        facts: [
          {
            label: 'Duración',
            value: '50 minutos',
          },
          {
            label: 'Nivel',
            value: 'Cualquiera',
          },
          {
            label: 'Materiales',
            value: 'Elegidos tras una prueba de nivel',
          },
        ],
      },
      {
        name: 'Grupo pequeño',
        people: 3,
        action: 'ask',
        forWhom: 'Dos o tres amigos que aprenden juntos',
        how: 'Un plan pensado para el nivel y los objetivos de tu grupo.',
        facts: [
          {
            label: 'Duración',
            value: '60 minutos',
          },
          {
            label: 'Nivel',
            value: 'El mismo para todo el grupo',
          },
          {
            label: 'Materiales',
            value: 'Según los objetivos del grupo',
          },
        ],
      },
      {
        name: 'Clase en grupo',
        people: 6,
        action: 'ask',
        forWhom: 'Estudiantes del mismo nivel',
        how: 'Un programa fijo por nivel y tema; únete cuando se abra un grupo nuevo.',
        facts: [
          {
            label: 'Duración',
            value: '60 minutos',
          },
          {
            label: 'Nivel',
            value: 'Definido para cada grupo',
          },
          {
            label: 'Materiales',
            value: 'Un programa de curso',
          },
        ],
      },
    ],
    steps: [
      {
        title: 'Reserva o escribe',
        text: 'Elige una hora para una clase particular o envía una pregunta si no sabes qué formato te conviene.',
      },
      {
        title: 'Una breve prueba de nivel',
        text: 'Unos minutos de conversación y preguntas para empezar en el punto justo.',
      },
      {
        title: 'Tu primera clase',
        text: 'Recibes un plan y materiales para tu nivel, y empezamos.',
      },
    ],
    faq: [
      {
        question: '¿Puedo unirme a una clase en grupo que ya ha empezado?',
        answer:
          'Las clases en grupo siguen un programa, así que unirse a mitad está limitado. Se abren grupos nuevos con regularidad.',
      },
      {
        question: '¿En qué zona horaria son las clases?',
        answer:
          'El horario cambia durante el año; las horas actuales aparecen en los avisos de la parte superior del sitio.',
      },
    ],
  },
  // TODO(id-review): machine-drafted.
  id: {
    formats: [
      {
        name: 'Kelas privat 1:1',
        people: 1,
        action: 'book',
        forWhom: 'Semua level, semua tujuan',
        how: 'Tes level dulu, lalu materi dipilih khusus untukmu.',
        facts: [
          {
            label: 'Durasi',
            value: '50 menit',
          },
          {
            label: 'Level',
            value: 'Semua level',
          },
          {
            label: 'Materi',
            value: 'Dipilih setelah tes level',
          },
        ],
      },
      {
        name: 'Kelompok kecil',
        people: 3,
        action: 'ask',
        forWhom: 'Dua atau tiga teman yang belajar bersama',
        how: 'Rencana belajar yang disesuaikan dengan level dan tujuan kelompokmu.',
        facts: [
          {
            label: 'Durasi',
            value: '60 menit',
          },
          {
            label: 'Level',
            value: 'Sama untuk semua anggota',
          },
          {
            label: 'Materi',
            value: 'Sesuai tujuan kelompok',
          },
        ],
      },
      {
        name: 'Kelas grup',
        people: 6,
        action: 'ask',
        forWhom: 'Pelajar dengan level yang sama',
        how: 'Kurikulum tetap per level dan topik; bergabunglah saat kelas baru dibuka.',
        facts: [
          {
            label: 'Durasi',
            value: '60 menit',
          },
          {
            label: 'Level',
            value: 'Ditentukan untuk tiap grup',
          },
          {
            label: 'Materi',
            value: 'Kurikulum kursus',
          },
        ],
      },
    ],
    steps: [
      {
        title: 'Pesan atau kirim pesan',
        text: 'Pilih waktu untuk kelas privat, atau kirim pertanyaan jika belum yakin format mana yang cocok.',
      },
      {
        title: 'Tes level singkat',
        text: 'Beberapa menit percakapan dan pertanyaan, supaya pelajaran dimulai dari titik yang tepat.',
      },
      {
        title: 'Kelas pertamamu',
        text: 'Kamu mendapat rencana dan materi sesuai levelmu, lalu kita mulai belajar.',
      },
    ],
    faq: [
      {
        question: 'Bisakah saya bergabung dengan kelas grup yang sudah dimulai?',
        answer:
          'Kelas grup mengikuti kurikulum, jadi bergabung di tengah jalan terbatas. Kelas baru dibuka secara rutin.',
      },
      {
        question: 'Kelas memakai zona waktu apa?',
        answer:
          'Jadwal berubah sepanjang tahun; waktu terbaru ada di pengumuman di bagian atas situs.',
      },
    ],
  },
  // TODO(uk-review): machine-drafted.
  uk: {
    formats: [
      {
        name: 'Індивідуальне заняття 1:1',
        people: 1,
        action: 'book',
        forWhom: 'Будь-який рівень, будь-яка мета',
        how: 'Спершу тест рівня, далі матеріали, дібрані саме для вас.',
        facts: [
          {
            label: 'Тривалість',
            value: '50 хвилин',
          },
          {
            label: 'Рівень',
            value: 'Будь-який',
          },
          {
            label: 'Матеріали',
            value: 'Добираються після тесту рівня',
          },
        ],
      },
      {
        name: 'Мала група',
        people: 3,
        action: 'ask',
        forWhom: 'Двоє-троє друзів, які вчаться разом',
        how: 'План під рівень і цілі вашої групи.',
        facts: [
          {
            label: 'Тривалість',
            value: '60 хвилин',
          },
          {
            label: 'Рівень',
            value: 'Однаковий для всієї групи',
          },
          {
            label: 'Матеріали',
            value: 'Під цілі групи',
          },
        ],
      },
      {
        name: 'Групові заняття',
        people: 6,
        action: 'ask',
        forWhom: 'Учні одного рівня',
        how: 'Фіксована програма за рівнем і темою; приєднуйтеся, коли відкривається нова група.',
        facts: [
          {
            label: 'Тривалість',
            value: '60 хвилин',
          },
          {
            label: 'Рівень',
            value: 'Свій для кожної групи',
          },
          {
            label: 'Матеріали',
            value: 'Програма курсу',
          },
        ],
      },
    ],
    steps: [
      {
        title: 'Запишіться або напишіть',
        text: 'Оберіть час для індивідуального заняття або надішліть питання, якщо не впевнені, який формат підійде.',
      },
      {
        title: 'Короткий тест рівня',
        text: 'Кілька хвилин розмови й запитань, щоб почати з правильного місця.',
      },
      {
        title: 'Перше заняття',
        text: 'Ви отримуєте план і матеріали для свого рівня, і ми починаємо.',
      },
    ],
    faq: [
      {
        question: 'Чи можна приєднатися до групи, яка вже почала навчання?',
        answer:
          'Групові заняття йдуть за програмою, тож приєднатися посередині можна не завжди. Нові групи відкриваються регулярно.',
      },
      {
        question: 'За яким часовим поясом проходять заняття?',
        answer: 'Розклад змінюється протягом року; актуальний час — в оголошеннях угорі сайту.',
      },
    ],
  },
};
