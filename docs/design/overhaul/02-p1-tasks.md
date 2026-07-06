# P1 작업지시서 — 판돈과 보상 (5건)

> 선행 조건: [P0](./01-p0-tasks.md) 완료 (특히 P0-2의 `applyPostMatchPlayerEffects` 훅과 P0-6의 `processWeeklyUpkeep`가 존재해야 한다). 배경 진단은 [00-analysis.md](./00-analysis.md).

## 공통 규칙 (P0 문서와 동일 — 요약)

1. **결정론**: 난수는 스레딩된 시드 RNG만. `Math.random()`/`Date.now()` 금지(`updatedAt` 제외).
2. **세그먼트 패리티**: 경기 후 rng 소비는 `finishMatch` 안에서만. `src/lib/engine/activeMatch.test.ts`는 **무수정 그린** 유지.
3. **세이브 마이그레이션**: P1 완료 시 `persistence.ts` `CURRENT_VERSION = 4`, `migrate()`에 기본값, `persistence.test.ts` 케이스 추가.
4. **i18n**: UI 문자열은 `src/lib/i18n/dict.ts`에 ko/en 쌍. 엔진 뉴스는 인라인 `LocalizedText`.
5. **작업당 검증**: `npx tsc --noEmit && npm run lint && npx vitest run && npm run build` + 명시된 스모크.
6. P1에서 재기준 가능성이 있는 테스트: `dashboard.test.ts`(수입 공식 변경 시). 그 외는 그린 유지.

---

## P1-1. 이사회: 시즌 목표 + 신임도 미터

**목표**: 클럽 평판에서 시즌 목표를 산출하고, 0–100 신임도가 결과·순위에 반응한다.

**파일**: `src/lib/types/index.ts`, `src/lib/engine/newGame.ts`, `src/lib/engine/season.ts`, `src/lib/engine/matchFlow.ts`, `src/lib/selectors/dashboard.ts`, `src/app/game/dashboard/page.tsx`, `src/lib/i18n/dict.ts`, `src/lib/store/persistence.ts`

**모델**: `GameState.board?: { objectiveRank: number; confidence: number }`

**공식**:
1. **목표 산출** — 헬퍼 `computeBoardObjective(state): number`를 season.ts(또는 새 engine/board.ts)에 만들고 `newGame`과 `rolloverSeason`(승강 스왑 **이후**)에서 호출:
   - `repRank` = 유저 클럽 `reputation`의 `competition.clubIds` 내 1-based 순위 (내림차순, 동률은 clubId 사전순으로 안정 정렬)
   - `N = clubIds.length` 기준:
     - `repRank <= 2` → `objectiveRank = 2` (우승 경쟁)
     - `repRank >= N - 1` → `objectiveRank = N - PROMOTION_RELEGATION_COUNT` (잔류)
     - 그 외 → `objectiveRank = repRank + 1`
   - 토너먼트 포맷이면 목표 앵커 없이 신임도가 경기 결과로만 움직인다(아래 2만 적용, 3 생략).
   - 초기 신임도: `confidence = 60`.
2. **경기 후** — `finishMatch`의 유저 분기(`matchFlow.ts:94-102`, `applyManagerRep` 다음), **국내 경기만**(`comp.id === state.competition.id` 가드, P0-2와 동일):
   ```ts
   const clamp15 = (x: number) => Math.max(0, Math.min(1.5, x));
   if (outcome === "W") board.confidence += 3 + clamp15((oppRep - myRep) / 20);
   else if (outcome === "D") board.confidence += 0.5;
   else board.confidence -= 3 + clamp15((myRep - oppRep) / 20);
   ```
3. **주간 수렴** — `processWeeklyUpkeep`(P0-6)에서, 리그 포맷일 때만: 유저 클럽의 현재 리그 순위 `rank`(기존 순위 셀렉터/`sortTable` 재사용)로
   ```ts
   const anchor = Math.max(5, Math.min(95, 62 + (board.objectiveRank - rank) * 7));
   board.confidence += (anchor - board.confidence) * 0.2;
   ```
