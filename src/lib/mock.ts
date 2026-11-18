// 목업용 가상 데이터 — 실제 아티스트·앨범과 무관한 가상의 이름과 색이에요.

export type MockMember = { id: string; name: string; color: string; birth: string };
export type MockArtist = {
  id: string;
  name: string;
  kind: "group" | "solo";
  color: string;
  description: string;
  debutYear: number;
  members: MockMember[];
};

export const ARTISTS: MockArtist[] = [
  {
    id: "lumi",
    name: "LUMI",
    kind: "group",
    color: "#ff6fa8",
    description: "5인조 걸그룹 · 2021 데뷔",
    debutYear: 2021,
    members: [
      { id: "lumi-ha", name: "하린", color: "#ff8fb8", birth: "05-16" },
      { id: "lumi-yu", name: "유나", color: "#9b8cff", birth: "01-03" },
      { id: "lumi-se", name: "세아", color: "#5cc8ff", birth: "08-21" },
      { id: "lumi-da", name: "다온", color: "#ffb347", birth: "11-27" },
      { id: "lumi-ri", name: "리오", color: "#6fd6a8", birth: "03-09" },
    ],
  },
  {
    id: "noa",
    name: "NOA",
    kind: "group",
    color: "#7c6cff",
    description: "4인조 보이그룹 · 2019 데뷔",
    debutYear: 2019,
    members: [
      { id: "noa-jun", name: "준", color: "#7c6cff", birth: "02-14" },
      { id: "noa-ian", name: "이안", color: "#4fb3ff", birth: "06-30" },
      { id: "noa-hyun", name: "현", color: "#ff7a7a", birth: "09-05" },
      { id: "noa-tae", name: "태오", color: "#ffc857", birth: "12-12" },
    ],
  },
  {
    id: "seoyun",
    name: "서윤",
    kind: "solo",
    color: "#ffa95c",
    description: "싱어송라이터 · 2016 데뷔",
    debutYear: 2016,
    members: [{ id: "seoyun", name: "서윤", color: "#ffa95c", birth: "04-22" }],
  },
];

export type AlbumFormat = "photobook" | "digipack" | "jewel" | "platform";
export type MockAlbum = {
  id: string;
  title: string;
  version: string;
  format: AlbumFormat;
  color: string;
  color2: string;
  year: number;
  owned: boolean;
};

export const ALBUMS: MockAlbum[] = [
  { id: "a1", title: "First Light", version: "Photobook", format: "photobook", color: "#ff9cc2", color2: "#ffd6e6", year: 2021, owned: true },
  { id: "a2", title: "First Light", version: "Digipack", format: "digipack", color: "#ffb3cf", color2: "#fff0f6", year: 2021, owned: true },
  { id: "a3", title: "Moonwalk", version: "Night ver.", format: "photobook", color: "#5b5bd6", color2: "#a9a9ff", year: 2022, owned: true },
  { id: "a4", title: "Moonwalk", version: "Day ver.", format: "photobook", color: "#ffd166", color2: "#fff3c4", year: 2022, owned: false },
  { id: "a5", title: "Sugar Rush", version: "Jewel", format: "jewel", color: "#ff7a7a", color2: "#ffd0d0", year: 2023, owned: true },
  { id: "a6", title: "Sugar Rush", version: "Platform", format: "platform", color: "#3a3a4a", color2: "#9a9ab0", year: 2023, owned: true },
  { id: "a7", title: "Blue Hour", version: "Photobook", format: "photobook", color: "#4fb3ff", color2: "#c8ecff", year: 2024, owned: true },
  { id: "a8", title: "Blue Hour", version: "Digipack", format: "digipack", color: "#3d8bd9", color2: "#b7dcff", year: 2024, owned: false },
  { id: "a9", title: "Petal", version: "Photobook", format: "photobook", color: "#c77dff", color2: "#efd6ff", year: 2025, owned: true },
  { id: "a10", title: "Petal", version: "Jewel", format: "jewel", color: "#e0aaff", color2: "#f7ecff", year: 2025, owned: false },
  { id: "a11", title: "Lumière", version: "Photobook", format: "photobook", color: "#6fd6a8", color2: "#d4f7e6", year: 2026, owned: true },
  { id: "a12", title: "Lumière", version: "Platform", format: "platform", color: "#2f6f5a", color2: "#9fd8c4", year: 2026, owned: false },
];

export type MockTrade = { date: string; kind: "구매" | "교환" | "양도" | "앨범 개봉"; price: number; memo?: string };
export type MockCard = {
  id: string;
  memberId: string;
  album: string;
  rare?: boolean;
  owned: boolean;
  /** 보유 포카 상세 (목업) */
  acquiredOn?: string;
  price?: number;
  history?: MockTrade[];
  binderSlot?: string;
};

