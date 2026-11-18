import React, { useState } from "react";
import { BarChart3 } from "lucide-react";
import { useStore } from "../store.jsx";
import { Btn, Card, Field, PageHead, Stat, Stepper, Tag, inputCls } from "../ui.jsx";
import { addMonths, monthOf, todayISO } from "../lib/date.js";
import { fmt, fmt1, monthSummary } from "../lib/calc.js";

export default function MonthlyClose({ nav }) {
  const { s, site, set, update } = useStore();
  const [ym, setYm] = useState(monthOf(todayISO()));
  const sum = monthSummary(s, site.id, ym);
  const extra = s.monthExtra[`${site.id}|${ym}`] || {};
  const setExtra = (f, v) =>
    update((p) => ({ ...p, monthExtra: { ...p.monthExtra, [`${site.id}|${ym}`]: { ...(p.monthExtra[`${site.id}|${ym}`] || {}), [f]: v === "" ? "" : Math.max(0, Number(v)) } } }));

  const rows = s.sites.map((x) => ({ site: x, ...monthSummary(s, x.id, ym) }));
  const tot = rows.reduce((a, r) => ({ meals: a.meals + r.meals, sales: a.sales + r.sales, food: a.food + r.food, profit: a.profit + r.profit }), { meals: 0, sales: 0, food: 0, profit: 0 });
  const rate = (a, b) => (b ? `${((a / b) * 100).toFixed(1)}%` : "-");

  return (
    <div>
      <PageHead icon={BarChart3} title="월마감" desc="업장별 식수·매출은 일마감에서, 식재료비는 발주서에서 자동으로 모입니다.">
        <Stepper label={ym.replace("-", "년 ") + "월"} onPrev={() => setYm(addMonths(ym, -1))} onNext={() => setYm(addMonths(ym, 1))} onToday={() => setYm(monthOf(todayISO()))} />
      </PageHead>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="업장" value={`${s.sites.length}곳`} />
        <Stat label="월 식수" value={`${fmt(tot.meals)}식`} />
        <Stat label="매출(순)" value={`${fmt(tot.sales)}원`} />
        <Stat label="식재료비율" value={rate(tot.food, tot.sales)} sub={`${fmt(tot.food)}원`} />
        <Stat label="손익" value={`${fmt(tot.profit)}원`} sub={rate(tot.profit, tot.sales)} tone={tot.profit >= 0 ? "text-emerald-600" : "text-rose-600"} />
      </div>

      <Card className="mb-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
              <th className="px-4 py-3 text-left">업장</th><th className="px-4 py-3 text-left">유형</th>
              <th className="px-4 py-3 text-right">식수</th><th className="px-4 py-3 text-right">매출</th><th className="px-4 py-3 text-right">식재료비율</th>
              <th className="px-4 py-3 text-right">손익</th><th className="px-4 py-3 text-right">손익률</th><th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.site.id} className={r.site.id === site.id ? "bg-rose-50/50" : ""}>
                <td className="px-4 py-3 font-semibold text-slate-900">{r.site.name}{r.site.sample && <span className="ml-2 text-[10px] font-normal text-slate-400">샘플</span>}</td>
                <td className="px-4 py-3"><Tag tone="green">{r.site.type}</Tag></td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(r.meals)}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmt(r.sales)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{rate(r.food, r.sales)}</td>
                <td className={`px-4 py-3 text-right font-semibold tabular-nums ${r.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmt(r.profit)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{rate(r.profit, r.sales)}</td>
                <td className="px-4 py-3 text-right"><Btn onClick={() => set({ siteId: r.site.id })}>열기</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <h2 className="mb-3 text-sm font-bold text-slate-900">{site.name} · {ym.replace("-", "년 ")}월 상세</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="mb-3 text-xs font-semibold text-slate-400">자동 집계</p>
          <dl className="space-y-2 text-sm">
            {[
              ["마감 일수", `${sum.days}일`],
              ["식수", `${fmt(sum.meals)}식`],
              ["매출 (식수 × 단가)", `${fmt(sum.sales)}원`],
              ["식재료비 (발주 확정·입고 기준)", `${fmt(sum.food)}원`],
              ["잔반", `${fmt1(sum.waste)}kg`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between"><dt className="text-slate-500">{k}</dt><dd className="font-semibold tabular-nums text-slate-900">{v}</dd></div>
            ))}
          </dl>
        </Card>
        <Card className="p-5">
          <p className="mb-3 text-xs font-semibold text-slate-400">수기 입력</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="인건비 (원)"><input type="number" className={inputCls} value={extra.labor ?? ""} onChange={(e) => setExtra("labor", e.target.value)} /></Field>
            <Field label="경비 (원)"><input type="number" className={inputCls} value={extra.expense ?? ""} onChange={(e) => setExtra("expense", e.target.value)} /></Field>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <span className="text-sm text-slate-500">손익</span>
            <span className={`text-lg font-bold tabular-nums ${sum.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmt(sum.profit)}원 <span className="text-xs font-medium">({sum.profitRate.toFixed(1)}%)</span></span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">손익 = 매출 − 식재료비 − 인건비 − 경비</p>
        </Card>
      </div>
    </div>
  );
}
