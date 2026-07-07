# P0 작업지시서 — 죽은 시스템 소생 + 결정론 버그 수정 (8건)

> 실행 모델을 위한 지시서. **P0-1부터 번호 순서대로** 구현할 것. 각 작업 완료 시 검증 명령을 통과시킨 뒤 다음 작업으로 넘어간다. 배경 진단은 [00-analysis.md](./00-analysis.md) 참조.

## 공통 규칙 (모든 작업에 적용 — 위반 시 테스트가 깨진다)

1. **결정론**: 모든 난수는 스레딩된 시드 RNG만 사용한다. 패턴: `const rng = createRng(state.rngState)` → 사용 → `next.rngState = rng.state()` 저장. 게임 로직 안에서 `Math.random()`, `Date.now()` **금지** (`updatedAt` 갱신만 예외).
2. **세그먼트 패리티**: 유저 경기(`advanceActiveMatch`, `src/lib/engine/activeMatch.ts:45`)와 AI 일괄 경기(`sport.simulateMatch`)는 같은 시드에서 같은 결과·같은 rng 소비량이어야 한다. 경기 후 처리에서 rng를 소비해야 한다면 **양 경로에서 정확히 1회씩 호출되는 `finishMatch`(`src/lib/engine/matchFlow.ts:70`) 안에서만** 소비한다.
3. **세이브 마이그레이션**: `GameState`에 필드를 추가하는 단계가 끝나면 `src/lib/store/persistence.ts:6`의 `CURRENT_VERSION`을 올리고(P0 완료 시 `2 → 3`) `migrate()`에 기본값 채움 로직을 추가한다. `src/lib/store/persistence.test.ts`에 케이스를 추가한다.
4. **i18n**: 새 UI 문자열은 반드시 `src/lib/i18n/dict.ts`에 `ko`/`en` 쌍으로 추가하고 `t("키")`로 사용한다. 엔진이 생성하는 텍스트(뉴스 등)는 기존 방식대로 인라인 `LocalizedText`(`{ko, en}`) 객체를 쓴다.
5. **작업당 검증**: `npx tsc --noEmit && npm run lint && npx vitest run && npm run build` 모두 그린 + 각 작업에 명시된 스모크 확인.
6. **테스트 영향표**:

| 테스트 파일 | 영향 |
|---|---|
| `src/lib/engine/activeMatch.test.ts` | **절대 재기준 금지.** rngState 패리티 단언이 카나리아 — 깨지면 내 코드가 양 경로에서 rng를 다르게 소비한 것 |
| `src/lib/sports/soccer/sim.test.ts` | P0-7에서 조합(composition) 테스트만 재기준 필요 |
| `src/lib/engine/season.test.ts`, `press_form.test.ts` | 시드 기반 재계산이므로 그린 유지가 원칙. 시뮬 반복 횟수 가드가 부족해지면 가드 수치만 올릴 것 |
| `src/lib/selectors/dashboard.test.ts` | P0-3 이후 컨디션 고정값 단언이 있으면 재기준 |
| `src/lib/store/persistence.test.ts` | P0-8에서 v3 마이그레이션 케이스 추가 |

---

## P0-1. `Math.random()` / `Date.now()` id 제거 (결정론 복구)

**목표**: 이적 협상 결과가 시드에서 재현되도록 복구.

**파일**: `src/lib/store/gameStore.ts`

**변경**:
1. `buyPlayer`(line ~270)의 `if (Math.random() > prob)` 를 시드 rng로 교체:
   ```ts
   import { createRng } from "@/lib/sim/rng"; // 상단 import에 추가 (이미 있으면 생략)
   // structuredClone 이후:
   const rng = createRng(next.rngState);
   const rejected = rng.next() > prob;
   // 성공/실패 "양쪽" 분기 모두에서 반드시:
   next.rngState = rng.state();
   ```
2. 뉴스 id의 `Date.now()` 제거:
   - `gameStore.ts:271` `` `n_t${Date.now()}` `` → `` `n_t${next.day}_${playerId}_r` `` (협상 결렬)
   - `gameStore.ts:286` `` `n_t${Date.now()}` `` → `` `n_t${next.day}_${playerId}` `` (영입 완료)
   - `gameStore.ts:329` `` `n_p${Date.now()}` `` → `` `n_p${next.day}_${itemId}` `` (`answerPress`)
   - `next.updatedAt = Date.now()`는 그대로 둔다 (게임 로직이 아님).

