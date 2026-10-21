/**
 * 주간 번호 생성 스크립트.
 * node:crypto의 randomInt로 5게임을 만들고, 검증을 통과하면 public/data/latest.json을 덮어쓴다.
 * 검증에 실패하면 파일을 쓰지 않고 종료 코드 1로 끝나 워크플로가 실패로 표시된다.
 */
import { randomInt } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertValidGames, generateGames } from '../src/lib/lotto';
import { getDrawDate, toKstIsoString } from '../src/lib/drawDate';
import type { LatestData } from '../src/types';

const OUTPUT_PATH = fileURLToPath(new URL('../public/data/latest.json', import.meta.url));

/** 게임 하나를 한 줄로 보이게 직렬화한다. */
function serialize(data: LatestData): string {
  const games = data.games.map((game) => `    ${JSON.stringify(game)}`).join(',\n');
  return [
    '{',
    `  "generatedAt": ${JSON.stringify(data.generatedAt)},`,
    `  "drawDate": ${JSON.stringify(data.drawDate)},`,
    '  "games": [',
    games,
    '  ]',
    '}',
    '',
  ].join('\n');
}

async function main() {
  const now = new Date();
  const games = generateGames(randomInt);
  assertValidGames(games);

  const data: LatestData = {
    generatedAt: toKstIsoString(now),
    drawDate: getDrawDate(now),
    games,
  };

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, serialize(data), 'utf8');

  console.log(`추첨일 ${data.drawDate} 번호를 생성했습니다 (${data.generatedAt}).`);
  data.games.forEach((game, i) => console.log(`  ${String.fromCharCode(65 + i)}: ${game.join(' ')}`));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
