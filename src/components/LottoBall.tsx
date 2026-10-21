import type { CSSProperties } from 'react';
import styles from './LottoBall.module.css';

interface LottoBallProps {
  number: number;
  /** 등장 애니메이션 순서 (0부터) */
  order?: number;
}

/** 번호 구간별 색상 (동행복권 공 색상 기준) */
function colorClass(number: number): string {
  if (number <= 10) return styles.yellow;
  if (number <= 20) return styles.blue;
  if (number <= 30) return styles.red;
  if (number <= 40) return styles.gray;
  return styles.green;
}

export function LottoBall({ number, order = 0 }: LottoBallProps) {
  const style = { '--delay': `${order * 60}ms` } as CSSProperties;
  return (
    <span className={`${styles.ball} ${colorClass(number)}`} style={style} role="img" aria-label={`${number}번`}>
      {number}
    </span>
  );
}
