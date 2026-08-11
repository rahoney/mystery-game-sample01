# AI 공간·인물 추리 게임 데모 — 기술 스펙 및 구현 설계서 v1.0

**문서 목적**  
이 문서는 Codex, Gemini CLI/Code Assist 등 AI 코딩 에이전트에게 그대로 전달해 실제 브라우저 게임 데모를 구현하게 하기 위한 자급형 구현 명세서다.

이 데모는 기능 몇 개만 있는 컨셉 증명이 아니라, 짧은 개발 기간 안에서도 팀원이 실제 게임처럼 플레이하고 재미를 판단할 수 있는 **5스테이지 Vertical Slice**를 목표로 한다.

---

# 0. AI 코딩 에이전트 최우선 지시

1. 먼저 전체 문서를 읽고 구현 계획을 세운 뒤 작업한다.
2. 게임 핵심 루프를 훼손하는 임의의 기능 축소를 하지 않는다.
3. 반대로 이 문서에 없는 대규모 기능을 자의적으로 추가하지 않는다.
4. **동작하는 Greybox → 시스템 완성 → 콘텐츠 연결 → 그래픽 교체 → 폴리시 → 테스트** 순으로 진행한다.
5. 각 단계가 끝날 때 `npm run build`, 단위 테스트, 핵심 E2E 테스트를 실행한다.
6. 정답·사실·단서 관계는 deterministic하게 유지하며 대사 시스템이 임의로 진실을 바꾸게 하지 않는다.
7. 런타임 OpenAI API는 이번 데모에서는 사용하지 않는다.
8. AI NPC처럼 느껴지는 인터뷰는 **Mock Dialogue Engine**으로 구현하되, 나중에 실제 LLM Provider로 교체할 수 있는 인터페이스를 반드시 둔다.
9. PixelLab API는 **개발 시점 오브젝트 생성**에만 사용한다. 브라우저 런타임에서 호출하지 않는다.
10. GPT Images용 배경/NPC/이벤트 컷은 별도 제작 작업으로 분리하되, 파일이 없어도 placeholder로 게임 전체가 실행되어야 한다.
11. `.env`의 비밀 키는 클라이언트 번들에 포함하지 않는다.
12. 모든 핵심 데이터는 JSON/TypeScript schema로 분리해 AI가 이후 사건·대사·그래픽을 교체하기 쉽게 한다.
13. 구현 중 작은 결정은 합리적으로 정하고 `docs/decisions.md`에 남긴다.
14. 기능을 만들고 끝내지 말고 실제로 플레이 가능한 상태까지 연결한다.
15. README에는 설치·실행·에셋 생성·테스트·빌드 방법을 반드시 적는다.

---

# 1. 프로젝트 한 줄 정의

> **공간에서 객관적 단서를 찾고, 인물들의 주관적인 증언과 비교하여, 증거를 제시하고 모순을 밝혀 최종 인물을 지목하는 2.5D 스타일의 브라우저 추리 게임.**

핵심 루프:

**공간 조사 → 단서 획득 → 인물 인터뷰 → 증언과 물증 대조 → 증거 제시 → 새로운 사실 해금 → 최종 추론 → 인물 지목**

---

# 2. 데모 목표

## 플레이 시간
- 최초 플레이 약 15~25분
- 익숙한 플레이어 약 10~15분
- 5개 스테이지가 하나의 사건으로 이어진다.

## 플레이어가 반드시 느껴야 하는 감정
1. 여기 뭔가 이상하다.
2. 이 물건이 단서였다.
3. 방금 한 말이 아까 본 증거와 안 맞는다.
4. 이 증거를 이 사람에게 보여주면 반응이 달라질 것 같다.
5. 정답 인물은 이 사람인 것 같다.
6. Reveal에서 “아, 그래서 그랬구나.”

## 성공 기준
- 10초 안에 조사 가능한 오브젝트가 무엇인지 이해
- 1분 안에 첫 단서 획득
- Stage 2 이내에 사람을 추리하는 게임임을 이해
- Stage 3에서 증언과 물증의 모순을 최소 1회 발견
- Stage 4에서 증거 제시로 NPC 상태 변화
- Stage 5에서 2~3개 핵심 근거로 최종 인물 지목
- 틀린 추론도 재검토 가능
- 최종 결과를 실제 수집한 정보로 설명 가능

