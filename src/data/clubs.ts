import type { LocalizedText, SportId } from "@/lib/types";

// 64 clubs across 8 domestic leagues. Names are city/nickname aliases (not real
// club trademarks). Reputation (69-91) drives squad quality and seeding.

export interface LeagueSeed {
  id: string;
  name: LocalizedText;
  country: string;
  /** promotion/relegation tier, 1 = top flight; defaults to 1 when absent */
  tier?: number;
  /** id shared by every tier of the same division, for promotion/relegation pairing */
  divisionId?: string;
}

export interface ClubSeed {
  id: string;
  name: LocalizedText;
  short: string;
  leagueId: string;
  country: string;
  reputation: number;
  color: string;
}

const LEAGUES_TIER1: LeagueSeed[] = [
  { id: "eng", name: { ko: "잉글랜드 프리미어", en: "England Premier" }, country: "EN" },
  { id: "esp", name: { ko: "스페인 프리메라", en: "Spain Primera" }, country: "ES" },
  { id: "ger", name: { ko: "독일 분데스", en: "Germany Bundes" }, country: "DE" },
  { id: "ita", name: { ko: "이탈리아 세리에", en: "Italy Serie" }, country: "IT" },
  { id: "fra", name: { ko: "프랑스 리그", en: "France Ligue" }, country: "FR" },
  { id: "por", name: { ko: "포르투갈 프리메이라", en: "Portugal Primeira" }, country: "PT" },
  { id: "ned", name: { ko: "네덜란드 에레디비", en: "Netherlands Eredivisie" }, country: "NL" },
  { id: "kor", name: { ko: "K리그", en: "K League" }, country: "KR" },
];

function c(
  id: string,
  ko: string,
  en: string,
  short: string,
  leagueId: string,
  country: string,
  reputation: number,
  color: string,
): ClubSeed {
  return { id, name: { ko, en }, short, leagueId, country, reputation, color };
}

// ---------------------------------------------------------------------------
// Procedural second tier: every league above gets a "Division 2" sibling for
// promotion/relegation, built from generic town+suffix combinations rather
// than hand-authored names. 16 towns x 8 suffixes = 128 unique combos, which
// exactly covers every league's 8-club second tier across all 5 sports.
// ---------------------------------------------------------------------------

const TIER2_TOWNS: { en: string; ko: string }[] = [
  { en: "Ashford", ko: "애쉬포드" },
  { en: "Brightmoor", ko: "브라이트무어" },
  { en: "Clayton", ko: "클레이턴" },
  { en: "Dunmore", ko: "던모어" },
  { en: "Elmridge", ko: "엘름리지" },
  { en: "Fairview", ko: "페어뷰" },
  { en: "Greenhill", ko: "그린힐" },
  { en: "Hartley", ko: "하틀리" },
  { en: "Ironwood", ko: "아이언우드" },
  { en: "Kingsley", ko: "킹슬리" },
  { en: "Lakeside", ko: "레이크사이드" },
  { en: "Millbrook", ko: "밀브룩" },
  { en: "Norwood", ko: "노어우드" },
  { en: "Oakdale", ko: "오크데일" },
  { en: "Pinehurst", ko: "파인허스트" },
  { en: "Queensbury", ko: "퀸즈버리" },
];

const TIER2_SUFFIXES: { en: string; ko: string }[] = [
  { en: "Rovers", ko: "로버스" },
  { en: "Athletic", ko: "애슬레틱" },
  { en: "United", ko: "유나이티드" },
  { en: "Town", ko: "타운" },
  { en: "Wanderers", ko: "원더러스" },
  { en: "City", ko: "시티" },
  { en: "Albion", ko: "알비온" },
  { en: "Rangers", ko: "레인저스" },
];

const TIER2_COLORS = ["#5B6B73", "#7A8450", "#8C5E58", "#4F6D7A", "#7D5A75", "#5C8374", "#8A6D3B", "#516072"];