4. **시즌 말** — `continueGame`의 `seasonOver = true` 블록(`season.ts:112`): 최종 순위 ≤ objectiveRank이면 `confidence = Math.min(95, confidence + 15)` + 뉴스 `{ko:"이사회가 시즌 성과에 만족합니다", en:"The board is pleased with the season"}`; 초과 실패면 `−15` + 실망 뉴스.
5. 모든 갱신 후 `confidence = Math.round(Math.max(0, Math.min(100, confidence)) * 10) / 10`.

**UI**: 대시보드에 "이사회" 타일 — 신임도 바 + 목표 문구(`목표: N위 이상` / `목표: 잔류`). 셀렉터 `boardSummary(state)`를 `dashboard.ts`에 추가.

**i18n 키**: `boardTitle: {ko:"이사회", en:"Board"}`, `boardConfidence: {ko:"이사회 신임도", en:"Board confidence"}`, `seasonObjective: {ko:"시즌 목표", en:"Season objective"}`, `objectiveTopN: {ko:"{n}위 이상", en:"Finish top {n}"}`, `objectiveSurvive: {ko:"잔류", en:"Avoid relegation"}`

**마이그레이션**: v3→v4에서 `board`가 없으면 목표 공식으로 채우고 `confidence: 60`.

**결정론**: rng 미사용, 전부 결정적.

**검증**: 공통 명령. 스모크: 대시보드 이사회 타일 표시, 승리 후 신임도 상승.

---

## P1-2. 경질 → 게임 오버 화면

**목표**: 지속적 실패에 실제 결말을 만든다.

**파일**: `src/lib/types/index.ts`, `src/lib/engine/matchFlow.ts`, `src/lib/engine/season.ts`, `src/lib/store/gameStore.ts`, 신규 `src/components/GameOverScreen.tsx`, `src/app/game/layout.tsx`, `src/lib/i18n/dict.ts`

**규칙**:
1. 타입: `GameState.gameOver?: { reason: "sacked"; day: number; season: number }`
2. 신임도를 바꾸는 모든 지점(P1-1의 경기 후 / 주간 / 시즌 말) 직후 공용 체크:
   ```ts
   if (state.board && state.board.confidence < 15 && state.day > 45 && !state.gameOver) {
     state.gameOver = { reason: "sacked", day: state.day, season: state.season };
     pushNews(state, { ko: "이사회가 감독을 경질했습니다", en: "The board has sacked the manager" });
   }
   ```
   (`day > 45` = 시즌 극초반 경질 방지 유예)
3. `continueGame` 최상단에 `if (state.gameOver) return state;` 추가 (`seasonOver`와 동일 패턴). `rolloverSeason`도 동일 가드.
4. `GameOverScreen`: 최종 성적(시즌, 리그 순위, W-D-L, 감독 평판) + "타이틀로" 버튼(타이틀 화면 라우트). **세이브는 삭제하지 않는다.** `src/app/game/layout.tsx`에서 `state.gameOver`면 자식 대신 이 화면을 렌더.

**i18n 키**: `sackedTitle: {ko:"경질되었습니다", en:"You have been sacked"}`, `finalRecord: {ko:"최종 성적", en:"Final record"}`, `backToTitle: {ko:"타이틀로", en:"Back to title"}`

**검증**: 실플레이로 재현이 어려우므로 **vitest 단위 테스트 필수**: 신임도 10, day 50 상태를 만들어 유저 경기 패배 처리 → `gameOver` 설정 확인 + `continueGame`이 상태를 더 진행시키지 않음 확인.

---

## P1-3. 역대 기록(Honours) + 시즌 수상

**목표**: 우승·득점왕·MVP가 롤오버 후에도 남는다.

**파일**: `src/lib/types/index.ts`, `src/lib/engine/season.ts`, 각 `src/lib/sports/*/index.ts`(SportModule에 `scoringEventTypes?: string[]` 추가), `src/app/game/competition/page.tsx`, `src/lib/i18n/dict.ts`

