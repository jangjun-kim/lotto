import { LottoBall } from './LottoBall';
import styles from './GameRow.module.css';

interface GameRowProps {
  /** 게임 이름 (A~E) */
  label: string;
  numbers: number[];
  /** 이 게임의 첫 공이 몇 번째로 나타날지 (애니메이션 순서) */
  startOrder?: number;
}

export function GameRow({ label, numbers, startOrder = 0 }: GameRowProps) {
  return (
    <li className={styles.row}>
      <span className={styles.label}>{label}</span>
      <div className={styles.balls}>
        {numbers.map((n, i) => (
          <LottoBall key={n} number={n} order={startOrder + i} />
        ))}
      </div>
    </li>
  );
}
