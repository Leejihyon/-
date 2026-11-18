import React, { useMemo, useState } from "react";
import { ShoppingCart, PackageCheck, FileText, Printer, Trash2, Send } from "lucide-react";
import { useStore } from "../store.jsx";
import { Btn, Card, Empty, Modal, PageHead, SitePicker, Stat, Stepper, Tag } from "../ui.jsx";
import { addDays, md, parse, todayISO, weekLabel, weekStart } from "../lib/date.js";
import { defaultDue, fmt, fmt1, nextOrderId, orderTotal, weekRequirements } from "../lib/calc.js";

const TONE = { 작성중: "slate", 발주완료: "blue", 입고완료: "green" };
const DAYNAME = ["월", "화", "수", "목", "금", "토", "일"];

export default function Order({ initWs }) {
  const { s, site, update } = useStore();
  const [ws, setWsRaw] = useState(initWs || weekStart(todayISO()));
  const [edits, setEdits] = useState({}); // `${ing}` → 수정한 발주량
  const [dues, setDues] = useState({}); // supplierId → 납품일
  const [filter, setFilter] = useState("전체");
  const [view, setView] = useState(null);
  const setWs = (w) => { setWsRaw(w); setEdits({}); setDues({}); };

  const req = useMemo(() => weekRequirements(s, site, ws), [s, site, ws]);
  const supName = (id) => s.suppliers.find((x) => x.id === id)?.name || "(업체 없음)";
  const siteOrders = s.orders.filter((o) => o.siteId === site.id);
  const weekOrders = siteOrders.filter((o) => o.weekStart === ws);
  const qtyOf = (r) => (edits[r.ingId] ?? r.qty);
  const dueOf = (sid, first) => dues[sid] || defaultDue(ws, first);

  const createOrder = (sid, rows, status) => {
    const lines = rows
      .map((r) => ({ ingId: r.ingId, name: r.name, unit: r.unit, qty: Number(qtyOf(r)) || 0, price: r.price }))
      .filter((l) => l.qty > 0);
    if (!lines.length) return;
    const due = dueOf(sid, Math.min(...rows.map((r) => r.firstDay)));
    update((p) => ({
      ...p,
      orders: [
        { id: nextOrderId(p.orders, todayISO()), siteId: site.id, supplierId: sid, weekStart: ws, due, status, lines, createdAt: todayISO() },
        ...p.orders,
      ],
    }));
  };
  const createAll = (status) =>
    Object.entries(req.bySupplier).forEach(([sid, rows]) => {
      if (!weekOrders.some((o) => o.supplierId === sid)) createOrder(sid, rows, status);
    });
  const setStatus = (id, status) =>
    update((p) => ({ ...p, orders: p.orders.map((o) => (o.id === id ? { ...o, status, receivedAt: status === "입고완료" ? todayISO() : o.receivedAt } : o)) }));
  const remove = (id) => confirm("이 발주서를 삭제할까요?") && update((p) => ({ ...p, orders: p.orders.filter((o) => o.id !== id) }));

  const suppliers = Object.keys(req.bySupplier);
  const shown = siteOrders.filter((o) => filter === "전체" || o.status === filter);
  const late = siteOrders.filter((o) => o.status === "발주완료" && o.due < todayISO()).length;

  return (
    <div>
      <PageHead icon={ShoppingCart} title="발주 관리" desc="식단표에서 계산된 필요량을 업체별 발주서로 만듭니다.">
        <SitePicker />
        <Stepper label={weekLabel(ws)} onPrev={() => setWs(addDays(ws, -7))} onNext={() => setWs(addDays(ws, 7))} onToday={() => setWs(weekStart(todayISO()))} />
      </PageHead>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="필요 품목" value={`${req.rows.length}개`} sub={`${suppliers.length}개 업체`} />
        <Stat label="예상 발주 금액" value={`${fmt(req.total)}원`} sub="부가세 별도 · 손실률 포함" />
        <Stat label="이번 주 발주서" value={`${weekOrders.length}건`} sub={`미작성 업체 ${suppliers.filter((sid) => !weekOrders.some((o) => o.supplierId === sid)).length}곳`} />
        <Stat label="납품 지연" value={`${late}건`} sub="납품일이 지났는데 미입고" tone={late ? "text-rose-600" : "text-slate-900"} />
      </div>

      {req.missingMenus.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          재료가 연결되지 않은 메뉴가 있어 필요량이 빠질 수 있습니다: <b>{req.missingMenus.join(", ")}</b> (「재료·메뉴 관리」에서 재료를 연결하세요)
        </div>
      )}

      {suppliers.length === 0 ? (
        <Card><Empty>이 주의 식단표가 비어 있습니다. 「영양사 식단」에서 메뉴를 먼저 입력해 주세요.</Empty></Card>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">업체별 발주 초안</h2>
            <div className="flex gap-2">
              <Btn icon={FileText} onClick={() => createAll("작성중")}>모든 업체 발주서 만들기</Btn>
              <Btn icon={Send} variant="primary" onClick={() => createAll("발주완료")}>모두 발주 확정</Btn>
            </div>
          </div>
          <div className="mb-8 space-y-4">
            {suppliers.map((sid) => {
              const rows = req.bySupplier[sid];
              const made = weekOrders.find((o) => o.supplierId === sid);
              const sum = rows.reduce((t, r) => t + (Number(qtyOf(r)) || 0) * r.price, 0);
              const first = Math.min(...rows.map((r) => r.firstDay));
              return (
                <Card key={sid} className="overflow-hidden">
                  <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <h3 className="text-sm font-bold text-slate-900">{supName(sid)}</h3>
                    <Tag>{rows.length}품목</Tag>
                    {made && <Tag tone={TONE[made.status]}>{made.id} · {made.status}</Tag>}
                    <div className="ml-auto flex items-center gap-2 text-xs">
                      <span className="text-slate-500">납품 예정일</span>
                      <input
                        type="date"
                        value={dueOf(sid, first)}
                        onChange={(e) => setDues({ ...dues, [sid]: e.target.value })}
                        className="h-8 rounded-lg border border-slate-200 px-2 text-xs"
                      />
                      <span className="w-24 text-right text-sm font-bold tabular-nums text-slate-900">{fmt(sum)}원</span>
                      <Btn disabled={!!made} onClick={() => createOrder(sid, rows, "작성중")}>임시 저장</Btn>
                      <Btn disabled={!!made} variant="primary" onClick={() => createOrder(sid, rows, "발주완료")}>발주 확정</Btn>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] font-semibold text-slate-400">
                        <th className="px-4 py-2">품목</th>
                        <th className="px-4 py-2">사용 메뉴</th>
                        <th className="px-4 py-2 text-right">계산 필요량</th>
                        <th className="w-44 px-4 py-2 text-right">발주량</th>
                        <th className="px-4 py-2 text-right">단가</th>
                        <th className="px-4 py-2 text-right">금액</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((r) => (
                        <tr key={r.ingId}>
                          <td className="px-4 py-2 font-medium text-slate-800">{r.name}</td>
                          <td className="max-w-[260px] truncate px-4 py-2 text-xs text-slate-400">{r.menus.join(", ")}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-slate-500">{fmt1(r.raw)} {r.unit}</td>
                          <td className="whitespace-nowrap px-4 py-2 text-right">
                            <input
                              type="number" min="0" step={r.unit === "개" ? 1 : 0.1}
                              disabled={!!made}
                              value={qtyOf(r)}
                              onChange={(e) => setEdits({ ...edits, [r.ingId]: e.target.value })}
                              className="h-8 w-20 rounded-lg border border-slate-200 px-2 text-right text-sm tabular-nums disabled:bg-slate-50"
                            />
                            <span className="ml-1 text-xs text-slate-400">{r.unit}</span>
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-slate-500">{fmt(r.price)}</td>
                          <td className="px-4 py-2 text-right font-semibold tabular-nums">{fmt((Number(qtyOf(r)) || 0) * r.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">발주서 목록 · {site.name}</h2>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {["전체", "작성중", "발주완료", "입고완료"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${filter === f ? "bg-slate-900 text-white" : "text-slate-500"}`}>{f}</button>
          ))}
        </div>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <th className="px-4 py-3">발주번호</th><th className="px-4 py-3">업체</th><th className="px-4 py-3">품목</th>
              <th className="px-4 py-3">납품 예정</th><th className="px-4 py-3 text-right">금액</th><th className="px-4 py-3">상태</th><th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium tabular-nums text-slate-900">{o.id}</td>
                <td className="px-4 py-3">{supName(o.supplierId)}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{o.lines[0].name}{o.lines.length > 1 && ` 외 ${o.lines.length - 1}건`}</td>
                <td className="px-4 py-3 tabular-nums">{md(o.due)}({DAYNAME[(parse(o.due).getDay() + 6) % 7]})
                  {o.status === "발주완료" && o.due < todayISO() && <span className="ml-1 text-xs font-semibold text-rose-600">지연</span>}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmt(orderTotal(o))}원</td>
                <td className="px-4 py-3"><Tag tone={TONE[o.status]}>{o.status}</Tag></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3 text-xs font-medium">
                    <button onClick={() => setView(o)} className="text-slate-600 hover:underline">보기</button>
                    {o.status === "작성중" && <button onClick={() => setStatus(o.id, "발주완료")} className="text-rose-600 hover:underline">발주 확정</button>}
                    {o.status === "발주완료" && <button onClick={() => setStatus(o.id, "입고완료")} className="inline-flex items-center gap-1 text-emerald-600 hover:underline"><PackageCheck className="h-3.5 w-3.5" />입고 처리</button>}
                    {o.status === "작성중" && <button onClick={() => remove(o.id)} className="text-slate-400 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={7}><Empty>발주서가 없습니다.</Empty></td></tr>}
          </tbody>
        </table>
      </Card>

      {view && (
        <Modal
          title={`발주서 ${view.id}`}
          onClose={() => setView(null)}
          footer={<><Btn onClick={() => setView(null)}>닫기</Btn><Btn variant="dark" icon={Printer} onClick={() => window.print()}>인쇄</Btn></>}
        >
          <div className="text-sm text-slate-600">
            <p><b>{site.name}</b> → <b>{supName(view.supplierId)}</b></p>
            <p className="text-xs text-slate-400">납품 예정 {view.due} · 상태 {view.status}</p>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-slate-400"><th className="py-1.5">품목</th><th className="text-right">수량</th><th className="text-right">단가</th><th className="text-right">금액</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {view.lines.map((l) => (
                <tr key={l.ingId}><td className="py-1.5">{l.name}</td><td className="text-right tabular-nums">{fmt1(l.qty)} {l.unit}</td><td className="text-right tabular-nums">{fmt(l.price)}</td><td className="text-right font-medium tabular-nums">{fmt(l.qty * l.price)}</td></tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={3} className="pt-2 text-right text-xs text-slate-500">합계(부가세 별도)</td><td className="pt-2 text-right font-bold tabular-nums">{fmt(orderTotal(view))}원</td></tr></tfoot>
          </table>
        </Modal>
      )}
    </div>
  );
}
