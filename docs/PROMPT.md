로또 6/45 번호 생성 웹앱을 React로 만들어줘.
일주일에 한 번 자동으로 5게임을 생성하고, 사이트에 접속하면 이번 주 번호를 볼 수 있어야 해.
서버 없이 Vercel(호스팅) + GitHub Actions(주간 생성)로 동작해야 해.

[기술 스택]
- Vite + React + TypeScript
- 스타일은 CSS Modules (추가 UI 라이브러리 없이)
- 테스트는 Vitest
- 생성 스크립트는 Node.js (TypeScript, tsx로 실행)
- Node 버전은 LTS(20 이상)로 고정: package.json engines + .nvmrc, GitHub Actions에서도 같은 버전 사용

[프로젝트 구조]
- src/lib/lotto.ts : 번호 생성 로직 (순수 함수)
  - 난수 함수를 인자로 주입받는 구조로 작성 (테스트에서 대체 가능하게)
  - node:crypto를 직접 import하지 말 것 (브라우저 번들에 섞이지 않도록)
- src/lib/drawDate.ts : KST 기준 다가오는 토요일 계산 (순수 함수, 기준 시각을 인자로 받음)
- scripts/generate-weekly.ts : node:crypto의 randomInt를 lotto.ts에 주입해 5게임 생성
  → public/data/latest.json 덮어쓰기
  JSON 형식:
  {
    "generatedAt": "KST 기준 ISO 시각 (+09:00 포함)",
    "drawDate": "다가오는 토요일 날짜 (YYYY-MM-DD)",
    "games": [[6개], [6개], [6개], [6개], [6개]]
  }
- src/types.ts : latest.json 타입 정의 (스크립트와 웹 공용)
- src/components/LottoBall.tsx : 공 하나 표시
- src/components/GameRow.tsx : 한 게임(6개 공) 표시
- src/App.tsx : latest.json을 불러와 화면 구성 (웹은 번호를 생성하지 않고 표시만 함)

[생성 규칙]
- 1~45 중 중복 없이 6개를 균등 확률로 뽑는다 (모든 조합의 확률이 동일해야 함).
- 난수는 node:crypto의 randomInt 사용 (Math.random 금지).
- 1~45 배열을 Fisher-Yates로 셔플한 뒤 앞 6개를 오름차순 정렬.
  - 셔플은 i = 44부터 1까지 내려가며 j = randomInt(0, i + 1)로 뽑아 swap
    (randomInt의 최댓값은 포함되지 않으므로 i + 1 필수. 범위가 틀리면 확률이 치우침)
  - 정렬은 반드시 숫자 비교로: sort((a, b) => a - b)
    (기본 sort()는 문자열 비교라 10이 3보다 앞에 오는 버그 발생)
- 저장 전 검증: 5게임, 각 6개, 정수, 1~45, 중복 없음, 오름차순, 게임 간 중복 없음을 확인하고
  하나라도 어긋나면 파일을 쓰지 않고 에러로 종료 (워크플로가 실패로 표시되도록)
- 과거 당첨 번호나 출현 빈도 기반 가중치는 적용하지 않는다.
- 항상 5게임을 생성하고, 게임끼리 같은 조합은 없어야 한다 (겹치면 그 게임만 다시 생성).
- drawDate는 실행 시점 기준 KST로 다가오는 토요일 날짜 (토요일 당일이면 당일 날짜).
- 날짜 계산은 서버/러너의 시스템 시간대(UTC)에 의존하지 말고 Asia/Seoul을 명시적으로 사용.

[자동 생성 - .github/workflows/weekly.yml]
- 매주 일요일 KST 00:05 실행 (cron: "5 15 * * 6", UTC 기준)
- workflow_dispatch도 추가해서 수동 실행 가능하게
- 순서: checkout → setup-node(.nvmrc) → npm ci → 테스트 실행 → 스크립트 실행 → 커밋·푸시
  (테스트 실패 시 커밋하지 않음)
- 빌드·배포는 하지 않음 (Vercel이 푸시를 감지해 배포)
- 커밋 작성자는 github-actions[bot], 커밋 메시지 예: "chore: weekly numbers for 2026-10-24"
- concurrency 설정으로 중복 실행 방지
- permissions: contents: write

[초기 번호 생성]
- 프로젝트를 다 만든 직후, 요일과 상관없이 scripts/generate-weekly.ts를 한 번 실행해서
  public/data/latest.json에 5게임을 생성하고 첫 커밋에 포함할 것
- 이후부터는 매주 일요일 GitHub Actions가 자동으로 덮어씀

[화면]
- 제목 "이번 주 번호" + 추첨일(토요일) + 생성 시각 표시
- 5게임을 A~E로 표시
- 번호는 로또 공 모양, 구간별 색상
  (1-10 노랑, 11-20 파랑, 21-30 빨강, 31-40 회색, 41-45 초록)
- 페이지 로드 시 공이 하나씩 나타나는 간단한 애니메이션 (prefers-reduced-motion이면 생략)
- 5게임 전체 복사 버튼, 복사 형식 예:
  A: 03 11 19 27 34 42
  B: ...
- 복사 성공 시 짧은 안내 표시
- latest.json은 캐시되지 않게 불러올 것 (fetch cache: 'no-store'), 실패 시 안내 문구 표시
- 화면 하단 안내: "번호는 무작위로 생성되며 당첨을 보장하지 않습니다. 로또는 만 19세 이상 구매 가능합니다."
- 페이지 title과 favicon 설정
- 공에 aria-label로 번호 제공 (스크린리더 대응)
- 모바일 화면 대응

[테스트]
- src/lib/lotto.test.ts
  - 결과가 항상 5게임, 각 6개, 1~45 범위, 중복 없음, 오름차순인지
  - 게임끼리 같은 조합이 없는지
  - 10만 회 생성 후 번호별 출현 빈도가 고른지
    (카이제곱 검정 등으로 판단하되, 정상 코드가 우연히 실패하지 않도록 여유 있는 기준 사용)
- src/lib/drawDate.test.ts
  - 요일별로 drawDate가 올바른지 (특히 토요일 당일, 일요일 00:05 KST)
  - UTC 기준으로는 토요일이지만 KST로는 일요일인 시각 처리 확인

[배포]
- Vercel에 GitHub 저장소를 연결해 main 브랜치 푸시 시 자동 배포
- Vite 기본 설정 그대로 사용 (base 경로 설정 불필요)
- 저장소는 public으로 운영하는 것을 기본으로 함
  (Vercel 무료 플랜에서 private 저장소는 봇 커밋의 자동 배포가 막힐 수 있음.
   private로 운영할 경우 Vercel Deploy Hook URL을 GitHub Secrets(VERCEL_DEPLOY_HOOK)에 넣고
   워크플로 마지막에 호출하는 방식으로 대체)

[README.md]
- 로컬 실행 방법 (npm install, npm run dev)
- 주간 생성 스크립트 로컬 실행 방법
- GitHub Actions 수동 실행 방법
- Vercel 연결 방법 (private 저장소일 때 Deploy Hook 설정 포함)
- 주의사항: GitHub 예약 실행은 몇 분~수십 분 지연될 수 있음,
  저장소에 오랫동안 활동이 없으면 예약 실행이 비활성화될 수 있으니 Actions 탭 주기적 확인
- docs/PROMPT.md 링크 추가 ("이 프로젝트를 만든 지시문")

[지시문 저장]
- 이 지시문 전체를 수정하지 말고 그대로 docs/PROMPT.md 파일로 저장해서 첫 커밋에 포함할 것
- 이후 요구사항이 바뀌면 docs/PROMPT.md도 함께 갱신할 것