**모델**:
```ts
GameState.honours?: {
  season: number; competitionName: LocalizedText; championId: string;
  userRank: number | null;
  topScorer?: { playerId: string; name: string; count: number };
  mvp?: { playerId: string; name: string; avgRating: number };
}[];
```

**계산** — `continueGame`의 `seasonOver` 블록(정확히 1회 실행)에서:
1. **득점왕**: `competition.fixtures`의 `result.events` 중 `event.type ∈ sport.scoringEventTypes`(기본 `["goal"]`)이고 `playerId` 있는 것을 집계, 최다 선수(동률: 사전순 id). 각 종목 모듈에 선언 — 구현자는 해당 sim.ts를 grep해 실제 이벤트 타입 문자열을 확인할 것: 축구 `["goal"]`, 야구는 득점 이벤트 타입, 농구는 득점 이벤트 타입. 배구/피클볼처럼 랠리 단위라 소음이 크면 `[]`로 선언하고 득점왕 생략.
2. **MVP**: 5경기 이상 `playerRatings`에 등장한 선수 중 평균 평점 최고(동률: 출장 多 → id 사전순).
3. `honours` 배열에 append + 우승/수상 뉴스(`{ko:"득점왕: …", en:"Top scorer: …"}` 등).
4. `rolloverSeason`은 `structuredClone`이라 `honours`가 자동 보존됨 — 리셋하는 코드가 없는지만 확인.

**UI**: 대회 페이지에 "역대 기록" 타일 (시즌 / 우승팀 / 득점왕 / MVP 목록, 최신 우선).

**i18n 키**: `honours: {ko:"역대 기록", en:"Honours"}`, `topScorer: {ko:"득점왕", en:"Top Scorer"}`, `seasonMvp: {ko:"시즌 MVP", en:"Season MVP"}`, `championsLabel: {ko:"우승", en:"Champions"}`

**결정론**: 순수 집계, rng 미사용.

**검증**: 공통 명령. 스모크: 시즌 완주 → 롤오버 → 대회 페이지에 지난 시즌 기록 잔존.

---

## P1-4. 수입 현실화: 홈경기 수입 + 상금 + 승격 보너스

**목표**: 재정이 성적에 반응한다. 수입 공식 중복(`season.ts:69` vs `selectors/dashboard.ts:24-26`)도 이번에 단일화.

**파일**: 신규 `src/lib/engine/finance.ts`, `src/lib/engine/season.ts`, `src/lib/engine/matchFlow.ts`, `src/lib/selectors/dashboard.ts`, `src/lib/i18n/dict.ts`

**변경**:
1. **공식 단일화**: `finance.ts`에 `export function weeklyIncomeFor(club: Club, wageBill: number): number` — 새 공식 `Math.round(club.reputation * 1200 + wageBill * 0.10)` (기본 수입 축소분은 홈경기 수입이 메꾼다). `processWeeklyFinances`(season.ts:65-72)와 대시보드 셀렉터(dashboard.ts의 주간 수입 계산) **양쪽 모두** 이 함수를 import하도록 교체.
2. **홈경기 수입**: `finishMatch`에서 `recordResult` 이후 (모든 국내+파트너 경기 — 파트너 경로는 `playPartnerMatchesForDay`에서 직접 추가), 홈 클럽에:
   ```ts
   let gate = Math.round(home.reputation * 1500);
   if (home.id === state.manager.clubId) gate = Math.round(gate * (1 + (state.manager.reputation - 50) / 200));
   home.finances.balance += gate;
   ```
   (national 클럽은 `finances`가 의미 없으므로 기존 `isNational` 가드 패턴 확인 후 스킵.)
3. **상금** — `seasonOver` 블록: 리그면 순위 r(1-based), N팀 기준 모든 클럽에
   ```ts
   const prize = Math.round(3_000_000 * (N - r) / (N - 1) + 500_000);
   ```
   우승팀 추가 `+1_000_000`. 토너먼트면 우승 `3_000_000`, 준우승 `1_200_000`. 적용: `balance += prize; transferBudget += Math.round(prize * 0.5)`. 유저 클럽에는 뉴스.
