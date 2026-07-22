import {
  addDays,
  addMonths,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns";
import type { ServiceFrequency } from "./types";

const WEEKDAY_MAP: Record<string, number> = {
  dom: 0,
  seg: 1,
  ter: 2,
  qua: 3,
  qui: 4,
  sex: 5,
  sab: 6,
};

function parseTime(serviceTime?: string) {
  const [h, m] = (serviceTime || "09:00").split(":").map(Number);
  return {
    hours: Number.isFinite(h) ? h : 9,
    minutes: Number.isFinite(m) ? m : 0,
  };
}

function atTime(date: Date, serviceTime?: string) {
  const { hours, minutes } = parseTime(serviceTime);
  return setMinutes(setHours(startOfDay(date), hours), minutes);
}

function nextWeekday(from: Date, weekday: number) {
  const d = startOfDay(from);
  const diff = (weekday - d.getDay() + 7) % 7;
  return addDays(d, diff === 0 ? 7 : diff);
}

/** Gera datas futuras de atendimento conforme a frequência. */
export function generateServiceDates(opts: {
  frequency: ServiceFrequency;
  serviceDays: string[];
  serviceTime?: string;
  from?: Date;
  count?: number;
}): Date[] {
  const from = startOfDay(opts.from || new Date());
  const count =
    opts.count ??
    (opts.frequency === "WEEKLY_1" || opts.frequency === "WEEKLY_2"
      ? 8
      : opts.frequency === "BIWEEKLY"
        ? 6
        : 4);
  const days = opts.serviceDays
    .map((d) => WEEKDAY_MAP[d.toLowerCase().trim()])
    .filter((n) => n != null);

  const dates: Date[] = [];

  if (opts.frequency === "WEEKLY_1") {
    const wd = days[0] ?? from.getDay();
    let cursor = nextWeekday(from, wd);
    // se cair muito longe, permite hoje se for o dia
    if (from.getDay() === wd) cursor = from;
    while (dates.length < count) {
      if (cursor >= from) dates.push(atTime(cursor, opts.serviceTime));
      cursor = addDays(cursor, 7);
    }
  } else if (opts.frequency === "WEEKLY_2") {
    const wds = days.length >= 2 ? days.slice(0, 2) : [1, 4];
    let weekStart = from;
    while (dates.length < count) {
      for (const wd of wds.sort((a, b) => a - b)) {
        let d = startOfDay(weekStart);
        const diff = (wd - d.getDay() + 7) % 7;
        d = addDays(d, diff);
        if (d >= from && dates.length < count) {
          dates.push(atTime(d, opts.serviceTime));
        }
      }
      weekStart = addDays(weekStart, 7);
    }
    dates.sort((a, b) => a.getTime() - b.getTime());
  } else if (opts.frequency === "BIWEEKLY") {
    let cursor = addDays(from, 1);
    while (dates.length < count) {
      dates.push(atTime(cursor, opts.serviceTime));
      cursor = addDays(cursor, 15);
    }
  } else {
    // MONTHLY — mesmo dia do mês, a partir do próximo ciclo
    let cursor = addMonths(from, 0);
    // primeira ocorrência: se já passou o horário hoje, próximo mês; senão hoje+1dia no mesmo dia do mês seguinte se for late
    cursor = addDays(from, 1);
    while (dates.length < count) {
      dates.push(atTime(cursor, opts.serviceTime));
      cursor = addMonths(cursor, 1);
    }
  }

  return dates.slice(0, count);
}
