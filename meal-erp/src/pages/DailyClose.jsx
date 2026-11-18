import React, { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { useStore } from "../store.jsx";
import { Card, PageHead, SitePicker, Stat, Stepper } from "../ui.jsx";
import { addMonths, daysInMonth, dowKo, todayISO, monthOf, parse } from "../lib/date.js";
import { activeMeals, fmt, fmt1, monthSummary } from "../lib/calc.js";

export default function DailyClose() {
  const { s, site, update } = useStore();
  const [ym, setYm] = useState(monthOf(todayISO()));
  const meals = activeMeals(site);
  const n = daysInMonth(ym);
  const today = todayISO();
  const sum = monthSummary(s, site.id, ym);

  const setVal = (date, meal, field, v) =>
    update((p) => {
      const k = `${site.id}|${date}`;
      const cur = p.closings[k] || {};
      const num = v === "" ? "" : Math.max(0, Number(v));
      return { ...p, closings: { ...p.closings, [k]: { ...cur, [meal]: { ...(cur[meal] || {}), [field]: num } } } };
    });
  const setMemo = (date, v) =>
    update((p) => {
      const k = `${site.id}|${date}`;
      return { ...p, closings: { ...p.closings, [k]: { ...(p.closings[k] || {}), memo: v } } };
    });

  const dates = Array.from({ length: n }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`);

  return (
    <div>
      <PageHead icon={CalendarCheck} title="일마감" desc="매일 실제 식수와 잔반량을 입력하면 월마감에 자동으로 모입니다.">
        <SitePicker />
        <Stepper label={ym.replace("-", "년 ") + "월"} onPrev={() => setYm(addMonths(ym, -1))} onNext={() => setYm(addMonths(ym, 1))} onToday={() => setYm(monthOf(today))} />
      </PageHead>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="마감 일수" value={`${sum.days}일`} />
        <Stat label="누적 식수" value={`${fmt(sum.meals)}식`} />
        <Stat label="누적 매출" value={`${fmt(sum.sales)}원`} sub="식수 × 계약 단가" />
        <Stat label="누적 잔반" value={`${fmt1(sum.waste)}kg`} />
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
              <th className="w-24 px-4 py-3 text-left">날짜</th>
              {meals.map((m) => (
                <th key={m} colSpan={2} className="border-l border-slate-200 px-2 py-3 text-center">{m} <span className="font-normal text-slate-400">식수 · 잔반(kg)</span></th>
              ))}
              <th className="border-l border-slate-200 px-4 py-3 text-left">메모</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dates.map((date) => {
              const dow = (parse(date).getDay() + 6) % 7;
              const off = !site.days[dow];
              const rec = s.closings[`${site.id}|${date}`] || {};
              const future = date > today;
              return (
                <tr key={date} className={`${off ? "bg-slate-50 text-slate-300" : ""} ${date === today ? "bg-rose-50/60" : ""}`}>
                  <td className="px-4 py-1.5 tabular-nums">
                    <span className={dow >= 5 ? "text-rose-500" : ""}>{Number(date.slice(8))}일({dowKo(date)})</span>
                  </td>
                  {meals.map((m) => (
                    <React.Fragment key={m}>
                      <td className="border-l border-slate-100 px-1 py-1">
                        <input type="number" min="0" disabled={off || future} placeholder={off ? "" : String(site.headcount[m])}
                          value={rec[m]?.count ?? ""} onChange={(e) => setVal(date, m, "count", e.target.value)}
                          className="h-8 w-full rounded-md border border-slate-200 px-2 text-right tabular-nums placeholder:text-slate-300 disabled:border-transparent disabled:bg-transparent" />
                      </td>
                      <td className="px-1 py-1">
                        <input type="number" min="0" step="0.1" disabled={off || future}
                          value={rec[m]?.waste ?? ""} onChange={(e) => setVal(date, m, "waste", e.target.value)}
                          className="h-8 w-full rounded-md border border-slate-200 px-2 text-right tabular-nums disabled:border-transparent disabled:bg-transparent" />
                      </td>
                    </React.Fragment>
                  ))}
                  <td className="border-l border-slate-100 px-1 py-1">
                    <input value={rec.memo || ""} disabled={off || future} onChange={(e) => setMemo(date, e.target.value)}
                      className="h-8 w-full rounded-md border border-slate-200 px-2 text-sm disabled:border-transparent disabled:bg-transparent" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-slate-400">회색 입력칸의 숫자는 계약 기본 식수입니다. 실제 식수를 입력한 날만 매출에 반영됩니다.</p>
    </div>
  );
}
