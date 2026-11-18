import React, { useState } from "react";
import { Search, Snowflake, Printer, Wand2, Trash2 } from "lucide-react";
import { useStore } from "../store.jsx";
import { Btn, Card, Empty, PageHead, SitePicker, Stepper, Tag } from "../ui.jsx";
import { DAYS, addDays, md, todayISO, weekLabel, weekStart } from "../lib/date.js";
import { activeMeals } from "../lib/calc.js";
import { SLOTS } from "../data/seed.js";

// 주간 식단 → [{date, meal, names:[...] }]
function useWeekSlots(ws) {
  const { s, site } = useStore();
  const plan = s.plans[`${site.id}|${ws}`] || {};
  const menuById = Object.fromEntries(s.menus.map((m) => [m.id, m]));
  const out = [];
  for (let d = 0; d < 7; d++) {
    if (!site.days[d]) continue;
    activeMeals(site).forEach((meal) => {
      const names = SLOTS.filter((x) => site.slots.includes(x.key))
        .map((x) => menuById[plan[`${d}|${meal}|${x.key}`]]?.name)
        .filter(Boolean);
      out.push({ date: addDays(ws, d), d, meal, names });
    });
  }
  return out;
}

export function Tasting() {
  const { s, site, update } = useStore();
  const [ws, setWs] = useState(weekStart(todayISO()));
  const rows = useWeekSlots(ws);
  const set = (date, meal, patch) =>
    update((p) => {
      const k = `${site.id}|${date}|${meal}`;
      return { ...p, tasting: { ...p.tasting, [k]: { ...(p.tasting[k] || {}), ...patch } } };
    });
  const fillAll = () =>
    rows.forEach((r) => {
      const cur = s.tasting[`${site.id}|${r.date}|${r.meal}`] || {};
      if (!cur.time) set(r.date, r.meal, { time: r.meal === "중식" ? "11:00" : r.meal === "석식" ? "16:30" : "07:00", result: "적합", by: site.dietitian });
    });

  return (
    <div>
      <PageHead icon={Search} title="검식일지" desc="메뉴는 식단표에서 자동으로 채워집니다. 검식 시간과 판정만 입력하세요.">
        <SitePicker />
        <Stepper label={weekLabel(ws)} onPrev={() => setWs(addDays(ws, -7))} onNext={() => setWs(addDays(ws, 7))} onToday={() => setWs(weekStart(todayISO()))} />
        <Btn icon={Wand2} onClick={fillAll}>검식 일괄 기록</Btn>
        <Btn icon={Printer} variant="dark" onClick={() => window.print()}>주간 전체 인쇄</Btn>
      </PageHead>
      {rows.length === 0 ? (
        <Card><Empty>이 주에는 운영하는 날이 없습니다.</Empty></Card>
      ) : rows.every((r) => !r.names.length) ? (
        <Card><Empty>이 주의 식단표가 비어 있습니다. 「영양사 식단」에서 먼저 입력해 주세요.</Empty></Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <th className="px-4 py-3">일자</th><th className="px-4 py-3">끼니</th><th className="px-4 py-3">메뉴</th>
                <th className="px-4 py-3">검식 시간</th><th className="px-4 py-3">판정</th><th className="px-4 py-3">의견</th><th className="px-4 py-3">확인자</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const v = s.tasting[`${site.id}|${r.date}|${r.meal}`] || {};
                return (
                  <tr key={r.date + r.meal} className="align-top">
                    <td className="whitespace-nowrap px-4 py-2.5 font-medium tabular-nums">{md(r.date)}({DAYS[r.d]})</td>
                    <td className="px-4 py-2.5"><Tag tone={r.meal === "중식" ? "blue" : "amber"}>{r.meal}</Tag></td>
                    <td className="max-w-[320px] px-4 py-2.5 text-xs leading-relaxed text-slate-600">{r.names.join(" · ") || <span className="text-slate-300">식단 없음</span>}</td>
                    <td className="px-4 py-2"><input type="time" value={v.time || ""} onChange={(e) => set(r.date, r.meal, { time: e.target.value })} className="h-8 rounded-lg border border-slate-200 px-2 text-xs" /></td>
                    <td className="px-4 py-2">
                      <select value={v.result || ""} onChange={(e) => set(r.date, r.meal, { result: e.target.value })} className={`h-8 rounded-lg border px-2 text-xs ${v.result === "부적합" ? "border-rose-300 text-rose-600" : "border-slate-200"}`}>
                        <option value="">-</option><option>적합</option><option>부적합</option>
                      </select>
                    </td>
                    <td className="px-4 py-2"><input value={v.note || ""} onChange={(e) => set(r.date, r.meal, { note: e.target.value })} className="h-8 w-full min-w-[120px] rounded-lg border border-slate-200 px-2 text-xs" /></td>
                    <td className="px-4 py-2"><input value={v.by || ""} onChange={(e) => set(r.date, r.meal, { by: e.target.value })} className="h-8 w-20 rounded-lg border border-slate-200 px-2 text-xs" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

export function Preserve() {
  const { s, site, update } = useStore();
  const [ws, setWs] = useState(weekStart(todayISO()));
  const rows = useWeekSlots(ws).filter((r) => r.names.length);
  const keyOf = (r) => `${site.id}|${r.date}|${r.meal}`;
  const setRec = (r, patch) => update((p) => ({ ...p, preserve: { ...p.preserve, [keyOf(r)]: { ...(p.preserve[keyOf(r)] || {}), ...patch } } }));
  const generate = () =>
    update((p) => {
      const next = { ...p.preserve };
      weekSlotsPure(p, site, ws).forEach((r) => {
        if (!next[`${site.id}|${r.date}|${r.meal}`])
          next[`${site.id}|${r.date}|${r.meal}`] = { time: r.meal === "중식" ? "11:30" : r.meal === "석식" ? "17:00" : "07:30", temp: "-18", disposal: addDays(r.date, 7), by: site.dietitian };
      });
      return { ...p, preserve: next };
    });
  const clearWeek = () => {
    if (!confirm("이번 주 보존식 기록을 모두 삭제할까요?")) return;
    update((p) => {
      const next = { ...p.preserve };
      rows.forEach((r) => delete next[keyOf(r)]);
      return { ...p, preserve: next };
    });
  };

  return (
    <div>
      <PageHead icon={Snowflake} title="보존식 관리" desc="식단이 자동으로 채워지고, 폐기일은 기본 +7일입니다.">
        <SitePicker />
        <Stepper label={weekLabel(ws)} onPrev={() => setWs(addDays(ws, -7))} onNext={() => setWs(addDays(ws, 7))} onToday={() => setWs(weekStart(todayISO()))} />
        <Btn icon={Wand2} variant="green" onClick={generate}>이번주 일괄 생성</Btn>
        <Btn icon={Trash2} variant="danger" onClick={clearWeek}>일괄 삭제</Btn>
        <Btn icon={Printer} variant="dark" onClick={() => window.print()}>주간 인쇄</Btn>
      </PageHead>
      {rows.length === 0 ? (
        <Card><Empty>이 주의 식단표가 비어 있습니다.</Empty></Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <th className="px-4 py-3">일자</th><th className="px-4 py-3">끼니</th><th className="px-4 py-3">보존식 메뉴</th>
                <th className="px-4 py-3">채취 시각</th><th className="px-4 py-3">보관 온도(℃)</th><th className="px-4 py-3">폐기 예정일</th><th className="px-4 py-3">담당</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const v = s.preserve[keyOf(r)] || {};
                return (
                  <tr key={r.date + r.meal}>
                    <td className="whitespace-nowrap px-4 py-2.5 font-medium tabular-nums">{md(r.date)}({DAYS[r.d]})</td>
                    <td className="px-4 py-2.5"><Tag tone={r.meal === "중식" ? "blue" : "amber"}>{r.meal}</Tag></td>
                    <td className="max-w-[300px] px-4 py-2.5 text-xs text-slate-600">{r.names.join(" · ")}</td>
                    <td className="px-4 py-2"><input type="time" value={v.time || ""} onChange={(e) => setRec(r, { time: e.target.value })} className="h-8 rounded-lg border border-slate-200 px-2 text-xs" /></td>
                    <td className="px-4 py-2"><input value={v.temp || ""} onChange={(e) => setRec(r, { temp: e.target.value })} className="h-8 w-16 rounded-lg border border-slate-200 px-2 text-right text-xs" /></td>
                    <td className="px-4 py-2"><input type="date" value={v.disposal || ""} onChange={(e) => setRec(r, { disposal: e.target.value })} className="h-8 rounded-lg border border-slate-200 px-2 text-xs" /></td>
                    <td className="px-4 py-2"><input value={v.by || ""} onChange={(e) => setRec(r, { by: e.target.value })} className="h-8 w-20 rounded-lg border border-slate-200 px-2 text-xs" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// update() 콜백 안에서는 훅을 못 쓰므로 같은 계산을 순수 함수로 한 번 더 둔다
function weekSlotsPure(p, site, ws) {
  const plan = p.plans[`${site.id}|${ws}`] || {};
  const menuById = Object.fromEntries(p.menus.map((m) => [m.id, m]));
  const out = [];
  for (let d = 0; d < 7; d++) {
    if (!site.days[d]) continue;
    activeMeals(site).forEach((meal) => {
      const names = SLOTS.filter((x) => site.slots.includes(x.key))
        .map((x) => menuById[plan[`${d}|${meal}|${x.key}`]]?.name)
        .filter(Boolean);
      if (names.length) out.push({ date: addDays(ws, d), d, meal, names });
    });
  }
  return out;
}
