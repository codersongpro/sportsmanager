# 이미지 에셋 프롬프트 팩 (Pro Manager)

이 게임(멀티 스포츠 매니저: 축구·농구·야구·배구·피클볼)을 **더 흥미진진하고 완성도 높은 게임처럼** 보이게 만들기 위한 이미지/일러스트 생성 프롬프트 모음입니다.

> 안내: 설명·가이드는 한글로 적었지만, **프롬프트 본문은 영어**로 작성했습니다. 대부분의 이미지 생성 모델(Midjourney, DALL·E 3, Stable Diffusion, Ideogram, Flux 등)이 영어 프롬프트에서 가장 안정적인 결과를 내기 때문입니다. 그대로 복사해 쓰시면 됩니다.

---

## 0. 사용법 요약

1. **공통 스타일 접미사**(§2)를 모든 프롬프트 끝에 붙이세요. 게임 전체의 톤을 통일시켜 줍니다.
2. 각 항목의 **종횡비/용도/파일명**을 참고해 생성·저장하세요.
3. UI 아이콘·엠블럼처럼 투명 배경이 필요한 것은 프롬프트에 `transparent background, isolated on transparent` 또는 SVG 변환을 사용하세요.
4. **일관성**이 핵심입니다 — 같은 시드(seed)와 스타일 레퍼런스 이미지를 재사용하고, 한 번에 한 카테고리씩 배치(batch)로 뽑으세요(§9).
5. 저장 위치/네이밍 규칙은 §8을 따르세요(`public/assets/...`).

권장 도구: 히어로/일러스트는 **Midjourney v6 / Flux**, 아이콘·엠블럼 라인아트는 **Ideogram / Recraft(벡터)**, 텍스트가 들어가는 로고는 **Ideogram / DALL·E 3**.

---

## 1. 아트 디렉션

- **장르 무드**: 프리미엄 e-스포츠 방송 그래픽 + 모던 매니지먼트 심(Football Manager × FIFA UI × 스포츠 중계 오프닝).
- **전체 톤**: 다크 모드 기반. 깊은 네이비-블랙 배경에 네온 같은 민트 그린이 포인트. 고급스럽고 날렵하며 약간의 발광(glow).
- **형태 언어**: 깔끔한 벡터 느낌의 또렷한 엣지, 부드러운 그라데이션, 얇은 라인, 둥근 모서리(반경 큼), 충분한 여백.
- **금지**: 유치한 카툰, 잡다한 클립아트, 칙칙한 색, 워터마크/텍스트(로고 항목 제외), 사실적 사진 질감(초상화 제외).

### 색상 팔레트 (실제 게임 토큰)

| 역할 | HEX |
|---|---|
| 배경(베이스) | `#0a0d13` |
| 패널 | `#131822` / `#0e121b` |
| 주 강조(민트) | `#18e29a` (강한 톤 `#0fae77`) |
| 골드(우승/경고) | `#f6c453` |
| 레드(위험/원정) | `#ff4d5e` |
| 블루(홈/정보) | `#4c8dff` |
| 퍼플(보조) | `#9b6dff` |
| 본문 텍스트 | `#eaeef5` / 보조 `#7e8aa0` |

### 종목별 코트/필드 색

| 종목 | 표면 | 그라데이션 |
|---|---|---|
| 축구 | 잔디(pitch) | `#0f3b28 → #0c2e20` |
| 농구 | 우드(hardwood) | `#3a2a18 → #2a1f12` |
| 야구 | 다이아몬드 | 잔디 `#1a4a30` / 흙 `#7a5230` |
| 배구 | 코트 | `#14283a → #1d3a52` |
| 피클볼 | 코트 | `#0f2f24 → #103a2c` |

---

## 2. 공통 스타일 접미사 (모든 프롬프트 끝에 붙이기)

```
STYLE: premium dark-mode sports-management video game art, deep navy-black background (#0a0d13),
mint-green neon primary accent (#18e29a), gold (#f6c453) and crimson (#ff4d5e) highlights,
electric blue (#4c8dff) and purple (#9b6dff) secondary accents, sleek modern flat design with
subtle gradients and soft inner glow, crisp vector-like edges, high contrast, broadcast/e-sports
graphics aesthetic, generous negative space, cinematic rim lighting, 4k, highly polished
```

