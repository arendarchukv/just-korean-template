/**
 * Which holiday a day falls in. Days are ISO strings (YYYY-MM-DD), compared as text, like the
 * notice strip; the visitor's browser passes its own local day.
 */
import {
  FIXED_WINDOWS,
  HOLIDAYS,
  LUNAR_AFTER,
  LUNAR_BEFORE,
  LUNAR_DAYS,
  type HolidayId,
} from '../data/holidays';

export type HolidayWindow = { id: HolidayId; from: string; to: string };

/** A day moved by n days, by calendar (UTC arithmetic, so no time zone or DST shifts). */
function shift(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Every holiday's window for the years of the lunar table, in priority order. */
export function holidayWindows(): HolidayWindow[] {
  const years = Object.keys(LUNAR_DAYS.seollal).map(Number);
  return years.flatMap((year) =>
    HOLIDAYS.map(({ id }) => {
      if (id === 'seollal' || id === 'chuseok') {
        const day = LUNAR_DAYS[id][year];
        return { id, from: shift(day, -LUNAR_BEFORE), to: shift(day, LUNAR_AFTER) };
      }
      const [from, to] = FIXED_WINDOWS[id];
      return { id, from: `${year}-${from}`, to: `${year}-${to}` };
    }),
  );
}

export function holidayOn(
  today: string,
  windows: HolidayWindow[] = holidayWindows(),
): HolidayId | undefined {
  return windows.find((w) => w.from <= today && today <= w.to)?.id;
}

export type HolidaySetting = 'none' | 'auto' | HolidayId;

/**
 * What a page carries for the Site settings choice: `none`, no holiday markup or script at all;
 * `auto`, every holiday's markup and the date script; a holiday id, that holiday written into the
 * page at build (`fixed`), shown without JS, no script.
 */
export function holidayRender(setting: HolidaySetting): {
  pieces: boolean;
  script: boolean;
  fixed?: HolidayId;
} {
  if (setting === 'none') return { pieces: false, script: false };
  if (setting === 'auto') return { pieces: true, script: true };
  return { pieces: true, script: false, fixed: setting };
}
