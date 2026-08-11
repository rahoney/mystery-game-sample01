# Dialogue Bible

런타임 대사의 단일 소스는 `src/data/cases/case-001/dialogue.json`이다. 이 문서는 집필 규칙과 검수 매트릭스를 설명한다.

## 공통 규칙

- 응답은 1–3문장, 확인 가능한 사실 하나를 중심으로 쓴다.
- neutral은 자발적으로 hidden fact를 말하지 않는다.
- evasive는 이미 한 말을 반복하거나 질문의 범위를 축소한다.
- pressured는 제시된 증거가 증명하는 범위까지만 인정한다.
- cracked는 자신의 실제 행동을 시간순으로 말하지만 다른 인물의 내면은 추측하지 않는다.
- 대사는 사건 진실, 증거 위치, 승패를 변경하지 않는다.

## 질문 매트릭스

각 NPC는 모든 상태에서 LOCATION, USB, OBJECT, PERSON, TIMELINE, ALIBI, MOTIVE, OTHER에 대한 authored response를 가진다. UI 기본 질문 6개와 자유 질문 parser가 같은 intent를 사용한다.

## 증거 반응 검수

| NPC  | 핵심 제시 증거 | 상태 전이                   | 생성 모순            |
| ---- | -------------- | --------------------------- | -------------------- |
| 민수 | 붉은 책        | neutral → pressured         | 업무 빌드가 아니었다 |
| 지연 | 커피컵         | neutral → pressured         | 짧지 않았던 체류     |
| 준호 | 약 포장지      | neutral → pressured         | 9분의 순찰 공백      |
| 서연 | 빈 슬롯        | neutral → evasive           | 없음                 |
| 서연 | 파란 카드      | evasive/neutral → pressured | 20:18 재입실         |
| 서연 | 2B 태그        | evasive → pressured         | 회의실 방문 인정     |
| 서연 | 붉은 USB       | pressured → cracked         | USB 접촉 부정 붕괴   |

## Stage 변화

- Stage 3: 네 사람의 첫 진술과 서로 다른 거짓말을 보여준다.
- Stage 4: 서연에게 카드 → 2B 정황 → USB 순서로 제시할 때 가장 자연스럽다. 순서가 달라도 획득 가능한 사실은 동일하다.
- Stage 5: 신규 대화는 필요 없으며, 사건 노트의 기록만으로 결론을 내릴 수 있다.

## 자유 질문 실패

키워드 점수가 임계값보다 낮으면 OTHER 응답 뒤에 “20시쯤 어디에 있었나요?” 형태의 추천 문장을 제공한다. 사용자의 원문은 화면과 저장 데이터에서 대화 기록으로만 남고 진실 데이터가 되지 않는다.
