# 작업지시서 — PRO MANAGER 디자인 적용 인수인계

**작성일**: 2026-06-24
**브랜치**: `claude/upbeat-goldberg-ba4xcv`
**대상**: 이 작업을 이어받는 다음 AI 에이전트

---

## 0. 한 줄 요약

사용자가 제공한 디자인 목업("PRO MANAGER" 다크 테마 스포츠 매니저 UI)을
Next.js 앱 전체에 적용하는 작업이 진행 중이다. **공통 토큰/컴포넌트와
AppShell(사이드바+탑바)은 완료되어 푸시됨.** 8개 화면 중 **나머지 화면
재구성(스쿼드/선수상세/전술/이적/경기중계/리그/훈련/대시보드)이 아직
남아 있다.** 이 화면들을 끝내고 나면 Phase 3("실시간 구간 시뮬레이션")를
진행하기로 사용자와 합의되어 있다 — **Phase 3는 이 디자인 작업이 끝나기
전까지 시작하지 말 것.**

---

## 1. 디자인 소스 (진실의 원천)

이 디렉토리(`docs/design/`)에 원본 디자인 파일을 복사해두었다:

- **`docs/design/Sports Manager.dc.html`** — 780줄 mockup 마크업.
  **색상/spacing/border-radius 등 모든 수치는 반드시 이 파일에서 직접
  읽어서 적용할 것. 임의로 추측하지 말 것** (사용자가 작업지시서에서
  두 번 강조한 원칙). 인라인 `style="..."` 속성에 정확한 px/hex 값이
  있다. `<script type="text/x-dc">` 안의 `Component` 클래스에는 각
  화면의 mock 데이터와 색상 threshold 함수(`attrColor`, `ratColor`,
  `condColor`, `ovrColor`, `posColor`)가 JS로 정의되어 있다.
- **`docs/design/IMPLEMENTATION_GUIDE.md`** — 원본 한국어 작업지시서
  (디자인 토큰 표, 8화면 스펙, 컴포넌트 권장사항, 접근성 요구사항).
- `Sports Manager.html` (23MB standalone 미리보기)은 너무 커서 repo에
  넣지 않았다. `.dc.html`이 구조/스타일의 authoritative source이므로
  필요 없다.

이 두 파일이 없으면 색상이나 spacing을 "대충" 맞추게 되는데, 그건
사용자가 명시적으로 금지한 방식이다 — 반드시 `.dc.html`을 grep/Read해서
정확한 값을 가져올 것.

---

## 2. 이미 완료되어 푸시된 작업 (커밋 `1a7360f`)

| 파일 | 내용 |
|---|---|
| `src/app/globals.css` | 고정 다크 테마 `:root` 토큰 전체 교체. light/dark 분기 제거. 레거시 변수명(`--background`, `--panel`, `--line`, `--soft` 등)은 새 팔레트에 리매핑해서 남겨둠 — 아직 안 만진 컴포넌트가 깨지지 않게 하기 위함. |
| `src/app/layout.tsx` | `<html class="dark">`, Barlow Condensed/Semi Condensed (Google Fonts) + Pretendard (jsDelivr CDN) 폰트 로딩 추가. |
| `src/components/Tile.tsx` | 디자인 시스템 공통 프리미티브 추가: `Avatar`, `Badge`, `RatingNumber`, `StatBar`, `FormChip`. 색상 threshold 헬퍼: `conditionColor`(condColor), `ratingColorHex`(ratColor), `attrColor`(0-20 스케일, **이 앱 attributes는 0-100 스케일이라 직접 쓰면 안 됨** — 아래 §4 참고), `overallColor`(ovrColor, 80/65 threshold로 보정), `groupColor`(GK=gold/DEF=blue/MID=mint/FWD=red). 기존 `conditionColor`/`ratingColor` export는 시그니처 그대로 유지(다른 파일에서 import 중이라 깨지면 안 됨). |
| `src/components/ui.tsx` | `Button`/`StatusBadge`/`ProgressBar`/`StatBlock`에서 light-mode Tailwind variant 제거, 새 CSS 변수 토큰으로 교체. |
| `src/components/AttributeBar.tsx` | `Tile.tsx`의 `StatBar` 재사용, 0-100 스케일 attribute용 자체 color threshold(80/60/40) 추가 (디자인의 0-20 스케일 `attrColor`와는 다름). |
| `src/app/game/layout.tsx` | AppShell 전체 재작성: 236px 사이드바(로고+9개 네비+클럽 카드), 60px 탑바(현재 화면 제목, 종목 표시, 이적예산, 시즌/일차, "계속 진행" CTA — `useGameStore`의 `continue`/`rolloverSeason` 호출). 모바일 하단 탭바는 기존 구조 유지하면서 재스킨. |

