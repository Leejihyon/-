// ─────────────────────────────────────────────────────────────
// 샘플 데이터. 업체명·단가·식수·1인분 사용량은 모두 시연용 가짜 값입니다.
// 실제 재료 목록·단가표·식단표가 들어오면 "재료·메뉴 관리"의 CSV 가져오기로 교체합니다.
// ─────────────────────────────────────────────────────────────
import { addDays, weekStart, todayISO, parse, monthOf, addMonths } from "../lib/date.js";
import { weekRequirements } from "../lib/calc.js";

// 식단표의 칸(형태). key는 저장용, label은 화면용, cat은 고를 수 있는 메뉴 분류
export const SLOTS = [
  { key: "rice", label: "밥", cat: "밥" },
  { key: "soup", label: "국", cat: "국" },
  { key: "main", label: "메인찬", cat: "메인찬" },
  { key: "side1", label: "부찬1", cat: "부찬" },
  { key: "box", label: "도시락찬", cat: "부찬" },
  { key: "side2", label: "부찬2", cat: "부찬" },
  { key: "side3", label: "부찬3", cat: "부찬" },
  { key: "kimchi", label: "김치", cat: "김치" },
  { key: "fruit", label: "과일", cat: "과일" },
  { key: "drink", label: "음료", cat: "음료" },
];
export const DEFAULT_SLOTS = ["rice", "soup", "main", "side1", "side2", "side3", "kimchi"];

export const SUPPLIERS = [
  { id: "sup1", name: "한결농산", manager: "", phone: "", terms: "월말 정산", note: "채소·곡류" },
  { id: "sup2", name: "울산축산", manager: "", phone: "", terms: "월말 정산", note: "육류·계란" },
  { id: "sup3", name: "동해수산", manager: "", phone: "", terms: "월말 정산", note: "수산·건어물" },
  { id: "sup4", name: "푸른양념", manager: "", phone: "", terms: "월말 정산", note: "양념·김치" },
  { id: "sup5", name: "가나다유통", manager: "", phone: "", terms: "월말 정산", note: "가공·냉동·음료" },
];

// [이름, 단위, 단가(단위당), 업체, 원산지, 분류]
const ING_ROWS = [
  ["백미", "kg", 2800, "sup1", "국산", "곡류"],
  ["무", "kg", 1800, "sup1", "국산", "채소"],
  ["배추", "kg", 1500, "sup1", "국산", "채소"],
  ["양파", "kg", 1500, "sup1", "국산", "채소"],
  ["대파", "kg", 3500, "sup1", "국산", "채소"],
  ["감자", "kg", 2200, "sup1", "국산", "채소"],
  ["당근", "kg", 2000, "sup1", "국산", "채소"],
  ["애호박", "kg", 2800, "sup1", "국산", "채소"],
  ["콩나물", "kg", 3000, "sup1", "국산", "채소"],
  ["시금치", "kg", 6000, "sup1", "국산", "채소"],
  ["양배추", "kg", 1400, "sup1", "국산", "채소"],
  ["오이", "kg", 3500, "sup1", "국산", "채소"],
  ["브로콜리", "kg", 5500, "sup1", "국산", "채소"],
  ["고구마", "kg", 3200, "sup1", "국산", "채소"],
  ["마늘", "kg", 9000, "sup1", "국산", "채소"],
  ["두부", "kg", 3000, "sup5", "국산", "가공"],
  ["사과", "개", 500, "sup1", "국산", "과일"],
  ["귤", "kg", 3500, "sup1", "국산", "과일"],
  ["소고기(국거리)", "kg", 24000, "sup2", "국내산", "육류"],
  ["소고기(불고기용)", "kg", 22000, "sup2", "호주산", "육류"],
  ["돼지고기(앞다리)", "kg", 9500, "sup2", "국내산", "육류"],
  ["돼지고기(목살)", "kg", 14000, "sup2", "국내산", "육류"],
  ["닭고기(정육)", "kg", 7500, "sup2", "국내산", "육류"],
  ["계란", "개", 220, "sup2", "국산", "육류"],
  ["고등어", "kg", 8500, "sup3", "노르웨이산", "수산"],
  ["오징어", "kg", 12000, "sup3", "원양산", "수산"],
  ["명태살", "kg", 9000, "sup3", "러시아산", "수산"],
  ["새우", "kg", 15000, "sup3", "베트남산", "수산"],
  ["건미역", "kg", 25000, "sup3", "국산", "수산"],
  ["멸치", "kg", 22000, "sup3", "국산", "수산"],
  ["어묵", "kg", 5500, "sup5", "국산", "가공"],
  ["간장", "L", 3500, "sup4", "국산", "양념"],
  ["고추장", "kg", 5500, "sup4", "국산", "양념"],
  ["된장", "kg", 4500, "sup4", "국산", "양념"],
  ["고춧가루", "kg", 18000, "sup4", "국산", "양념"],
  ["참기름", "L", 15000, "sup4", "국산", "양념"],
  ["식용유", "L", 3200, "sup4", "수입산", "양념"],
  ["설탕", "kg", 1500, "sup4", "국산", "양념"],
  ["소금", "kg", 800, "sup4", "국산", "양념"],
  ["밀가루", "kg", 1600, "sup4", "국산", "양념"],
  ["전분", "kg", 2200, "sup4", "국산", "양념"],
  ["카레가루", "kg", 6000, "sup4", "국산", "양념"],
  ["배추김치", "kg", 5500, "sup4", "국산", "김치"],
  ["깍두기", "kg", 5200, "sup4", "국산", "김치"],
  ["요구르트", "개", 350, "sup5", "국산", "음료"],
];
export const INGREDIENTS = ING_ROWS.map(([name, unit, price, supplierId, origin, category], i) => ({
  id: `ing${i + 1}`,
  name,
  unit,
  price,
  supplierId,
  origin,
  category,
  allergy: "",
}));
const ingId = (name) => INGREDIENTS.find((x) => x.name === name)?.id;