**검증**: 공통 명령 + vitest 그린. 스모크: 같은 세이브에서 같은 선수를 두 번 영입 시도하면(새로고침 후 재시도) 동일한 결과가 나와야 함.

---

## P0-2. `finishMatch`에 rng 스레딩 + 경기 후 선수 효과 공용 훅 신설

**목표**: 이후 P0-3/5/6이 얹힐 단일 훅을 만든다. 이 작업 자체는 동작 무변경(훅은 빈 함수).

**파일**: `src/lib/engine/matchFlow.ts`, `src/lib/engine/season.ts`, `src/lib/engine/activeMatch.ts`

**변경**:
1. `finishMatch` 시그니처에 rng 추가 (`matchFlow.ts:70`):
   ```ts
   import type { RNG } from "@/lib/sim/rng";
   export function finishMatch(state, comp, fixtureId, home, away, homeTeam, awayTeam, result, rng: RNG)
   ```
   호출부 3곳 수정 — 모두 이미 `rng`를 들고 있다: `season.ts:38`, `activeMatch.ts:90`, `activeMatch.ts:101`. 다른 호출부가 없는지 `finishMatch(`로 grep 확인.
2. 공용 훅 추가 (matchFlow.ts, export):
   ```ts
   /** 경기 후 선수 상태 갱신(컨디션/모랄/부상). 양 시뮬 경로에서 경기당 정확히 1회 호출. */
   export function applyPostMatchPlayerEffects(
     state: GameState, homeTeam: MatchTeam, awayTeam: MatchTeam,
     result: MatchResult, day: number, rng: RNG,
   ) { /* P0-3/5/6에서 채움 */ }
   ```
3. `finishMatch` 안에서 `recordForm` 두 호출 직후에 부른다. 단, **국내 경기에서만**:
   ```ts
   if (comp.id === state.competition.id) {
     applyPostMatchPlayerEffects(state, homeTeam, awayTeam, result, state.day, rng);
   }
   ```
   이유: `finishMatch`는 월드컵/클럽컵 유저 경기에서도 호출되는데(`activeMatch.ts`의 scope 분기), 그 대회의 AI 경기는 `worldcup.ts`의 원자 시뮬 경로라 `finishMatch`를 타지 않는다. 컵에서도 효과를 적용하면 유저 팀만 피로해지는 비대칭이 생기므로 국내 리그로 한정한다. `worldcup.ts`는 **건드리지 않는다**.
4. 파트너(2부) 리그도 같은 효과를 받도록 `playPartnerMatchesForDay`(`season.ts:43-63`)의 `recordForm` 두 호출 뒤에 직접 호출:
   ```ts
   applyPostMatchPlayerEffects(state, homeTeam, awayTeam, result, state.day, rng);
   ```

**결정론 주의**: 훅이 비어 있으므로 이 단계에서 rng 소비량 불변 → 모든 테스트가 **수정 없이** 그린이어야 한다. 깨지면 잘못 배선한 것.

**검증**: 공통 명령 전부 그린 (재기준 없이).

---

## P0-3. 컨디션: 경기 피로 + 일일 회복

**목표**: `player.condition`을 살아있는 자원으로 만들어 로테이션이 의미를 갖게 한다. 동결돼 있던 시뮬의 0.80–1.00 컨디션 항(`simutil.ts:36`)이 활성화된다.

**파일**: `src/lib/engine/matchFlow.ts`(`applyPostMatchPlayerEffects`), `src/lib/engine/season.ts`(`continueGame`)

**공식 (정확히 이 수치로)**:
1. **경기 후 피로** — `applyPostMatchPlayerEffects` 안에서, 홈/원정 라인업의 모든 선수:
   ```ts
   const cost = Math.min(32, Math.max(16, 19 + (p.age - 23) * 0.7));
   p.condition = Math.max(5, Math.min(100, p.condition - cost));
   ```
   rng 사용 금지 (결정적).
