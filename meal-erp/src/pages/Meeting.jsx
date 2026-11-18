import React, { useState } from "react";
import { ClipboardList, Download } from "lucide-react";
import { useStore } from "../store.jsx";
import { Btn, Card, Field, PageHead, SitePicker, Stepper, Tag, inputCls } from "../ui.jsx";
import { addDays, todayISO, weekLabel, weekStart } from "../lib/date.js";
import { MEALS } from "../lib/date.js";
import { fmt, fmt1 } from "../lib/calc.js";

const blank = { actual: "", wasteRate: "", wasteHigh: "", wasteLow: "", issues: "", nextWeek: "", hq: "", theme: "", status: "미작성" };

export default function Meeting() {
  const { s, site, update } = useStore();
  const [ws, setWs] = useState(addDays(weekStart(todayISO()), -7)); // 기본은 지난주 실적
  const key = `${site.id}|${ws}`;
  const m = { ...blank, ...(s.meetings[key] || {}) };
  const save = (patch) => update((p) => ({ ...p, meetings: { ...p.meetings, [key]: { ...blank, ...(p.meetings[key] || {}), ...patch } } }));

  const fromClosings = () => {
    let meals = 0, waste = 0;
    for (let i = 0; i < 7; i++) {
      const c = s.closings[`${site.id}|${addDays(ws, i)}`];
      if (!c) continue;
      MEALS.forEach((x) => { meals += Number(c[x]?.count) || 0; waste += Number(c[x]?.waste) || 0; });
    }
    if (!meals) return alert("이 주에 입력된 일마감 식수가 없습니다.");
    // 잔반률은 식수 × 평균 1식 잔반 기준이 정해지지 않아 kg 합계만 불러옵니다
    save({ actual: meals, issues: m.issues || "", wasteKg: waste });
  };
  const rate = site.contractWeekly > 0 && m.actual !== "" ? `${((m.actual / site.contractWeekly) * 100).toFixed(1)}%` : "—";

  const rowsAll = s.sites.map((x) => ({ x, r: s.meetings[`${x.id}|${ws}`] }));
  const submitted = rowsAll.filter((r) => r.r?.status === "제출완료").length;

  return (
    <div>
      <PageHead icon={ClipboardList} title="영양사 회의자료" desc="업장별 주간 보고서를 작성하고 제출 현황을 확인합니다. 보고 대상은 선택한 주의 실적입니다.">
        <SitePicker />
        <Stepper label={weekLabel(ws)} onPrev={() => setWs(addDays(ws, -7))} onNext={() => setWs(addDays(ws, 7))} onToday={() => setWs(addDays(weekStart(todayISO()), -7))} />
      </PageHead>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">① 전주 실적 <Tag tone="rose">필수</Tag></h3>
              <Btn icon={Download} onClick={fromClosings}>일마감에서 불러오기</Btn>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="계약 식수 (주간)"><input disabled className={inputCls + " bg-slate-50"} value={site.contractWeekly ? fmt(site.contractWeekly) : "미설정"} /></Field>
              <Field label="실제 식수"><input type="number" className={inputCls} value={m.actual} onChange={(e) => save({ actual: e.target.value === "" ? "" : Number(e.target.value) })} /></Field>
              <Field label="달성률 (자동)"><input disabled className={inputCls + " bg-slate-50 text-center"} value={rate} /></Field>
              <Field label="잔반률 (%)"><input type="number" className={inputCls} value={m.wasteRate} onChange={(e) => save({ wasteRate: e.target.value })} /></Field>
              <Field label="잔반 많은 메뉴"><input className={inputCls} value={m.wasteHigh} onChange={(e) => save({ wasteHigh: e.target.value })} /></Field>
              <Field label="잔반 적은 메뉴"><input className={inputCls} value={m.wasteLow} onChange={(e) => save({ wasteLow: e.target.value })} /></Field>
            </div>
            {m.wasteKg != null && <p className="mt-2 text-xs text-slate-400">불러온 주간 잔반 합계: {fmt1(m.wasteKg)}kg</p>}
          </Card>

          {[
            ["② 고객사 이슈 / 클레임", "issues", "고객사 피드백·요청·클레임"],
            ["③ 다음 주 식단 특이사항", "nextWeek", "행사·특식·휴무·식수 변동"],
            ["④ 본사 요청·문의사항", "hq", "본사에 요청하거나 문의할 내용"],
            ["⑤ 이번 주 메인 테마", "theme", "익일 식단에서 가장 자신있는 메뉴 1개와 그 이유"],
          ].map(([label, f, ph]) => (
            <Card key={f} className="p-5">
              <h3 className="mb-2 text-sm font-bold text-slate-900">{label}</h3>
              <textarea rows={3} placeholder={ph} value={m[f]} onChange={(e) => save({ [f]: e.target.value })} className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10" />
            </Card>
          ))}

          <div className="flex justify-end gap-2">
            <Btn onClick={() => save({ status: "임시저장" })}>임시 저장</Btn>
            <Btn variant="primary" onClick={() => save({ status: "제출완료" })}>제출</Btn>
          </div>
        </div>

        <Card className="h-fit p-5">
          <h3 className="mb-1 text-sm font-bold text-slate-900">제출 현황</h3>
          <p className="mb-3 text-xs text-slate-400">{weekLabel(ws)} · {submitted}/{rowsAll.length} 제출</p>
          <ul className="divide-y divide-slate-100">
            {rowsAll.map(({ x, r }) => (
              <li key={x.id} className="flex items-center justify-between py-2.5 text-sm">
                <div><p className="font-medium text-slate-800">{x.name}</p><p className="text-xs text-slate-400">{x.dietitian || "담당 미지정"}</p></div>
                <Tag tone={r?.status === "제출완료" ? "green" : r?.status === "임시저장" ? "amber" : "rose"}>{r?.status || "미작성"}</Tag>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