---

# 3. 데모 사건 콘셉트

## 작업 제목
**《흔적: 마지막 접속자》**  
영문 작업명: **TRACE: The Last Visitor**

## 사건
퇴근 후 비어 있던 스타트업 사무실에서 외부 공개 전인 프로젝트의 **붉은 프로토타입 USB**가 사라졌다.

플레이어의 목표:

> **누가 붉은 USB를 원래 자리에서 옮겼는가?**

4명의 인물이 관련되어 있다. 각 인물은 하나씩 숨기고 싶은 사실 또는 오해받을 행동이 있으므로 **거짓말한 사람 = 정답 인물**이 되지 않게 한다.

초기 구현의 정답은 **서연**으로 고정하되, 정답은 `case-001` 데이터에서 관리하고 코드에 하드코딩하지 않는다.

---

# 4. 등장인물

## 민수 — 개발자
- 논리적, 직설적
- USB 접근 이유가 가장 뚜렷해 의심받기 쉬움
- 숨기는 사실: 퇴근 전 개인 프로젝트 빌드를 회사 장비에서 돌림
- 규정 위반 질문에는 말을 흐림
- 정답 인물 아님

## 지연 — 기획자
- 차분하고 기억력이 좋음
- 회의실 체류 시간을 처음엔 축소해서 말함
- 숨기는 사실: 퇴근 후 개인 전화를 하려고 회의실에 남음
- 정답 인물 아님

## 준호 — 보안/운영 담당
- 규정 중심, 관찰력이 좋음
- 여러 공간 출입 권한 보유
- 숨기는 사실: 보안 순찰 중 잠시 자리를 비움
- 정답 인물 아님

## 서연 — 마케팅 담당
- 친근하고 말이 빠름
- 홍보 자료용 스크린샷 확인 목적으로 USB를 옮김
- 이후 예상치 못한 상황 때문에 회의실 보관함에 숨김
- 처음에는 USB를 만지지 않았다고 주장
- 최종 정답 인물

---

# 5. 5개 스테이지

## Stage 1 — 비어 있는 사무실
목적: 조사 조작 학습 + 사건 인식

공간:
- 대표 사무실 1개

플레이:
- hotspot hover/click
- 오브젝트 조사
- 첫 단서 획득
- 단서 연결 1회

핵심 단서:
- USB가 있던 빈 슬롯
- 찢어진 메모
- 파란 출입 카드

Clear:
- 필수 단서 3개 중 2개 이상 발견
- 빈 USB 슬롯 조사

## Stage 2 — 세 개의 공간
목적: 공간 간 정보 연결

공간:
1. 사무실
2. 회의실
3. 휴게실

플레이:
- 미니맵/탭 이동
- 각 공간 조사
- 서로 다른 방의 단서를 비교
- 무관해 보이는 단서도 일부 등장

예시 연결:
`찢어진 메모 + 보관함 태그 → 회의실 2B 보관함 관련`

Clear:
- 세 공간 모두 방문
- 필수 단서 4개 이상
- 첫 Connection Card 생성

## Stage 3 — 네 사람의 증언
목적: 객관적 물증 vs 주관적 증언 체험

플레이:
- NPC 4명 인터뷰
- 질문 카테고리 버튼
- 자유 텍스트 질문
- deterministic intent parser
- 획득 증거 제시

기본 질문:
- 당시 어디 있었나요?
- USB를 본 적 있나요?
- 이 물건을 아나요?
- 다른 사람을 봤나요?
- 퇴근 후 왜 남아 있었나요?

Intent:
- LOCATION
- USB
- OBJECT
- PERSON
- TIMELINE
- ALIBI
- MOTIVE
- OTHER

핵심:
- 최소 한 명의 증언과 물증이 충돌
- 모순 발견 시 “증언 불일치” 카드 생성

Clear:
- NPC 4명 모두 대화
- 증거 2개 이상 제시
- 모순 1개 이상 발견

## Stage 4 — 무너지는 알리바이
목적: 증거 제시가 실제 게임 상태를 변화

플레이:
- 증언 타임라인 비교
- 증거 조합 제시
- dialogue state 변화
- portrait 감정 상태 변경

