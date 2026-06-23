import type { LocalizedText } from "@/lib/types";

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
