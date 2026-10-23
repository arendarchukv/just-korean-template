/**
 * Korean holidays the site can decorate for (spec docs/superpowers/specs/2026-10-24-holiday-
 * decorations-design.md). Hardcoded like the playlists; Site settings picks none, automatic by
 * date, or one by hand. Order is priority if windows ever overlap. Name and greeting in every
 * interface language; ko, es, id and uk machine-drafted: TODO(ko-review) TODO(es-review)
 * TODO(id-review) TODO(uk-review).
 */
import type { Localized } from '../i18n/localized';

type HolidayText = { name: string; greeting: string };

export const HOLIDAY_IDS = [
  'seollal',
  'chuseok',
  'christmas',
  'hangeulnal',
  'gwangbokjeol',
] as const;
export type HolidayId = (typeof HOLIDAY_IDS)[number];

export const HOLIDAYS: readonly { id: HolidayId; korean: string; text: Localized<HolidayText> }[] =
  [
    {
      id: 'seollal',
      korean: '설날',
      text: {
        en: { name: 'Seollal', greeting: 'Happy Lunar New Year!' },
        ko: { name: '설날', greeting: '새해 복 많이 받으세요!' },
        es: { name: 'Año Nuevo coreano', greeting: '¡Feliz Año Nuevo lunar!' },
        id: { name: 'Tahun Baru Korea', greeting: 'Selamat Tahun Baru Imlek!' },
        uk: { name: 'Соллаль', greeting: 'З Новим роком за місячним календарем!' },
      },
    },
    {
      id: 'chuseok',
      korean: '추석',
      text: {
        en: { name: 'Chuseok', greeting: 'Happy Chuseok!' },
        ko: { name: '추석', greeting: '즐거운 추석 보내세요!' },
        es: { name: 'Chuseok', greeting: '¡Feliz Chuseok!' },
        id: { name: 'Chuseok', greeting: 'Selamat Chuseok!' },
        uk: { name: 'Чхусок', greeting: 'Щасливого Чхусоку!' },
      },
    },
    {
      id: 'christmas',
      korean: '크리스마스',
      text: {
        en: { name: 'Christmas', greeting: 'Merry Christmas!' },
        ko: { name: '크리스마스', greeting: '메리 크리스마스!' },
        es: { name: 'Navidad', greeting: '¡Feliz Navidad!' },
        id: { name: 'Natal', greeting: 'Selamat Natal!' },
        uk: { name: 'Різдво', greeting: 'З Різдвом!' },
      },
    },
    {
      id: 'hangeulnal',
      korean: '한글날',
      text: {
        en: { name: 'Hangul Day', greeting: 'Happy Hangul Day!' },
        ko: { name: '한글날', greeting: '한글날을 축하합니다!' },
        es: { name: 'Día del Hangul', greeting: '¡Feliz Día del Hangul!' },
        id: { name: 'Hari Hangul', greeting: 'Selamat Hari Hangul!' },
        uk: { name: 'День хангилю', greeting: 'З Днем хангилю!' },
      },
    },
    {
      id: 'gwangbokjeol',
      korean: '광복절',
      text: {
        en: { name: 'Liberation Day', greeting: 'Happy Liberation Day!' },
        ko: { name: '광복절', greeting: '광복절을 축하합니다!' },
        es: { name: 'Día de la Liberación', greeting: '¡Feliz Día de la Liberación!' },
        id: { name: 'Hari Pembebasan', greeting: 'Selamat Hari Pembebasan Korea!' },
        uk: { name: 'День визволення', greeting: 'З Днем визволення Кореї!' },
      },
    },
  ];

/**
 * Seollal and Chuseok follow the lunar calendar: their Korean (KST) day per year, from the official
 * holiday lists (checked 2026-10-24 against superkts.com and Wikipedia). Extend before 2034: a
 * unit test fails two years before the table runs out. Past it, these two simply do not show.
 */
export const LUNAR_DAYS: Record<'seollal' | 'chuseok', Record<number, string>> = {
  seollal: {
    2026: '2026-02-17',
    2027: '2027-02-07',
    2028: '2028-01-27',
    2029: '2029-02-13',
    2030: '2030-02-03',
    2031: '2031-01-23',
    2032: '2032-02-11',
    2033: '2033-01-31',
    2034: '2034-02-19',
    2035: '2035-02-08',
  },
  chuseok: {
    2026: '2026-09-25',
    2027: '2027-09-15',
    2028: '2028-10-03',
    2029: '2029-09-22',
    2030: '2030-09-12',
    2031: '2031-10-01',
    2032: '2032-09-19',
    2033: '2033-09-08',
    2034: '2034-09-27',
    2035: '2035-09-16',
  },
};

/** Fixed-date windows, month-day: from, to. */
export const FIXED_WINDOWS: Record<'christmas' | 'hangeulnal' | 'gwangbokjeol', [string, string]> =
  {
    christmas: ['12-20', '12-26'],
    hangeulnal: ['10-08', '10-09'],
    gwangbokjeol: ['08-14', '08-15'],
  };

/** Days shown before and after a lunar holiday's day. */
export const LUNAR_BEFORE = 3;
export const LUNAR_AFTER = 1;