Dialogue state:
`neutral → evasive → pressured → cracked`

예시:
서연 최초: “저는 그 USB를 만진 적이 없어요.”
1차 증거 후: “그 카드는 제가 주운 거예요. USB 때문은 아니었어요.”
2차 증거 후: “회의실에 들어간 건 맞아요. 하지만 가져가려고 한 건 아니었어요.”

Clear:
- 핵심 NPC `pressured` 이상
- 핵심 모순 2개 이상
- 회의실 보관함을 열 수 있는 단서 체인 완성

## Stage 5 — 최종 추론
목적: 직접 사건을 설명하고 인물 지목

화면:
- 중앙: 용의자 4명
- 왼쪽: 증거
- 오른쪽: 증언/모순

플레이:
1. USB를 옮긴 인물 선택
2. 근거 증거 2~4개 선택
3. 핵심 모순 1개 선택
4. 추론 제출

틀린 경우:
- 즉시 게임오버 금지
- 인물은 맞지만 근거가 약함
- 증거는 맞지만 인물은 틀림
- 결정적 모순 누락
등의 피드백 제공

맞은 경우:
- 사건 시간순 재구성
- 각 NPC가 무엇을 숨겼는지 설명
- Case Closed
- 발견 단서 수 / 인터뷰 횟수 / 잘못된 추론 / 모순 수 / 플레이 시간 표시

---

# 6. 핵심 시스템

## Investigation System
- 배경 위 hotspot
- hover/focus highlight
- 조사 애니메이션
- 오브젝트 확대 보기
- clue 획득
- 조사 완료 표시
- stage 조건 기반 활성화

```ts
interface Hotspot {
  id: string;
  roomId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  objectAsset?: string;
  examineText: string;
  grantsClueIds?: string[];
  requiresFlags?: string[];
  setFlags?: string[];
}
```

## Evidence System

```ts
interface Evidence {
  id: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  category: "object" | "document" | "trace" | "testimony";
  discoveredAt: string;
  tags: string[];
  supportsFacts: string[];
  contradictsClaims: string[];
  asset?: string;
}
```

UI:
- 증거 카드
- 신규 증거 toast
- 상세 보기
- NPC에게 제시
- Deduction Board에 사용

## Connection System

```ts
interface EvidenceConnection {
  id: string;
  requiresEvidence: string[];
  unlocksFactId: string;
  title: string;
  description: string;
}
```

## Case Engine
관리 대상:
- 실제 정답
- 실제 타임라인
- NPC 실제 행동
- NPC별 known/hidden facts
- 단서 위치
- 단서-사실 관계
- claim 충돌
- stage unlock
- final answer 판정

**대사 시스템은 실제 진실을 변경할 수 없다.**

---

# 7. 사건 데이터 구조

```text
src/data/cases/case-001/
  case.json
  facts.json
  characters.json
  rooms.json
  evidence.json
  connections.json
  dialogue.json
  stages.json
```

Zod 또는 동등한 schema validation으로 로드 시 검증한다.

---

# 8. Mock Dialogue Engine

## Provider

```ts
export interface DialogueProvider {
  respond(input: DialogueInput): Promise<DialogueResult>;
}
```

현재:
`MockDialogueProvider`

향후:
`OpenAIDialogueProvider`

## Input

```ts
interface DialogueInput {
  characterId: string;
  freeText?: string;
  questionIntent?: QuestionIntent;
  presentedEvidenceIds: string[];
  discoveredFactIds: string[];
  conversationHistory: DialogueTurn[];
  currentDialogueState: DialogueState;
}
```

## Intent

```ts
type QuestionIntent =
  | "LOCATION"
  | "USB"
  | "OBJECT"
  | "PERSON"
  | "TIMELINE"
  | "ALIBI"
  | "MOTIVE"
  | "OTHER";
```

자유 텍스트:
- 한글 normalize
- 키워드 dictionary
- weighted scoring
- 실패 시 추천 질문 버튼

## Dialogue State

```ts
type DialogueState =
  | "neutral"
  | "evasive"
  | "pressured"
  | "cracked";
```

NPC마다:
- known facts
- hidden facts
- denied claims
- evidence reactions
- state별 대사
를 가진다.

