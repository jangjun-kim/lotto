# 로또 6/45 이번 주 번호

매주 자동으로 로또 6/45 번호 5게임을 생성하고, 사이트에서 이번 주 번호를 보여주는 웹앱입니다.
서버 없이 **GitHub Actions**(주간 생성)와 **Vercel**(정적 호스팅)로 동작합니다.

- 이 프로젝트를 만든 지시문: [docs/PROMPT.md](docs/PROMPT.md)

## 동작 방식

1. 매주 일요일 00:05(KST)에 GitHub Actions가 테스트를 돌린 뒤 `scripts/generate-weekly.ts`를 실행합니다.
2. 스크립트가 `node:crypto`의 `randomInt`로 5게임을 만들고, 검증을 통과하면 `public/data/latest.json`을 덮어씁니다.
3. 봇이 변경 내용을 `main`에 커밋·푸시하면 Vercel이 이를 감지해 자동 배포합니다.
4. 웹페이지는 번호를 직접 만들지 않고 `latest.json`을 불러와 보여주기만 합니다.

## 요구 사항

- Node.js 20 (20.11 이상, `.nvmrc` 참고, `nvm use`로 맞출 수 있음)

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 터미널에 표시된 주소(기본 http://localhost:5173)로 접속합니다.

그 밖의 명령:

```bash
npm test          # 테스트 실행
npm run build     # 타입 검사 + 프로덕션 빌드 (dist/)
npm run preview   # 빌드 결과 미리보기
```

## 주간 생성 스크립트 로컬 실행

```bash
npm run generate
```

`public/data/latest.json`이 새 번호로 덮어써집니다. 검증(5게임, 각 6개, 1~45 정수, 중복 없음, 오름차순, 게임 간 중복 없음)에
실패하면 파일을 쓰지 않고 종료 코드 1로 끝납니다.

## GitHub Actions 수동 실행

1. GitHub 저장소의 **Actions** 탭으로 이동합니다.
2. 왼쪽 목록에서 **Weekly numbers** 워크플로를 선택합니다.
3. **Run workflow** → 브랜치 `main` 선택 → **Run workflow**를 누릅니다.

## Vercel 연결

### public 저장소 (기본)

1. [Vercel](https://vercel.com)에 GitHub 계정으로 로그인합니다.
2. **Add New… → Project**에서 이 저장소를 Import합니다.
3. Framework Preset이 **Vite**로 자동 인식됩니다. 빌드 설정은 기본값 그대로 두고 **Deploy**를 누릅니다.
4. 이후 `main` 브랜치에 푸시될 때마다(봇 커밋 포함) 자동으로 배포됩니다.

### private 저장소

Vercel 무료 플랜에서는 private 저장소의 봇 커밋이 자동 배포되지 않을 수 있습니다. 이 경우 Deploy Hook을 사용합니다.

1. Vercel 프로젝트의 **Settings → Git → Deploy Hooks**에서 브랜치 `main`으로 Hook을 만들고 URL을 복사합니다.
2. GitHub 저장소의 **Settings → Secrets and variables → Actions → New repository secret**에서
   이름 `VERCEL_DEPLOY_HOOK`, 값에 복사한 URL을 넣어 저장합니다.
3. 워크플로 마지막 단계가 이 시크릿이 있을 때만 Hook을 호출해 배포를 시작합니다.

## 주의사항

- GitHub의 예약 실행(schedule)은 정시에 실행되지 않고 **몇 분~수십 분 지연**될 수 있습니다.
- 저장소에 **오랫동안 활동이 없으면 예약 실행이 자동으로 비활성화**될 수 있습니다.
  Actions 탭을 주기적으로 확인하고, 비활성화되었다면 다시 활성화해 주세요.
- 번호는 무작위로 생성되며 당첨을 보장하지 않습니다. 로또는 만 19세 이상 구매 가능합니다.