let tier2Counter = 0;

function genSecondTierClubs(tier1Clubs: ClubSeed[], tier2LeagueId: string, country: string): ClubSeed[] {
  const avgRep = Math.round(tier1Clubs.reduce((s, cl) => s + cl.reputation, 0) / tier1Clubs.length);
  return tier1Clubs.map((_, i) => {
    const counter = tier2Counter++;
    const town = TIER2_TOWNS[counter % TIER2_TOWNS.length];
    const suffix = TIER2_SUFFIXES[Math.floor(counter / TIER2_TOWNS.length) % TIER2_SUFFIXES.length];
    const color = TIER2_COLORS[counter % TIER2_COLORS.length];
    const reputation = Math.max(45, Math.min(99, avgRep - 14 - i));
    return c(
      `${tier2LeagueId}-${i}`,
      `${town.ko} ${suffix.ko}`,
      `${town.en} ${suffix.en}`,
      (town.en.slice(0, 2) + suffix.en.slice(0, 1)).toUpperCase(),
      tier2LeagueId,
      country,
      reputation,
      color,
    );
  });
}

/** Tags every league as tier 1 and appends a generated tier-2 sibling division for promotion/relegation. */
function expandWithTiers(leagues: LeagueSeed[], clubs: ClubSeed[]): { leagues: LeagueSeed[]; clubs: ClubSeed[] } {
  const outLeagues: LeagueSeed[] = [];
  const outClubs: ClubSeed[] = [...clubs];
  for (const league of leagues) {
    outLeagues.push({ ...league, tier: 1, divisionId: league.id });
    const tier1Clubs = clubs.filter((cl) => cl.leagueId === league.id);
    const tier2Id = `${league.id}-2`;
    outLeagues.push({
      id: tier2Id,
      name: { ko: `${league.name.ko} 2부`, en: `${league.name.en} Division 2` },
      country: league.country,
      tier: 2,
      divisionId: league.id,
    });
    outClubs.push(...genSecondTierClubs(tier1Clubs, tier2Id, league.country));
  }
  return { leagues: outLeagues, clubs: outClubs };
}

