# GPT Images Production Prompts

## 공통 continuity

2.5D isometric editorial game illustration, modern mystery UI companion art, subtle pixel-texture grain without chunky retro pixels, clear silhouettes, cool midnight teal shadows, restrained warm amber practical lights, small red evidence accents. No readable text, logos, watermarks, UI panels, embedded clues, extreme perspective, or photorealistic people.

## Backgrounds — 16:10 landscape

### `office-main.webp`

- 목적: 조사 Stage 1–4 메인 배경
- 카메라/구성: high three-quarter isometric view; three desk islands, USB hub zone centered, waste bin right, card search zone left, bookshelf rear right, uncluttered walk paths
- 색감: midnight blue/steel, warm monitor glow, red used only as tiny ambient accent
- 금지: visible USB, readable notes/cards, people, noir darkness that hides objects
- Prompt: “Nighttime contemporary Seoul startup office after everyone has left, high three-quarter isometric view, clear desk islands and readable environmental zones, glass city windows, soft monitor afterglow, cinematic but gameplay-readable, common continuity.”

### `meeting-room.webp`

- 목적: 조사와 Stage 4 confrontation
- 카메라/구성: same camera; glass walls, long table, chairs, lockers 2×3 on right, open central negative space
- 색감: blue-gray glass, amber rim light
- 금지: open locker, USB, characters, readable locker number
- Prompt: “Empty modern glass-walled meeting room at night, same camera and lighting as office, long table, subtle cup placement zone, bank of lockers on right, tense clean atmosphere, common continuity.”

### `lounge.webp`

- 목적: 조사 Stage 2–4
- 카메라/구성: same camera; sink/counter left, café table center, umbrella rack right, cup return visible
- 색감: muted green-teal, cozy amber practical light
- 금지: readable receipt, key, medicine, people
- Prompt: “Small startup lounge and kitchenette at night, same camera, sink and coffee counter, central table, umbrella rack and cup return, rain on city window, common continuity.”

## Portraits — 4:5, chest-up

공통 카메라: consistent 3/4 bust portrait, clean dark abstract office backdrop, strong readable face and hand pose, same wardrobe in all expressions.

| 인물/파일 접두어 | 외형·의상                                                                                            | palette   |
| ---------------- | ---------------------------------------------------------------------------------------------------- | --------- |
| `minsu-*`        | Korean man early 30s, short neat black hair, navy hoodie over gray tee, focused angular posture      | cool blue |
| `jiyeon-*`       | Korean woman early 30s, shoulder-length dark hair, plum blouse and charcoal jacket, composed posture | violet    |
| `junho-*`        | Korean man late 30s, cropped hair, forest utility overshirt, badge lanyard, upright posture          | green     |
| `seoyeon-*`      | Korean woman late 20s, warm brown bob, coral blouse and dark blazer, expressive hands                | coral red |

각 인물에 다음 suffix를 생성한다.

- `neutral.webp`: attentive, guarded neutral expression
- `nervous.webp`: eye contact drifting, small tense breath, no melodrama
- `defensive.webp`: tightened jaw, crossed or raised hand, direct look
- `resigned.webp`: shoulders lowered, honest tired expression, relief mixed with regret

## Event cuts — 16:9

### `incident-empty-slot.webp`

Macro-isometric view of a desk USB hub at night, one clean empty red-marked slot in settled dust, evidence light grazing the surface, no hands or text, common continuity.

### `confrontation.webp`

Wide meeting-room confrontation, Seoyeon in coral accent on one side of the long table, unseen investigator perspective, evidence silhouettes projected as abstract light shapes, defensive-to-cracked emotion, no text or identifiable evidence details, common continuity.

### `case-closed.webp`

Time-reconstruction montage in one coherent isometric scene: office entrance, desk hub, meeting locker connected by red trace of light, small silhouette of Seoyeon moving through sequence, dawn beginning outside, no labels or text, common continuity.