2. **일일 회복** — `continueGame`(`season.ts:101` while 루프)의 `next.day += 1` 직후, 경기 처리 **전에**, `next.players`의 모든 선수:
   ```ts
   let rate = p.age <= 29 ? 4.5 : 3.5;
   const injured = p.injuredUntilDay != null && p.injuredUntilDay > next.day;
   if (injured) rate *= 0.5;
   p.condition = Math.min(injured ? 85 : 100, p.condition + rate);
   ```
   rng 사용 금지. (`injuredUntilDay`는 P0-5 전까지 항상 undefined → injured 분기는 그때까지 죽은 분기지만 미리 넣어둔다.)

**기대 효과**: 주 1경기면 거의 완전 회복. 컵 병행/연전 시 체력이 깎이고, 대시보드 "선발 체력 저하" 경고(`dashboard.ts:113`, 임계 60)와 훈련 페이지 컨디션 바가 처음으로 움직인다.

**검증**: 공통 명령. `dashboard.test.ts`가 컨디션 고정값을 단언하면 재기준. 스모크: 3경기 진행 → 스쿼드 페이지에서 경기일에 컨디션 하락, "계속" 사이에 회복 확인.

---

## P0-4. 수치 폼을 `recentForm`에서 파생

**목표**: 죽어 있던 ±9% 폼 항(`simutil.ts:37`) 활성화.

**파일**: `src/lib/engine/matchFlow.ts`(`recordForm`, line 25)

**변경**: `recordForm`의 per-player 루프에서, 6개 트림 직후에:
```ts
const avg = form.reduce((s, e) => s + e.rating, 0) / form.length;
p.form = Math.max(-5, Math.min(5, Math.round((avg - 6.5) * 2.2)));
```
rng 사용 금지. `recordForm`은 양 경로 + 파트너 리그에서 모두 호출되므로 이것만으로 전 리그에 폼이 살아난다.

**검증**: 공통 명령. 스모크: 몇 경기 후 스쿼드 페이지 폼 수치가 0이 아니고 최근 평점과 방향이 일치.

---

## P0-5. 부상: 발생 → 라인업 제외 → UI 표시

**목표**: `injuredUntilDay`가 실제로 쓰이게 하고, 영구 공백이던 부상자 UI(훈련 페이지 목록, 대시보드 경고 `dashboard.ts:100`)를 살린다.

**파일**: `src/lib/engine/matchFlow.ts`, `src/lib/engine/season.ts`, `src/lib/store/gameStore.ts`, `src/components/LineupBoard.tsx`, `src/lib/i18n/dict.ts`

**변경**:
1. **경기 중 부상 확정** — `applyPostMatchPlayerEffects` 안에서 `result.events`를 스캔해 `type === "injury"`이고 `playerId`가 있는 이벤트마다:
   ```ts
   const days = 4 + rng.int(0, 17); // 4~21일
   p.injuredUntilDay = day + days;
   p.condition = Math.max(30, p.condition - 25);
   ```
   해당 선수가 유저 클럽 소속이면 `pushNews(state, { ko: `${이름} 부상 (약 ${days}일 결장)`, en: `${name} injured (~${days} days out)` })`. 이름은 한국어 뉴스에 `p.nameKo ?? p.name` 패턴(기존 뉴스 코드 참조).
2. **훈련 부상 롤** — `applyWeeklyTraining`(`season.ts:74-83`)에서 선수별 `trainPlayer` 호출 뒤:
   ```ts
   if (!(p.injuredUntilDay != null && p.injuredUntilDay > state.day) && rng.bool(0.008)) {
     p.injuredUntilDay = state.day + 3 + rng.int(0, 11);
     // 유저 클럽이면 pushNews (위와 같은 형식, "훈련 중 부상")
   }
   ```
   이것이 부상 이벤트가 없는 비축구 4종목의 부상 공급원이 된다.
3. **선발에서 제외** — `resolveTeam`(`matchFlow.ts:6`)에 `day` 파라미터 추가:
   ```ts
   export function resolveTeam(club, players, sport, day: number): MatchTeam {
     const healthy = (id: string) => { const p = players[id]; return p && !(p.injuredUntilDay != null && p.injuredUntilDay > day); };
     let ids = club.tactics.lineup.filter(healthy);
     if (ids.length < 11) {
       const eligible = Object.fromEntries(Object.entries(players).filter(([id]) => !club.squad.includes(id) || healthy(id)));
       ids = sport.autoPickLineup(club, eligible).lineup.filter(healthy);
       if (ids.length < club.tactics.lineup.length) ids = sport.autoPickLineup(club, players).lineup; // 집단 부상 폴백
     }
     return { club, lineup: ids.map((id) => players[id]) };
   }
   ```
   호출부 전체에 `state.day` 전달: `season.ts:30-31`(playMatchesForDay), `season.ts:52-53`(playPartnerMatchesForDay), `activeMatch.ts:61-62`. `resolveTeam(`으로 grep해 누락 확인.