4. **승격 보너스** — `rolloverSeason`의 `lastPromotions` 구성부(season.ts:175-178): 승격 클럽 `balance += 2_000_000`.

**i18n 키**: `matchdayIncome: {ko:"홈경기 수입", en:"Matchday income"}`, `prizeMoney: {ko:"상금", en:"Prize money"}`, `promotionBonus: {ko:"승격 보너스", en:"Promotion bonus"}` (재정 페이지에 내역을 노출한다면 사용)

**검증**: 공통 명령. `dashboard.test.ts`가 옛 수입 공식을 단언하면 새 수치로 재기준. 스모크: 재정 페이지 주간 순익이 홈/원정 주에 따라 달라짐.

---

## P1-5. 재정 압박: 주급 예산 집행 + 적자 페널티

**목표**: 마이너스 잔고와 주급 초과에 이빨을 단다.

**파일**: `src/lib/store/gameStore.ts`(`buyPlayer`), `src/lib/engine/season.ts`(`processWeeklyFinances`), `src/lib/types/index.ts`, `src/lib/i18n/dict.ts`

**규칙**:
1. 타입: `Finances`에 `debtWeeks?: number` 추가.
2. **주급 예산 집행** — `buyPlayer`의 이적료 잔고 체크 앞에:
   ```ts
   const wageBill = /* 기존 wageBill 계산 재사용 */;
   if (wageBill + player.wage > myClub.finances.wageBudget) { /* 실패 뉴스/토스트 후 return */ }
   ```
   실패 문구: `{ko:"주급 예산을 초과합니다", en:"This signing would exceed your wage budget"}`.
3. **적자 카운터** — `processWeeklyFinances`, **유저 클럽만**:
   ```ts
   f.debtWeeks = f.balance < 0 ? (f.debtWeeks ?? 0) + 1 : 0;
   ```
   - `debtWeeks === 2`: 경고 뉴스 + `board.confidence -= 5` (P1-1의 board가 있을 때).
   - `debtWeeks >= 4`: **강제 매각** — 스쿼드에서 `value` 최고 선수(동률: id 사전순; 스쿼드 유일 GK는 제외)를 `value * 0.8`에 매각(기존 `sellPlayer` 로직과 동일하게 스쿼드/라인업 제거 + 잔고 반영), 뉴스 `{ko:"이사회가 강제 매각을 단행했습니다: {이름}", en:"The board forced a sale: {name}"}`, `board.confidence -= 10`, `debtWeeks = 2`로 리셋.
   - 전 과정 결정적(rng 미사용).

**i18n 키**: `wageOverBudget: {ko:"주급 예산 초과", en:"Over wage budget"}`, `forcedSale: {ko:"강제 매각", en:"Forced sale"}`, `debtWarning: {ko:"재정 경고", en:"Financial warning"}`

**마이그레이션**: 이 시점에 `CURRENT_VERSION = 4` (P1-1 board 기본값 포함), `persistence.test.ts` 케이스 추가.

**검증**: 공통 명령 + 강제 매각 단위 테스트(잔고 음수 4주 → 최고가치 선수 매각). 스모크: 비싼 선수를 연달아 영입해 적자 → 4주 후 자동 매각 뉴스.

---

## P1 완료 조건

- [ ] 전 검증 명령 그린, `activeMatch.test.ts` 무수정 그린
- [ ] 대시보드에 이사회 목표+신임도 표시, 결과에 반응
- [ ] 신임도 <15 지속 시 경질 화면 (단위 테스트 포함)
- [ ] 시즌 완주 → 역대 기록에 우승/득점왕/MVP 적립·보존
- [ ] 홈경기/상금/승격 수입 반영, 수입 공식 단일화(중복 제거)
- [ ] 주급 예산 초과 영입 차단, 적자 4주 강제 매각
- [ ] `CURRENT_VERSION === 4`
- [ ] 커밋 메시지 예: `P1: board objectives, sacking, honours, performance-based income, financial pressure`
