# 스포츠매니저 (PRO MANAGER) — 구현 작업 지시서

> AI 코딩 에이전트 대상. 이 디자인을 실제 프로덕션 코드로 옮기기 위한 지침서입니다.
> 시각적 기준(SSOT)은 `Sports Manager.html`(standalone 미리보기)과 `Sports Manager.dc.html`(편집 가능 소스)입니다.
> 픽셀·색상·간격은 추측하지 말고 항상 소스 파일의 실제 값을 따르세요.

---

## 0. 전제 / 기술 스택 권장
- **프레임워크**: React 18 + TypeScript (Vue/Svelte도 동일 구조로 매핑 가능)
- **스타일**: CSS Modules 또는 Tailwind. 디자인 토큰을 CSS 변수로 먼저 정의할 것.
- **상태관리**: 화면 전환·종목 선택은 전역 store(Zustand/Pinia) 또는 라우터.
- **데이터**: 아래 §4 의 데이터 스키마를 API 응답 타입으로 사용. 현재 소스의 하드코딩 값은 **목업**이므로 API 연동으로 대체.
- 폰트는 Barlow Condensed / Barlow Semi Condensed(Google Fonts) + Pretendard(jsDelivr). standalone 파일에는 내장되어 있음.

---

## 1. 디자인 토큰 (가장 먼저 정의)

```css
:root {
  /* 배경 */
  --bg-base:    #0A0D13;   /* 앱 최하단 */
  --bg-topbar:  #0C1019;
  --bg-sidebar: #0E121B;
  --panel:      #131822;   /* 카드 기본 */
  --panel-2:    #0E121B;   /* 카드 내부 칸 */
  --border:     rgba(255,255,255,.07);
  --border-soft:rgba(255,255,255,.04);

  /* 텍스트 */
  --text:       #EAEEF5;
  --text-2:     #b6bfcf;
  --muted:      #8A93A3;
  --muted-2:    #7E8AA0;
  --muted-3:    #5A6478;

  /* 액센트 */
  --mint:   #18E29A;  /* primary — 긍정/우리팀/성공 */
  --red:    #FF4D5E;  /* 경고/부상/강등/실점 */
  --gold:   #F6C453;  /* 주의/무승부/양호 */
  --blue:   #4C8DFF;  /* 데이터/수비/링크 */
  --purple: #9B6DFF;  /* 잠재력/스카우트 */
}
```

