/**
 * 로또 6/45 번호 생성 로직 (순수 함수).
 *
 * 난수 함수는 외부에서 주입받는다. 실제 생성은 node:crypto의 randomInt를,
 * 테스트는 대체 함수를 넘긴다. 이 파일은 브라우저 번들에도 포함될 수 있으므로
 * node:crypto를 직접 import하지 않는다.
 */

/** [min, max) 범위의 정수를 반환하는 난수 함수. max는 포함되지 않는다 (crypto.randomInt와 동일). */
export type RandomInt = (min: number, max: number) => number;

export const MIN_NUMBER = 1;
export const MAX_NUMBER = 45;
export const NUMBERS_PER_GAME = 6;
export const GAME_COUNT = 5;

/** 같은 조합이 계속 나올 때 무한 루프를 막기 위한 상한 (정상 난수라면 사실상 도달 불가). */
const MAX_ATTEMPTS = 1000;

/** 1~45를 Fisher-Yates로 셔플한 뒤 앞 6개를 오름차순으로 반환한다. */
export function generateGame(randomInt: RandomInt): number[] {
  const pool = Array.from({ length: MAX_NUMBER - MIN_NUMBER + 1 }, (_, i) => i + MIN_NUMBER);

  for (let i = pool.length - 1; i >= 1; i--) {
    // randomInt의 최댓값은 포함되지 않으므로 i + 1을 넘겨야 0~i가 균등하게 나온다.
    const j = randomInt(0, i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // 기본 sort()는 문자열 비교라 반드시 숫자 비교 함수를 넘긴다.
  return pool.slice(0, NUMBERS_PER_GAME).sort((a, b) => a - b);
}

/** 서로 다른 조합의 게임을 count개 생성한다. 이미 나온 조합이면 그 게임만 다시 생성한다. */
export function generateGames(randomInt: RandomInt, count: number = GAME_COUNT): number[][] {
  const games: number[][] = [];
  const seen = new Set<string>();
  let attempts = 0;

  while (games.length < count) {
    if (++attempts > MAX_ATTEMPTS) {
      throw new Error(`서로 다른 조합 ${count}개를 생성하지 못했습니다 (${MAX_ATTEMPTS}회 시도).`);
    }
    const game = generateGame(randomInt);
    const key = game.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    games.push(game);
  }

  return games;
}

/** 저장 전 검증. 문제가 있으면 오류 메시지 목록을, 없으면 빈 배열을 반환한다. */
export function validateGames(games: unknown, count: number = GAME_COUNT): string[] {
  if (!Array.isArray(games)) return ['games가 배열이 아닙니다.'];

  const errors: string[] = [];
  if (games.length !== count) {
    errors.push(`게임 수가 ${count}개가 아닙니다 (${games.length}개).`);
  }

  const seen = new Set<string>();
  games.forEach((game: unknown, index) => {
    const label = `${index + 1}번째 게임`;
    if (!Array.isArray(game)) {
      errors.push(`${label}이 배열이 아닙니다.`);
      return;
    }
    if (game.length !== NUMBERS_PER_GAME) {
      errors.push(`${label}의 번호 수가 ${NUMBERS_PER_GAME}개가 아닙니다 (${game.length}개).`);
    }
    if (!game.every((n) => Number.isInteger(n))) {
      errors.push(`${label}에 정수가 아닌 값이 있습니다.`);
      return;
    }
    if (!game.every((n: number) => n >= MIN_NUMBER && n <= MAX_NUMBER)) {
      errors.push(`${label}에 ${MIN_NUMBER}~${MAX_NUMBER} 범위를 벗어난 번호가 있습니다.`);
    }
    if (new Set(game).size !== game.length) {
      errors.push(`${label}에 중복된 번호가 있습니다.`);
    }
    if (!game.every((n: number, i) => i === 0 || game[i - 1] < n)) {
      errors.push(`${label}이 오름차순이 아닙니다.`);
    }

    const key = game.join(',');
    if (seen.has(key)) errors.push(`${label}이 앞선 게임과 같은 조합입니다.`);
    seen.add(key);
  });

  return errors;
}

/** 검증에 실패하면 예외를 던진다. */
export function assertValidGames(games: unknown, count: number = GAME_COUNT): asserts games is number[][] {
  const errors = validateGames(games, count);
  if (errors.length > 0) {
    throw new Error(`번호 검증 실패:\n- ${errors.join('\n- ')}`);
  }
}