---

# 9. UI/UX

PC 브라우저 우선.

권장:
- 1440×900 또는 16:10 기준
- 1366×768 정상 플레이
- resize 대응
- 모바일 완전 최적화는 범위 밖

조사 화면:
- 상단: Stage / 사건명 / 진행 힌트
- 중앙: 2.5D/isometric 배경 + clickable object overlay
- 하단: 사건 노트 / 증거 / 인물 / 공간 이동 / 설정

인터뷰:
- NPC portrait
- 이름/감정
- 대화 bubble
- 추천 질문
- 자유 텍스트
- 증거 제시

사건 노트 Tabs:
- 증거
- 인물
- 타임라인
- 모순
- 연결된 추론

---

# 10. 그래픽 방향

**2.5D / isometric 느낌 + 약한 pixel texture + 현대적인 추리 UI**

원칙:
- 지나치게 레트로하지 않음
- 너무 사실적 사진게임도 아님
- 오브젝트 구분이 쉬움
- 배경은 분위기 담당
- PixelLab 오브젝트는 gameplay affordance 담당
- NPC portrait는 감정 가독성 우선

---

# 11. PixelLab API — 오브젝트 10종

`.env`:

```env
PIXELLAB_API_KEY=
```

원칙:
- `VITE_PIXELLAB_API_KEY` 사용 금지
- 게임 런타임 호출 금지
- Node script가 개발 시점에만 호출
- `.env`는 `.gitignore`

스크립트:
`scripts/generate-pixellab-assets.ts`

역할:
1. env key 로드
2. asset manifest 읽기
3. 10개 생성
4. 투명 PNG/WebP 저장
5. metadata/log 저장
6. 기존 파일은 skip
7. `--force` 재생성 지원

PixelLab API 구현은 adapter로 격리하고 실제 API/SDK 사용법은 구현 시점 공식 문서를 확인한다.

필수 오브젝트:
1. 붉은 프로토타입 USB
2. 파란 출입 카드
3. 찢어진 메모
4. 종이 커피컵
5. 붉은 하드커버 책
6. 검은 우산
7. 약 포장지/블리스터
8. 황동 보관함 열쇠
9. 편의점 영수증
10. 회의실 보관함 태그

규격:
- transparent
- isometric/semi-pixel
- 동일 카메라 각도
- 동일 light direction
- 동일 outline/texture 규칙
- 확대해도 식별 가능

경로:

```text
public/assets/objects/
  usb-red.png
  access-card-blue.png
  torn-note.png
  coffee-cup.png
  red-book.png
  black-umbrella.png
  medicine-pack.png
  brass-key.png
  receipt.png
  locker-tag.png
```

PixelLab asset이 없을 때:
- 동일 파일명 placeholder를 먼저 사용
- 실제 asset 생성 후 자동 교체

---

# 12. GPT Images — 배경/NPC/이벤트 컷

런타임 API 호출이 아니라 **별도 제작 작업**이다.

AI 코딩 에이전트는 먼저:

`docs/art/gpt-image-prompts.md`

를 생성한다.

각 이미지마다:
- 목적
- 비율
- 카메라
- 구성
- 스타일
- 색감
- 금지사항
- continuity
- 파일명

을 정의한다.

## 배경 3장
1. `office-main.webp`
   - 야간 스타트업 사무실
   - 책상/서랍/출입구 위치 명확
   - 핵심 interactive clue를 배경에 직접 박아 넣지 않음

2. `meeting-room.webp`
   - 유리벽 회의실
   - 보관함/테이블/의자
   - Stage 4 confrontation에도 활용

3. `lounge.webp`
   - 휴게실/탕비실
   - 싱크대/테이블/커피 영역

## NPC portrait
4명 × 4표정 이상:
- neutral
- nervous
- defensive
- resigned/relieved

총 최소 16장.

## 이벤트 컷
최소 3장:
1. 사건 발생 / 빈 USB 슬롯
2. Stage 4 confrontation
3. 사건 재구성 / Case Closed

그래픽 제작이 늦어져도 asset slot과 prompt 문서는 삭제하지 않는다.

---

# 13. 스토리/대사 별도 작업

반드시 생성:

```text
docs/content/story-bible.md
docs/content/character-bible.md
docs/content/dialogue-bible.md
docs/content/clue-logic.md
```

## story-bible
- 실제 진실
- 시간순 타임라인
- NPC 이동 경로
- Stage별 Reveal
- 결말
- 후속 확장 가능성

## character-bible
- 성격/말투
- 직업/관계
- hidden facts
- known facts
- 오해
- lie policy
- 압박 단계별 반응
- NPC 간 태도

## dialogue-bible
NPC × intent × dialogueState별 대사.

최소:
- 기본 질문 5개
- 증거 제시 반응 5개 이상
- pressure transition
- 모순 지적 대사
- Stage별 대사 변화

한 응답 1~3문장 권장.

## clue-logic
증거마다:
- 지지 fact
- 충돌 claim
- connection
- 최종 정답 기여도
를 표로 관리.

---

# 14. 기술 스택

런타임:
- TypeScript
- Phaser
- HTML/CSS
- Vite
- LocalStorage

검증:
- Zod 권장

테스트:
- Vitest
- Playwright

개발:
- ESLint
- Prettier
- Git

사용하지 않음:
- React
- Next.js
- Unity
- Godot
- Unreal
- Three.js
- 별도 physics engine
- PostgreSQL
- Redis
- Docker
- 로그인
- 실시간 멀티플레이
- 백엔드 서버
- 런타임 OpenAI API

---

# 15. 초기화 예시

Node는 구현 시점 Vite 요구사항을 만족하는 LTS 사용.

```bash
npm create vite@latest . -- --template vanilla-ts
npm install
npm install phaser zod
npm install -D vitest @playwright/test eslint prettier dotenv tsx
```

설치 후 `package-lock.json`으로 고정.

---

# 16. 디렉터리 구조

```text
.
├─ AGENTS.md
├─ README.md
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ .env
├─ .env.example
├─ .gitignore
├─ public/
│  └─ assets/
│     ├─ backgrounds/
│     ├─ characters/
│     ├─ objects/
│     ├─ ui/
│     ├─ audio/
│     └─ placeholders/
├─ src/
│  ├─ main.ts
│  ├─ styles/
│  ├─ game/
│  │  ├─ config.ts
│  │  ├─ scenes/
│  │  │  ├─ BootScene.ts
│  │  │  ├─ TitleScene.ts
│  │  │  ├─ InvestigationScene.ts
│  │  │  ├─ StageTransitionScene.ts
│  │  │  └─ EndingScene.ts
│  │  └─ systems/
│  │     ├─ HotspotSystem.ts
│  │     ├─ InteractionSystem.ts
│  │     └─ SceneStateSystem.ts
│  ├─ core/
│  │  ├─ case/
│  │  │  ├─ CaseEngine.ts
│  │  │  ├─ CaseState.ts
│  │  │  ├─ CaseValidator.ts
│  │  │  └─ schemas.ts
│  │  ├─ evidence/
│  │  │  ├─ EvidenceManager.ts
│  │  │  └─ ConnectionEngine.ts
│  │  ├─ stages/
│  │  │  └─ StageManager.ts
│  │  └─ save/
│  │     └─ SaveManager.ts
│  ├─ dialogue/
│  │  ├─ DialogueProvider.ts
│  │  ├─ MockDialogueProvider.ts
│  │  ├─ IntentParser.ts
│  │  ├─ DialogueStateMachine.ts
│  │  └─ types.ts
│  ├─ ui/
│  │  ├─ AppShell.ts
│  │  ├─ DialoguePanel.ts
│  │  ├─ EvidencePanel.ts
│  │  ├─ NotebookPanel.ts
│  │  ├─ MapPanel.ts
│  │  ├─ DeductionBoard.ts
│  │  └─ Toast.ts
│  ├─ data/
│  │  └─ cases/case-001/
│  └─ integrations/
│     └─ pixellab/
│        ├─ client.ts
│        └─ types.ts
├─ scripts/
│  ├─ generate-pixellab-assets.ts
│  ├─ validate-case.ts
│  └─ check-assets.ts
├─ tests/
│  ├─ unit/
│  └─ e2e/
└─ docs/
   ├─ decisions.md
   ├─ architecture.md
   ├─ content/
   └─ art/
```

