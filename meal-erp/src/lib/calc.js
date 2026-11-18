import { addDays, daysInMonth, todayISO } from "./date.js";
import { MEALS } from "./date.js";

export const fmt = (n) => (n == null || Number.isNaN(n) ? "-" : Math.round(n).toLocaleString("ko-KR"));
export const fmt1 = (n) => (Number(n) || 0).toLocaleString("ko-KR", { maximumFractionDigits: 1 });

// 1인분 사용량(g·ml, 개는 개수) → 재료 단위(kg·L·개)
export const toUnit = (ing, amt) => (ing.unit === "개" ? amt : amt / 1000);

// 발주 수량 올림: 개는 정수, kg·L는 0.1 단위
export const roundUp = (unit, q) => (unit === "개" ? Math.ceil(q - 1e-9) : Math.ceil(q * 10 - 1e-9) / 10);

export const activeMeals = (site) => MEALS.filter((m) => site.meals[m]);

/**
 * 한 주 식단표 → 재료별 필요량.
 * 필요량 = Σ (1인분 사용량 × 식수) × (1 + 손실률)
 */
export function weekRequirements(state, site, ws) {
  const plan = state.plans[`${site.id}|${ws}`] || {};
  const menuById = Object.fromEntries(state.menus.map((m) => [m.id, m]));
  const ingById = Object.fromEntries(state.ingredients.map((i) => [i.id, i]));
  const loss = 1 + (site.loss || 0) / 100;
  const acc = {};
  const missingMenus = new Set();
  let filled = 0;

  Object.entries(plan).forEach(([key, mid]) => {
    if (!mid) return;
    const [d, meal] = key.split("|");
    const di = Number(d);
    if (!site.days[di] || !site.meals[meal]) return;
    const menu = menuById[mid];
    if (!menu) return;
    filled++;
    const count = site.headcount[meal] || 0;
    if (!menu.lines.length) missingMenus.add(menu.name);
    menu.lines.forEach((ln) => {
      const ing = ingById[ln.ingId];
      if (!ing) return;
      const a = (acc[ing.id] ||= { ing, raw: 0, firstDay: di, menus: new Set() });
      a.raw += toUnit(ing, ln.amt) * count * loss;
      a.firstDay = Math.min(a.firstDay, di);
      a.menus.add(menu.name);
    });
  });

  const rows = Object.values(acc)
    .map((a) => {
      const qty = roundUp(a.ing.unit, a.raw);
      return {
        ingId: a.ing.id,
        name: a.ing.name,
        unit: a.ing.unit,
        supplierId: a.ing.supplierId,
        price: a.ing.price,
        raw: a.raw,
        qty,
        cost: qty * a.ing.price,
        firstDay: a.firstDay,
        menus: [...a.menus],
      };
    })
    .sort((x, y) => x.supplierId.localeCompare(y.supplierId) || x.name.localeCompare(y.name, "ko"));

  const bySupplier = {};
  rows.forEach((r) => (bySupplier[r.supplierId] ||= []).push(r));
  const total = rows.reduce((s, r) => s + r.cost, 0);
  return { rows, bySupplier, total, missingMenus: [...missingMenus], filled };
}

// 발주번호: PO-YYYYMMDD-NNN
export function nextOrderId(orders, dateISO) {
  const p = `PO-${dateISO.replaceAll("-", "")}-`;
  const n = orders.filter((o) => o.id.startsWith(p)).length + 1;
  return p + String(n).padStart(3, "0");
}

export const orderTotal = (o) => o.lines.reduce((s, l) => s + l.qty * l.price, 0);

// 월 마감 집계
export function monthSummary(state, siteId, ym) {
  const site = state.sites.find((s) => s.id === siteId);
  let meals = 0;
  let sales = 0;
  let days = 0;
  let waste = 0;
  const n = daysInMonth(ym);
  for (let d = 1; d <= n; d++) {
    const date = `${ym}-${String(d).padStart(2, "0")}`;
    const c = state.closings[`${siteId}|${date}`];
    if (!c) continue;
    let any = false;
    MEALS.forEach((m) => {
      if (c[m]?.count > 0) {
        meals += c[m].count;
        sales += c[m].count * (site?.price?.[m] || 0);
        waste += Number(c[m].waste) || 0;
        any = true;
      }
    });
    if (any) days++;
  }
  const food = state.orders
    .filter((o) => o.siteId === siteId && o.status !== "작성중" && o.due.startsWith(ym))
    .reduce((s, o) => s + orderTotal(o), 0);
  const extra = state.monthExtra[`${siteId}|${ym}`] || {};
  const labor = Number(extra.labor) || 0;
  const expense = Number(extra.expense) || 0;
  const profit = sales - food - labor - expense;
  return {
    meals, sales, days, waste, food, labor, expense, profit,
    foodRate: sales ? (food / sales) * 100 : 0,
    laborRate: sales ? (labor / sales) * 100 : 0,
    profitRate: sales ? (profit / sales) * 100 : 0,
  };
}

// 납품 예정일 기본값: 첫 사용일 전날, 단 이미 지난 날짜면 내일
export const defaultDue = (ws, firstDay) => {
  const d = addDays(ws, Math.max(0, firstDay - 1));
  const tomorrow = addDays(todayISO(), 1);
  return d < tomorrow ? tomorrow : d;
};