## 3. 공통 네거티브 프롬프트

```
NEGATIVE: text, lettering, watermark, signature, logo text, ui mockup frames, cluttered,
busy background, low quality, jpeg artifacts, blurry, muddy colors, childish cartoon,
clip art, distorted anatomy, extra limbs, deformed hands, oversaturated, washed out
```

---

## 4. 카테고리별 프롬프트

각 항목: **[파일명]** — 용도 · 종횡비 · 프롬프트.

### A. 브랜드 / 타이틀

**[brand/app-logo.png]** — 앱 로고 마크 · 1:1 · 투명 배경
```
A minimalist app logo mark for a sports manager game called "PRO MANAGER", a rounded square
emblem with a stylized abstract "SM" monogram fused with an upward trend arrow and a subtle
play/triangle motif, glossy mint-green (#18e29a) on dark, soft glow, flat vector, centered,
transparent background, isolated icon. + STYLE
```

**[brand/title-hero.jpg]** — 타이틀 화면 메인 배경 · 16:9 (모바일용 9:16 별도)
```
Epic title screen key art for a multi-sport manager game: a dramatic dark stadium at night seen
from a manager's perspective, floodlights blooming through atmospheric haze, faint silhouettes of
players warming up, sweeping mint-green light streaks and gold particles, empty foreground for a
title and menu, moody cinematic depth, lens flare, premium broadcast intro vibe. + STYLE
```

**[brand/app-icon.png]** — 스토어/파비콘 아이콘 · 1:1
```
Bold app store icon: rounded-square badge, dark gradient base (#0a0d13 to #131822), a glowing
mint-green abstract trophy-and-arrow mark centered, crisp, high contrast, subtle bevel, no text. + STYLE
```

### B. 종목별 경기장 히어로 / 배경

각 종목 카드·매치 인트로·로딩 배경으로 사용. · 16:9 (카드용 4:3 크롭 가능)

**[venue/soccer-hero.jpg]**
```
Dynamic top-down-to-low-angle hero shot of a floodlit soccer pitch at night, emerald turf
(#0f3b28), crisp white markings glowing, dramatic light shafts, faint motion-blurred ball streak,
atmospheric crowd bokeh, energetic broadcast opener mood. + STYLE
```
**[venue/basketball-hero.jpg]**
```
Hero shot of an indoor basketball arena, warm amber hardwood court (#3a2a18), spotlight pools,
glowing three-point arc, suspended scoreboard glow, dynamic angle, electric crowd haze. + STYLE
```
**[venue/baseball-hero.jpg]**
```
Hero shot of a baseball diamond from behind home plate, green outfield (#1a4a30) and brown infield
dirt (#7a5230), foul lines glowing, stadium lights, dusk-to-night sky, cinematic depth. + STYLE
```
**[venue/volleyball-hero.jpg]**
```
Hero shot of an indoor volleyball court, cool blue floor (#14283a to #1d3a52), bright net line,
sharp boundary lines glowing, arena spotlights, crisp modern sports look. + STYLE
```
**[venue/pickleball-hero.jpg]**
```
Hero shot of a pickleball court, teal-green surface (#0f2f24 to #103a2c), kitchen/non-volley zone
highlighted, glowing lines, clean modern outdoor-evening lighting, energetic. + STYLE
```

**[bg/abstract-mesh.jpg]** — 범용 메뉴/패널 배경 (반복·블러용) · 16:9
```
Abstract dark background, deep navy-black, faint geometric pitch/court line grid, soft mint-green
and blue gradient glows in corners, subtle particle dust, very low contrast so UI sits on top,
seamless, premium. + STYLE
```

### C. 엠블럼 / 크레스트 / 대회 로고

**[crest/club-template.png]** — 클럽 엠블럼(여러 변형 배치 생성) · 1:1 · 투명 배경
```
A modern football/sports club crest emblem, shield or roundel shape, bold simple iconography
(lion / eagle / star / flame variants), two-tone with a single bright accent color, clean vector,
flat, balanced, embroidered-badge feel without text, transparent background. Generate as a set of
8 distinct crests. + STYLE
```