const CLUBS_TIER1: ClubSeed[] = [
  // England
  c("eng-skyblue", "맨체스터 스카이", "Manchester Sky", "MCS", "eng", "EN", 90, "#6CABDD"),
  c("eng-merseyred", "머지사이드 레즈", "Merseyside Reds", "MSR", "eng", "EN", 89, "#C8102E"),
  c("eng-cannons", "런던 캐넌스", "London Cannons", "LCN", "eng", "EN", 88, "#EF0107"),
  c("eng-crimson", "맨체스터 크림슨", "Manchester Crimson", "MCR", "eng", "EN", 83, "#DA291C"),
  c("eng-blues", "런던 블루스", "London Blues", "LBL", "eng", "EN", 83, "#034694"),
  c("eng-spurs", "노스 런던 스퍼스", "North London Spurs", "NLS", "eng", "EN", 82, "#132257"),
  c("eng-magpies", "타인사이드 맥파이", "Tyneside Magpies", "TYM", "eng", "EN", 80, "#241F20"),
  c("eng-villans", "미들랜즈 빌런스", "Midlands Villans", "MDV", "eng", "EN", 79, "#670E36"),
  // Spain
  c("esp-whites", "마드리드 화이트", "Madrid Whites", "MDW", "esp", "ES", 91, "#FEBE10"),
  c("esp-blaugrana", "카탈루냐 블라우그라나", "Catalonia Blaugrana", "CAB", "esp", "ES", 89, "#A50044"),
  c("esp-rojiblanco", "마드리드 로히블랑코", "Madrid Rojiblanco", "MDR", "esp", "ES", 85, "#CB3524"),
  c("esp-txuriurdin", "바스크 추리우르딘", "Basque Txuri-Urdin", "BTU", "esp", "ES", 80, "#0067B1"),
  c("esp-lions", "바스크 라이온스", "Basque Lions", "BLN", "esp", "ES", 79, "#EE2523"),
  c("esp-submarine", "비야레알 서브마린", "Villarreal Submarine", "VSM", "esp", "ES", 78, "#FFE667"),
  c("esp-nervion", "안달루시아 네르비온", "Andalusia Nervion", "ANV", "esp", "ES", 78, "#D00027"),
  c("esp-bats", "발렌시아 배츠", "Valencia Bats", "VBT", "esp", "ES", 76, "#F18E00"),
  // Germany
  c("ger-bavaria", "바이에른 레즈", "Bavaria Reds", "BVR", "ger", "DE", 90, "#DC052D"),
  c("ger-aspirin", "라인 아스피린", "Rhine Aspirin", "RAS", "ger", "DE", 86, "#E32219"),
  c("ger-yellows", "루르 옐로스", "Ruhr Yellows", "RUY", "ger", "DE", 85, "#FDE100"),
  c("ger-bulls", "작센 불스", "Saxony Bulls", "SXB", "ger", "DE", 83, "#DD0741"),
  c("ger-eagles", "헤센 이글스", "Hesse Eagles", "HSE", "ger", "DE", 79, "#E1000F"),
  c("ger-swabia", "슈바벤 슈투트", "Swabia Stutt", "SWS", "ger", "DE", 78, "#E32219"),
  c("ger-wolves", "니더작센 울브스", "Lower Saxony Wolves", "LSW", "ger", "DE", 76, "#65B32E"),
  c("ger-greens", "브레멘 그린스", "Bremen Greens", "BMG", "ger", "DE", 74, "#1D9053"),
  // Italy
  c("ita-nerazzurri", "밀라노 네라추리", "Milan Nerazzurri", "MNR", "ita", "IT", 87, "#0068A8"),
  c("ita-oldlady", "토리노 올드레이디", "Turin Old Lady", "TOL", "ita", "IT", 85, "#000000"),
  c("ita-rossoneri", "밀라노 로소네리", "Milan Rossoneri", "MRN", "ita", "IT", 84, "#FB090B"),
  c("ita-partenopei", "나폴리 파르테노페이", "Naples Partenopei", "NPP", "ita", "IT", 84, "#12A0D7"),
  c("ita-goddess", "베르가모 가디스", "Bergamo Goddess", "BGG", "ita", "IT", 82, "#1E71B8"),
  c("ita-giallorossi", "로마 잘로로시", "Rome Giallorossi", "RGR", "ita", "IT", 81, "#8E1F2F"),
  c("ita-biancocelesti", "로마 비안코첼레스티", "Rome Biancocelesti", "RBC", "ita", "IT", 80, "#87D8F7"),
  c("ita-viola", "피렌체 비올라", "Florence Viola", "FLV", "ita", "IT", 78, "#592C82"),
  // France
  c("fra-capital", "파리 캐피털", "Paris Capital", "PRC", "fra", "FR", 88, "#004170"),
  c("fra-principaute", "모나코 프린시포테", "Monaco Principaute", "MNP", "fra", "FR", 81, "#E51B22"),
  c("fra-phoceens", "마르세유 포세앵", "Marseille Phoceens", "MRP", "fra", "FR", 80, "#2FAEE0"),
  c("fra-gones", "리옹 곤스", "Lyon Gones", "LYG", "fra", "FR", 79, "#1A3C7B"),
  c("fra-mastiffs", "릴 마스티프", "Lille Mastiffs", "LMS", "fra", "FR", 79, "#E01E13"),
  c("fra-aiglons", "니스 에글롱", "Nice Aiglons", "NCA", "fra", "FR", 78, "#C8102E"),
  c("fra-rouge", "렌 루즈누아", "Rennes Rouge", "RNR", "fra", "FR", 77, "#E23026"),
  c("fra-canaris", "낭트 카나리", "Nantes Canaris", "NTC", "fra", "FR", 73, "#FDDA0D"),
  // Portugal
  c("por-eagles", "리스본 이글스", "Lisbon Eagles", "LSE", "por", "PT", 82, "#E30613"),
  c("por-lions", "리스본 라이온스", "Lisbon Lions", "LSL", "por", "PT", 82, "#008057"),
  c("por-dragons", "포르투 드래곤스", "Porto Dragons", "PTD", "por", "PT", 81, "#00428C"),
  c("por-arsenalistas", "브라가 아르세날리스타스", "Braga Arsenalistas", "BRA", "por", "PT", 76, "#E2231A"),
  c("por-conquerors", "기마랑이스 컨쿼러스", "Guimaraes Conquerors", "GMC", "por", "PT", 73, "#FFFFFF"),
  c("por-belenenses", "리스본 벨레넨스", "Lisbon Belenenses", "LSB", "por", "PT", 71, "#005EB8"),
  c("por-algarve", "파루 알가르브", "Faro Algarve", "FRA", "por", "PT", 70, "#1D8649"),
  c("por-academica", "코임브라 아카데미카", "Coimbra Academica", "CMA", "por", "PT", 70, "#000000"),
  // Netherlands
  c("ned-lightbulbs", "에인트호번 라이트", "Eindhoven Lights", "EHL", "ned", "NL", 82, "#ED1C24"),
  c("ned-godenzonen", "암스테르담 고든조넨", "Amsterdam Godenzonen", "AMG", "ned", "NL", 81, "#D2122E"),
  c("ned-harbour", "로테르담 하버", "Rotterdam Harbour", "RTH", "ned", "NL", 81, "#E5000B"),
  c("ned-cheese", "알크마르 치즈", "Alkmaar Cheese", "AZC", "ned", "NL", 76, "#E2001A"),
  c("ned-tukkers", "트벤테 투커스", "Twente Tukkers", "TWT", "ned", "NL", 74, "#E1000F"),
  c("ned-cathedral", "위트레흐트 캐시드럴", "Utrecht Cathedral", "UTC", "ned", "NL", 73, "#E30613"),
  c("ned-eaglehood", "아른헴 이글후드", "Arnhem Eaglehood", "ARE", "ned", "NL", 71, "#FFD700"),
  c("ned-frisians", "헤이렌베인 프리지안", "Heerenveen Frisians", "HVF", "ned", "NL", 70, "#005EB8"),
  // Korea
  c("kor-tigers", "울산 타이거스", "Ulsan Tigers", "ULT", "kor", "KR", 76, "#005BAC"),
  c("kor-greens", "전주 그린스", "Jeonju Greens", "JJG", "kor", "KR", 75, "#1B7A3D"),
  c("kor-capital", "서울 캐피털", "Seoul Capital", "SLC", "kor", "KR", 73, "#C8102E"),
  c("kor-steelers", "포항 스틸러스", "Pohang Steelers", "PHS", "kor", "KR", 73, "#000000"),
  c("kor-bluewings", "수원 블루윙스", "Suwon Bluewings", "SWB", "kor", "KR", 71, "#1D4F91"),
  c("kor-sky", "대구 스카이", "Daegu Sky", "DGS", "kor", "KR", 70, "#41B6E6"),
  c("kor-unicorns", "인천 유니콘스", "Incheon Unicorns", "ICU", "kor", "KR", 70, "#0067B1"),
  c("kor-fc", "강원 FC", "Gangwon FC", "GWF", "kor", "KR", 69, "#F47920"),
];