4. **UI 가드** — `LineupBoard`(및 전술 페이지)에서 부상 선수에 배지(`🩹 {t("injuredBadge")} D-N`) 표시, 선발 슬롯 배치 차단. `gameStore.makeSubstitution`에서 부상 선수 투입 거부.

**i18n 키**: `injuredBadge: { ko: "부상", en: "Injured" }`, `daysOut: { ko: "일 결장", en: "days out" }`

**결정론 주의**: 1은 `finishMatch` 안(양 경로 1회)이라 안전. 2는 시즌 rng에서 주당 선수당 1 draw — 양 경로와 무관하므로 안전. **`rng.bool` 호출을 조건문 뒤에 두지 말 것** — 위 코드처럼 부상 중이 아닐 때만 굴리면 draw 수가 상태에 따라 달라지지만, 이는 단일 시즌 rng 스트림이므로 문제없다 (패리티는 경기 시뮬에만 요구됨).

**검증**: 공통 명령. `season.test.ts`/`press_form.test.ts`는 시드 재계산이므로 그린 유지 원칙(반복 가드 부족 시 가드만 상향). 스모크: 시즌 절반쯤 시뮬 → 훈련 페이지 부상자 목록에 항목 발생, 부상 선발이 경기일에 자동 교체되는지 확인.

---

## P0-6. 모랄: 승패 + 연승/연패 + 주간 감쇠

**목표**: 모랄이 경기장 위 현실을 반영하게 한다 (언론 답변 전용 탈피).

**파일**: `src/lib/engine/matchFlow.ts`(`applyPostMatchPlayerEffects`), `src/lib/engine/season.ts`

**공식**:
1. **경기 후** — 양 클럽의 **전체 스쿼드**(라인업만이 아님) 대상: 승 `+4`, 무 `+0`, 패 `−4`. 연속 보너스: 해당 클럽의 이 대회 최근 3경기(방금 경기 포함, `comp.fixtures`에서 played 항목을 day 순 정렬로 도출)가 3연승이면 추가 `+2`, 3연패면 추가 `−2`. `Math.max(0, Math.min(100, …))` 클램프. rng 사용 금지.
2. **주간 감쇠** — `season.ts`에 `processWeeklyUpkeep(state: GameState)` 신설, `continueGame`의 주간 블록(`season.ts:105-108`)에서 `processWeeklyFinances` 옆에 호출. 모든 선수:
   ```ts
   p.morale = Math.round((p.morale + (55 - p.morale) * 0.10) * 10) / 10;
   ```

**검증**: 공통 명령. 스모크: 대시보드 모랄 지표가 승패에 반응하고, 연승 시 70 이상으로 상승.

---

## P0-7. 퇴장 페널티 (축구): 10명은 10명답게

**목표**: 레드카드가 남은 세그먼트의 팀 전력을 깎는다. 양 시뮬 경로 동일 적용.

**파일**: `src/lib/types/index.ts`, `src/lib/sports/soccer/sim.ts`, `src/lib/engine/activeMatch.ts`, `src/lib/sports/soccer/sim.test.ts`

**변경**:
1. `SimOptions`에 `sentOffIds?: string[]` 추가.
2. `soccer/sim.ts`의 `teamPower`에 `sentOffIds?: string[]` 파라미터 추가: 라인업 순회 시 `sentOffIds.includes(p.id)`인 선수를 **모든 집계에서 제외**하고, 그 팀에서 제외된 수가 `n > 0`이면 마지막에:
   ```ts
   attackPower *= Math.pow(0.86, n);
   defPower *= Math.pow(0.90, n);
   ```
   `simulateSegment`의 두 `teamPower` 호출에 `opts?.sentOffIds` 전달 (홈 선수의 퇴장은 홈 전력에만 영향 — id로 자연히 구분됨).
