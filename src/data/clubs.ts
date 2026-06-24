import type { LocalizedText, SportId } from "@/lib/types";

// 64 clubs across 8 domestic leagues. Names are city/nickname aliases (not real
// club trademarks). Reputation (69-91) drives squad quality and seeding.

export interface LeagueSeed {
  id: string;
  name: LocalizedText;
  country: string;
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

export const LEAGUES: LeagueSeed[] = [
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

export const CLUBS: ClubSeed[] = [
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

export const CLUB_BY_ID: Record<string, ClubSeed> = Object.fromEntries(
  CLUBS.map((cl) => [cl.id, cl]),
);

const BASKETBALL_LEAGUES: LeagueSeed[] = [
  { id: "bb-na", name: { ko: "Continental Hoops", en: "Continental Hoops" }, country: "US" },
  { id: "bb-global", name: { ko: "Global Hardwood", en: "Global Hardwood" }, country: "EU" },
];

const BASKETBALL_CLUBS: ClubSeed[] = [
  c("bb-la-stars", "LA Starline", "LA Starline", "LAS", "bb-na", "US", 90, "#552583"),
  c("bb-bay-splash", "Bay Splash", "Bay Splash", "BSP", "bb-na", "US", 89, "#1D428A"),
  c("bb-boston-clovers", "Boston Clovers", "Boston Clovers", "BCL", "bb-na", "US", 88, "#007A33"),
  c("bb-texas-mavs", "Texas Mavericks", "Texas Mavericks", "TMV", "bb-na", "US", 86, "#00538C"),
  c("bb-chicago-wind", "Chicago Wind", "Chicago Wind", "CWD", "bb-na", "US", 82, "#CE1141"),
  c("bb-miami-tide", "Miami Tide", "Miami Tide", "MTD", "bb-na", "US", 82, "#98002E"),
  c("bb-denver-peaks", "Denver Peaks", "Denver Peaks", "DVP", "bb-na", "US", 84, "#0E2240"),
  c("bb-seoul-royals", "Seoul Royals", "Seoul Royals", "SLR", "bb-na", "KR", 76, "#0B5CAD"),
  c("bb-madrid-crowns", "Madrid Crowns", "Madrid Crowns", "MDC", "bb-global", "ES", 88, "#FDB927"),
  c("bb-athens-flame", "Athens Flame", "Athens Flame", "ATF", "bb-global", "GR", 84, "#D71920"),
  c("bb-istanbul-moon", "Istanbul Moon", "Istanbul Moon", "ISM", "bb-global", "TR", 84, "#F5A400"),
  c("bb-belgrade-fortress", "Belgrade Fortress", "Belgrade Fortress", "BGF", "bb-global", "RS", 82, "#C8102E"),
  c("bb-bologna-reds", "Bologna Reds", "Bologna Reds", "BLR", "bb-global", "IT", 80, "#BE0A26"),
  c("bb-telaviv-lions", "Tel Aviv Lions", "Tel Aviv Lions", "TAL", "bb-global", "IL", 80, "#F7D417"),
  c("bb-kaunas-amber", "Kaunas Amber", "Kaunas Amber", "KAM", "bb-global", "LT", 79, "#006A44"),
  c("bb-manila-kings", "Manila Kings", "Manila Kings", "MNK", "bb-global", "PH", 75, "#0038A8"),
];

const BASEBALL_LEAGUES: LeagueSeed[] = [
  { id: "bsb-majors", name: { ko: "Grand Diamond League", en: "Grand Diamond League" }, country: "US" },
  { id: "bsb-pacific", name: { ko: "Pacific Pro Baseball", en: "Pacific Pro Baseball" }, country: "JP" },
];

const BASEBALL_CLUBS: ClubSeed[] = [
  c("bsb-newyork-pinstripes", "New York Pinstripes", "New York Pinstripes", "NYP", "bsb-majors", "US", 90, "#132448"),
  c("bsb-la-sunsets", "LA Sunsets", "LA Sunsets", "LAS", "bsb-majors", "US", 89, "#005A9C"),
  c("bsb-boston-harbor", "Boston Harbor", "Boston Harbor", "BOH", "bsb-majors", "US", 86, "#BD3039"),
  c("bsb-houston-orbit", "Houston Orbit", "Houston Orbit", "HOU", "bsb-majors", "US", 85, "#EB6E1F"),
  c("bsb-atlanta-hammers", "Atlanta Hammers", "Atlanta Hammers", "ATH", "bsb-majors", "US", 85, "#CE1141"),
  c("bsb-chicago-north", "Chicago North", "Chicago North", "CHN", "bsb-majors", "US", 82, "#0E3386"),
  c("bsb-toronto-maples", "Toronto Maples", "Toronto Maples", "TOM", "bsb-majors", "CA", 80, "#134A8E"),
  c("bsb-sanfran-gate", "San Francisco Gate", "San Francisco Gate", "SFG", "bsb-majors", "US", 81, "#FD5A1E"),
  c("bsb-tokyo-giants", "Tokyo Giants", "Tokyo Giants", "TYG", "bsb-pacific", "JP", 87, "#F97700"),
  c("bsb-osaka-tigers", "Osaka Tigers", "Osaka Tigers", "OST", "bsb-pacific", "JP", 84, "#FFE100"),
  c("bsb-fukuoka-hawks", "Fukuoka Hawks", "Fukuoka Hawks", "FKH", "bsb-pacific", "JP", 84, "#FFCC00"),
  c("bsb-seoul-twins", "Seoul Twins", "Seoul Twins", "SET", "bsb-pacific", "KR", 80, "#C30452"),
  c("bsb-incheon-landers", "Incheon Landers", "Incheon Landers", "ICL", "bsb-pacific", "KR", 79, "#CE0E2D"),
  c("bsb-busan-gulls", "Busan Gulls", "Busan Gulls", "BSG", "bsb-pacific", "KR", 77, "#002955"),
  c("bsb-taipei-dragons", "Taipei Dragons", "Taipei Dragons", "TPD", "bsb-pacific", "TW", 76, "#003DA5"),
  c("bsb-sydney-southern", "Sydney Southern", "Sydney Southern", "SYS", "bsb-pacific", "AU", 73, "#006341"),
];

const VOLLEYBALL_LEAGUES: LeagueSeed[] = [
  { id: "vb-korea", name: { ko: "Korea Spike League", en: "Korea Spike League" }, country: "KR" },
  { id: "vb-world", name: { ko: "World Volley Circuit", en: "World Volley Circuit" }, country: "IT" },
];

const VOLLEYBALL_CLUBS: ClubSeed[] = [
  c("vb-seoul-wings", "Seoul Wings", "Seoul Wings", "SLW", "vb-korea", "KR", 80, "#0057B8"),
  c("vb-incheon-air", "Incheon Air", "Incheon Air", "ICA", "vb-korea", "KR", 79, "#00A3E0"),
  c("vb-suwon-hillstate", "Suwon Hillstate", "Suwon Hillstate", "SWH", "vb-korea", "KR", 79, "#006341"),
  c("vb-daejeon-sparks", "Daejeon Sparks", "Daejeon Sparks", "DJS", "vb-korea", "KR", 78, "#E4002B"),
  c("vb-cheonan-sky", "Cheonan Sky", "Cheonan Sky", "CNS", "vb-korea", "KR", 77, "#003DA5"),
  c("vb-gimcheon-roads", "Gimcheon Roads", "Gimcheon Roads", "GMR", "vb-korea", "KR", 76, "#005EB8"),
  c("vb-hwaseong-ibex", "Hwaseong Ibex", "Hwaseong Ibex", "HSI", "vb-korea", "KR", 75, "#C8102E"),
  c("vb-busan-wave", "Busan Wave", "Busan Wave", "BSW", "vb-korea", "KR", 74, "#009CA6"),
  c("vb-ankara-stars", "Ankara Stars", "Ankara Stars", "ANS", "vb-world", "TR", 86, "#FDB913"),
  c("vb-istanbul-queens", "Istanbul Queens", "Istanbul Queens", "ISQ", "vb-world", "TR", 85, "#A6192E"),
  c("vb-milan-blockers", "Milan Blockers", "Milan Blockers", "MLB", "vb-world", "IT", 84, "#111111"),
  c("vb-novara-blue", "Novara Blue", "Novara Blue", "NVB", "vb-world", "IT", 82, "#004B93"),
  c("vb-osaka-aces", "Osaka Aces", "Osaka Aces", "OSA", "vb-world", "JP", 80, "#E60012"),
  c("vb-rio-samba", "Rio Samba", "Rio Samba", "RIS", "vb-world", "BR", 80, "#009739"),
  c("vb-belgrade-nets", "Belgrade Nets", "Belgrade Nets", "BGN", "vb-world", "RS", 79, "#C6363C"),
  c("vb-warsaw-spire", "Warsaw Spire", "Warsaw Spire", "WSP", "vb-world", "PL", 78, "#DC143C"),
];

const PICKLEBALL_LEAGUES: LeagueSeed[] = [
  { id: "pb-pro", name: { ko: "Premier Paddle League", en: "Premier Paddle League" }, country: "US" },
  { id: "pb-open", name: { ko: "Global Pickle Tour", en: "Global Pickle Tour" }, country: "US" },
];

const PICKLEBALL_CLUBS: ClubSeed[] = [
  c("pb-austin-dinks", "Austin Dinks", "Austin Dinks", "ATD", "pb-pro", "US", 84, "#BF5700"),
  c("pb-miami-smash", "Miami Smash", "Miami Smash", "MIS", "pb-pro", "US", 83, "#00B2A9"),
  c("pb-seattle-kitchen", "Seattle Kitchen", "Seattle Kitchen", "SEK", "pb-pro", "US", 82, "#69BE28"),
  c("pb-phoenix-rallies", "Phoenix Rallies", "Phoenix Rallies", "PHR", "pb-pro", "US", 81, "#E56020"),
  c("pb-brooklyn-paddles", "Brooklyn Paddles", "Brooklyn Paddles", "BKP", "pb-pro", "US", 80, "#000000"),
  c("pb-dallas-courts", "Dallas Courts", "Dallas Courts", "DLC", "pb-pro", "US", 79, "#003594"),
  c("pb-vegas-volley", "Vegas Volley", "Vegas Volley", "VGV", "pb-pro", "US", 78, "#B4975A"),
  c("pb-denver-drop", "Denver Drop", "Denver Drop", "DVD", "pb-pro", "US", 77, "#0E2240"),
  c("pb-toronto-spin", "Toronto Spin", "Toronto Spin", "TOS", "pb-open", "CA", 78, "#DA291C"),
  c("pb-seoul-paddle", "Seoul Paddle", "Seoul Paddle", "SLP", "pb-open", "KR", 76, "#0047A0"),
  c("pb-tokyo-softgame", "Tokyo Softgame", "Tokyo Softgame", "TOSG", "pb-open", "JP", 76, "#BC002D"),
  c("pb-london-lobs", "London Lobs", "London Lobs", "LDL", "pb-open", "EN", 75, "#1C2C5B"),
  c("pb-madrid-kitchen", "Madrid Kitchen", "Madrid Kitchen", "MDK", "pb-open", "ES", 75, "#AA151B"),
  c("pb-sydney-slices", "Sydney Slices", "Sydney Slices", "SYS", "pb-open", "AU", 74, "#00843D"),
  c("pb-paris-paddlers", "Paris Paddlers", "Paris Paddlers", "PRP", "pb-open", "FR", 74, "#0055A4"),
  c("pb-mexico-drive", "Mexico Drive", "Mexico Drive", "MXD", "pb-open", "MX", 73, "#006847"),
];

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
    { name: "Jalen Cross", nameKo: "Jalen Cross" },
    { name: "Cade Rivers", nameKo: "Cade Rivers" },
    { name: "Luka Marin", nameKo: "Luka Marin" },
    { name: "Giannis Karras", nameKo: "Giannis Karras" },
    { name: "Aria Moon", nameKo: "Aria Moon" },
  ],
  baseball: [
    { name: "Sho Ito", nameKo: "Sho Ito" },
    { name: "Mookie Stone", nameKo: "Mookie Stone" },
    { name: "Aaron Vale", nameKo: "Aaron Vale" },
    { name: "Hyun Park", nameKo: "Hyun Park" },
    { name: "Miguel Cruz", nameKo: "Miguel Cruz" },
  ],
  volleyball: [
    { name: "Tijana Markovic", nameKo: "Tijana Markovic" },
    { name: "Yuji Sato", nameKo: "Yuji Sato" },
    { name: "Ebrar Demir", nameKo: "Ebrar Demir" },
    { name: "Minji Kang", nameKo: "Minji Kang" },
    { name: "Paola Ricci", nameKo: "Paola Ricci" },
  ],
  pickleball: [
    { name: "Ben Archer", nameKo: "Ben Archer" },
    { name: "Anna Bright", nameKo: "Anna Bright" },
    { name: "Tyson Reed", nameKo: "Tyson Reed" },
    { name: "Catherine Lane", nameKo: "Catherine Lane" },
    { name: "JW Stone", nameKo: "JW Stone" },
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