export const { leagues: LEAGUES, clubs: CLUBS } = expandWithTiers(LEAGUES_TIER1, CLUBS_TIER1);

export const CLUB_BY_ID: Record<string, ClubSeed> = Object.fromEntries(
  CLUBS.map((cl) => [cl.id, cl]),
);

const BASKETBALL_LEAGUES_TIER1: LeagueSeed[] = [
  { id: "bb-na", name: { ko: "콘티넨털 후프스", en: "Continental Hoops" }, country: "US" },
  { id: "bb-global", name: { ko: "글로벌 하드우드", en: "Global Hardwood" }, country: "EU" },
];

const BASKETBALL_CLUBS_TIER1: ClubSeed[] = [
  c("bb-la-stars", "LA 스타라인", "LA Starline", "LAS", "bb-na", "US", 90, "#552583"),
  c("bb-bay-splash", "베이 스플래시", "Bay Splash", "BSP", "bb-na", "US", 89, "#1D428A"),
  c("bb-boston-clovers", "보스턴 클로버스", "Boston Clovers", "BCL", "bb-na", "US", 88, "#007A33"),
  c("bb-texas-mavs", "텍사스 매버릭스", "Texas Mavericks", "TMV", "bb-na", "US", 86, "#00538C"),
  c("bb-chicago-wind", "시카고 윈드", "Chicago Wind", "CWD", "bb-na", "US", 82, "#CE1141"),
  c("bb-busan-phoenix", "부산 피닉스", "Busan Phoenix", "BSX", "bb-na", "KR", 75, "#98002E"),
  c("bb-denver-peaks", "덴버 피크스", "Denver Peaks", "DVP", "bb-na", "US", 84, "#0E2240"),
  c("bb-seoul-royals", "서울 로열스", "Seoul Royals", "SLR", "bb-na", "KR", 76, "#0B5CAD"),
  c("bb-madrid-crowns", "마드리드 크라운스", "Madrid Crowns", "MDC", "bb-global", "ES", 88, "#FDB927"),
  c("bb-athens-flame", "아테네 플레임", "Athens Flame", "ATF", "bb-global", "GR", 84, "#D71920"),
  c("bb-istanbul-moon", "이스탄불 문", "Istanbul Moon", "ISM", "bb-global", "TR", 84, "#F5A400"),
  c("bb-belgrade-fortress", "베오그라드 포트리스", "Belgrade Fortress", "BGF", "bb-global", "RS", 82, "#C8102E"),
  c("bb-daegu-hunters", "대구 헌터스", "Daegu Hunters", "DGH", "bb-global", "KR", 75, "#BE0A26"),
  c("bb-telaviv-lions", "텔아비브 라이언스", "Tel Aviv Lions", "TAL", "bb-global", "IL", 80, "#F7D417"),
  c("bb-incheon-comets", "인천 코메츠", "Incheon Comets", "ICC", "bb-global", "KR", 74, "#006A44"),
  c("bb-manila-kings", "마닐라 킹스", "Manila Kings", "MNK", "bb-global", "PH", 75, "#0038A8"),
];

