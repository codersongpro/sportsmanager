import type { Locale, LocalizedText } from "@/lib/types";

// UI string dictionary. Each key maps to both supported languages.
// Domain text (club/competition names, news) is stored as LocalizedText on the
// data itself and rendered with `tl()`.

export const dict = {
  appTitle: { ko: "스포츠매니저", en: "Sports Manager" },
  tagline: {
    ko: "감독이 되어 팀을 정상으로 이끄세요",
    en: "Become a manager and lead your team to glory",
  },

  // menu
  newGame: { ko: "새 게임", en: "New Game" },
  continueGame: { ko: "이어하기", en: "Continue" },
  loadGame: { ko: "불러오기", en: "Load Game" },
  settings: { ko: "설정", en: "Settings" },
  language: { ko: "언어", en: "Language" },
  korean: { ko: "한국어", en: "Korean" },
  english: { ko: "영어", en: "English" },
  back: { ko: "뒤로", en: "Back" },
  next: { ko: "다음", en: "Next" },
  confirm: { ko: "확인", en: "Confirm" },
  cancel: { ko: "취소", en: "Cancel" },
  comingSoon: { ko: "곧 출시", en: "Coming soon" },

  // new game flow
  chooseSport: { ko: "종목 선택", en: "Choose a Sport" },
  chooseMode: { ko: "대회 모드 선택", en: "Choose Competition Mode" },
  chooseClub: { ko: "구단 선택", en: "Choose a Club" },
  managerProfile: { ko: "감독 프로필", en: "Manager Profile" },
  managerName: { ko: "감독 이름", en: "Manager Name" },
  startGame: { ko: "게임 시작", en: "Start Game" },
  leagueMode: { ko: "리그 모드", en: "League Mode" },
  tournamentMode: { ko: "챔피언십 (토너먼트)", en: "Championship (Knockout)" },
  leagueModeDesc: {
    ko: "홈&원정 풀리그. 승점을 쌓아 시즌 우승을 노립니다.",
    en: "Home & away round-robin. Earn points to win the season.",
  },
  tournamentModeDesc: {
    ko: "단판 토너먼트. 패하면 탈락, 결승에서 우승을 가립니다.",
    en: "Single-elimination knockout. Lose and you're out.",
  },

  // sports
  soccer: { ko: "축구", en: "Football" },
  baseball: { ko: "야구", en: "Baseball" },
  volleyball: { ko: "배구", en: "Volleyball" },
  pickleball: { ko: "피클볼", en: "Pickleball" },

  // nav
  dashboard: { ko: "대시보드", en: "Dashboard" },
  squad: { ko: "선수단", en: "Squad" },
  tactics: { ko: "전술", en: "Tactics" },
  training: { ko: "훈련", en: "Training" },
  finances: { ko: "재정", en: "Finances" },
  transfers: { ko: "이적", en: "Transfers" },
  competition: { ko: "대회", en: "Competition" },
  mainMenu: { ko: "메인 메뉴", en: "Main Menu" },

  // dashboard
  nextMatch: { ko: "다음 경기", en: "Next Match" },
  continueBtn: { ko: "계속하기", en: "Continue" },
  advanceToMatch: { ko: "다음 경기까지 진행", en: "Advance to next match" },
  leaguePosition: { ko: "리그 순위", en: "League Position" },
  nextRound: { ko: "다음 라운드", en: "Next Round" },
  news: { ko: "소식", en: "News" },
  noNews: { ko: "새 소식이 없습니다", en: "No news yet" },
  home: { ko: "홈", en: "Home" },
  away: { ko: "원정", en: "Away" },
  vs: { ko: "vs", en: "vs" },
  day: { ko: "일차", en: "Day" },
  season: { ko: "시즌", en: "Season" },
  seasonComplete: { ko: "시즌 종료", en: "Season Complete" },
  champion: { ko: "우승", en: "Champion" },
  startNewSeason: { ko: "새 시즌 시작", en: "Start New Season" },

  // squad / player
  name: { ko: "이름", en: "Name" },
  position: { ko: "포지션", en: "Pos" },
  age: { ko: "나이", en: "Age" },
  nationality: { ko: "국적", en: "Nat" },
  overall: { ko: "종합", en: "OVR" },
  potential: { ko: "잠재력", en: "POT" },
  value: { ko: "가치", en: "Value" },
  wage: { ko: "주급", en: "Wage" },
  morale: { ko: "사기", en: "Morale" },
  condition: { ko: "체력", en: "Cond" },
  form: { ko: "폼", en: "Form" },
  contract: { ko: "계약", en: "Contract" },
  attributes: { ko: "능력치", en: "Attributes" },
  injured: { ko: "부상", en: "Injured" },

  // tactics
  formation: { ko: "포메이션", en: "Formation" },
  mentality: { ko: "공격 성향", en: "Mentality" },
  tempo: { ko: "템포", en: "Tempo" },
  pressing: { ko: "압박", en: "Pressing" },
  width: { ko: "폭", en: "Width" },
  startingXI: { ko: "선발 라인업", en: "Starting XI" },
  bench: { ko: "벤치", en: "Bench" },
  autoPick: { ko: "자동 선발", en: "Auto Pick" },
  lineupValid: { ko: "라인업이 유효합니다", en: "Lineup is valid" },

  defensive: { ko: "수비적", en: "Defensive" },
  balanced: { ko: "균형", en: "Balanced" },
  attacking: { ko: "공격적", en: "Attacking" },
  slow: { ko: "느리게", en: "Slow" },
  normal: { ko: "보통", en: "Normal" },
  fast: { ko: "빠르게", en: "Fast" },
  low: { ko: "낮음", en: "Low" },
  medium: { ko: "중간", en: "Medium" },
  high: { ko: "높음", en: "High" },
  narrow: { ko: "좁게", en: "Narrow" },
  wide: { ko: "넓게", en: "Wide" },

  // training
  trainingFocus: { ko: "훈련 중점", en: "Training Focus" },
  applyTraining: { ko: "이번 주 훈련 적용", en: "Apply Weekly Training" },
  teamFocus: { ko: "팀 훈련 중점", en: "Team Training Focus" },
  fitnessReport: { ko: "체력 / 부상 현황", en: "Fitness & Injuries" },
  avgCondition: { ko: "평균 체력", en: "Avg Condition" },
  noInjuries: { ko: "부상자가 없습니다", en: "No injuries" },

  // finances
  balance: { ko: "잔고", en: "Balance" },
  transferBudget: { ko: "이적 예산", en: "Transfer Budget" },
  wageBudget: { ko: "주급 예산", en: "Wage Budget" },
  weeklyWages: { ko: "주간 임금 지출", en: "Weekly Wages" },
  income: { ko: "수입", en: "Income" },
  expenses: { ko: "지출", en: "Expenses" },

  // transfers
  transferMarket: { ko: "이적 시장", en: "Transfer Market" },
  freeAgents: { ko: "자유 계약", en: "Free Agents" },
  buy: { ko: "영입", en: "Buy" },
  sell: { ko: "방출", en: "Sell" },
  myClub: { ko: "내 구단", en: "My Club" },
  insufficientFunds: { ko: "예산이 부족합니다", en: "Insufficient funds" },
  signed: { ko: "영입 완료", en: "Signed" },
  sold: { ko: "방출 완료", en: "Sold" },
  fee: { ko: "이적료", en: "Fee" },
  managerReputation: { ko: "감독 평판", en: "Manager Reputation" },
  influence: { ko: "협상 영향력", en: "Negotiating Power" },
  signChance: { ko: "영입 가능성", en: "Sign Chance" },

  // form card
  recentForm: { ko: "최근 5경기", en: "Last 5 Matches" },
  avgRating: { ko: "평균 평점", en: "Avg Rating" },
  noForm: { ko: "최근 경기 기록이 없습니다", en: "No recent matches" },

  // press / media
  press: { ko: "미디어", en: "Media" },
  pressConference: { ko: "기자회견", en: "Press Conference" },
  noPress: { ko: "대기 중인 기자회견이 없습니다", en: "No press to attend" },
  pendingPress: { ko: "대기 중인 기자회견", en: "Pending press" },

  // competition / match
  played: { ko: "경기", en: "P" },
  won: { ko: "승", en: "W" },
  drawn: { ko: "무", en: "D" },
  lost: { ko: "패", en: "L" },
  goalsFor: { ko: "득점", en: "GF" },
  goalsAgainst: { ko: "실점", en: "GA" },
  goalDiff: { ko: "득실", en: "GD" },
  points: { ko: "승점", en: "Pts" },
  standings: { ko: "순위표", en: "Standings" },
  bracket: { ko: "대진표", en: "Bracket" },
  aclDirect: { ko: "ACL 직행", en: "Continental (direct)" },
  aclPlayoff: { ko: "ACL 플레이오프", en: "Continental (playoff)" },
  relegation: { ko: "강등권", en: "Relegation" },
  matchResult: { ko: "경기 결과", en: "Match Result" },
  matchStats: { ko: "경기 통계", en: "Match Stats" },
  matchEvents: { ko: "주요 이벤트", en: "Match Events" },
  possession: { ko: "점유율", en: "Possession" },
  shots: { ko: "슈팅", en: "Shots" },
  shotsOnTarget: { ko: "유효 슈팅", en: "On Target" },
  ratings: { ko: "선수 평점", en: "Player Ratings" },
  afterPenalties: { ko: "승부차기", en: "on penalties" },
  afterExtraTime: { ko: "연장전", en: "after extra time" },
  eliminated: { ko: "탈락", en: "Eliminated" },
  advanced: { ko: "진출", en: "Advanced" },
  viewResult: { ko: "결과 보기", en: "View Result" },
  events: { ko: "주요 장면", en: "Events" },

  // world cup
  worldCup: { ko: "월드컵", en: "World Cup" },
  worldCupDesc: {
    ko: "국가를 선택해 같은 선수단으로 구성된 월드컵 토너먼트를 시뮬레이션합니다.",
    en: "Pick a nation and simulate a World Cup knockout built from the same player pool.",
  },
  chooseNation: { ko: "국가 선택", en: "Choose a Nation" },
  startWorldCup: { ko: "월드컵 시작", en: "Start World Cup" },
  simulateRound: { ko: "라운드 시뮬레이션", en: "Simulate Round" },

  // live match viewer
  watchMatch: { ko: "경기 관전", en: "Watch Match" },
  live: { ko: "실시간", en: "LIVE" },
  play: { ko: "재생", en: "Play" },
  pause: { ko: "일시정지", en: "Pause" },
  restart: { ko: "처음부터", en: "Restart" },
  skipToEnd: { ko: "결과로 건너뛰기", en: "Skip to result" },
  speed: { ko: "배속", en: "Speed" },
  commentary: { ko: "중계", en: "Commentary" },
  momentum: { ko: "경기 흐름", en: "Momentum" },
  kickoff: { ko: "킥오프", en: "Kick-off" },
  halfTime: { ko: "하프타임", en: "Half Time" },
  fullTime: { ko: "경기 종료", en: "Full Time" },
  extraTime: { ko: "연장전", en: "Extra Time" },
  assist: { ko: "도움", en: "assist" },

  // match center (in-match intervention)
  matchCenter: { ko: "매치 센터", en: "Match Center" },
  continueMatchBtn: { ko: "경기 계속하기", en: "Continue Match" },
  phaseFirstHalf: { ko: "전반전", en: "First Half" },
  phaseSecondHalf: { ko: "후반전", en: "Second Half" },
  penaltyShootout: { ko: "승부차기", en: "Penalty Shootout" },
  decisionRecap: { ko: "경기 중 결정", en: "In-Match Decisions" },
  substitutionsTitle: { ko: "선수 교체", en: "Substitutions" },
  subsUsed: { ko: "사용한 교체", en: "Subs Used" },
  subOutLabel: { ko: "교체 아웃", en: "Sub Out" },
  subInLabel: { ko: "교체 인", en: "Sub In" },
  confirmSubBtn: { ko: "교체 실행", en: "Make Substitution" },
  noSubsRemaining: { ko: "교체 횟수를 모두 사용했습니다", en: "No substitutions remaining" },
  teamTalk: { ko: "팀토크", en: "Team Talk" },
  giveTeamTalkBtn: { ko: "팀토크 전달", en: "Give Team Talk" },
  teamTalkGivenNote: { ko: "이번 경기에서 팀토크를 사용했습니다", en: "You've given your team talk this match" },
  teamTalkHalftimeOnly: { ko: "하프타임 이후 사용할 수 있습니다", en: "Available from half-time onward" },
  tacticalAdvice: { ko: "감독 조언", en: "Tactical Advice" },
  noAdvice: { ko: "특별한 조언이 없습니다", en: "No advice at this time" },
  tacticChangesCount: { ko: "전술 변경", en: "Tactic Changes" },
  viewFullReplay: { ko: "전체 리플레이 보기", en: "Watch Full Replay" },
  backToDashboard: { ko: "대시보드로 돌아가기", en: "Back to Dashboard" },
  noMatchInProgress: { ko: "진행 중인 경기가 없습니다", en: "No match in progress" },
  selectPlayer: { ko: "선수 선택", en: "Select player" },

  // event labels
  evGoal: { ko: "골", en: "GOAL" },
  evSave: { ko: "선방", en: "Save" },
  evMiss: { ko: "빗나간 슛", en: "Off target" },
  evWoodwork: { ko: "골대", en: "Woodwork" },
  evCorner: { ko: "코너킥", en: "Corner" },
  evFreekick: { ko: "프리킥", en: "Free kick" },
  evFoul: { ko: "파울", en: "Foul" },
  evOffside: { ko: "오프사이드", en: "Offside" },
  evChance: { ko: "기회", en: "Chance" },
  evSub: { ko: "교체", en: "Substitution" },
  playstyles: { ko: "플레이스타일", en: "Playstyles" },

  // misc
  goal: { ko: "골", en: "Goal" },
  yellowCard: { ko: "경고", en: "Yellow Card" },
  redCard: { ko: "퇴장", en: "Red Card" },
  injury: { ko: "부상", en: "Injury" },
  noSavedGame: { ko: "저장된 게임이 없습니다", en: "No saved game found" },
  deleteSave: { ko: "세이브 삭제", en: "Delete Save" },

  // dashboard (design system)
  seasonStatus: { ko: "시즌 현황", en: "Season Status" },
  inbox: { ko: "받은 메시지", en: "Inbox" },
  topPerformers: { ko: "이 달의 핵심 선수", en: "Top Performers" },
  viewStandings: { ko: "순위표", en: "Standings" },
  viewFullSquad: { ko: "전체 스쿼드", en: "Full Squad" },
  startMatch: { ko: "경기 시작", en: "Start Match" },
  checkTactics: { ko: "전술 점검", en: "Check Tactics" },
  unbeaten: { ko: "무패", en: "Unbeaten" },
  rating: { ko: "평점", en: "Rating" },
  newCount: { ko: "건 신규", en: "new" },
  noFixturesLeft: { ko: "남은 경기가 없습니다", en: "No fixtures remaining" },
  urgentAlerts: { ko: "긴급 알림", en: "Urgent Alerts" },
  teamStatus: { ko: "팀 상태", en: "Team Status" },
  metricMorale: { ko: "사기", en: "Morale" },
  metricCondition: { ko: "체력", en: "Condition" },
  metricForm: { ko: "최근 폼", en: "Recent Form" },
  metricRank: { ko: "순위", en: "Rank" },
  metricReputation: { ko: "감독 평판", en: "Reputation" },
  todaysTasks: { ko: "오늘의 할 일", en: "Today's Tasks" },
  noTasks: { ko: "처리할 작업이 없습니다", en: "Nothing needs your attention" },
  financeSummary: { ko: "재정 요약", en: "Finance Summary" },
  netWeekly: { ko: "주간 순수익", en: "Net Weekly" },
  viewFinances: { ko: "재정 보기", en: "View Finances" },

  // squad page (design system)
  all: { ko: "전체", en: "All" },
  avgAge: { ko: "평균 연령", en: "Avg Age" },
  squadValue: { ko: "스쿼드 가치", en: "Squad Value" },

  // player detail page (design system)
  contractInfo: { ko: "계약 정보", en: "Contract Info" },
  marketValue: { ko: "시장 가치", en: "Market Value" },
  contractExpiry: { ko: "계약 만료", en: "Contract Expiry" },
  seasonRecord: { ko: "이번 시즌 기록", en: "Season Record" },
  attrExcellent: { ko: "우수", en: "Strong" },
  attrGood: { ko: "양호", en: "Decent" },
  attrWeak: { ko: "약점", en: "Weak" },

  // tactics page (design system)
  teamInstructions: { ko: "팀 지시사항", en: "Team Instructions" },
  lineupValidity: { ko: "라인업 유효성", en: "Lineup Validity" },

  // transfers page (design system)
  wageHeadroom: { ko: "주급 여유분", en: "Wage Headroom" },
  candidateCount: { ko: "영입 후보", en: "Targets" },
  squadSize: { ko: "보유 선수", en: "Squad Size" },
  available: { ko: "가능", en: "Available" },
  overBudget: { ko: "예산 부족", en: "Over Budget" },
  scoutTargets: { ko: "스카우트 영입 후보", en: "Scouted Targets" },
  club: { ko: "소속", en: "Club" },
} satisfies Record<string, LocalizedText>;

export type DictKey = keyof typeof dict;

export function translate(key: DictKey, locale: Locale): string {
  return dict[key][locale];
}

export function localized(text: LocalizedText, locale: Locale): string {
  return text[locale];
}
