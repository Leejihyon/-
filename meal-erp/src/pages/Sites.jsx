import React, { useState } from "react";
import { Building2, Plus, Search, Trash2, UserPlus } from "lucide-react";
import { useStore } from "../store.jsx";
import { Btn, Card, Chip, Empty, Field, Modal, PageHead, Tag, inputCls } from "../ui.jsx";
import { DAYS, MEALS } from "../lib/date.js";
import { DEFAULT_SLOTS } from "../data/seed.js";

const blankSite = () => ({
  name: "", type: "위탁", status: "거래중", dietitian: "",
  meals: { 조식: false, 중식: true, 석식: false, 야식: false },
  days: [true, true, true, true, true, false, false],
  headcount: { 조식: 0, 중식: 0, 석식: 0, 야식: 0 },
  price: { 조식: 0, 중식: 0, 석식: 0, 야식: 0 },
  contractWeekly: 0, loss: 5, slots: DEFAULT_SLOTS, staff: [],
});

export default function Sites() {
  const { s, site, set, update, patchSite } = useStore();
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(null);
  const list = s.sites.filter((x) => x.name.includes(q));
  const num = (v) => (v === "" ? 0 : Math.max(0, Number(v)));

  const addSite = () => {
    const id = "s" + Date.now().toString(36);
    update((p) => ({ ...p, sites: [...p.sites, { ...adding, id }], siteId: id }));
    setAdding(null);
  };
  const removeSite = () => {
    if (s.sites.length <= 1) return alert("업장은 최소 한 곳이 있어야 합니다.");
    if (!confirm(`'${site.name}' 업장을 삭제할까요? 이 업장의 식단표·발주 기록은 그대로 남지만 화면에서는 보이지 않습니다.`)) return;
    update((p) => {
      const sites = p.sites.filter((x) => x.id !== site.id);
      return { ...p, sites, siteId: sites[0].id };
    });
  };
  const addStaff = () => patchSite(site.id, { staff: [...site.staff, { id: "st" + Date.now().toString(36), name: "", role: "조리", canInput: true }] });
  const setStaff = (id, patch) => patchSite(site.id, { staff: site.staff.map((x) => (x.id === id ? { ...x, ...patch } : x)) });

  return (
    <div>
      <PageHead icon={Building2} title="업장 관리" desc="위탁 업장의 식수·단가·운영 방식과 담당 인력을 한 곳에서 관리합니다.">
        <Btn variant="primary" icon={Plus} onClick={() => setAdding(blankSite())}>새 업장</Btn>
      </PageHead>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit p-3">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="업장 검색" className={inputCls + " pl-9"} />
          </div>
          <ul className="space-y-1">
            {list.map((x) => (
              <li key={x.id}>
                <button onClick={() => set({ siteId: x.id })} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${x.id === site.id ? "bg-rose-50 font-semibold text-rose-700" : "text-slate-700 hover:bg-slate-50"}`}>
                  <span className="truncate">{x.name}</span>
                  <Tag tone={x.status === "거래중" ? "green" : "slate"}>{x.status}</Tag>
                </button>
              </li>
            ))}
            {list.length === 0 && <Empty>검색 결과가 없습니다.</Empty>}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">{site.name} {site.sample && <span className="ml-1 text-xs font-normal text-amber-600">· 숫자는 샘플 값입니다</span>}</h2>
              <Btn variant="danger" icon={Trash2} onClick={removeSite}>삭제</Btn>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2"><Field label="업장명"><input className={inputCls} value={site.name} onChange={(e) => patchSite(site.id, { name: e.target.value })} /></Field></div>
              <Field label="유형">
                <select className={inputCls} value={site.type} onChange={(e) => patchSite(site.id, { type: e.target.value })}>
                  {["위탁", "도시락", "이동식", "홀"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="상태">
                <select className={inputCls} value={site.status} onChange={(e) => patchSite(site.id, { status: e.target.value })}>
                  <option>거래중</option><option>중지</option>
                </select>
              </Field>
              <div className="sm:col-span-2"><Field label="담당 영양사"><input className={inputCls} value={site.dietitian} onChange={(e) => patchSite(site.id, { dietitian: e.target.value })} /></Field></div>
              <Field label="주간 계약 식수" hint="0이면 달성률을 계산하지 않습니다"><input type="number" className={inputCls} value={site.contractWeekly} onChange={(e) => patchSite(site.id, { contractWeekly: num(e.target.value) })} /></Field>
              <Field label="손실률 (%)" hint="발주량 계산에 더해집니다"><input type="number" step="0.5" className={inputCls} value={site.loss} onChange={(e) => patchSite(site.id, { loss: num(e.target.value) })} /></Field>
            </div>

            <p className="mb-2 mt-5 text-xs font-semibold text-slate-500">끼니별 운영 · 식수 · 단가</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {MEALS.map((m) => (
                <div key={m} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${site.meals[m] ? "border-rose-200 bg-rose-50/40" : "border-slate-200"}`}>
                  <Chip on={site.meals[m]} onClick={() => patchSite(site.id, { meals: { ...site.meals, [m]: !site.meals[m] } })}>{m}</Chip>
                  <input type="number" disabled={!site.meals[m]} placeholder="식수" value={site.headcount[m]} onChange={(e) => patchSite(site.id, { headcount: { ...site.headcount, [m]: num(e.target.value) } })} className={inputCls + " w-24 text-right disabled:bg-slate-50"} />
                  <span className="text-xs text-slate-400">식</span>
                  <input type="number" disabled={!site.meals[m]} placeholder="단가" value={site.price[m]} onChange={(e) => patchSite(site.id, { price: { ...site.price, [m]: num(e.target.value) } })} className={inputCls + " w-24 text-right disabled:bg-slate-50"} />
                  <span className="text-xs text-slate-400">원</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">운영 요일</span>
              {DAYS.map((d, i) => (
                <Chip key={d} on={site.days[i]} onClick={() => patchSite(site.id, { days: site.days.map((v, k) => (k === i ? !v : v)) })}>{d}</Chip>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">업장 인력 · 입력 권한</h3>
                <p className="text-xs text-slate-400">업장 담당 인력과 식단·식수 입력 권한을 관리합니다.</p>
              </div>
              <Btn icon={UserPlus} onClick={addStaff}>인력 추가</Btn>
            </div>
            {site.staff.length === 0 ? (
              <Empty>등록된 인력이 없습니다.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100">
                {site.staff.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2">
                    <input value={p.name} placeholder="이름" onChange={(e) => setStaff(p.id, { name: e.target.value })} className={inputCls + " max-w-[180px]"} />
                    <select value={p.role} onChange={(e) => setStaff(p.id, { role: e.target.value })} className={inputCls + " max-w-[120px]"}>
                      {["영양사", "조리", "배식", "관리"].map((r) => <option key={r}>{r}</option>)}
                    </select>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600">
                      <input type="checkbox" checked={p.canInput} onChange={(e) => setStaff(p.id, { canInput: e.target.checked })} />입력 권한
                    </label>
                    <button onClick={() => patchSite(site.id, { staff: site.staff.filter((x) => x.id !== p.id) })} className="ml-auto text-slate-300 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {adding && (
        <Modal title="새 업장" onClose={() => setAdding(null)} footer={<><Btn onClick={() => setAdding(null)}>취소</Btn><Btn variant="primary" disabled={!adding.name.trim()} onClick={addSite}>등록</Btn></>}>
          <Field label="업장명"><input autoFocus className={inputCls} value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} /></Field>
          <Field label="담당 영양사"><input className={inputCls} value={adding.dietitian} onChange={(e) => setAdding({ ...adding, dietitian: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="중식 식수"><input type="number" className={inputCls} value={adding.headcount.중식} onChange={(e) => setAdding({ ...adding, headcount: { ...adding.headcount, 중식: num(e.target.value) } })} /></Field>
            <Field label="중식 단가(원)"><input type="number" className={inputCls} value={adding.price.중식} onChange={(e) => setAdding({ ...adding, price: { ...adding.price, 중식: num(e.target.value) } })} /></Field>
          </div>
          <p className="text-xs text-slate-400">석식·요일·손실률은 등록 후 업장 상세에서 바꿀 수 있습니다.</p>
        </Modal>
      )}
    </div>
  );
}
