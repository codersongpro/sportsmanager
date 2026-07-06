# P2 작업지시서 — 살아있는 세계 + 페이싱 (9건)

> 선행 조건: [P0](./01-p0-tasks.md), [P1](./02-p1-tasks.md) 완료. 배경 진단은 [00-analysis.md](./00-analysis.md).
> P2-1~P2-4는 순서대로(서로 의존), P2-5~P2-9는 독립적이라 순서 무관.

## 공통 규칙 (P0 문서와 동일 — 요약)

1. **결정론**: 난수는 스레딩된 시드 RNG만. `Math.random()`/`Date.now()` 금지(`updatedAt` 제외). AI 순회는 **안정 정렬 순서**(id 사전순)로.
2. **세그먼트 패리티**: `src/lib/engine/activeMatch.test.ts`는 **무수정 그린** 유지. 시뮬 함수 내부 변경은 원자/세그먼트 양 경로가 같은 함수를 공유하는지 확인.
3. **세이브 마이그레이션**: P2 완료 시 `persistence.ts` `CURRENT_VERSION = 5`, `migrate()` 기본값, `persistence.test.ts` 케이스 추가.
4. **i18n**: UI 문자열은 `src/lib/i18n/dict.ts`에 ko/en 쌍. 엔진 뉴스는 인라인 `LocalizedText`.
5. **작업당 검증**: `npx tsc --noEmit && npm run lint && npx vitest run && npm run build` + 명시된 스모크.
6. P2에서 재기준이 예정된 테스트: `season.test.ts`(P2-3 — 은퇴로 단언 대상 선수가 사라질 수 있음 → 30세 미만 선수를 골라 단언하도록 수정), `soccer/sim.test.ts`·`multisport.test.ts`는 상수 변경(P2-5/6)에도 결정론·승자 존재 단언이라 그린 유지가 원칙.

---

## P2-1. 이적창 + AI 간 이적

**목표**: 이적시장이 기간제로 열리고, AI 클럽끼리도 선수를 사고판다.

**파일**: 신규 `src/lib/engine/transfers.ts`, `src/lib/engine/season.ts`, `src/lib/engine/newGame.ts`, `src/lib/store/gameStore.ts`, `src/app/game/transfers/page.tsx`, `src/lib/types/index.ts`, `src/lib/i18n/dict.ts`

**규칙**:
1. 타입: `GameState.seasonStartDay?: number`. `newGame`과 `rolloverSeason`에서 `seasonStartDay = state.day`(롤오버는 `next.day` 갱신 후) 설정. 마이그레이션 기본값 `0`.
2. `transfers.ts`에 `export function isWindowOpen(state: GameState): boolean`:
   ```ts
   const d = state.day - (state.seasonStartDay ?? 0);
   return d <= 20 || (d >= 56 && d <= 70); // 개막창 + 겨울창
   ```
3. `gameStore.buyPlayer`/`sellPlayer`: 창이 닫혔으면 실패 처리 + 뉴스/토스트 `{ko:"이적시장이 닫혀 있습니다", en:"The transfer window is closed"}`. 이적 페이지 상단에 창 상태 + 다음 개장일 표시.
4. `transfers.ts`에 `export function runAiTransfers(state: GameState, sport: SportModule, rng: RNG)`:
   - 호출 위치: `continueGame`의 주간 블록(`day % 7 === 0`), `applyWeeklyTraining` 다음, **창이 열려 있을 때만**.
   - AI 클럽(유저 클럽·national 제외)을 **id 사전순**으로 순회. 각 클럽 `rng.bool(0.12)`로 이번 주 영입 시도 여부 결정.
   - 시도 시: 바이어의 선발 라인업에서 `calcOverall` 최저 선수의 주 포지션이 "약점 포지션". 후보 = 다른 AI 클럽 소속 + 같은 주 포지션(`positions[0]`) + `ovr > 약점선수 ovr + 2` + 셀러 `squad.length > lineup.length + 3`인 선수 중 ovr 최고(동률 id 사전순). `fee = Math.round(player.value * rng.range(0.95, 1.15))`가 바이어 `transferBudget` 이하일 때만 체결.
   - 체결: 셀러 `balance += fee`, 바이어 `balance -= fee; transferBudget -= fee`, `squad` 이동, `player.clubId` 갱신, 양 클럽 라인업에 있었다면 제거 후 `autoPickLineup` 재선발.
   - 뉴스: `fee > 1_000_000`이거나 유저와 같은 리그 클럽 간 거래일 때만 (스팸 방지). 주당 전체 체결 상한 3건.

