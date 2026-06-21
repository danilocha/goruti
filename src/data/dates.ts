/**
 * Day range builder — generates a sequence of DayRangeItem entries
 * starting from a given date (default: yesterday) for use in DayTabs.
 *
 * Spanish locale is used for day names to match the existing state key
 * convention ("Lunes"–"Domingo").
 */

export interface DayRangeItem {
  /** Full Spanish day name, e.g. "Lunes", "Martes" */
  dayName: string;
  /** 3-letter uppercase abbreviation, e.g. "LUN", "MAR" */
  abbreviation: string;
  /** Day-of-month number (1–31) */
  date: number;
  /** Full Date object */
  fullDate: Date;
  /** Whether this entry corresponds to the current calendar day */
  isToday: boolean;
}

const SPANISH_WEEKDAYS: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

const SPANISH_WEEKDAYS_SHORT: Record<number, string> = {
  0: "DOM",
  1: "LUN",
  2: "MAR",
  3: "MIÉ",
  4: "JUE",
  5: "VIE",
  6: "SÁB",
};

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getYesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

/**
 * Build an array of DayRangeItem entries.
 *
 * @param start  Starting date (default: yesterday).
 * @param count  Number of entries to generate (default: 7).
 */
export function buildDayRange(start?: Date, count: number = 7): DayRangeItem[] {
  const today = new Date();
  const startDate = start ?? getYesterday();

  return Array.from({ length: count }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const weekday = d.getDay();

    return {
      dayName: SPANISH_WEEKDAYS[weekday],
      abbreviation: SPANISH_WEEKDAYS_SHORT[weekday],
      date: d.getDate(),
      fullDate: d,
      isToday: isSameDay(d, today),
    };
  });
}