검증 완료: `tsc --noEmit`, `eslint .`, `vitest run`(63 테스트 통과),
`next build` 모두 그린 (기존에 있던 `multisport.test.ts`의 타입 에러 1개와
`page.tsx`의 미사용 변수 경고 1개는 **이 작업과 무관한 pre-existing
이슈**이니 건드리지 말 것).

---

## 3. 실데이터 모델 제약 — 디자인 목업의 가짜 위젯을 실데이터로 바꾸는 법

디자인 목업은 mock 데이터로 만들어졌기 때문에, 이 앱의 실제 데이터
모델(`src/lib/types/index.ts`, 413줄)에는 존재하지 않는 항목들이
있다. **새 기능을 지어내지 말 것 (가짜 메커닉 추가 금지)** — 대신
아래처럼 실데이터로 대체하거나, 기존 실데이터 컴포넌트를 재스킨해서
그 자리에 끼워 넣을 것.

| 디자인 목업의 가짜 항목 | 실데이터 대체 방안 |
|---|---|
| 선수 프로필의 "능력 성장 추이" 7시즌 OVR 막대그래프 (`devChart`) | 그런 히스토리 데이터 없음 → 기존 `PlayerFormCard.tsx`(real `player.recentForm` 스파크라인)를 그 자리에 재사용 (재스킨만, 새로 안 만듦) |
| 전술 화면의 "전술 친밀도 %" (`전술 친밀도`) | `Tactics`에 그런 필드 없음 → `sport.validateLineup()` 기반 실제 "라인업 유효성" 카드로 대체 |
| 이적 화면의 잔여예산/주급여유/스카우트보고서/마감D-day 4개 KPI | 스카우트 보고서 수·마감일 메커닉 없음 → 잔여예산(real `transferBudget`), 주급여유(`wageBudget` - 스쿼드 주급 합), 영입후보 수(검색 결과 `results.length`), 보유선수 수(스�쿼드 크기)로 교체 |
| 이적 화면의 영입후보 상태("확보추진"/"협상중"/"경쟁치열") | 그런 협상 상태 메커닉 없음 → `myClub.finances.transferBudget >= fee` 기반 실제 "가능/예산부족" 배지로 대체 |
| 선수 잠재력 별 5개 표시 | `player.potential`은 0-100 스케일 → `potential/100*5`로 환산 |
| 훈련 화면의 월~일 주간 일정 그리드 | 실제로는 주 단위 단일 `trainingFocus` 키만 존재 → 가짜 일일 스케줄 만들지 말고, 기존 단일-포커스 선택 메커닉을 디자인 카드 스타일로만 재스킨 |
| 경기 화면의 분 단위 모멘텀/점유율 시계열 그래프 | 그런 시계열 없음 → 실제로 공개된 `MatchEvent[]`를 `zone`/`clubId` 기준으로 N개 구간으로 버킷팅해서 만들 것 (완전 조작 데이터 금지, 실제 이벤트 기반 집계만 허용) |

이 표는 §7(남은 작업)의 각 화면 작업 시 그대로 적용하면 된다.

---

## 4. 디자인 토큰 / 색상 threshold (이미 `globals.css`/`Tile.tsx`에 구현됨 — 참고용)

```
--bg-base:#0A0D13  --bg-topbar:#0C1019  --bg-sidebar:#0E121B
--panel:#131822     --panel-2:#0E121B
--border-soft:rgba(255,255,255,.04)   --line(=border):rgba(255,255,255,.07)
--text(=foreground):#EAEEF5  --text-2:#b6bfcf
--muted-2:#7E8AA0  --muted-3:#5A6478
--mint:#18E29A  --red:#FF4D5E  --gold:#F6C453  --blue:#4C8DFF  --purple:#9B6DFF
```

포지션 그룹 색상: GK=gold, DEF=blue, MID=mint, FWD=red (`groupColor()`).

색상 threshold 함수 (디자인 원본 스케일과 이 앱의 실제 스케일이 다른
경우가 있으니 주의):

