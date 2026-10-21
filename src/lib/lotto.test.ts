import { randomInt } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  GAME_COUNT,
  MAX_NUMBER,
  MIN_NUMBER,
  NUMBERS_PER_GAME,
  type RandomInt,
  generateGame,
  generateGames,
  validateGames,
} from './lotto';

/** 재현 가능한 테스트용 난수 함수 (mulberry32). */
function seededRandomInt(seed: number): RandomInt {
  let state = seed >>> 0;
  return (min, max) => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return min + Math.floor(r * (max - min));
  };
}

describe('generateGames', () => {
  it('항상 5게임, 각 6개, 1~45 범위, 중복 없음, 오름차순이다', () => {
    // 반복마다 expect를 부르면 느려지므로 어긋난 결과만 모아서 마지막에 한 번 확인한다.
    const failures: unknown[] = [];
    for (let run = 0; run < 2000; run++) {
      const games = generateGames(randomInt);
      const ok =
        games.length === GAME_COUNT &&
        games.every(
          (game) =>
            game.length === NUMBERS_PER_GAME &&
            new Set(game).size === NUMBERS_PER_GAME &&
            game.every(
              (n, i) =>
                Number.isInteger(n) && n >= MIN_NUMBER && n <= MAX_NUMBER && (i === 0 || game[i - 1] < n),
            ),
        ) &&
        validateGames(games).length === 0;
      if (!ok) failures.push(games);
    }
    expect(failures).toEqual([]);
  });

  it('게임끼리 같은 조합이 없다', () => {
    let duplicated = 0;
    for (let run = 0; run < 2000; run++) {
      const keys = generateGames(randomInt).map((g) => g.join(','));
      if (new Set(keys).size !== GAME_COUNT) duplicated++;
    }
    expect(duplicated).toBe(0);
  });

  it('같은 조합이 나오면 그 게임만 다시 생성한다', () => {
    // 처음 두 게임은 swap이 일어나지 않도록(j = i) 해서 [1..6]이 두 번 나오게 한다.
    const fallback = seededRandomInt(42);
    let calls = 0;
    const rigged: RandomInt = (min, max) => (calls++ < 88 ? max - 1 : fallback(min, max));

    const games = generateGames(rigged);
    expect(games[0]).toEqual([1, 2, 3, 4, 5, 6]);
    expect(games).toHaveLength(GAME_COUNT);
    expect(new Set(games.map((g) => g.join(','))).size).toBe(GAME_COUNT);
  });

  it('숫자 기준으로 정렬한다 (문자열 정렬 아님)', () => {
    // 한 자리 수와 두 자리 수가 섞인 조합이 충분히 나오도록 여러 시드로 확인
    for (let seed = 0; seed < 200; seed++) {
      const game = generateGame(seededRandomInt(seed));
      expect(game).toEqual([...game].sort((a, b) => a - b));
    }
  });

  it('10만 게임 생성 시 번호별 출현 빈도가 고르다 (카이제곱 검정)', () => {
    const TRIALS = 100_000;
    const counts = new Array<number>(MAX_NUMBER + 1).fill(0);
    for (let t = 0; t < TRIALS; t++) {
      for (const n of generateGame(randomInt)) counts[n]++;
    }

    const expected = (TRIALS * NUMBERS_PER_GAME) / MAX_NUMBER;
    let chiSquare = 0;
    for (let n = MIN_NUMBER; n <= MAX_NUMBER; n++) {
      chiSquare += (counts[n] - expected) ** 2 / expected;
    }

    // 자유도 44의 카이제곱 분포: 평균 44, 표준편차 약 9.4.
    // 기준 110은 평균 + 약 7σ (p < 1e-9)라 정상 코드가 우연히 실패할 일은 사실상 없고,
    // 셔플 범위 오류(randomInt(0, i) 등)는 수천 단위 값이 나와 확실히 걸린다.
    expect(chiSquare).toBeLessThan(110);
  }, 60_000);

  it('셔플 범위를 잘못 쓰면 카이제곱 검정에 걸린다 (검정 자체의 민감도 확인)', { timeout: 30_000 }, () => {
    const TRIALS = 20_000;
    const offByOne: RandomInt = (min, max) => randomInt(min, Math.max(min + 1, max - 1));
    const counts = new Array<number>(MAX_NUMBER + 1).fill(0);
    for (let t = 0; t < TRIALS; t++) {
      for (const n of generateGame(offByOne)) counts[n]++;
    }
    const expected = (TRIALS * NUMBERS_PER_GAME) / MAX_NUMBER;
    let chiSquare = 0;
    for (let n = MIN_NUMBER; n <= MAX_NUMBER; n++) {
      chiSquare += (counts[n] - expected) ** 2 / expected;
    }
    expect(chiSquare).toBeGreaterThan(110);
  });
});

describe('validateGames', () => {
  const valid = [
    [1, 2, 3, 4, 5, 6],
    [7, 8, 9, 10, 11, 12],
    [13, 14, 15, 16, 17, 18],
    [19, 20, 21, 22, 23, 24],
    [40, 41, 42, 43, 44, 45],
  ];

  it('올바른 데이터는 통과한다', () => {
    expect(validateGames(valid)).toEqual([]);
  });

  it.each([
    ['배열이 아님', null],
    ['게임 수 부족', valid.slice(0, 4)],
    ['번호 수 부족', [[1, 2, 3, 4, 5], ...valid.slice(1)]],
    ['정수 아님', [[1, 2, 3, 4, 5, 6.5], ...valid.slice(1)]],
    ['문자열 포함', [[1, 2, 3, 4, 5, '6'], ...valid.slice(1)]],
    ['범위 초과', [[1, 2, 3, 4, 5, 46], ...valid.slice(1)]],
    ['0 포함', [[0, 2, 3, 4, 5, 6], ...valid.slice(1)]],
    ['게임 내 중복', [[1, 2, 3, 4, 6, 6], ...valid.slice(1)]],
    ['오름차순 아님', [[10, 3, 4, 5, 6, 7], ...valid.slice(1)]],
    ['게임 간 중복', [valid[0], valid[0], ...valid.slice(2)]],
  ])('%s → 오류', (_, games) => {
    expect(validateGames(games).length).toBeGreaterThan(0);
  });
});