**i18n 키**: `transferWindowOpen: {ko:"이적시장 개장 중", en:"Transfer window open"}`, `transferWindowClosed: {ko:"이적시장 폐장", en:"Transfer window closed"}`, `windowReopens: {ko:"재개장", en:"Reopens"}`

**검증**: 공통 명령 + `isWindowOpen` 단위 테스트. 스모크: 창 폐장 기간에 영입 시도 → 차단; 몇 주 진행 → AI 이적 뉴스 발생.

---

## P2-2. 유저 선수에 대한 AI 영입 제안

**목표**: AI가 내 선수에게 입찰하고, 수락/거절이 실제 결과를 낳는다.

**파일**: `src/lib/engine/transfers.ts`, `src/lib/types/index.ts`, `src/lib/store/gameStore.ts`, `src/lib/selectors/dashboard.ts`, `src/app/game/transfers/page.tsx`, `src/lib/i18n/dict.ts`

**규칙**:
1. 타입: `GameState.offers?: { id: string; playerId: string; fromClubId: string; fee: number; expiresDay: number }[]`
2. **생성** — `runAiTransfers` 끝에서 (창 개장 중, 현재 유효 제안 2건 미만일 때): 유저 스쿼드의 `ovr >= 62` 선수를 id 사전순으로 순회,
   ```ts
   const prob = Math.max(0.01, Math.min(0.10, (ovr - myClub.reputation * 0.6 - 30) / 300));
   if (rng.bool(prob)) { /* 제안 생성 */ }
   ```
   `fee = Math.round(player.value * rng.range(1.0, 1.3))`; 입찰 클럽 = `transferBudget >= fee`이고 `reputation >= myClub.reputation - 15`인 AI 클럽 중 rng로 선택(`rng.int`로 인덱스, 후보는 id 사전순 배열) — 없으면 생성 스킵. `id = \`offer_${state.day}_${playerId}\``, `expiresDay = state.day + 7`. 뉴스 + 대시보드 경고 알림("이적 제안 도착").
3. **만료** — `continueGame` 일일 루프에서 `offers = offers.filter(o => o.expiresDay > next.day)`.
4. **수락** — `gameStore.acceptOffer(offerId)`: `balance += fee; transferBudget += fee`, 선수 이적(스쿼드/라인업 제거, `clubId` 변경, 바이어 스쿼드 추가). 판 선수가 스쿼드 ovr 상위 3위 이내였다면 잔류 스쿼드 전원 모랄 `−3`. 뉴스.
5. **거절** — `gameStore.rejectOffer(offerId)`: 제안 삭제. `fee >= player.value * 1.2`(대형 제안)였다면 해당 선수 모랄 `−4` (이적을 원했음). 뉴스 생략 가능.
6. 이적 페이지에 "받은 제안" 섹션: 선수/입찰 클럽/금액/만료일 + 수락·거절 버튼.

**i18n 키**: `incomingOffers: {ko:"받은 이적 제안", en:"Incoming offers"}`, `acceptOffer: {ko:"수락", en:"Accept"}`, `rejectOffer: {ko:"거절", en:"Reject"}`, `offerExpires: {ko:"만료", en:"Expires"}`