const lumi = ARTISTS[0].members;
export const CARDS: MockCard[] = [
  { id: "c1", memberId: lumi[0].id, album: "First Light", owned: true, acquiredOn: "2021.05.20", price: 0, history: [{ date: "2021.05.20", kind: "앨범 개봉", price: 0, memo: "First Light 포토북" }] },
  { id: "c2", memberId: lumi[1].id, album: "First Light", owned: true, acquiredOn: "2021.06.02", price: 3000, history: [{ date: "2021.06.02", kind: "구매", price: 3000, memo: "번개장터" }] },
  { id: "c3", memberId: lumi[2].id, album: "First Light", owned: false },
  { id: "c4", memberId: lumi[3].id, album: "First Light", owned: true, rare: true, acquiredOn: "2022.01.15", price: 18000, history: [{ date: "2021.12.30", kind: "교환", price: 0, memo: "유나 포카와 교환 제안 → 무산" }, { date: "2022.01.15", kind: "구매", price: 18000, memo: "럭키드로우 · X 양도글" }] },
  { id: "c5", memberId: lumi[4].id, album: "Moonwalk", owned: true, acquiredOn: "2022.08.11", price: 0, history: [{ date: "2022.08.11", kind: "앨범 개봉", price: 0, memo: "Moonwalk Night ver." }] },
  { id: "c6", memberId: lumi[0].id, album: "Moonwalk", owned: true, rare: true, acquiredOn: "2022.09.03", price: 25000, history: [{ date: "2022.09.03", kind: "구매", price: 25000, memo: "팬사인회 특전" }] },
  { id: "c7", memberId: lumi[1].id, album: "Moonwalk", owned: false },
  { id: "c8", memberId: lumi[2].id, album: "Moonwalk", owned: true, acquiredOn: "2022.08.20", price: 4000, history: [{ date: "2022.08.20", kind: "교환", price: 4000, memo: "하린 포카 + 4,000원" }] },
  { id: "c9", memberId: lumi[3].id, album: "Sugar Rush", owned: true, acquiredOn: "2023.03.10", price: 0, history: [{ date: "2023.03.10", kind: "앨범 개봉", price: 0, memo: "Sugar Rush Jewel" }] },
  { id: "c10", memberId: lumi[4].id, album: "Sugar Rush", owned: false },
  { id: "c11", memberId: lumi[0].id, album: "Sugar Rush", owned: true, acquiredOn: "2023.03.10", price: 0, history: [{ date: "2023.03.10", kind: "앨범 개봉", price: 0 }] },
  { id: "c12", memberId: lumi[1].id, album: "Sugar Rush", owned: true, rare: true, acquiredOn: "2023.04.01", price: 32000, history: [{ date: "2023.04.01", kind: "구매", price: 32000, memo: "미공포 · 시세 확인 후 구매" }] },
];

export const memberById = (id: string) =>
  ARTISTS.flatMap((a) => a.members).find((m) => m.id === id) ?? lumi[0];

export type GoodsCategory = "lightstick" | "doll" | "keyring" | "slogan" | "poster" | "season";
export const GOODS_CATEGORIES: { id: GoodsCategory; label: string }[] = [
  { id: "lightstick", label: "응원봉" },
  { id: "doll", label: "인형" },
  { id: "keyring", label: "키링·아크릴" },
  { id: "slogan", label: "슬로건" },
  { id: "poster", label: "포스터·엽서" },
  { id: "season", label: "시즌그리팅" },
];

export type MockGoods = { id: string; category: GoodsCategory; name: string; color: string; price: number };
export const GOODS: MockGoods[] = [
  { id: "g1", category: "lightstick", name: "공식 응원봉 ver.2", color: "#ff6fa8", price: 49000 },
  { id: "g2", category: "doll", name: "하린 20cm 인형", color: "#ff8fb8", price: 32000 },
  { id: "g3", category: "doll", name: "유나 10cm 인형", color: "#9b8cff", price: 22000 },
  { id: "g4", category: "keyring", name: "로고 아크릴 키링", color: "#5cc8ff", price: 12000 },
  { id: "g5", category: "keyring", name: "생일카페 특전 키링", color: "#ffb347", price: 0 },
  { id: "g6", category: "slogan", name: "Lumière 투어 슬로건", color: "#6fd6a8", price: 18000 },
  { id: "g7", category: "poster", name: "Petal 접지 포스터", color: "#c77dff", price: 8000 },
  { id: "g8", category: "season", name: "2026 시즌그리팅", color: "#ffd166", price: 45000 },
];

export type MockExpense = { id: string; date: string; merchant: string; item: string; amount: number; category: string };
export const RECEIPT: MockExpense[] = [
  { id: "e1", date: "11.14", merchant: "공식 스토어", item: "Lumière 앨범 (Photobook)", amount: 19800, category: "앨범" },
  { id: "e2", date: "11.14", merchant: "공식 스토어", item: "로고 아크릴 키링", amount: 12000, category: "굿즈" },
  { id: "e3", date: "11.16", merchant: "티켓 예매처", item: "팬콘 R석 티켓", amount: 99000, category: "티켓" },
  { id: "e4", date: "11.17", merchant: "카페 블룸", item: "하린 생일카페 음료", amount: 6500, category: "생일카페" },
];
export const MONTHLY_BUDGET = 150000;

export const TIMELINE = [
  { date: "2021.05.16", label: "데뷔 쇼케이스", kind: "기념일", note: "5주년까지 D-179" },
  { date: "2023.11.18", label: "3년 전 오늘", kind: "N년 전 오늘", note: "Sugar Rush 첫 음방 1위" },
  { date: "2024.07.02", label: "첫 콘서트 다녀온 날", kind: "내 기록", note: "R석 · 슬로건 구매" },
  { date: "2025.11.18", label: "1년 전 오늘", kind: "N년 전 오늘", note: "Petal MV 비하인드 공개" },
  { date: "2026.11.25", label: "Lumière 리패키지 MV", kind: "다가오는 일정", note: "오후 6시 · 알림 켜짐" },
];