**[crest/nation-template.png]** — 국가대표 엠블럼 · 1:1 · 투명 배경
```
A national team sports emblem, circular badge with abstract star/laurel motif and a bold flag-color
band, prestigious and minimal, no text, vector, transparent background, set of variations. + STYLE
```

**[logo/league.png]** — 리그 로고 · 1:1 또는 4:3 · 투명
```
A premier domestic sports league logo mark, dynamic abstract emblem combining a ball silhouette and
forward motion lines, mint-and-silver, sleek broadcast branding, no text, transparent background. + STYLE
```
**[logo/worldcup.png]** — 월드컵(국가대항) 로고 · 1:1 · 투명
```
A world championship trophy emblem for an international sports cup, golden globe wrapped with laurel
and dynamic ribbons, prestigious, glowing gold (#f6c453) on dark, no text, transparent background. + STYLE
```
**[logo/clubcup.png]** — 클럽컵(대륙컵) 로고 · 1:1 · 투명
```
A continental club cup emblem, silver star-burst around a stylized cup, elite tournament feel,
mint and platinum accents, no text, transparent background. + STYLE
```

### D. 트로피 / 시상 / 우승 연출

**[trophy/league-trophy.png]** — 리그 우승 트로피 · 1:1 · 투명
```
A gleaming championship trophy, tall elegant silver cup with mint-green accent gems, studio rim
light, subtle reflection, 3/4 hero angle, premium, transparent background. + STYLE
```
**[trophy/world-trophy.png]** — 월드컵 트로피 · 1:1 · 투명
```
An iconic golden world-cup style trophy, ornate base, glowing gold, dramatic spotlight, hero angle,
transparent background. + STYLE
```
**[fx/win-celebration.jpg]** — 우승/승리 화면 · 16:9
```
Victory celebration key art: golden confetti and mint-green streamers bursting over a dark stadium,
volumetric spotlights, lens flare, triumphant energy, empty center for a result banner. + STYLE
```
**[fx/medal-set.png]** — 메달(금/은/동) · 1:1 · 투명
```
A set of three sports medals (gold, silver, bronze) with ribbon, clean glossy vector, soft glow,
transparent background. + STYLE
```

### E. 선수 일러스트 / 아바타

**[player/avatar-generic.png]** — 익명 선수 아바타(기본 플레이스홀더) · 1:1 · 투명
```
A sleek anonymous athlete avatar, head-and-shoulders silhouette filled with a subtle mint-to-blue
gradient, faceless modern minimal style, soft glow ring, clean, transparent background, set of
slight variations. + STYLE
```

**[player/portrait-frame.jpg]** — 선수 카드 배경/프레임 · 3:4
```
A premium player card background, dark vertical panel with diagonal energy streaks, faint position
lines, mint accent border glow at the edges, empty center for a player portrait, FUT-card-like but
flat and classy. + STYLE
```

**[player/star-hero.jpg]** — 스타 선수 히어로(종목 무관 실루엣) · 3:4
```
Dramatic athlete hero illustration, dynamic action silhouette of a generic player mid-motion,
backlit by mint and gold stadium glow, motion energy lines, powerful and cinematic, no facial
detail needed, no team identifiers. + STYLE
```

> 종목별 포지션 아이콘이 필요하면 §F의 아이콘 스타일로 “goalkeeper gloves, pitcher, setter, point guard, paddle” 등을 라인 아이콘으로 생성하세요.

### F. UI 아이콘 세트

내비/액션 아이콘. **하나의 시트로 일괄 생성** 후 잘라 쓰기 권장. · 1:1 · 투명 · 라인+면 혼합

**[icon/nav-set.png]** — 내비게이션 아이콘 시트
```
A cohesive set of minimalist UI icons for a sports manager app, single consistent line+fill style,
2px rounded strokes, mint-green active accent, on transparent background, arranged in a neat grid:
dashboard (office desk/grid), squad (people roster), tactics (formation board), training (whistle/
dumbbell), competition (trophy), media (microphone), finances (coin stack), transfers (two-way
arrows), calendar (advance day), settings (gear). Flat, crisp, pixel-perfect. + STYLE
```