3. `simulateMatch`(sim.ts 말미의 세그먼트 루프): 각 세그먼트 종료 후 누적:
   ```ts
   const sentOffIds = segments.flatMap((s) => s.result.events.filter((e) => e.type === "red" && e.playerId).map((e) => e.playerId!));
   ```
   다음 `simulateSegment` 호출에 `{ ...opts, sentOffIds }` 전달.
4. `advanceActiveMatch`(`activeMatch.ts:74`): `sport.simulateSegment` 호출 **직전에** `nextActive.segments`에서 **3과 완전히 동일한 식**으로 `sentOffIds`를 계산해 `{ ...nextActive.opts, sentOffIds }`로 전달. `nextActive.opts`에 **저장하지 말 것** (저장하면 세이브 반복 로드 시 중복 누적 위험 + 패리티 검증이 흐려짐).
5. **테스트 재기준**: `soccer/sim.test.ts`의 조합 테스트("simulateMatch = simulateSegment 조합")는 수동 세그먼트 루프를 돌리므로, 그 루프에도 세그먼트 사이에 동일한 `sentOffIds` 계산을 넣어야 다시 일치한다.

**검증**: 공통 명령 (특히 `activeMatch.test.ts` 그린 = 패리티 확인). 퇴장은 희귀 이벤트라 스모크 불가 — 테스트로 갈음.

---

## P0-8. 주간 훈련 리포트 (가시적 성장 피드백) + 세이브 v3

**목표**: 무음이던 주간 훈련이 "누가 얼마나 성장했는지"를 보여준다.

**파일**: `src/lib/types/index.ts`, `src/lib/engine/season.ts`(`applyWeeklyTraining`), `src/app/game/training/page.tsx`, `src/lib/store/persistence.ts`, `src/lib/store/persistence.test.ts`, `src/lib/i18n/dict.ts`

**변경**:
1. 타입 추가:
   ```ts
   // GameState에
   lastTrainingReport?: { day: number; focus: string; entries: { playerId: string; ovrBefore: number; ovrAfter: number }[] };
   ```
2. `applyWeeklyTraining`에서 **유저 클럽만**: 선수별 `sport.calcOverall(p)`를 `trainPlayer` 전/후로 기록. `ovrAfter - ovrBefore >= 0.05`인 항목을 내림차순 상위 8개까지 `state.lastTrainingReport = { day: state.day, focus, entries }`로 저장(매주 덮어씀). 델타 `>= 0.5`인 선수가 있으면 `pushNews(state, { ko: `훈련 성과: ${이름} 급성장 (+${d.toFixed(1)})`, en: `Training: ${name} improving fast (+${d.toFixed(1)})` })`.
3. 훈련 페이지에 "주간 훈련 리포트" 타일: 선수명 + `+Δ OVR`(초록) + 사용한 포커스. 리포트 없으면 빈 상태 문구.
4. `persistence.ts`: `CURRENT_VERSION = 3`. `migrate()`는 기존 패턴대로 버전만 올리면 됨(신규 필드는 optional이라 기본값 불필요). `persistence.test.ts`에 v2 세이브 → v3 마이그레이션 케이스 추가.

**i18n 키**: `weeklyTrainingReport: { ko: "주간 훈련 리포트", en: "Weekly Training Report" }`, `noTrainingReport: { ko: "아직 훈련 리포트가 없습니다", en: "No training report yet" }`

**검증**: 공통 명령. 스모크: 주 경계를 넘겨 "계속" → 훈련 페이지 리포트 타일 채워짐.

---

## P0 완료 조건

- [ ] `tsc`/`lint`/`vitest`/`build` 전부 그린, `activeMatch.test.ts` 무수정 그린
- [ ] 스쿼드 페이지에서 컨디션·폼이 경기/시간에 따라 움직임
- [ ] 부상자 목록·경고가 실제로 발생하고 부상자는 선발 제외
- [ ] 모랄이 승패·연승에 반응
- [ ] 훈련 리포트 타일 표시
- [ ] `CURRENT_VERSION === 3`, 구버전 세이브 로드 정상
- [ ] 커밋 메시지 예: `P0: revive condition/form/injury/morale systems, red-card penalty, determinism fixes`