**검증**: 공통 명령 + 수락/거절 로직 단위 테스트. 스모크: 여러 주 진행 → 제안 도착 알림 → 수락 시 잔고 증가·선수 이탈.

---

## P2-3. 은퇴 + 유스 리젠 (롤오버)

**목표**: 세계가 더 이상 단조 감쇠하지 않는다 — 노장은 떠나고 유스가 올라온다.

**파일**: `src/lib/engine/season.ts`(`rolloverSeason`), `src/lib/engine/world.ts`(이름 생성기 재사용 — 어떤 함수로 선수 이름을 만드는지 grep해서 같은 것을 쓸 것), `src/lib/engine/season.test.ts`, `src/lib/i18n/dict.ts`

**규칙** — `rolloverSeason`의 `ageAndDevelop` 루프 **직후**:
1. **은퇴 판정** (클럽 id 사전순 → 스쿼드 순서로 안정 순회):
   - `age >= 38` → 무조건 은퇴
   - `age >= 36` && `rng.bool(0.35)` → 은퇴
   - `age >= 34` && `calcOverall < 58` && `rng.bool(0.5)` → 은퇴
   - 처리: `next.players`에서 삭제, 소속 클럽 `squad`·`tactics.lineup`·`tactics.bench`에서 제거. 유저 클럽 선수이거나 `ovr >= 75`였던 선수는 은퇴 뉴스.
2. **유스 리젠** — 은퇴자 1명당 그 클럽에 1명 생성:
   ```ts
   sport.generatePlayer(...)  // 기존 생성기 시그니처를 확인해 맞출 것
   // id: `regen_s${season}_${clubId}_${i}`, age: rng.int(16, 18),
   // targetOverall: rng.int(42, 58), potential: rng.int(62, 94),
   // nationality: club.country, 이름: world.ts와 같은 이름 생성기(시드 rng 전달)
   ```
   생성 후 `contractUntil = next.season + rng.int(2, 4)`. `players`와 클럽 `squad`에 추가. 유저 클럽이면 뉴스 `{ko:"유스 아카데미 승격: {이름}", en:"Youth academy graduate: {name}"}`.
3. 리젠/은퇴 뒤에 기존 `autoPickLineup` 재선발 루프(season.ts:185-189, 196-200)가 돌므로 라인업 정합성은 자동 회복 — 순서상 은퇴·리젠이 **그 앞**에 오도록 배치할 것.

**테스트 재기준**: `season.test.ts`가 `Object.keys(players)[0]` 같은 임의 선수로 나이/출장 단언을 하면 그 선수가 은퇴로 사라질 수 있다 → **30세 미만 선수를 골라** 단언하도록 수정.

**i18n 키**: `retired: {ko:"은퇴", en:"Retired"}`, `youthGraduate: {ko:"유스 승격", en:"Youth graduate"}`

**검증**: 공통 명령 + 단위 테스트(38세 선수 → 롤오버 후 부재 + 같은 클럽에 리젠 존재). 스모크: 시즌 롤오버 → 뉴스에 은퇴/유스 항목.

---

## P2-4. 계약 만료 · 재계약 · 자유계약(FA)

**목표**: `contractUntil`이 의미를 갖는다.

**파일**: `src/lib/engine/season.ts`, `src/lib/store/gameStore.ts`, `src/lib/selectors/dashboard.ts`, `src/app/game/squad/page.tsx`, `src/app/game/transfers/page.tsx`, `src/lib/i18n/dict.ts`

**규칙**:
1. **유저 재계약** — `gameStore.renewContract(playerId)` (시즌 중 언제든):
   ```ts
   const bonus = player.wage * 8;             // 사이닝 보너스, balance에서 차감 (부족 시 실패)
   player.wage = Math.round(player.wage * (1.15 + player.form * 0.01));
   player.contractUntil = state.season + 2;
   ```
   결정적(rng 없음). 스쿼드/선수 상세 페이지에 "재계약" 버튼 + 비용 표시.