- `condColor`/`conditionColor(v)` — 0-100% 컨디션: `>=90 mint, >=75 gold, else red`
- `ratColor`/`ratingColorHex(v)` — 0-10 평점: `>=7.3 mint, >=6.8 gold, else red`
- `attrColor(v)` (Tile.tsx) — **디자인 원본은 0-20 스케일** (`>=16 mint, >=13 gold, >=10 #9aa4b8, else red`). **이 앱의 `player.attributes`는 0-100 스케일이므로 이 함수를 직접 쓰면 안 됨.** 0-100용은 `AttributeBar.tsx`에 이미 만들어둔 자체 threshold(`>=80 mint, >=60 blue, >=40 gold, else red`)를 쓸 것.
- `overallColor(v)` — OVR/POT 0-100: `>=80 mint, >=65 blue, else #9aa4b8` (디자인 원본 85/78에서 이 앱의 `calcOverall()` 분포에 맞게 80/65로 보정한 값. 더 조정이 필요하면 실제 스쿼드 OVR 분포를 보고 재보정해도 됨)

타이포그래피: Barlow Condensed(큰 숫자/제목, `font-display` 클래스),
Barlow Semi Condensed(작은 표 숫자, `font-display-sm` 클래스), Pretendard(본문, 기본 body 폰트).

---

## 5. 멀티스포츠 처리 방침

디자인 목업은 축구/야구/농구/e스포츠 4종목 스위처를 가정하지만, 이
앱은 종목이 세이브 생성 시 고정되고(`SportModule` 아키텍처), 실제
종목은 soccer/basketball/baseball/volleyball/pickleball 5종이다
(e스포츠 없음). **종목 스위처 UI는 만들지 않기로 이미 결정됨** —
`game/layout.tsx` 탑바에는 스위처 대신 현재 종목명을 보여주는 정적
배지만 있다. 화면별 데이터 분기는 기존 `getSport(state.sportId)` /
`sport.attributeGroups` / `sport.positions` 등 기존 `SportModule`
패턴을 그대로 쓸 것 — 새 분기 시스템을 만들지 말 것.

---

## 6. 이미 구축된 재사용 가능 컴포넌트 (남은 화면에서 적극 활용)

- `src/components/Tile.tsx`: `Tile`(카드), `Avatar`, `Badge`,
  `RatingNumber`, `StatBar`, `FormChip`, `conditionColor`,
  `ratingColorHex`, `ratingColor`(레거시), `attrColor`(0-20용, 주의),
  `overallColor`, `groupColor`
- `src/components/ui.tsx`: `Button`(primary/secondary/ghost/danger),
  `StatusBadge`(neutral/success/warning/danger/info), `ProgressBar`,
  `StatBlock`
- `src/components/AttributeBar.tsx`: 0-100 스케일 attribute bar
- `src/components/PlayerFormCard.tsx`: 최근 5경기 스파크라인 — 선수
  프로필의 "능력 성장 추이" 자리에 재사용 (§3 참고)
- `src/components/Venue.tsx`: 종목별 경기장 비주얼 — 현재 채도 높은
  Tailwind 그라디언트라 다크 패널 톤과 안 맞을 수 있는데, 실제 경기장
  색상을 표현하는 거라 그대로 둬도 괜찮음. MatchViewer 작업(§7-④) 때
  안 어울리면 그때 다시 검토.
- `src/components/LeagueTable.tsx`, `src/components/BracketView.tsx`:
  아직 디자인 토큰 적용 안 됨, 리그/대회 화면 작업(§7-③) 때 같이 처리.

---

## 7. 남은 작업 (TaskList ID #15~#23, 순서대로)

작업 시작 전에 `TaskList`로 현재 상태 확인하고, 각 항목 시작할 때
`in_progress`로, 끝나면 `completed`로 바꿀 것.

1. **#15 대시보드** (`src/app/game/dashboard/page.tsx`) — `.dc.html` 97~198줄 참고.
   - 다음 경기 히어로 카드(그라디언트, 홈/원정 아바타, VS, 액션 버튼) — 실데이터: `upcomingFixtures`, `sortTable`
   - 시즌 현황 카드(순위/승점/득점/무패 + 최근 5경기 `FormChip`)
   - 받은 메시지(inbox) — 기존 `state.news`/`state.press` 활용, 디자인의 아이콘맵 스타일 재사용 가능
   - "이 달의 핵심 선수" 4명 그리드 — **"이 달"이라는 기간 집계는 없으므로** 스쿼드를 overall 또는 recentForm 평균으로 정렬한 top-N으로 대체 (조작 데이터 X)
   - 레이아웃의 탑바에 이미 "계속 진행" CTA가 있으므로, 페이지 자체의 중복 헤더/버튼은 제거할 것 (이전 페이지 코드에 있던 상단 `<h1>`+Button 블록).

