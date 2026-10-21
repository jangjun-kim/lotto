/** public/data/latest.json 형식 (생성 스크립트와 웹 공용). */
export interface LatestData {
  /** 생성 시각, KST ISO 문자열 (예: 2026-10-25T00:05:00+09:00) */
  generatedAt: string;
  /** 추첨일(다가오는 토요일), YYYY-MM-DD */
  drawDate: string;
  /** 5게임, 각 게임은 오름차순 6개 번호 */
  games: number[][];
}
