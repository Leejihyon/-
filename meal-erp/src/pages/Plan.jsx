import React, { useMemo, useState } from "react";
import { UtensilsCrossed, Copy, Eraser, ShoppingCart } from "lucide-react";
import { useStore } from "../store.jsx";
import { Btn, Card, Chip, PageHead, SitePicker, Stepper, Stat } from "../ui.jsx";
import { SLOTS } from "../data/seed.js";
import { DAYS, MEALS, addDays, md, todayISO, weekLabel, weekStart } from "../lib/date.js";
import { activeMeals, fmt, weekRequirements } from "../lib/calc.js";

const MEAL_TONE = {
  조식: "bg-emerald-50/60",
  중식: "bg-sky-50/60",
  석식: "bg-amber-50/60",
  야식: "bg-violet-50/60",
};

export default function Plan({ nav }) {
  const { s, site, update, patchSite } = useStore();
  const [ws, setWs] = useState(weekStart(todayISO()));
  const key = `${site.id}|${ws}`;
  const plan = s.plans[key] || {};
  const meals = activeMeals(site);
  const slots = SLOTS.filter((x) => site.slots.includes(x.key));
  const menusByCat = useMemo(() => {
    const o = {};
    s.menus.forEach((m) => (o[m.cat] ||= []).push(m));
    return o;
  }, [s.menus]);
  const menuById = useMemo(() => Object.fromEntries(s.menus.map((m) => [m.id, m])), [s.menus]);
  const req = useMemo(() => weekRequirements(s, site, ws), [s, site, ws]);

  const setCell = (d, meal, slot, id) =>
    update((p) => ({
      ...p,
      plans: { ...p.plans, [key]: { ...(p.plans[key] || {}), [`${d}|${meal}|${slot}`]: id || undefined } },
    }));

  const copyPrev = () => {
    const prev = s.plans[`${site.id}|${addDays(ws, -7)}`];
    if (!prev) return alert("지난주 식단표가 없습니다.");
    if (Object.keys(plan).length && !confirm("이미 입력된 식단표를 지난주 것으로 덮어쓸까요?")) return;
    update((p) => ({ ...p, plans: { ...p.plans, [key]: { ...prev } } }));
  };
  const clearAll = () => {
    if (confirm("이번 주 식단표를 모두 비울까요?")) update((p) => ({ ...p, plans: { ...p.plans, [key]: {} } }));
  };
  const toggleMeal = (m) => patchSite(site.id, { meals: { ...site.meals, [m]: !site.meals[m] } });
  const toggleDay = (i) => patchSite(site.id, { days: site.days.map((v, k) => (k === i ? !v : v)) });
  const toggleSlot = (k) =>
    patchSite(site.id, {
      slots: site.slots.includes(k) ? site.slots.filter((x) => x !== k) : SLOTS.map((x) => x.key).filter((x) => x === k || site.slots.includes(x)),
    });

  const totalMeals = meals.reduce(
    (sum, m) => sum + site.days.filter(Boolean).length * (site.headcount[m] || 0),
    0
  );

  return (
    <div>
      <PageHead icon={UtensilsCrossed} title="영양사 식단" desc="식단표를 입력하면 필요한 식재료와 발주서가 자동으로 계산됩니다.">
        <SitePicker />
        <Stepper
          label={weekLabel(ws)}
          onPrev={() => setWs(addDays(ws, -7))}
          onNext={() => setWs(addDays(ws, 7))}
          onToday={() => setWs(weekStart(todayISO()))}
        />
      </PageHead>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="이번 주 총 식수" value={`${fmt(totalMeals)}식`} sub={`${meals.join("·") || "운영 끼니 없음"}`} />
        <Stat label="예상 식재료비" value={`${fmt(req.total)}원`} sub="식단표 기준 · 손실률 포함" />
        <Stat label="1식당 식재료비" value={totalMeals ? `${fmt(req.total / totalMeals)}원` : "-"} sub={`계약 단가 ${fmt(site.price.중식)}원 (중식)`} />
        <Stat
          label="재료 없는 메뉴"
          value={`${req.missingMenus.length}개`}
          sub={req.missingMenus.length ? req.missingMenus.slice(0, 2).join(", ") : "모든 메뉴에 재료가 연결됨"}
          tone={req.missingMenus.length ? "text-amber-600" : "text-emerald-600"}
        />
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">운영</span>
            {MEALS.map((m) => (
              <Chip key={m} on={site.meals[m]} onClick={() => toggleMeal(m)}>{m}</Chip>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">요일</span>
            {DAYS.map((d, i) => (
              <Chip key={d} on={site.days[i]} onClick={() => toggleDay(i)} className={i >= 5 && site.days[i] ? "!bg-rose-500" : ""}>{d}</Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-500">형태</span>
            {SLOTS.map((x) => (
              <Chip key={x.key} on={site.slots.includes(x.key)} onClick={() => toggleSlot(x.key)}>{x.label}</Chip>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Btn icon={Copy} onClick={copyPrev}>지난주 복사</Btn>
            <Btn icon={Eraser} variant="danger" onClick={clearAll}>비우기</Btn>
            <Btn icon={ShoppingCart} variant="primary" onClick={() => nav("order", { ws })}>이 식단으로 발주</Btn>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-400">
          메뉴 색: <span className="font-semibold text-amber-600">재료 없음</span> / <span className="font-semibold text-sky-600">재료 있음</span> ·
          식수·단가·손실률은 「업장 관리」에서 바꿉니다.
        </p>
      </Card>

      {meals.length === 0 || slots.length === 0 ? (
        <Card className="py-16 text-center text-sm text-slate-400">운영 끼니와 형태를 한 개 이상 켜 주세요.</Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="w-12 border-b border-r border-slate-200 py-2">구분</th>
                <th className="w-16 border-b border-r border-slate-200 py-2">형태</th>
                {DAYS.map((d, i) => (
                  <th key={d} className={`border-b border-r border-slate-200 py-2 ${i >= 5 ? "text-rose-500" : ""} ${site.days[i] ? "" : "opacity-40"}`}>
                    {d} <span className="font-normal text-slate-400">{md(addDays(ws, i))}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meals.map((meal) =>
                slots.map((slot, si) => (
                  <tr key={meal + slot.key} className={MEAL_TONE[meal]}>
                    {si === 0 && (
                      <td rowSpan={slots.length} className="border-b border-r border-slate-200 text-center text-sm font-bold text-slate-700">
                        {meal}
                      </td>
                    )}
                    <td className="border-b border-r border-slate-200 px-2 py-1 text-center font-semibold text-slate-600">{slot.label}</td>
                    {DAYS.map((_, d) => {
                      const id = plan[`${d}|${meal}|${slot.key}`] || "";
                      const m = id ? menuById[id] : null;
                      const off = !site.days[d];
                      return (
                        <td key={d} className={`border-b border-r border-slate-200 p-0.5 ${off ? "bg-slate-100/70" : ""}`}>
                          <select
                            disabled={off}
                            value={id}
                            onChange={(e) => setCell(d, meal, slot.key, e.target.value)}
                            className={`h-8 w-full cursor-pointer rounded-md border-0 bg-transparent px-1 text-xs outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-rose-300 ${
                              m ? (m.lines.length ? "font-medium text-sky-700" : "font-medium text-amber-600") : "text-slate-300"
                            } disabled:cursor-not-allowed`}
                          >
                            <option value="">입력…</option>
                            {(menusByCat[slot.cat] || []).map((x) => (
                              <option key={x.id} value={x.id}>{x.name}</option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