2. **#16 스쿼드** (`src/app/game/squad/page.tsx`) — `.dc.html` 201~238줄.
   테이블에 `Avatar`, 포지션 `Badge`(`groupColor`), `RatingNumber`(OVR/POT),
   `StatBar`(컨디션), 사기 dot, 평점. 포지션 그룹 필터 칩(전체/GK/DF/MF/FW
   — 종목별로 `sport.positions`의 group이 다르니 그걸 기반으로 동적 생성).

3. **#17 선수 상세** (`src/app/game/squad/[playerId]/page.tsx`) — `.dc.html` 240~342줄.
   아이덴티티 카드, 계약 정보 카드, 플레이 성향 태그, 3열 능력치
   그룹(`sport.attributeGroups` + `AttributeBar`), `PlayerFormCard`를
   "능력 성장 추이" 자리에 재사용, 시즌 기록 그리드(실제 `apps`/`recentForm` 집계).

4. **#18 전술** (`src/app/game/tactics/page.tsx`) — `.dc.html` 344줄~ (이후 계속 읽을 것, 아직 못 다 읽음).
   포메이션 피치를 `groupColor`로 토닝, "전술 친밀도" 위젯은 §3대로
   `sport.validateLineup()` 기반 실제 라인업 유효성 카드로 교체.
   기존 `conditionColor` import는 그대로 유지 가능(Tile.tsx에 보존됨).

5. **#19 이적/스카우트** (`src/app/game/transfers/page.tsx`).
   KPI 카드 4개를 §3 표대로 실데이터로 교체. 후보 리스트에 잠재력 별
   표시(`potential/100*5`), 영입후보 상태 배지는 가능/예산부족으로 교체.

6. **#20 경기 중계** (`MatchViewer.tsx` — 정확한 경로는
   `src/components/`나 `src/app/game/match/` 하위, Glob으로 찾을 것).
   **주의**: 이전 세션에서 `toneRank`/`feedToneRankFloor`/`openLabel`/
   속도별 밀도 필터링 로직을 이미 구현해뒀음 — 이거 절대 손상시키지
   말고 그 위에 비주얼만 재스킨할 것. 모멘텀 바는 §3대로 실제
   `MatchEvent[]` 버킷팅으로 구현.

7. **#21 리그/대회** (`src/app/game/competition/page.tsx` +
   `LeagueTable.tsx` + `BracketView.tsx`). 순위 zone 컬러링(상위/중위/
   하위권, 리그 크기가 다양하니 비율 기반 threshold로), 유저 클럽
   하이라이트, 브래킷 토큰 재스킨.

8. **#22 훈련** (`src/app/game/training/page.tsx`). 단일
   `trainingFocus` 선택 메커닉은 유지하고 카드 스타일만 재스킨. 팀
   컨디션/부상 패널 추가 — `player.condition` 평균, `player.injuredUntilDay > state.day`로 부상 필터링 (둘 다 실데이터).

9. **#23 검증 및 커밋/푸시**. `npx tsc --noEmit -p .`, `npx eslint .`,
   `npx vitest run`, `npx next build` 전부 그린 확인 (위 §2에 언급한
   pre-existing 이슈 2개는 무시). 가능하면 `npm run dev`로 실제 브라우저
   에서 주요 화면 스팟체크. 끝나면 `claude/upbeat-goldberg-ba4xcv`
   브랜치에 커밋 후 `git push -u origin claude/upbeat-goldberg-ba4xcv`.
   **PR은 사용자가 명시적으로 요청하지 않는 한 만들지 말 것.**

---

## 8. 이 작업이 다 끝난 뒤

사용자가 이미 승인한 **Phase 3 ("실시간 구간 시뮬레이션" / Live Segment
Simulation, 5개 종목 전체 범위)**를 시작하면 된다. 단, 이 디자인 적용
작업이 끝나기 전까지는 시작하지 말 것 — 사용자가 명시적으로 순서를
"디자인 먼저, Phase 3는 그 다음"으로 지정했다.

---

## 9. 작업 원칙 (재강조)

- 색상/spacing/border-radius 값은 **항상 `docs/design/Sports Manager.dc.html`에서 직접 읽을 것**. 추측 금지.
- 디자인에만 있고 실데이터에 없는 메커닉은 **새로 만들지 말고**, §3
  표대로 실데이터 기반으로 재해석하거나 기존 실데이터 컴포넌트를 재사용할 것.
- 종목 스위처 UI 만들지 말 것 — 종목은 세이브당 고정.
- 한 화면씩 끝낼 때마다 `tsc`/`eslint`/`vitest` 돌려서 깨진 게 없는지 확인.
- 커밋은 의미 단위로 나눠서 하고, 매번 빌드 검증 후 푸시할 것.