2. **롤오버 처리** — `rolloverSeason`에서 은퇴 판정 **전에**, `contractUntil <= next.season`인 선수:
   - AI 클럽: `ovr >= 스쿼드 ovr 중앙값 − 5`면 자동 갱신(`contractUntil = next.season + rng.int(1, 3)`, `wage`는 기존 `playerWage(value)` 재계산), 아니면 방출 → `clubId`를 무소속 표시(코드베이스의 무소속 표현을 확인: 없다면 `clubId = ""` + 모든 조회부 가드 — 타입이 non-null이면 `GameState.freeAgentIds: string[]`를 쓰는 편이 안전).
   - 유저 클럽: 갱신 안 한 선수는 FA로 이탈 + 뉴스 `{ko:"{이름} 계약 만료로 팀을 떠났습니다", en:"{name} left on a free"}`.
3. **FA 영입** — 이적 페이지에 "자유계약 선수" 섹션(무소속, ovr 내림차순, 최대 30명). `buyPlayer`에 FA 분기: `fee = 0`, 성사 확률은 기존 로지스틱에서 셀러 항 제거(`resistance = ovr`), 주급 예산 검사(P1-5)는 동일 적용.
4. **알림** — 시즌 마지막 5라운드 구간에 유저 스쿼드 중 만료 예정(`contractUntil <= season`) 선수가 있으면 대시보드 경고 "계약 만료 임박 N명".

**i18n 키**: `renewContractBtn: {ko:"재계약", en:"Renew contract"}`, `contractExpiring: {ko:"계약 만료 임박", en:"Contract expiring"}`, `freeAgents: {ko:"자유계약 선수", en:"Free agents"}`, `signingBonus: {ko:"사이닝 보너스", en:"Signing bonus"}`

**검증**: 공통 명령 + 롤오버 만료 처리 단위 테스트. 스모크: 재계약 버튼 동작(잔고 차감·주급 인상), 롤오버 후 미갱신 선수 이탈.

---

## P2-5. 비축구 4종목 전술 연결

**목표**: mentality/tempo 다이얼이 농구·야구·배구·피클볼 시뮬에도 실제 반영된다.

**파일**: 신규 `tactics.ts` in `src/lib/sports/{basketball,baseball,volleyball,pickleball}/`, 각 종목 `sim.ts`, `src/app/game/tactics/page.tsx`(비축구에서 mentality/tempo 다이얼 노출, pressing/width는 축구 전용으로 숨김), `src/lib/i18n/dict.ts`(기존 다이얼 라벨 재사용 — 누락분만 추가)

**정확한 배율** (각 sim의 공격/수비 강도 계산 지점에 적용; 팀 전술은 `club.tactics`에서 읽는다 — 축구 `tactics.ts`의 기존 매핑 패턴을 그대로 따라 각 종목판을 만든다):
- **농구** (`side()`의 off/def): mentality attacking `off ×1.07, def ×0.94`; defensive `off ×0.94, def ×1.07`. tempo는 경기 페이스 공유: 양 팀 tempo 계수(fast 1.06 / normal 1.0 / slow 0.94)의 `max`를 **양 팀** 쿼터 기대득점에 곱한다.
- **야구**: mentality attacking → `batRating ×1.05, pitchRating ×0.96`; defensive → `×0.95 / ×1.04`. tempo fast → 자책 λ `×1.04`, slow → `×0.97`.
- **배구·피클볼**: mentality → 자기 `strength`에 attacking `+1.2` / defensive `−1.2` (로지스틱 진입 전). tempo → 클러치 gaussian의 sd: fast `3.0`, normal `2.5`, slow `2.1`.

**결정론/패리티**: 순수 배율·sd 파라미터 변경이며 **추가 rng draw 없음**. 원자/세그먼트 경로가 같은 강도 함수를 공유하므로 패리티 자동 유지. `multisport.test.ts`는 결정론·승자 존재 단언이라 그린 유지.