---

# 17. Save / Reset

LocalStorage 저장:
- 현재 Stage
- 발견 evidence
- 방문 room
- NPC dialogue state
- facts
- connections
- contradictions
- 인터뷰 횟수
- 플레이 시작 시간
- 잘못된 추론 횟수

메뉴:
- Continue
- New Game
- Reset Case

---

# 18. 사운드

최소 효과음:
- hover/click
- 증거 발견
- connection 생성
- 모순 발견
- pressure 상승
- Stage clear
- Final reveal

초기에는 Web Audio API synthesized SFX 허용.
BGM은 라이선스 명확한 무료 음원 또는 placeholder.

---

# 19. 폴리시

포함:
- 화면 fade
- Stage title transition
- hotspot hover
- evidence fly-in
- notebook badge
- NPC portrait crossfade
- contradiction flash/shake
- deduction board transition
- Case Closed reveal
- button feedback
- loading state

---

# 20. Case Validator

`npm run validate:case`

검증:
- 정답 인물 정확히 1명
- evidence의 fact/claim 참조 유효
- room/object/NPC ID 유효
- 필수 evidence 획득 가능
- stage unlock 순환 없음
- connection evidence 존재
- final required evidence 획득 가능
- NPC가 모르는 fact를 기본 대사에서 말하지 않음
- contradictory world truth 없음
- 최소 한 논리 경로로 정답 도출 가능

가능하면:
- 핵심 단서 하나 누락 시 완전 막힘 방지
- 무관 단서만으로 정답 확정 불가
도 테스트.

---

# 21. 테스트 계획

Unit:
- CaseEngine
- Evidence acquire
- Connection unlock
- Stage progression
- Final judge
- Intent parsing
- Evidence reaction
- Dialogue state transition
- Validator

E2E:
1. 정상 클리어
2. 잘못된 추론 후 재시도
3. Stage 3에서 reload 후 진행 복원

---

# 22. Definition of Done

## 기능
- [ ] New Game / Continue
- [ ] 5 Stage 연결
- [ ] 3 공간
- [ ] NPC 4명
- [ ] PixelLab object 10개 slot
- [ ] hotspot 조사
- [ ] evidence 획득/상세
- [ ] evidence connection
- [ ] NPC 인터뷰
- [ ] 자유 질문 intent parser
- [ ] 증거 제시
- [ ] dialogue state 변화
- [ ] contradiction 기록
- [ ] notebook
- [ ] deduction board
- [ ] 잘못된 추론 피드백
- [ ] 올바른 ending
- [ ] LocalStorage
- [ ] sound
- [ ] animation/polish

## 콘텐츠
- [ ] 사건 실제 진실
- [ ] NPC 4명 character bible
- [ ] Stage 1~5 story beat
- [ ] 핵심 증거/모순 chain
- [ ] state별 대사
- [ ] 결말 재구성

## 그래픽
- [ ] GPT Images background 3 slot
- [ ] GPT Images NPC portrait 16+ slot
- [ ] GPT Images event cut 3 slot
- [ ] PixelLab object 10
- [ ] asset manifest
- [ ] placeholder fallback

## 품질
- [ ] `npm run build`
- [ ] `npm run test`
- [ ] `npm run validate:case`
- [ ] Playwright E2E
- [ ] fatal console error 없음
- [ ] README만 보고 실행 가능

---

