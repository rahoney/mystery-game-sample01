# TRACE: The Last Visitor

공간의 물증과 네 사람의 증언을 대조해 붉은 프로토타입 USB를 옮긴 인물을 밝히는 5 Stage 브라우저 추리 게임 데모입니다.

## 실행

Node.js 20.19+ 또는 22.12+가 필요합니다.

```bash
npm install
npm run dev
```

터미널에 표시된 `http://127.0.0.1:4173`을 PC 브라우저에서 엽니다. 1366×768 이상을 권장합니다.

배포된 팀 공유 버전: <https://rahoney.github.io/mystery-game-sample01/>

## 플레이 방법

- 조사 화면의 빛나는 hotspot 또는 하단의 조사 대상 버튼을 누릅니다.
- Stage 2부터 하단 공간 탭으로 사무실·회의실·휴게실을 이동합니다.
- Stage 3부터 인물 인터뷰에서 추천 질문, 자유 질문, 증거 제시를 사용할 수 있습니다.
- 증거와 사실이 연결되면 연결 카드가 자동으로 사건 노트에 기록됩니다.
- Stage 5에서 인물 1명, 증거 2–4개, 결정적 모순 1개를 선택합니다.
- 틀린 추론은 진행을 잃지 않고 바로 재검토할 수 있습니다.

진행 상황은 LocalStorage에 자동 저장됩니다. 타이틀의 Continue로 복원하거나 하단 `↺` 버튼으로 사건을 초기화할 수 있습니다.

## 검증

```bash
npm run check
npm run test:e2e
npm run lint
npm run assets:check
```

- `check`: 사건 교차 참조/도달 가능성 검증 → Vitest 단위 테스트 → TypeScript/Vite 프로덕션 빌드
- `test:e2e`: Playwright Chromium 정상 클리어, 오답 후 재시도, Stage 3 새로고침 복원
- `assets:check`: 오브젝트 10, 배경 3, portrait 16, 이벤트 컷 3의 production/fallback 슬롯 확인

Playwright 브라우저가 로컬에 없다면 한 번만 다음을 실행합니다.

```bash
npx playwright install chromium
```

## 아키텍처

- `src/core/case/CaseEngine.ts`: 정답, 사실, Stage, 최종 판정의 단일 deterministic 경계
- `src/data/cases/case-001/`: 사건, facts, claims, 인물, 방/hotspot, 증거, 연결, 대사, Stage 데이터
- `src/dialogue/`: 교체 가능한 `DialogueProvider`, Mock provider, 한글 intent parser, 상태 머신
- `src/game/`: Phaser 조사 canvas, room background, hotspot interaction
- `src/ui/`: 접근 가능한 DOM 인터뷰, 사건 노트, 공간 탭, 추론 보드, 엔딩
- `scripts/validate-case.ts`: schema 외 ID 교차 참조와 최소 논리 경로 검증

대사 provider는 표현과 관점만 결정합니다. 정답, 물증 위치, 사실, 승패를 변경할 수 없습니다. 런타임 AI API나 백엔드는 없습니다.

## 아트 에셋

현재 프로젝트에는 실제 WebP 배경 3장, NPC portrait 16장, 이벤트 컷 3장이 포함되어 있습니다. 제작 continuity와 재생성 prompt는 [docs/art/gpt-image-prompts.md](docs/art/gpt-image-prompts.md)에 있습니다.

PixelLab 오브젝트는 10개 투명 슬롯과 SVG fallback을 제공합니다. 실제 PixelLab 생성에는 `.env`에 서버 전용 키를 설정합니다.

```bash
cp .env.example .env
# .env의 PIXELLAB_API_KEY 값을 설정
npm run assets:pixellab
# 기존 결과까지 재생성하려면
npm run assets:pixellab -- --force
```

스크립트는 PixelLab v2 `create-image-pixflux` endpoint를 Node에서만 호출하고 `public/assets/objects/*.png`에 저장합니다. 키는 `VITE_` prefix를 사용하지 않으며 클라이언트 번들에 포함되지 않습니다. 키가 없거나 제작 파일이 빠져도 fallback으로 게임 전체를 플레이할 수 있습니다.

## 콘텐츠 문서

- [Story Bible](docs/content/story-bible.md)
- [Character Bible](docs/content/character-bible.md)
- [Dialogue Bible](docs/content/dialogue-bible.md)
- [Clue Logic](docs/content/clue-logic.md)
- [Architecture](docs/architecture.md)
- [Decisions](docs/decisions.md)

## 주요 npm 명령

| 명령                      | 역할                               |
| ------------------------- | ---------------------------------- |
| `npm run dev`             | 개발 서버                          |
| `npm run build`           | TypeScript 검사 + production build |
| `npm run preview`         | build 결과 preview                 |
| `npm run test`            | 단위 테스트                        |
| `npm run test:e2e`        | Playwright E2E                     |
| `npm run validate:case`   | 사건 schema/logic 검증             |
| `npm run assets:pixellab` | PixelLab object 생성               |
| `npm run assets:check`    | 모든 art slot 검사                 |
| `npm run lint`            | ESLint                             |

## 구현 범위

5개 Stage, 3개 공간, 4명 NPC, 11개 수집 증거, 4개 연결 카드, 자유 질문 intent parser, 증거 제시, 4단계 NPC 태도 변화, 모순 기록, 사건 노트 5개 탭, 오답 피드백, 사건 재구성 엔딩, 자동 저장, 합성 SFX, 전환/hover/toast/pressure animation을 포함합니다.