**검증**: 공통 명령. 스모크: 농구 게임에서 mentality를 attacking으로 → 여러 시드에서 평균 득점 상승 경향 확인(전술 페이지에서 변경 후 경기).

---

## P2-6. 농구 분산 상향 (이변 허용)

**목표**: 가장 예측 가능한 종목(지수 1.05 + 균등분포 4쿼터 평균화)에 드라마를 부여.

**파일**: `src/lib/sports/basketball/sim.ts` (`quarterTarget`, line ~176-178)

**변경**:
```ts
// 기존: base = 26 * (off / max(30, def))^1.05;  pts = clamp(round(base * range(0.8,1.2) ± 0.6), 14, 38)
const base = 26 * Math.pow(off / Math.max(30, def), 1.25);            // 1.05 → 1.25
const swing = Math.max(0.72, Math.min(1.28, rng.gaussian(1, 0.14)));  // range(0.8,1.2) 대체
```
`[14, 38]` 클램프와 홈 ±0.6은 유지.

**결정론 주의**: `gaussian`은 내부적으로 uniform 4회를 소비(기존 `range`는 1회)하지만, 이 함수는 원자/세그먼트 **양 경로가 공유**하므로 패리티 무영향. 시드별 결과값 자체는 달라진다 — 고정 스코어를 단언하는 테스트가 있으면 재기준(현재 없음이 원칙, `multisport.test.ts`는 결정론·범위 단언).

**검증**: 공통 명령. 참고 확인: 임시 스크립트로 동일 두 팀 100회 시뮬 → 약팀 승률이 기존보다 상승(예: 15%→25% 수준)하는지 눈으로 확인 후 스크립트 삭제.

---

## P2-7. 경기 후 MOTM + 전체 평점 공개

**목표**: 경기 후 화면에 전 선수 평점과 Man of the Match가 보인다.

**파일**: `src/components/MatchViewer.tsx`, `src/lib/i18n/dict.ts`

**변경**:
1. 숨겨진 타일 3곳의 `className="hidden"` 제거 + 기존 타일 스타일로 정리: `MatchViewer.tsx:340`(홈/원정 포메이션·풀스쿼드 타일), `:433`(스쿼드 평점 테이블), `:451`(코멘터리). 레이아웃이 길어지면 반응형 그리드(기존 타일 그리드 패턴)로 배치.
2. **MOTM** (엔진 무변경, 컴포넌트 내 계산): `result.playerRatings`에서 최고 평점 선수(동률: 홈 라인업 순서 우선, 다음 id 사전순). 배지 타일: 선수명 + 평점 + 소속.

**i18n 키**: `manOfTheMatch: {ko:"경기 MVP", en:"Man of the Match"}`, `allRatings: {ko:"전체 평점", en:"All ratings"}`

**검증**: 공통 명령. 스모크: 5종목 각각 경기 종료 → 전체 평점 테이블 + MOTM 배지 렌더 확인(모바일 폭 375px에서도 깨짐 없이).

---

## P2-8. 언론 다양화

**목표**: W/D/L별 3문항 고정 반복 탈피.

**파일**: `src/lib/engine/press.ts`, `src/lib/engine/matchFlow.ts`

**변경**:
1. 시그니처 확장: `makePostMatchPress(id, day, outcome, oppShort, ctx: { margin: number; streak: number })`. `finishMatch`에서 `margin = |득점 − 실점|`, `streak = 이 대회 직전 경기들에서 같은 outcome의 연속 수(방금 경기 포함)`를 계산해 전달.
2. press.ts: outcome별 질문 풀을 배열로 확장 — 기본 4종 + 특수 2종(대승 `outcome==="W" && margin >= 3`, 연패 `outcome==="L" && streak >= 3`, 연승 `outcome==="W" && streak >= 3`, 신승 `margin <= 1` 등 조건 매칭 우선). 각 항목은 기존과 같은 구조(질문 + 옵션 3개, 옵션별 `moraleDelta`/`repDelta`/`reply`).
3. **선택은 rng가 아니라 해시로**: `hashSeed(id) % pool.length` (`hashSeed`는 `src/lib/sim/rng.ts`에서 export, `newGame.ts:24` 사용례 참조). rng 소비 0 → 시즌 시드 스트림 불변 → **기존 테스트 재기준 불필요**.
4. **제약**: `press_form.test.ts:36`이 `item.options.length === 3`을 단언하므로 모든 변형도 옵션 정확히 3개.