const { leagues: BASKETBALL_LEAGUES, clubs: BASKETBALL_CLUBS } = expandWithTiers(BASKETBALL_LEAGUES_TIER1, BASKETBALL_CLUBS_TIER1);

const BASEBALL_LEAGUES_TIER1: LeagueSeed[] = [
  { id: "bsb-majors", name: { ko: "그랜드 다이아몬드 리그", en: "Grand Diamond League" }, country: "US" },
  { id: "bsb-pacific", name: { ko: "퍼시픽 프로 베이스볼", en: "Pacific Pro Baseball" }, country: "JP" },
];

const BASEBALL_CLUBS_TIER1: ClubSeed[] = [
  c("bsb-newyork-pinstripes", "뉴욕 핀스트라이프스", "New York Pinstripes", "NYP", "bsb-majors", "US", 90, "#132448"),
  c("bsb-la-sunsets", "LA 선셋츠", "LA Sunsets", "LAS", "bsb-majors", "US", 89, "#005A9C"),
  c("bsb-boston-harbor", "보스턴 하버", "Boston Harbor", "BOH", "bsb-majors", "US", 86, "#BD3039"),
  c("bsb-houston-orbit", "휴스턴 오빗", "Houston Orbit", "HOU", "bsb-majors", "US", 85, "#EB6E1F"),
  c("bsb-atlanta-hammers", "애틀랜타 해머스", "Atlanta Hammers", "ATH", "bsb-majors", "US", 85, "#CE1141"),
  c("bsb-chicago-north", "시카고 노스", "Chicago North", "CHN", "bsb-majors", "US", 82, "#0E3386"),
  c("bsb-toronto-maples", "토론토 메이플스", "Toronto Maples", "TOM", "bsb-majors", "CA", 80, "#134A8E"),
  c("bsb-sanfran-gate", "샌프란시스코 게이트", "San Francisco Gate", "SFG", "bsb-majors", "US", 81, "#FD5A1E"),
  c("bsb-tokyo-giants", "도쿄 자이언츠", "Tokyo Giants", "TYG", "bsb-pacific", "JP", 87, "#F97700"),
  c("bsb-osaka-tigers", "오사카 타이거스", "Osaka Tigers", "OST", "bsb-pacific", "JP", 84, "#FFE100"),
  c("bsb-fukuoka-hawks", "후쿠오카 호크스", "Fukuoka Hawks", "FKH", "bsb-pacific", "JP", 84, "#FFCC00"),
  c("bsb-seoul-twins", "서울 트윈스", "Seoul Twins", "SET", "bsb-pacific", "KR", 80, "#C30452"),
  c("bsb-incheon-landers", "인천 랜더스", "Incheon Landers", "ICL", "bsb-pacific", "KR", 79, "#CE0E2D"),
  c("bsb-busan-gulls", "부산 걸스", "Busan Gulls", "BSG", "bsb-pacific", "KR", 77, "#002955"),
  c("bsb-taipei-dragons", "타이베이 드래곤스", "Taipei Dragons", "TPD", "bsb-pacific", "TW", 76, "#003DA5"),
  c("bsb-sydney-southern", "시드니 서던", "Sydney Southern", "SYS", "bsb-pacific", "AU", 73, "#006341"),
];