// [메뉴명, 분류, [[재료명, 1인분 사용량(g·ml, 개는 개수)], ...]]
const MENU_ROWS = [
  ["쌀밥", "밥", [["백미", 100]]],
  ["콩나물밥", "밥", [["백미", 90], ["콩나물", 30], ["간장", 3]]],
  ["미역국", "국", [["건미역", 3], ["소고기(국거리)", 15], ["참기름", 1], ["간장", 3], ["마늘", 1]]],
  ["소고기뭇국", "국", [["소고기(국거리)", 15], ["무", 40], ["대파", 5], ["마늘", 1], ["간장", 3]]],
  ["콩나물국", "국", [["콩나물", 40], ["대파", 5], ["마늘", 1], ["소금", 1]]],
  ["된장찌개", "국", [["된장", 12], ["두부", 20], ["애호박", 20], ["양파", 15], ["대파", 5]]],
  ["김치찌개", "국", [["배추김치", 40], ["돼지고기(앞다리)", 20], ["두부", 20], ["대파", 5]]],
  ["감자양파국", "국", [["감자", 30], ["양파", 15], ["대파", 5], ["멸치", 2]]],
  ["어묵국", "국", [["어묵", 25], ["무", 30], ["대파", 5], ["간장", 3]]],
  ["제육볶음", "메인찬", [["돼지고기(앞다리)", 80], ["양파", 25], ["대파", 5], ["고추장", 10], ["고춧가루", 2], ["설탕", 3], ["마늘", 2]]],
  ["소불고기", "메인찬", [["소고기(불고기용)", 70], ["양파", 30], ["당근", 10], ["간장", 10], ["설탕", 4], ["참기름", 1]]],
  ["닭갈비", "메인찬", [["닭고기(정육)", 100], ["양배추", 40], ["고구마", 20], ["고추장", 15], ["양파", 20]]],
  ["고등어조림", "메인찬", [["고등어", 80], ["무", 40], ["양파", 15], ["고춧가루", 3], ["간장", 8]]],
  ["오징어볶음", "메인찬", [["오징어", 70], ["양파", 25], ["대파", 5], ["고추장", 10]]],
  ["돈까스", "메인찬", [["돼지고기(목살)", 90], ["밀가루", 10], ["계란", 0.3], ["식용유", 10]]],
  ["닭강정", "메인찬", [["닭고기(정육)", 90], ["전분", 15], ["식용유", 15], ["설탕", 8], ["간장", 5]]],
  ["카레라이스소스", "메인찬", [["카레가루", 15], ["감자", 40], ["당근", 20], ["양파", 30], ["돼지고기(앞다리)", 25]]],
  ["동태전", "메인찬", [["명태살", 70], ["밀가루", 10], ["계란", 0.4], ["식용유", 8]]],
  ["계란말이", "부찬", [["계란", 1], ["당근", 5], ["대파", 3], ["식용유", 3]]],
  ["어묵볶음", "부찬", [["어묵", 30], ["양파", 15], ["당근", 8], ["간장", 5], ["식용유", 3]]],
  ["시금치나물", "부찬", [["시금치", 50], ["참기름", 1], ["소금", 1], ["마늘", 1]]],
  ["콩나물무침", "부찬", [["콩나물", 50], ["참기름", 1], ["대파", 3], ["소금", 1]]],
  ["감자볶음", "부찬", [["감자", 60], ["양파", 10], ["식용유", 5], ["소금", 1]]],
  ["애호박볶음", "부찬", [["애호박", 60], ["대파", 3], ["식용유", 4], ["새우", 5]]],
  ["오이무침", "부찬", [["오이", 50], ["고춧가루", 1], ["마늘", 1], ["설탕", 1]]],
  ["브로콜리무침", "부찬", [["브로콜리", 50], ["고추장", 5], ["설탕", 1]]],
  ["멸치볶음", "부찬", [["멸치", 10], ["간장", 3], ["설탕", 2], ["식용유", 2]]],
  ["두부조림", "부찬", [["두부", 70], ["간장", 6], ["고춧가루", 1], ["대파", 3]]],
  ["무생채", "부찬", [["무", 60], ["고춧가루", 2], ["설탕", 1], ["마늘", 1]]],
  ["배추김치", "김치", [["배추김치", 40]]],
  ["깍두기", "김치", [["깍두기", 40]]],
  ["사과", "과일", [["사과", 0.5]]],
  ["귤", "과일", [["귤", 80]]],
  ["요구르트", "음료", [["요구르트", 1]]],
  ["(재료 미등록 메뉴)", "메인찬", []],
];
export const MENUS = MENU_ROWS.map(([name, cat, lines], i) => ({
  id: `m${i + 1}`,
  name,
  cat,
  lines: lines.map(([n, amt]) => ({ ingId: ingId(n), amt })),
}));
const menuId = (name) => MENUS.find((m) => m.name === name)?.id;