**검증**: 공통 명령(특히 press_form.test.ts 무수정 그린). 스모크: 여러 경기 진행 → 질문 문구가 경기마다 달라지고, 3점차 대승 후 특수 질문 등장.

---

## P2-9. 인매치 가시적 피드백

**목표**: 팀토크·전술 변경·경기 흐름이 눈에 보인다. 전부 클라이언트 표시 로직 — **엔진·rng 무변경**.

**파일**: `src/lib/types/index.ts`, `src/lib/store/gameStore.ts`, `src/app/game/match/live/page.tsx`, `src/lib/i18n/dict.ts`

**변경**:
1. 타입: `ActiveMatchState.lastTalk?: { key: string; moraleDelta: number }`.
2. `gameStore.giveTeamTalk`: 적용 시 `nextActive.lastTalk = { key: option.key, moraleDelta: option.moraleDelta }` 저장. 라이브 페이지에서 칩 표시 `팀 토크 적용: {옵션명} (사기 {+N})` — 다음 세그먼트가 플레이되면(`segments.length` 증가 감지) 칩 제거(`lastTalk` 클리어는 `playNextSegment`에서).
3. 전술 변경 시(라이브 페이지의 인매치 전술 컨트롤) 토스트/배너: `전술 변경 — 다음 구간부터 적용` + 현재 전술 태그 칩 갱신. 기존 `tacticChangesCount` 카운터는 유지해도 무방.
4. **모멘텀 바**: 세그먼트 사이에 최신 세그먼트 결과로
   ```ts
   const momentum = Math.max(10, Math.min(90, 50 + (hShots - aShots) * 4 + (hGoals - aGoals) * 12));
   ```
   두 색 게이지로 렌더(라벨 "경기 흐름"). 라이브 페이지에 기존 momentum 표시가 있으면 이 공식으로 통일/대체.

**i18n 키**: `teamTalkApplied: {ko:"팀 토크 적용", en:"Team talk applied"}`, `tacticsNextSegment: {ko:"전술 변경 — 다음 구간부터 적용", en:"Tactics changed — applies from next segment"}`, `momentumLabel: {ko:"경기 흐름", en:"Momentum"}`

**마이그레이션**: 이 시점에 `CURRENT_VERSION = 5` (P2-1 `seasonStartDay`, P2-2 `offers` 기본값 포함), `persistence.test.ts` 케이스 추가.

**검증**: 공통 명령. 스모크: 라이브 경기에서 팀토크 → 칩 표시 → 다음 세그먼트 후 소멸; 전술 변경 토스트; 모멘텀 바가 세그먼트마다 움직임.

---

## P2 완료 조건

- [ ] 전 검증 명령 그린, `activeMatch.test.ts`·`press_form.test.ts` 무수정 그린, `season.test.ts`는 P2-3 재기준만
- [ ] 이적창 개폐 + AI 이적 뉴스 + 내 선수 제안 수락/거절 동작
- [ ] 롤오버 시 은퇴·유스 리젠·계약 만료 처리
- [ ] 4종목 전술 다이얼이 시뮬에 반영, 농구 이변 증가
- [ ] 경기 후 MOTM·전체 평점, 언론 질문 다양화, 인매치 피드백 표시
- [ ] `CURRENT_VERSION === 5`
- [ ] 커밋 메시지 예: `P2: living world (AI transfers, retirement/youth, contracts), non-soccer tactics, match feedback`