- **포지션 컬러 규칙**: GK=`--gold`, DF=`--blue`, MF=`--mint`, FW=`--red`.
- **능력치/평점 임계값 컬러 함수** (소스 `attrColor`, `ratColor`, `condColor` 그대로 사용):
  - 능력치(20점 만점): `≥16` mint · `13–15` gold · `10–12` 회색(#9aa4b8) · `<10` red
  - 평점(10점 만점): `≥7.3` mint · `6.8–7.29` gold · `<6.8` red
  - 컨디션(%): `≥90` mint · `75–89` gold · `<75` red

## 2. 타이포그래피
| 용도 | 폰트 | 비고 |
|---|---|---|
| 큰 수치·헤더·OVR/평점 | **Barlow Condensed** 700/600 | 모든 숫자 강조에 사용 |
| 작은 수치(테이블 셀) | **Barlow Semi Condensed** 500/600 | 나이·경기수 등 |
| 한국어 본문/라벨 | **Pretendard** 400/600/700 | 기본 폰트 |

- 1920 데스크톱 기준. 본문 최소 11px, 강조 수치 16–48px.
- 카드 제목은 Barlow Condensed 16px / letter-spacing .5px.

## 3. 레이아웃 골격
```
<AppShell>
  ├─ <Sidebar/>      width 236px 고정. 로고 + 8개 NavItem + 구단 카드(하단 고정)
  ├─ <Main>
  │   ├─ <TopBar/>   height 60px. [화면제목/부제] [종목스위처] [예산][날짜][계속 진행 버튼]
  │   └─ <ScreenRouter/>  scroll 영역. 활성 화면만 렌더
```
- 8개 화면: `dash · squad · player · tactics · transfer · match · league · training`
- 화면 전환은 `activeScreen` 상태 1개로 제어. NavItem active 시 `--mint` 텍스트 + `rgba(24,226,154,.12)` 배경.
- 종목 스위처(축구/야구/농구/e스포츠): 현재는 축구 데이터만 채워짐. 종목별 데이터 소스를 분기할 것(§6).

## 4. 화면별 구현 명세 & 데이터 스키마

### 4-1. 대시보드 `dash`
- 그리드 `1.7fr 1fr`. 구성: ① 다음경기 히어로(전폭) ② 시즌 현황 카드 ③ 받은 메시지 ④ 핵심 선수(전폭).
- 히어로의 "경기 시작" → `match`, "전술 점검" → `tactics` 로 라우팅.
```ts
type SeasonStat = { label:string; value:string; color:string };
type FormResult = 'W'|'D'|'L';                 // W=mint D=gold L=red
type InboxMsg = { title:string; body:string; time:string; unread:boolean; type:'board'|'scout'|'injury'|'news' };
type Performer = { name:string; pos:string; stat:string; rating:number };
```

### 4-2. 스쿼드 `squad`
- 테이블. 컬럼: `# / 이름 / 포지션 / 나이 / OVR / POT / 컨디션(바) / 사기 / 평점 / 가치`.
- 포지션 필터 칩(전체/GK/DF/MF/FW) — 클라이언트 필터 구현.
- 행 클릭 → `player` 화면(해당 선수 id 전달).
```ts
type Player = {
  id:string; name:string; nat:string; num:number; age:number;
  group:'GK'|'DF'|'MF'|'FW'; pos:string;       // pos는 세부(RB, AMC...)
  ovr:number; pot:number; condition:number;     // condition 0–100
  morale:'최상'|'좋음'|'보통'|'불만'; rating:number; value:string;
};
```

### 4-3. 선수 프로필 `player`
- 그리드 `340px 1fr`. 좌: 신상 카드 + 계약정보 + 플레이성향 태그. 우: 능력치(기술/정신/신체 3열 막대) + 성장 추이 막대차트 + 시즌 기록.
- 능력치는 20점 만점, 막대 width = `value/20*100%`, 컬러는 §1 임계값.
```ts
type Attr = { label:string; value:number };     // 0–20
type PlayerDetail = Player & {
  height:number; contractUntil:string; wage:string;
  technical:Attr[]; mental:Attr[]; physical:Attr[];
  traits:string[]; ovrHistory:{year:number; ovr:number}[];
  season:{ apps:number; starts:number; goals:number; assists:number; keyPass:number; rating:number };
};
```

### 4-4. 전술 보드 `tactics`
- 그리드 `1fr 320px`. 좌: 포메이션 셀렉터 + **피치(세로형)**. 우: 팀 지시사항 + 전술 친밀도.
- 피치 좌표계: 각 선수 `x,y` 는 **%** (좌상단 0,0 / 공격 방향 위). 토큰 `position:absolute; left:x%; top:y%; transform:translate(-50%,-50%)`.
- 드래그 앤 드롭으로 위치 변경 가능하게 구현(현재는 정적). 포메이션 변경 시 좌표 프리셋 교체.
```ts
type Slot = { name:string; role:string; group:'GK'|'DF'|'MF'|'FW'; x:number; y:number };
type Tactic = { formation:string; slots:Slot[]; instructions:{key:string;value:string}[]; familiarity:number };
```

### 4-5. 이적/스카우트 `transfer`
- 상단 KPI 4칸(잔여 예산/주급 여유/스카우트 보고서/마감 D-day) + 영입 후보 테이블.
- 잠재력은 ★(반 별 ½ 포함) 표기. 상태 배지 컬러는 의미별(`확보 추진`=mint, `협상 중`=blue, `경쟁 치열`=red 등).
```ts
type Target = { id:string; name:string; nat:string; pos:string; age:number;
  club:string; ovr:number; potential:number;     // potential 0–5(.5 단위)
  value:string; status:string; statusColor:string };
```

### 4-6. 경기 중계 `match` (핵심 — 실시간성)
- 그리드 `1fr 380px`. 좌: 스코어보드(LIVE 깜빡임) + 경기 흐름 미니바 + 경기 통계(좌우 분할 바). 우: 실시간 중계 피드 + 전술변경/교체 버튼.
- **실시간 구현**: 매치 엔진(서버 또는 클라이언트 시뮬)에서 분당 이벤트를 push → 피드 prepend, 스코어/통계 갱신. `LIVE NN'` 분 표시 갱신.
- 이벤트 타입: `goal | yellow | red | sub | chance`. 컬러 매핑 §1.
```ts
type MatchEvent = { minute:number; type:'goal'|'yellow'|'red'|'sub'|'chance'; who:string; desc:string };
type MatchStat  = { key:string; home:number; away:number };  // 바 비율 = home/(home+away)
type LiveMatch  = { home:Team; away:Team; minute:number; homeScore:number; awayScore:number;
  events:MatchEvent[]; stats:MatchStat[] };
```

### 4-7. 리그 순위 `league`
- 풀 테이블. 컬럼 `# / 구단 / 경기 / 승 / 무 / 패 / 득 / 실 / 득실 / 승점`.
- 좌측 존 바 컬러: 1–3위 mint(ACL직행) · 4–6위 blue(ACL2) · 하위 2팀 red(강등). 우리 구단 행은 `rgba(24,226,154,.07)` 배경 + mint 구단명.
```ts
type TableRow = { rank:number; name:string; badge:string; played:number;
  win:number; draw:number; loss:number; gf:number; ga:number; gd:number; pts:number; isMine:boolean };
```

### 4-8. 트레이닝 `training`
- 주간 7일 그리드(요일별 포커스/태그/강도) + 개인 집중 훈련 진행도 + 팀 컨디션·부상 패널.
- 강도 컬러: 높음 red · 중간 gold · 낮음 mint.
```ts
type TrainDay = { day:string; focus:string; tag:string; tagColor:string; load:'높음'|'중간'|'낮음'|'-' };
type IndivTrain = { player:string; focus:string; progress:number };  // 0–100
type FitnessPanel = { avgFitness:number; injuredCount:number; injuries:{name:string;type:string;return:string}[] };
```

## 5. 공통 컴포넌트 (추출 권장)
- `<Avatar initials value bg color size>` — 한글 1자 또는 영문 이니셜 2자. 그라데이션 배경.
- `<StatBar value max color>` — 능력치/컨디션/진행도 막대.
- `<Badge color bg>` — 포지션·상태 칩.
- `<Card title action>` — 패널 셸(제목 + 우측 액션 링크).
- `<RatingNumber value>` — Barlow Condensed + 임계값 컬러.
- `<FormChip result>` — W/D/L 사각 칩.

## 6. 멀티 종목 확장 (요구사항)
- 종목 스위처 상태 `sport: 'soccer'|'baseball'|'basket'|'esports'`.
- 화면 골격(셸/내비/카드 시스템)은 **공통 유지**, 데이터·일부 화면만 종목별 분기:
  - 축구: 포메이션 피치 / 야구: 라인업·타순·구종 / 농구: 5인 로테이션 / e스포츠: 5인 로스터·맵 풀.
  - 능력치 라벨·통계 컬럼만 종목별 config로 분리(`SPORT_CONFIG[sport]`).

## 7. 접근성 / 반응형 / 인터랙션
- 모바일(요구사항): 사이드바 → 하단 탭바 전환, 테이블 → 카드 리스트로 리플로우. 히트 타깃 ≥ 44px.
- hover 상태는 소스의 `style-hover` 참고(행 hover `rgba(24,226,154,.05)`).
- `prefers-reduced-motion` 존중. LIVE 깜빡임/막대 애니메이션 비활성 처리.
- 키보드: 내비 화면 전환, 테이블 행 포커스 가능하게.

## 8. 작업 순서 (체크리스트)
1. [ ] §1 디자인 토큰을 CSS 변수/Tailwind config로 정의
2. [ ] 폰트 로드(Barlow Condensed/Semi + Pretendard)
3. [ ] AppShell + Sidebar + TopBar + 화면 라우팅 골격
4. [ ] 공통 컴포넌트(§5) 구현
5. [ ] 8개 화면을 §4 명세대로 구현 (dash → squad → player → tactics → transfer → match → league → training 순 권장)
6. [ ] 목업 데이터를 §4 타입 기반 API 연동으로 교체
7. [ ] match 화면 실시간 이벤트 스트림 연결
8. [ ] 모바일 반응형 + 접근성(§7)
9. [ ] 멀티 종목 config 분기(§6)

> 참고: 색상 hex·간격·radius 등 세부 값은 본 문서에 없더라도 `Sports Manager.dc.html` 인라인 스타일을 그대로 따르세요. 임의 변경 금지.
