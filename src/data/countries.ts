import type { LocalizedText } from "@/lib/types";

// Countries with common given/family name pools used to procedurally name
// players. Names are inspired by each nation's naming conventions but are
// deliberately altered (respelled / recombined) so they do not reproduce any
// real athlete's actual full name. `firstNamesKo`/`lastNamesKo` give the
// matching Korean transliteration (by index) so every generated player can
// show a name in Korean and English at the same time, not as a locale toggle.

export interface Country {
  code: string;
  name: LocalizedText;
  /** relative football strength 1-100, biases generated player quality */
  strength: number;
  firstNames: string[];
  lastNames: string[];
  /** Korean transliteration, aligned by index with firstNames/lastNames */
  firstNamesKo: string[];
  lastNamesKo: string[];
}

export const COUNTRIES: Country[] = [
  {
    code: "KR", name: { ko: "대한민국", en: "South Korea" }, strength: 72,
    firstNames: ["Minjun", "Heungsoo", "Jaewon", "Wooshin", "Inho", "Seunghyun", "Kanghyun", "Daehyun", "Hyunwoo", "Taeyang", "Jinho", "Youngmin"],
    firstNamesKo: ["민준", "흥수", "재원", "우신", "인호", "승현", "강현", "대현", "현우", "태양", "진호", "영민"],
    lastNames: ["Kim", "Lee", "Park", "Choi", "Jung", "Kang", "Cho", "Yoon", "Han", "Seo", "Hwang", "Sohn"],
    lastNamesKo: ["김", "이", "박", "최", "정", "강", "조", "윤", "한", "서", "황", "손"],
  },
  {
    code: "JP", name: { ko: "일본", en: "Japan" }, strength: 74,
    firstNames: ["Takumo", "Wataro", "Daichiro", "Ritsuo", "Kaoto", "Takefumi", "Hiroto", "Yuuto", "Shoma", "Aoto", "Junpei", "Reiji"],
    firstNamesKo: ["타쿠모", "와타로", "다이치로", "리츠오", "카오토", "타케후미", "히로토", "유우토", "쇼마", "아오토", "준페이", "레이지"],
    lastNames: ["Tanaka", "Sato", "Suzuki", "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Endoji", "Mitomi", "Kubou", "Minamizono", "Tomiyama"],
    lastNamesKo: ["타나카", "사토", "스즈키", "이토", "야마모토", "나카무라", "코바야시", "엔도지", "미토미", "쿠보우", "미나미조노", "토미야마"],
  },
  {
    code: "EN", name: { ko: "잉글랜드", en: "England" }, strength: 84,
    firstNames: ["Harvey", "Jace", "Finn", "Bukolo", "Marcas", "Declyn", "Maison", "Judel", "Coleson", "Ozzy", "Reeve", "Brent"],
    firstNamesKo: ["하비", "제이스", "핀", "부콜로", "마카스", "데클린", "메이슨", "주델", "콜슨", "오지", "리브", "브렌트"],
    lastNames: ["Smith", "Walker", "Fodden", "Stones", "Royce", "Bellinger", "Saku", "Palma", "Maddison", "Grealish", "Henderson", "Wilson"],
    lastNamesKo: ["스미스", "워커", "포덴", "스톤스", "로이스", "벨린저", "사쿠", "팔마", "매디슨", "그릴리쉬", "헨더슨", "윌슨"],
  },
  {
    code: "ES", name: { ko: "스페인", en: "Spain" }, strength: 85,
    firstNames: ["Pedro", "Gavo", "Alvaro", "Dano", "Rodri", "Marco", "Fabian", "Mikel", "Nico", "Ferran", "Lamin", "Pou"],
    firstNamesKo: ["페드로", "가보", "알바로", "다노", "로드리", "마르코", "파비안", "미켈", "니코", "페란", "라민", "포우"],
    lastNames: ["Garcia", "Martinez", "Lopez", "Sanchez", "Gonzalez", "Ramos", "Torres", "Olmedo", "Merino", "Asensio", "Yamali", "Cubarro"],
    lastNamesKo: ["가르시아", "마르티네스", "로페스", "산체스", "곤잘레스", "라모스", "토레스", "올메도", "메리노", "아센시오", "야말리", "쿠바로"],
  },
  {
    code: "DE", name: { ko: "독일", en: "Germany" }, strength: 83,
    firstNames: ["Jamil", "Florin", "Leron", "Kaito", "Joshuah", "Ilkan", "Niklaus", "Leonn", "Robyn", "Pascual", "Maximilien", "Felician"],
    firstNamesKo: ["자밀", "플로린", "레론", "카이토", "조슈아흐", "일칸", "니클라우스", "레온", "로빈", "파스쿠알", "막시밀리앙", "펠리시안"],
    lastNames: ["Mueller", "Schmitt", "Wirtzer", "Saner", "Haverts", "Kimmer", "Gundogmus", "Goretzki", "Fullkrugge", "Grossmann", "Schlottermann", "Tahler"],
    lastNamesKo: ["뮐러", "슈미트", "비르처", "자너", "하베르츠", "키머", "귄도그무스", "고레츠키", "퓔크루게", "그로스만", "슐로터만", "탈러"],
  },
  {
    code: "IT", name: { ko: "이탈리아", en: "Italy" }, strength: 81,
    firstNames: ["Federigo", "Nicolino", "Lorenzo", "Gianluca", "Sandrino", "Daviddo", "Giacomo", "Mateo", "Riccardo", "Alessandro", "Manolo", "Bryan"],
    firstNamesKo: ["페데리고", "니콜리노", "로렌초", "지안루카", "산드리노", "다비도", "자코모", "마테오", "리카르도", "알레산드로", "마놀로", "브라이언"],
    lastNames: ["Rossi", "Russo", "Ferrari", "Chiesi", "Barelli", "Tonale", "Scamacchi", "Frattesini", "Locatello", "Bastioni", "Dimarchi", "Raspadore"],
    lastNamesKo: ["로씨", "루소", "페라리", "키에시", "바렐리", "토날레", "스카마키", "프라테시니", "로카텔로", "바스티오니", "디마르키", "라스파도레"],
  },
  {
    code: "FR", name: { ko: "프랑스", en: "France" }, strength: 86,
    firstNames: ["Kyrian", "Antwan", "Aurelio", "Eduarde", "Ousmaine", "Randall", "Bradly", "Teo", "Joules", "Marcel", "Warrick", "Mikael"],
    firstNamesKo: ["키리앙", "앙트완", "아우렐리오", "에두아르드", "우스메인", "랜달", "브래들리", "테오", "줄스", "마르셀", "워릭", "미카엘"],
    lastNames: ["Martins", "Bernardi", "Duboir", "Tchoumeni", "Camavingo", "Kolo Muana", "Barcolo", "Koundi", "Salibo", "Thurame", "Zaire-Emory", "Maignant"],
    lastNamesKo: ["마르탱스", "베르나르디", "뒤부아르", "추메니", "카마빙고", "콜로 무아나", "바르콜로", "쿤디", "살리보", "튀라메", "자이르에모리", "메냥"],
  },
  {
    code: "PT", name: { ko: "포르투갈", en: "Portugal" }, strength: 83,
    firstNames: ["Brunno", "Bernardim", "Joel", "Rafhael", "Diago", "Vitinho", "Goncalin", "Rubens", "Nunho", "Pedro", "Francisco", "Antonio"],
    firstNamesKo: ["브루노", "베르나르딩", "조엘", "라파엘", "디아고", "비틴호", "곤칼링", "후벵스", "눈호", "페드로", "프란시스코", "안토니오"],
    lastNames: ["Silva", "Fernandinho", "Felis", "Leoa", "Joto", "Nevares", "Ramos", "Diase", "Mendiz", "Cancelot", "Conceicas", "Inacios"],
    lastNamesKo: ["실바", "페르난징요", "펠리스", "레오아", "조토", "네바레스", "라모스", "디아세", "멘디스", "칸셀로트", "콘세이상스", "이나시오스"],
  },
  {
    code: "NL", name: { ko: "네덜란드", en: "Netherlands" }, strength: 82,
    firstNames: ["Coby", "Frenkel", "Memfis", "Virgile", "Xander", "Denzo", "Nathen", "Tijani", "Jeremio", "Woutar", "Mikko", "Joeyan"],
    firstNamesKo: ["코비", "프렌켈", "멤피스", "비르질레", "산더르", "덴조", "나텐", "티야니", "예레미오", "보우타르", "미코", "조이안"],
    lastNames: ["de Jonge", "van Dyck", "Gakpoe", "Depaay", "Simonis", "Dumfriess", "Akkeh", "Reijndaal", "Frimpongo", "Weghorsten", "van der Ven", "Veermans"],
    lastNamesKo: ["데 용허", "반다이크", "가크포어", "데파이", "시모니스", "둠프리스", "아케", "레인달", "프림퐁고", "베그호르스턴", "반더벤", "베르만스"],
  },
  {
    code: "BR", name: { ko: "브라질", en: "Brazil" }, strength: 87,
    firstNames: ["Vinicio", "Rodrigho", "Rafinho", "Bruno", "Lucas", "Gabriel", "Endriko", "Joao", "Andre", "Savyo", "Estevan", "Marquinho"],
    firstNamesKo: ["비니시오", "호드리고", "라피뉴", "브루노", "루카스", "가브리엘", "엔드리코", "조앙", "안드레", "사비오", "에스테반", "마르키뉴"],
    lastNames: ["Silvas", "Santosi", "Souzas", "Junioro", "Guimaraens", "Martinello", "Pereiro", "Paquetao", "Rochas", "Ribeira", "Oliveiro", "Costas"],
    lastNamesKo: ["시우바스", "산토시", "소우자스", "주니오로", "기마랑이스", "마르티넬로", "페레이로", "파케타오", "호샤스", "히베이라", "올리베이로", "코스타스"],
  },
  {
    code: "AR", name: { ko: "아르헨티나", en: "Argentina" }, strength: 88,
    firstNames: ["Lionell", "Juliano", "Lautarro", "Enzio", "Alexio", "Rodrigho", "Nicolan", "Giovano", "Nahuelo", "Cristobal", "Alejo", "Emilio"],
    firstNamesKo: ["리오넬", "줄리아노", "라우타로", "엔지오", "알렉시오", "로드리고", "니콜란", "조바노", "나우엘로", "크리스토발", "알레호", "에밀리오"],
    lastNames: ["Messih", "Alvarado", "Martinoz", "Fernandino", "Mac Calister", "Du Paul", "Otamendy", "Lo Celsi", "Molinari", "Romerez", "Garnachu", "Tagliafici"],
    lastNamesKo: ["메시흐", "알바라도", "마르티노스", "페르난디노", "마크 칼리스터", "두 폴", "오타멘디", "로 첼시", "몰리나리", "로메레스", "가르나추", "탈리아피치"],
  },
  {
    code: "BE", name: { ko: "벨기에", en: "Belgium" }, strength: 80,
    firstNames: ["Kelvin", "Romelio", "Jeremiah", "Youric", "Amadu", "Leandre", "Dodie", "Arthuro", "Charel", "Loris", "Maxen", "Johann"],
    firstNamesKo: ["켈빈", "로멜리오", "제레미아", "유리크", "아마두", "레안드레", "도디", "아르투로", "샤렐", "로리스", "막센", "요한"],
    lastNames: ["De Brunne", "Lukako", "Dokou", "Tielemons", "Onanga", "Trossart", "Lukebakyo", "Theyate", "De Ketelaar", "Opendo", "De Kuyper", "Bakayako"],
    lastNamesKo: ["더 브륀너", "루카코", "도쿠", "틸레몽스", "오낭가", "트로사르트", "루케바키오", "테야테", "더 케텔라르", "오펜도", "더 카이퍼", "바카야코"],
  },
  {
    code: "HR", name: { ko: "크로아티아", en: "Croatia" }, strength: 79,
    firstNames: ["Lukan", "Matej", "Marcelio", "Joslav", "Ivano", "Andrei", "Mariano", "Bornon", "Lovre", "Martan", "Nikolaj", "Josipe"],
    firstNamesKo: ["루칸", "마테이", "마르첼리오", "요슬라브", "이바노", "안드레이", "마리아노", "보르논", "로브레", "마르탄", "니콜라이", "요시페"],
    lastNames: ["Modrici", "Kovacin", "Brozovac", "Gvardioli", "Perisini", "Kramarac", "Pasalini", "Sosin", "Majero", "Sucici", "Vlasini", "Stanisin"],
    lastNamesKo: ["모드리치", "코바친", "브로조바츠", "그바르디올리", "페리시니", "크라마라츠", "파살리니", "소신", "마예로", "수치치", "블라시니", "스타니신"],
  },
  {
    code: "MX", name: { ko: "멕시코", en: "Mexico" }, strength: 73,
    firstNames: ["Hirvin", "Edsel", "Santiagu", "Cesario", "Raulo", "Luiz", "Orbelino", "Urielo", "Jorgen", "Roberto", "Diago", "Carlos"],
    firstNamesKo: ["이르빈", "엣셀", "산티아구", "세사리오", "라울로", "루이즈", "오르벨리노", "우리엘로", "호르헨", "로베르토", "디아고", "카를로스"],
    lastNames: ["Lozana", "Alvares", "Gimenas", "Montas", "Jimenes", "Romino", "Pinedo", "Antunas", "Sanches", "Alvarodo", "Lainoz", "Rodrigez"],
    lastNamesKo: ["로사나", "알바레스", "히메나스", "몬타스", "히메네스", "로미노", "피네도", "안투나스", "산체스", "알바로도", "라이노스", "로드리게스"],
  },
  {
    code: "US", name: { ko: "미국", en: "USA" }, strength: 74,
    firstNames: ["Christyan", "Westin", "Tylar", "Giovon", "Yunis", "Folaran", "Timotheo", "Antoneo", "Sergian", "Brendin", "Ricardio", "Malek"],
    firstNamesKo: ["크리스티안", "웨스틴", "타일러", "지오본", "유니스", "폴라란", "티모테오", "안토네오", "세르지안", "브렌딘", "리카르디오", "말렉"],
    lastNames: ["Pulisich", "McKenny", "Adamson", "Reynar", "Musaha", "Baloguno", "Weahson", "Robinsen", "Destan", "Aronsen", "Pepito", "Tillmann"],
    lastNamesKo: ["풀리시치", "맥켄니", "아담슨", "레이나르", "무사하", "발로구노", "웨아손", "로빈센", "데스탄", "아론센", "페피토", "틸만"],
  },
  {
    code: "NG", name: { ko: "나이지리아", en: "Nigeria" }, strength: 75,
    firstNames: ["Viktor", "Ademolu", "Samuelo", "Alec", "Wilfrid", "Franko", "Keleci", "Joel", "Calvino", "Mozes", "Taiwon", "Olawale"],
    firstNamesKo: ["빅토르", "아데몰루", "사무엘로", "알렉", "윌프리드", "프랑코", "켈레치", "조엘", "칼비노", "모제스", "타이원", "올라왈레"],
    lastNames: ["Osimhan", "Lookmon", "Chukwuze", "Iwobio", "Ndidio", "Onyekan", "Iheanachi", "Aribon", "Bassei", "Simion", "Awoniya", "Ainaz"],
    lastNamesKo: ["오심한", "룩몬", "추쿠제", "이워비오", "은디디오", "온예칸", "이헤아나치", "아리본", "바세이", "시미온", "아워니야", "아이나즈"],
  },
  {
    code: "SN", name: { ko: "세네갈", en: "Senegal" }, strength: 76,
    firstNames: ["Sadiyo", "Kalidu", "Ismailo", "Nicolan", "Papis", "Idrisa", "Boulaya", "Cheikou", "Habibo", "Ilimane", "Lamino", "Krepine"],
    firstNamesKo: ["사디요", "칼리두", "이스마일로", "니콜란", "파피스", "이드리사", "불라야", "셰이쿠", "하비보", "일리마네", "라미노", "크레핀"],
    lastNames: ["Manet", "Koulibali", "Sarro", "Jacksone", "Gueya", "Diaw", "Kouyatti", "Diattan", "Ndiayo", "Camaro", "Dialloh", "Diedhioux"],
    lastNamesKo: ["마네트", "쿨리발리", "사로", "잭소네", "게야", "디아우", "쿠야티", "디아탄", "디아요", "카마로", "디알로흐", "디에디우"],
  },
  {
    code: "UY", name: { ko: "우루과이", en: "Uruguay" }, strength: 78,
    firstNames: ["Federicco", "Darwen", "Ronel", "Rodriga", "Manolo", "Nicolan", "Facundi", "Maxio", "Sebastia", "Agustino", "Mathia", "Giorgiano"],
    firstNamesKo: ["페데리코", "다르웬", "로넬", "로드리가", "마놀로", "니콜란", "파쿤디", "막시오", "세바스티아", "아구스티노", "마티아", "조르지아노"],
    lastNames: ["Valverdez", "Nunes", "Araujoz", "Bentancuro", "Ugartez", "De La Cruzo", "Pellistro", "Gomes", "Coatesi", "Canobio", "Oliverra", "De Arrascaetto"],
    lastNamesKo: ["발베르데스", "누네스", "아라우호스", "벤탄쿠로", "우가르테스", "데 라 크루소", "펠리스트로", "고메스", "코아테시", "카노비오", "올리베라", "데 아라스카에토"],
  },
  {
    code: "CO", name: { ko: "콜롬비아", en: "Colombia" }, strength: 76,
    firstNames: ["Luiz", "Jaimito", "Jhonny", "Rafaelo", "Daniello", "Ricardo", "Mateo", "Jefersson", "Juano", "Davinso", "Yerrin", "Johano"],
    firstNamesKo: ["루이스", "하이미토", "조니", "라파엘로", "다니엘로", "리카르도", "마테오", "제퍼슨", "후아노", "다빈소", "예린", "조하노"],
    lastNames: ["Diazo", "Rodrigez", "Cordoban", "Borreo", "Munos", "Rioz", "Uribay", "Lermo", "Cuadradoe", "Sanchis", "Minas", "Mojico"],
    lastNamesKo: ["디아소", "로드리게스", "코르도반", "보레오", "무뇨스", "리오스", "우리바이", "레르모", "쿠아드라도에", "산치스", "미나스", "모히코"],
  },
  {
    code: "MA", name: { ko: "모로코", en: "Morocco" }, strength: 77,
    firstNames: ["Achraff", "Hakimo", "Youssaf", "Sofian", "Azzedin", "Brahimo", "Noussayr", "Bilali", "Aminu", "Romaine", "Selimo", "Abdi"],
    firstNamesKo: ["아흐라프", "하키모", "유사프", "소피안", "아제딘", "브라히모", "누사이르", "빌라리", "아미누", "로멘", "셀리모", "압디"],
    lastNames: ["Hakimy", "Ziyache", "En-Nasiri", "Amrabati", "Ounahy", "Diazo", "Mazraouy", "El Khanous", "Hariti", "Saissi", "Amallaha", "Ezzalzouly"],
    lastNamesKo: ["하키미", "지야셰", "엔나시리", "암라바티", "우나히", "디아조", "마즈라위", "엘카누스", "하리티", "사이시", "아말라하", "에잘줄리"],
  },
  {
    code: "PL", name: { ko: "폴란드", en: "Poland" }, strength: 72,
    firstNames: ["Roberto", "Pyotr", "Nikolan", "Sebastien", "Jacob", "Karolo", "Przemek", "Bartos", "Mattheo", "Kamilo", "Krystof", "Damiano"],
    firstNamesKo: ["로베르토", "표트르", "니콜란", "세바스티엔", "야콥", "카롤로", "프셰멕", "바르토스", "마테오", "카밀로", "크리스토프", "다미아노"],
    lastNames: ["Lewandowsky", "Zielinsky", "Zalewsky", "Szymansky", "Kaminsky", "Swidersky", "Frankowsky", "Bereszynsky", "Cashion", "Grosicky", "Piatkov", "Szymczyk"],
    lastNamesKo: ["레반도프스키", "지엘린스키", "잘레프스키", "시만스키", "카민스키", "시비데르스키", "프랑코프스키", "베레신스키", "카시온", "그로시츠키", "피아트코프", "심치크"],
  },
  {
    code: "DK", name: { ko: "덴마크", en: "Denmark" }, strength: 75,
    firstNames: ["Kristian", "Pierre-Emil", "Rasmund", "Joakimo", "Andreyas", "Jonash", "Mikkael", "Viktor", "Thoman", "Jesperin", "Mortin", "Andersi"],
    firstNamesKo: ["크리스티안", "피에르에밀", "라스문드", "요아키모", "안드레야스", "요나시", "미카엘", "빅토르", "토만", "예스페린", "모르틴", "안더시"],
    lastNames: ["Eriksson", "Hojbjerre", "Hojlunde", "Maehlen", "Christensan", "Windal", "Damsgaarde", "Kristiansan", "Delaneo", "Lindstrome", "Dolbergo", "Skoval"],
    lastNamesKo: ["에릭손", "호이비에레", "호이룬데", "매흘렌", "크리스텐산", "빈달", "담스고르데", "크리스티안산", "델라네오", "린드스트로메", "돌베르고", "스코발"],
  },
  {
    code: "NO", name: { ko: "노르웨이", en: "Norway" }, strength: 71,
    firstNames: ["Erlin", "Martyn", "Alexandar", "Sandor", "Antonyo", "Fredrico", "Kristan", "Patrik", "Muhamed", "Juliano", "Leon", "Oskar"],
    firstNamesKo: ["에를린", "마틴", "알렉산다르", "산도르", "안토뇨", "프레드리코", "크리스탄", "파트릭", "무하메드", "줄리아노", "레온", "오스카"],
    lastNames: ["Haalund", "Odegaarden", "Sorlothe", "Bergen", "Nusaa", "Aursness", "Thorstvedte", "Bergo", "Elyounoussy", "Ryersen", "Ostigaard", "Bobben"],
    lastNamesKo: ["홀란", "오데고르덴", "솔로테", "베르겐", "누사아", "아우르스네스", "토르스트베데", "베르고", "엘유누시", "라이어센", "오스티고르", "보벤"],
  },
  {
    code: "EG", name: { ko: "이집트", en: "Egypt" }, strength: 73,
    firstNames: ["Mohammod", "Omari", "Mostafan", "Trezegette", "Ahmedo", "Mahmude", "Emami", "Ramadane", "Tarique", "Akramo", "Hossamo", "Karimo"],
    firstNamesKo: ["모함모드", "오마리", "모스타판", "트레제게트", "아흐메도", "마흐무데", "에마미", "라마단", "타리크", "아크라모", "호삼오", "카리모"],
    lastNames: ["Salahin", "Marmoushi", "Mohamedi", "Hassane", "Sayedi", "Trezegetto", "Ashouri", "Sobhie", "Hamdiy", "Tawfiki", "Hassano", "Magdiy"],
    lastNamesKo: ["살라힌", "마르무시", "모하메디", "하사네", "사예디", "트레제게토", "아슈리", "소비에", "함디", "타우피키", "하사노", "마그디"],
  },
];

export const COUNTRY_BY_CODE: Record<string, Country> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c]),
);
