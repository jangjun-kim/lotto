import { useEffect, useRef, useState } from 'react';
import { GameRow } from './components/GameRow';
import type { LatestData } from './types';
import styles from './App.module.css';

const DATA_URL = '/data/latest.json';
const GAME_LABELS = ['A', 'B', 'C', 'D', 'E'];

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: LatestData };
type CopyState = 'idle' | 'copied' | 'failed';

function isLatestData(value: unknown): value is LatestData {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.generatedAt === 'string' &&
    typeof v.drawDate === 'string' &&
    Array.isArray(v.games) &&
    v.games.every((g) => Array.isArray(g) && g.every((n) => typeof n === 'number'))
  );
}

/** 2026-10-24 → 2026년 10월 24일 (토) */
function formatDrawDate(drawDate: string): string {
  const [y, m, d] = drawDate.split('-').map(Number);
  const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'short', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
  return `${y}년 ${m}월 ${d}일 (${weekday})`;
}

/** KST ISO 시각 → 2026. 10. 25. 오전 12:05 */
function formatGeneratedAt(generatedAt: string): string {
  const date = new Date(generatedAt);
  if (Number.isNaN(date.getTime())) return generatedAt;
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/** 복사 형식: "A: 03 11 19 27 34 42" */
function toClipboardText(games: number[][]): string {
  return games
    .map((game, i) => `${GAME_LABELS[i]}: ${game.map((n) => String(n).padStart(2, '0')).join(' ')}`)
    .join('\n');
}

export default function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const copyTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    fetch(DATA_URL, { cache: 'no-store', signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: unknown) => {
        if (!isLatestData(json)) throw new Error('잘못된 데이터 형식');
        setState({ status: 'ready', data: json });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error(error);
        setState({ status: 'error' });
      });
    return () => controller.abort();
  }, []);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  async function handleCopy(games: number[][]) {
    try {
      await navigator.clipboard.writeText(toClipboardText(games));
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopyState('idle'), 2000);
  }

  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <h1 className={styles.title}>이번 주 번호</h1>

        {state.status === 'loading' && <p className={styles.message}>번호를 불러오는 중…</p>}

        {state.status === 'error' && (
          <p className={`${styles.message} ${styles.error}`} role="alert">
            번호를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        {state.status === 'ready' && (
          <>
            <dl className={styles.meta}>
              <div>
                <dt>추첨일</dt>
                <dd>
                  <time dateTime={state.data.drawDate}>{formatDrawDate(state.data.drawDate)}</time>
                </dd>
              </div>
              <div>
                <dt>생성 시각</dt>
                <dd>
                  <time dateTime={state.data.generatedAt}>{formatGeneratedAt(state.data.generatedAt)}</time>
                </dd>
              </div>
            </dl>

            <ol className={styles.games}>
              {state.data.games.map((game, i) => (
                <GameRow key={GAME_LABELS[i]} label={GAME_LABELS[i]} numbers={game} startOrder={i * game.length} />
              ))}
            </ol>

            <div className={styles.actions}>
              <button type="button" className={styles.copyButton} onClick={() => handleCopy(state.data.games)}>
                5게임 전체 복사
              </button>
              <p className={styles.copyStatus} role="status" aria-live="polite">
                {copyState === 'copied' && <span className={styles.success}>복사되었습니다</span>}
                {copyState === 'failed' && <span className={styles.error}>복사하지 못했습니다</span>}
              </p>
            </div>
          </>
        )}
      </main>

      <footer className={styles.footer}>
        번호는 무작위로 생성되며 당첨을 보장하지 않습니다. 로또는 만 19세 이상 구매 가능합니다.
      </footer>
    </div>
  );
}