**[icon/event-set.png]** — 매치 이벤트 아이콘(피드용) · 1:1 · 투명
```
A set of small match-event glyph icons, consistent rounded line+fill style, color-coded
(score=mint, danger=red, warning=gold, info=blue): goal, shot, save, yellow card, red card,
substitution, injury, basketball three-pointer, dunk, baseball home run, strikeout, volleyball
spike, block, ace, pickleball winner. Transparent background, grid layout. + STYLE
```

### G. 경기 중계 “명장면” 일러스트 (흥미 핵심)

매치 피드의 큰 순간(역전골 등)에 띄우는 드라마틱 컷. · 16:9 또는 1:1

**[moment/soccer-goal.jpg]**
```
Explosive "GOAL" moment illustration, dynamic action of a striker's silhouette unleashing a shot,
net rippling, mint-green shockwave burst and gold sparks, motion blur, dramatic low angle,
broadcast highlight energy, no text. + STYLE
```
**[moment/basketball-dunk.jpg]**
```
Powerful slam-dunk moment, player silhouette hammering the rim, glass-shatter light burst, amber
court glow, explosive energy lines. + STYLE
```
**[moment/baseball-homerun.jpg]**
```
Home-run moment, batter silhouette mid-swing with a glowing ball streak arcing into night sky,
stadium lights, triumphant burst. + STYLE
```
**[moment/volleyball-spike.jpg]**
```
Decisive spike moment, attacker silhouette smashing over the net, impact shockwave, blue court
glow, dynamic. + STYLE
```
**[moment/pickleball-winner.jpg]**
```
Winning-shot moment, player silhouette putting away a volley, paddle blur, teal court glow,
energetic burst. + STYLE
```
**[moment/late-winner-banner.png]** — “극장 결승/역전” 강조 배너 · 21:9 · 투명
```
A dramatic wide ribbon/banner graphic for a clutch late winner, jagged energy shape with gold and
mint gradient, glowing edges, empty center, transparent background, no text. + STYLE
```

### H. 매니저 / 오피스

**[manager/avatar-set.png]** — 감독 아바타 선택지 · 1:1 · 투명
```
A set of stylized sports-manager avatars, head-and-shoulders, confident coaches in team jackets,
diverse, semi-flat illustrated style with mint accent lighting, clean, transparent background. + STYLE
```
**[bg/office.jpg]** — 대시보드 “감독실” 배경 · 16:9
```
A modern manager's office at night, dark minimalist room with a glowing tactical screen, trophy
shelf bokeh, large window overlooking a floodlit stadium, calm premium atmosphere, empty center
for dashboard cards. + STYLE
```

### I. 미디어 / 뉴스

**[media/press-conf.jpg]** — 기자회견 일러스트 · 16:9
```
A press conference scene illustration, a podium with microphones backlit by camera flashes,
dark room, mint-and-blue stage glow, blurred press silhouettes, dramatic, empty upper area for a
question card. + STYLE
```
**[media/news-card.jpg]** — 뉴스 카드 배경 · 16:9 / 4:3
```
A newspaper/broadcast-ticker style card background, dark with a faint halftone texture and a single
accent stripe, clean area for a headline, premium editorial sports look. + STYLE
```

### J. 분위기 / 엠비언트 배경

**[bg/crowd.jpg]** — 관중 군중(블러) · 16:9
```
A blurred stadium crowd at night under floodlights, sea of faint phone lights and color, bokeh,
dark and atmospheric, usable as a low-contrast backdrop. + STYLE
```
**[bg/floodlights.jpg]** — 야간 조명 텍스처 · 16:9
```
Stadium floodlight glow texture over deep night sky, volumetric light beams, haze, particles,
minimal, for overlay backgrounds. + STYLE
```

### K. 업적 / 뱃지

**[badge/achievement-set.png]** — 업적 뱃지 세트 · 1:1 · 투명
```
A set of game achievement badges, hexagon and shield shapes, glossy enamel-pin style, tiered
colors (bronze/silver/gold/mint-elite), simple central icons (trophy, flame, star, crown, ball),
no text, transparent background, grid. + STYLE
```
**[badge/form-set.png]** — 폼/연승 뱃지(W/D/L 등) · 1:1 · 투명
```
Small status badges for recent form, rounded squares color-coded green(win)/gray(draw)/red(loss)
and a flame streak badge, ultra-minimal flat, transparent background. + STYLE
```