const { leagues: BASEBALL_LEAGUES, clubs: BASEBALL_CLUBS } = expandWithTiers(BASEBALL_LEAGUES_TIER1, BASEBALL_CLUBS_TIER1);

const VOLLEYBALL_LEAGUES_TIER1: LeagueSeed[] = [
  { id: "vb-korea", name: { ko: "코리아 스파이크 리그", en: "Korea Spike League" }, country: "KR" },
  { id: "vb-world", name: { ko: "월드 발리 서킷", en: "World Volley Circuit" }, country: "IT" },
];

const VOLLEYBALL_CLUBS_TIER1: ClubSeed[] = [
  c("vb-seoul-wings", "서울 윙스", "Seoul Wings", "SLW", "vb-korea", "KR", 80, "#0057B8"),
  c("vb-incheon-air", "인천 에어", "Incheon Air", "ICA", "vb-korea", "KR", 79, "#00A3E0"),
  c("vb-suwon-hillstate", "수원 힐스테이트", "Suwon Hillstate", "SWH", "vb-korea", "KR", 79, "#006341"),
  c("vb-daejeon-sparks", "대전 스파크스", "Daejeon Sparks", "DJS", "vb-korea", "KR", 78, "#E4002B"),
  c("vb-cheonan-sky", "천안 스카이", "Cheonan Sky", "CNS", "vb-korea", "KR", 77, "#003DA5"),
  c("vb-gimcheon-roads", "김천 로즈", "Gimcheon Roads", "GMR", "vb-korea", "KR", 76, "#005EB8"),
  c("vb-hwaseong-ibex", "화성 아이벡스", "Hwaseong Ibex", "HSI", "vb-korea", "KR", 75, "#C8102E"),
  c("vb-busan-wave", "부산 웨이브", "Busan Wave", "BSW", "vb-korea", "KR", 74, "#009CA6"),
  c("vb-ankara-stars", "앙카라 스타스", "Ankara Stars", "ANS", "vb-world", "TR", 86, "#FDB913"),
  c("vb-istanbul-queens", "이스탄불 퀸스", "Istanbul Queens", "ISQ", "vb-world", "TR", 85, "#A6192E"),
  c("vb-milan-blockers", "밀라노 블로커스", "Milan Blockers", "MLB", "vb-world", "IT", 84, "#111111"),
  c("vb-novara-blue", "노바라 블루", "Novara Blue", "NVB", "vb-world", "IT", 82, "#004B93"),
  c("vb-osaka-aces", "오사카 에이스", "Osaka Aces", "OSA", "vb-world", "JP", 80, "#E60012"),
  c("vb-rio-samba", "리우 삼바", "Rio Samba", "RIS", "vb-world", "BR", 80, "#009739"),
  c("vb-belgrade-nets", "베오그라드 네츠", "Belgrade Nets", "BGN", "vb-world", "RS", 79, "#C6363C"),
  c("vb-warsaw-spire", "바르샤바 스파이어", "Warsaw Spire", "WSP", "vb-world", "PL", 78, "#DC143C"),
];