export const SITES = [
  {
    id: "s1",
    name: "동서석유화학",
    type: "위탁",
    status: "거래중",
    dietitian: "조의숙",
    meals: { 조식: false, 중식: true, 석식: true, 야식: false },
    days: [true, true, true, true, true, false, false],
    headcount: { 조식: 0, 중식: 620, 석식: 180, 야식: 0 },
    price: { 조식: 0, 중식: 6200, 석식: 6200, 야식: 0 },
    contractWeekly: 0,
    loss: 5,
    slots: DEFAULT_SLOTS,
    sample: true,
    staff: [
      { id: "st1", name: "조의숙", role: "영양사", canInput: true },
      { id: "st2", name: "조리장(샘플)", role: "조리", canInput: true },
      { id: "st3", name: "조리원(샘플)", role: "조리", canInput: false },
    ],
  },
  {
    id: "s2",
    name: "샘플 업장 B",
    type: "위탁",
    status: "거래중",
    dietitian: "(미지정)",
    meals: { 조식: false, 중식: true, 석식: false, 야식: false },
    days: [true, true, true, true, true, false, false],
    headcount: { 조식: 0, 중식: 410, 석식: 0, 야식: 0 },
    price: { 조식: 0, 중식: 6000, 석식: 0, 야식: 0 },
    contractWeekly: 0,
    loss: 5,
    slots: DEFAULT_SLOTS,
    sample: true,
    staff: [],
  },
];