---

## 5. 종횡비 · 해상도 · 내보내기 가이드

| 용도 | 종횡비 | 권장 크기 | 포맷 |
|---|---|---|---|
| 타이틀/히어로/배경 | 16:9 (모바일 9:16 별도) | 2560×1440 | JPG/WebP |
| 명장면 컷 | 16:9 또는 1:1 | 1600px | WebP |
| 선수 카드/포트레이트 | 3:4 | 1024×1365 | WebP/PNG |
| 엠블럼/로고/트로피 | 1:1 | 1024×1024 | PNG(투명) → 가능하면 SVG |
| UI·이벤트·뱃지 아이콘 | 1:1 | 512×512 | PNG(투명) / SVG |
| 와이드 배너 | 21:9 | 2100×900 | PNG(투명) |

- 아이콘·엠블럼은 가능하면 **SVG로 벡터화**(Recraft, Illustrator Image Trace, `vtracer`)해서 선명도와 용량을 동시에 확보하세요.
- 웹 성능을 위해 사진성 에셋은 **WebP/AVIF**로 변환하세요(`squoosh`, `sharp`).
- 다크 UI 위에 얹히는 배경은 **저대비**로 뽑아 텍스트 가독성을 지키세요.

---

## 6. 파일 네이밍 / 배치 규칙

```
public/
  assets/
    brand/      app-logo.png, title-hero.jpg, app-icon.png
    venue/      soccer-hero.jpg, basketball-hero.jpg, ...
    bg/         abstract-mesh.jpg, office.jpg, crowd.jpg, floodlights.jpg
    crest/      club-01.png ... club-08.png, nation-xx.png
    logo/       league.png, worldcup.png, clubcup.png
    trophy/     league-trophy.png, world-trophy.png, medal-set.png
    player/     avatar-generic.png, portrait-frame.jpg, star-hero.jpg
    icon/       nav/*.svg, event/*.svg
    moment/     soccer-goal.jpg, basketball-dunk.jpg, ...
    media/      press-conf.jpg, news-card.jpg
    badge/      achievement/*.png, form/*.png
```

- 파일명은 소문자-케밥, 종목/카테고리 접두사 일관 유지.
- Next.js에서는 `public/assets/...`에 두고 `/assets/...`로 참조하거나 `next/image`로 최적화하세요.

---

## 7. 일관성 유지 팁

- **시드 고정**: 마음에 드는 결과의 seed를 기록하고 같은 카테고리에서 재사용.
- **스타일 레퍼런스**: 베이스 1장을 정한 뒤 Midjourney `--sref` / 다른 도구의 image reference로 묶기.
- **배치 생성**: 엠블럼·아이콘·뱃지는 “set / grid of N variations” 프롬프트로 한 번에 뽑아 통일감 확보.
- **팔레트 강제**: 결과가 색에서 벗어나면 프롬프트에 정확한 HEX를 다시 명시하거나 후처리로 듀오톤/컬러 그레이딩 적용.
- **여백 확보**: UI에 얹을 배경/배너는 “empty center/area for UI, generous negative space”를 꼭 포함.
- **저작권**: 실제 구단·리그·선수 명칭/로고/얼굴을 모방하지 마세요. 모두 가상(generic)으로 생성합니다.

---

## 8. 우선순위 추천 (적은 수로 큰 효과)

1. `brand/title-hero` + `brand/app-logo` — 첫인상.
2. `venue/*-hero` 5종 — 종목 선택·매치 인트로 몰입감.
3. `icon/nav-set` + `icon/event-set` — UI 완성도 즉시 상승.
4. `moment/*` 명장면 컷 — “흥미진진함”의 핵심, 중계 피드 빅 모먼트에 연결.
5. `trophy/*` + `fx/win-celebration` — 보상감.
6. 나머지(크레스트/뱃지/미디어)는 점진 적용.