# 23. package.json 권장 scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "validate:case": "tsx scripts/validate-case.ts",
    "assets:pixellab": "tsx scripts/generate-pixellab-assets.ts",
    "assets:check": "tsx scripts/check-assets.ts",
    "check": "npm run validate:case && npm run test && npm run build"
  }
}
```

---

# 24. `.env.example`

```env
PIXELLAB_API_KEY=
```

이번 데모에는 `OPENAI_API_KEY`가 필요 없다.

---

# 25. AI Vibe Coding 작업 순서

## Phase 0 — Repository Harness
- package setup
- directory skeleton
- AGENTS.md
- README
- decisions.md
- lint/format
- tests skeleton

AGENTS.md 규칙:
- deterministic truth
- no runtime AI
- no secret in client
- data-driven case
- tests before large refactor
- content/art task 삭제 금지

## Phase 1 — Greybox Core
placeholder만으로 Stage 1~5 전체 플레이 가능하게.

## Phase 2 — Investigation + Evidence
room/hotspot/evidence/notebook/connection/stage progression.

## Phase 3 — Dialogue
MockDialogueProvider / intent / evidence presentation / state / contradiction.

## Phase 4 — Deduction
final board / judge / ending.

## Phase 5 — Content Pass
story-bible / character-bible / dialogue-bible / clue-logic 완성 후 JSON 반영.

## Phase 6 — Art Production
PixelLab 10 object + GPT Images background/NPC/event cut.

## Phase 7 — Polish
transition / sound / micro feedback / spacing / typography / loading.

## Phase 8 — Validation
validator / unit / E2E / build / manual full playthrough.

---

# 26. 하지 말아야 할 것

- 데모라는 이유로 Stage 1~2개로 축소
- 조사 없이 텍스트 버튼 게임으로 변경
- 인터뷰를 고정 대사 1개로 축소
- CaseEngine 없이 조건문을 UI에 분산
- 정답을 UI 코드에 하드코딩
- PixelLab key를 `VITE_`로 노출
- GPT Images가 없다고 art 설계 삭제
- runtime OpenAI API 임의 추가
- React/Next/DB/backend 불필요 추가
- 한 파일짜리 거대 스크립트
- 테스트를 마지막으로 미룸
- AI story/dialogue와 truth data 혼합
- 과도한 추상화/과설계

---

# 27. 향후 실제 AI 버전 확장

현재:
`MockDialogueProvider`

향후:
`OpenAIDialogueProvider`

실제 AI 담당:
- 자유 질문 의미 해석
- 성격에 맞는 표현
- 숨기는 사실을 직접 노출하지 않는 대화
- 증거 제시 반응
- 같은 사실의 다양한 표현

실제 AI 비담당:
- 정답 결정
- world fact 변경
- evidence 위치
- 승패
- stage unlock

원칙:

> **AI = 관점·기억·거짓말·표현**  
> **Case Engine = 진실·정답·논리·게임 상태**

---

# 28. 데모 이후 확장 가능성

이번 구현에서는 제외:
- 사건 추가
- Daily Case
- 정답 인물 랜덤화
- 사건 template 조합
- 실제 LLM NPC
- 다양한 lie policy
- UGC 사건 작성
- 사건 공유 코드
- leaderboard
- 제한 시간 모드
- 협동 추리
- 비대칭 정보 추리

---

# 29. 첫 구현 후 사람이 확인할 질문

1. 첫 60초가 지루하지 않은가?
2. 조사 오브젝트가 너무 뻔하거나 너무 안 보이지 않는가?
3. 단서를 찾는 것 자체가 재미있는가?
4. NPC 거짓말이 억지스럽지 않은가?
5. “증언 vs 물증” 충돌이 명확한가?
6. 증거 제시 보상이 충분한가?
7. Stage 3부터 반복처럼 느껴지지 않는가?
8. 최종 지목 전 스스로 답을 추론할 수 있는가?
9. 정답 Reveal이 납득되는가?
10. 다른 사건도 해보고 싶은가?

특히 4, 5, 6, 8, 9가 약하면 그래픽보다 먼저 로직/사건 설계를 수정한다.

---

# 30. 최종 구현 지시

AI 코딩 에이전트는 이 문서를 기준으로 **실제 실행 가능한 프로젝트**를 완성한다.

우선순위:
1. 5 Stage 전체 플레이
2. Case Engine의 논리 일관성
3. 조사 → 인터뷰 → 모순 → 증거 제시 → 추론의 재미
4. content data 분리
5. graphics production pipeline
6. polish
7. automated validation

프로젝트 폴더에서:

```bash
npm install
npm run dev
```

만으로 플레이 가능해야 한다.

품질 검증:

```bash
npm run check
```

PixelLab asset generation:

```bash
npm run assets:pixellab
```

GPT Images 배경/NPC/이벤트 컷은 `docs/art/gpt-image-prompts.md` 기준으로 별도 생성 후 지정 asset path에 넣으면 placeholder가 교체되게 한다.

---

**End of Specification**