const { leagues: VOLLEYBALL_LEAGUES, clubs: VOLLEYBALL_CLUBS } = expandWithTiers(VOLLEYBALL_LEAGUES_TIER1, VOLLEYBALL_CLUBS_TIER1);

const PICKLEBALL_LEAGUES_TIER1: LeagueSeed[] = [
  { id: "pb-pro", name: { ko: "프리미어 패들 리그", en: "Premier Paddle League" }, country: "US" },
  { id: "pb-open", name: { ko: "글로벌 피클 투어", en: "Global Pickle Tour" }, country: "US" },
];

const PICKLEBALL_CLUBS_TIER1: ClubSeed[] = [
  c("pb-austin-dinks", "오스틴 딩크스", "Austin Dinks", "ATD", "pb-pro", "US", 84, "#BF5700"),
  c("pb-miami-smash", "마이애미 스매시", "Miami Smash", "MIS", "pb-pro", "US", 83, "#00B2A9"),
  c("pb-seattle-kitchen", "시애틀 키친", "Seattle Kitchen", "SEK", "pb-pro", "US", 82, "#69BE28"),
  c("pb-phoenix-rallies", "피닉스 랠리즈", "Phoenix Rallies", "PHR", "pb-pro", "US", 81, "#E56020"),
  c("pb-brooklyn-paddles", "브루클린 패들스", "Brooklyn Paddles", "BKP", "pb-pro", "US", 80, "#000000"),
  c("pb-daejeon-dinkers", "대전 딩커스", "Daejeon Dinkers", "DJD", "pb-pro", "KR", 72, "#003594"),
  c("pb-gwangju-spin", "광주 스핀", "Gwangju Spin", "GJS", "pb-pro", "KR", 73, "#B4975A"),
  c("pb-suwon-smashers", "수원 스매셔스", "Suwon Smashers", "SWS", "pb-pro", "KR", 72, "#0E2240"),
  c("pb-toronto-spin", "토론토 스핀", "Toronto Spin", "TOS", "pb-open", "CA", 78, "#DA291C"),
  c("pb-seoul-paddle", "서울 패들", "Seoul Paddle", "SLP", "pb-open", "KR", 76, "#0047A0"),
  c("pb-tokyo-softgame", "도쿄 소프트게임", "Tokyo Softgame", "TOSG", "pb-open", "JP", 76, "#BC002D"),
  c("pb-london-lobs", "런던 롭스", "London Lobs", "LDL", "pb-open", "EN", 75, "#1C2C5B"),
  c("pb-madrid-kitchen", "마드리드 키친", "Madrid Kitchen", "MDK", "pb-open", "ES", 75, "#AA151B"),
  c("pb-jeonju-rally", "전주 랠리", "Jeonju Rally", "JJR", "pb-open", "KR", 71, "#00843D"),
  c("pb-cheongju-paddlers", "청주 패들러스", "Cheongju Paddlers", "CJP", "pb-open", "KR", 71, "#0055A4"),
  c("pb-mexico-drive", "멕시코 드라이브", "Mexico Drive", "MXD", "pb-open", "MX", 73, "#006847"),
];