// ── 샘플 식단표: 요일마다 메뉴를 돌려가며 채움
const ROT = {
  rice: ["쌀밥", "콩나물밥", "쌀밥", "쌀밥", "쌀밥"],
  soup: ["미역국", "소고기뭇국", "콩나물국", "된장찌개", "김치찌개", "감자양파국", "어묵국"],
  main: ["제육볶음", "소불고기", "닭갈비", "고등어조림", "오징어볶음", "돈까스", "닭강정", "카레라이스소스", "동태전"],
  side1: ["계란말이", "어묵볶음", "감자볶음", "두부조림", "멸치볶음"],
  side2: ["시금치나물", "콩나물무침", "애호박볶음", "오이무침", "브로콜리무침"],
  side3: ["무생채", "오이무침", "시금치나물", "콩나물무침", "브로콜리무침"],
  kimchi: ["배추김치", "깍두기"],
};
export function makeWeekPlan(site, ws, seed = 0) {
  const plan = {};
  const meals = Object.keys(site.meals).filter((m) => site.meals[m]);
  for (let d = 0; d < 7; d++) {
    if (!site.days[d]) continue;
    meals.forEach((meal, mi) => {
      site.slots.forEach((slot) => {
        const list = ROT[slot];
        if (!list) return;
        const name = list[(seed * 3 + d * 2 + mi * 5 + slot.length) % list.length];
        plan[`${d}|${meal}|${slot}`] = menuId(name);
      });
    });
  }
  return plan;
}

// ── 샘플 마감(일일 실식수·잔반): 지난 14일
function makeClosings(site) {
  const out = {};
  const today = todayISO();
  for (let i = 1; i <= 14; i++) {
    const date = addDays(today, -i);
    const dow = (parse(date).getDay() + 6) % 7;
    if (!site.days[dow]) continue;
    const rec = {};
    ["중식", "석식"].forEach((meal) => {
      if (!site.meals[meal]) return;
      const base = site.headcount[meal];
      const wobble = ((i * 37 + (meal === "석식" ? 11 : 0)) % 21) - 10; // -10..10
      rec[meal] = { count: Math.max(0, base + wobble * 3), waste: 18 + ((i * 7) % 15) };
    });
    out[`${site.id}|${date}`] = { ...rec, memo: "" };
  }
  return out;
}

export function makeSeed() {
  const thisWs = weekStart(todayISO());
  const plans = {};
  SITES.forEach((site) => {
    [-7, 0, 7, 14].forEach((off, idx) => {
      const ws = addDays(thisWs, off);
      plans[`${site.id}|${ws}`] = makeWeekPlan(site, ws, idx + (site.id === "s2" ? 2 : 0));
    });
  });
  let closings = {};
  SITES.forEach((s) => (closings = { ...closings, ...makeClosings(s) }));
  // 지난주 식단으로 만든 샘플 발주서(입고 완료) + 샘플 인건비·경비
  const base = {
    sites: SITES, suppliers: SUPPLIERS, ingredients: INGREDIENTS, menus: MENUS, plans,
  };
  const orders = [];
  const prevWs = addDays(thisWs, -7);
  SITES.forEach((site) => {
    const req = weekRequirements(base, site, prevWs);
    Object.entries(req.bySupplier).forEach(([sid, rows]) => {
      const first = Math.min(...rows.map((r) => r.firstDay));
      const due = addDays(prevWs, Math.max(0, first - 1));
      const n = orders.length + 1;
      orders.push({
        id: `PO-${prevWs.replaceAll("-", "")}-${String(n).padStart(3, "0")}`,
        siteId: site.id, supplierId: sid, weekStart: prevWs, due, status: "입고완료", receivedAt: due, createdAt: addDays(due, -2),
        lines: rows.map((r) => ({ ingId: r.ingId, name: r.name, unit: r.unit, qty: r.qty, price: r.price })),
      });
    });
  });
  const ym = monthOf(todayISO());
  const monthExtra = {
    [`s1|${ym}`]: { labor: 9000000, expense: 1800000 },
    [`s2|${ym}`]: { labor: 4200000, expense: 900000 },
    [`s1|${addMonths(ym, -1)}`]: { labor: 17000000, expense: 3200000 },
  };
  return {
    siteId: "s1",
    sites: SITES,
    suppliers: SUPPLIERS,
    ingredients: INGREDIENTS,
    menus: MENUS,
    plans,
    orders,
    closings,
    monthExtra, // `${siteId}|${YYYY-MM}` → {labor, expense}
    preserve: {}, // `${siteId}|${date}|${meal}` → {time, temp, by}
    tasting: {}, // `${siteId}|${date}|${meal}` → {time, result, note}
    meetings: {}, // `${siteId}|${weekStart}` → {...}
  };
}
