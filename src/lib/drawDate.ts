/**
 * KST(Asia/Seoul) 기준 날짜 계산 (순수 함수).
 * 실행 환경의 시스템 시간대(GitHub Actions 러너는 UTC)에 의존하지 않도록
 * 항상 Asia/Seoul을 명시해 날짜·요일을 구한다.
 */

export const KST_TIME_ZONE = 'Asia/Seoul';

const SATURDAY = 6;
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const kstFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: KST_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

interface KstParts {
  year: number;
  month: number;
  day: number;
  weekday: number;
  hour: number;
  minute: number;
  second: number;
}

function getKstParts(date: Date): KstParts {
  const parts = Object.fromEntries(kstFormatter.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: WEEKDAY_INDEX[parts.weekday],
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 기준 시각의 KST 날짜 기준으로 다가오는 토요일(YYYY-MM-DD). 토요일 당일이면 당일 날짜. */
export function getDrawDate(now: Date): string {
  const { year, month, day, weekday } = getKstParts(now);
  const daysUntilSaturday = (SATURDAY - weekday + 7) % 7;
  // 달력 날짜 계산만 하므로 UTC 자정을 기준으로 더해도 시간대 영향이 없다.
  const saturday = new Date(Date.UTC(year, month - 1, day + daysUntilSaturday));
  return saturday.toISOString().slice(0, 10);
}

/** 기준 시각을 KST ISO 문자열로 변환한다. 예: 2026-10-25T00:05:00+09:00 */
export function toKstIsoString(now: Date): string {
  const { year, month, day, hour, minute, second } = getKstParts(now);
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}+09:00`;
}