const { leagues: PICKLEBALL_LEAGUES, clubs: PICKLEBALL_CLUBS } = expandWithTiers(PICKLEBALL_LEAGUES_TIER1, PICKLEBALL_CLUBS_TIER1);

const SPORT_LEAGUES: Record<SportId, LeagueSeed[]> = {
  soccer: LEAGUES,
  basketball: BASKETBALL_LEAGUES,
  baseball: BASEBALL_LEAGUES,
  volleyball: VOLLEYBALL_LEAGUES,
  pickleball: PICKLEBALL_LEAGUES,
};

const SPORT_CLUBS: Record<SportId, ClubSeed[]> = {
  soccer: CLUBS,
  basketball: BASKETBALL_CLUBS,
  baseball: BASEBALL_CLUBS,
  volleyball: VOLLEYBALL_CLUBS,
  pickleball: PICKLEBALL_CLUBS,
};

export interface PlayerNameSeed {
  name: string;
  nameKo: string;
}

const SPORT_NAME_ARCHETYPES: Record<SportId, PlayerNameSeed[]> = {
  soccer: [],
  basketball: [
    { name: "Jalen Cross", nameKo: "제일런 크로스" },
    { name: "Cade Rivers", nameKo: "케이드 리버스" },
    { name: "Luka Marin", nameKo: "루카 마린" },
    { name: "Giannis Karras", nameKo: "야니스 카라스" },
    { name: "Aria Moon", nameKo: "아리아 문" },
  ],
  baseball: [
    { name: "Sho Ito", nameKo: "쇼 이토" },
    { name: "Mookie Stone", nameKo: "무키 스톤" },
    { name: "Aaron Vale", nameKo: "애런 베일" },
    { name: "Hyun Park", nameKo: "현 박" },
    { name: "Miguel Cruz", nameKo: "미겔 크루스" },
  ],
  volleyball: [
    { name: "Tijana Markovic", nameKo: "티야나 마르코비치" },
    { name: "Yuji Sato", nameKo: "유지 사토" },
    { name: "Ebrar Demir", nameKo: "에브라르 데미르" },
    { name: "Minji Kang", nameKo: "강민지" },
    { name: "Paola Ricci", nameKo: "파올라 리치" },
  ],
  pickleball: [
    { name: "Ben Archer", nameKo: "벤 아처" },
    { name: "Anna Bright", nameKo: "애나 브라이트" },
    { name: "Tyson Reed", nameKo: "타이슨 리드" },
    { name: "Catherine Lane", nameKo: "캐서린 레인" },
    { name: "JW Stone", nameKo: "제이더블유 스톤" },
  ],
};

export function getLeaguesForSport(sportId: SportId): LeagueSeed[] {
  return SPORT_LEAGUES[sportId];
}

export function getClubsForSport(sportId: SportId): ClubSeed[] {
  return SPORT_CLUBS[sportId];
}

export function getClubByIdForSport(sportId: SportId, clubId: string): ClubSeed | undefined {
  return getClubsForSport(sportId).find((club) => club.id === clubId);
}

export function getNameArchetypesForSport(sportId: SportId): PlayerNameSeed[] {
  return SPORT_NAME_ARCHETYPES[sportId];
}
