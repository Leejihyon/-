import React, { useMemo, useRef, useState } from "react";
import { Boxes, Plus, Search, Trash2, Upload } from "lucide-react";
import { useStore } from "../store.jsx";
import { Btn, Card, Empty, Field, Modal, PageHead, Tag, inputCls } from "../ui.jsx";
import { fmt } from "../lib/calc.js";

const TABS = ["재료", "메뉴·레시피", "공급업체"];
const CATS = ["밥", "국", "메인찬", "부찬", "김치", "과일", "음료"];

// 간단 CSV 파서(따옴표 지원)
function parseCSV(text) {
  const rows = [];
  let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === "," || c === "\t") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

export default function Masters() {
  const { s, update } = useStore();
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState("");
  const [menuEdit, setMenuEdit] = useState(null);
  const [csvMsg, setCsvMsg] = useState("");
  const fileRef = useRef(null);

  const supName = (id) => s.suppliers.find((x) => x.id === id)?.name || "";
  const ingById = useMemo(() => Object.fromEntries(s.ingredients.map((i) => [i.id, i])), [s.ingredients]);
  const ings = s.ingredients.filter((i) => i.name.includes(q));
  const menus = s.menus.filter((m) => m.name.includes(q));

  const setIng = (id, patch) => update((p) => ({ ...p, ingredients: p.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  const addIng = () =>
    update((p) => ({ ...p, ingredients: [{ id: "ing" + Date.now().toString(36), name: "새 재료", unit: "kg", price: 0, supplierId: p.suppliers[0]?.id, origin: "", category: "", allergy: "" }, ...p.ingredients] }));
  const delIng = (id) => {
    const used = s.menus.filter((m) => m.lines.some((l) => l.ingId === id)).length;
    if (used && !confirm(`이 재료는 메뉴 ${used}개에서 쓰고 있습니다. 삭제하면 해당 메뉴에서 빠집니다. 삭제할까요?`)) return;
    update((p) => ({ ...p, ingredients: p.ingredients.filter((i) => i.id !== id), menus: p.menus.map((m) => ({ ...m, lines: m.lines.filter((l) => l.ingId !== id) })) }));
  };

  // CSV: 재료명, 단위, 단가, 업체명, 원산지, 알러지   (첫 줄이 제목이면 자동으로 건너뜀)
  const importCSV = async (file) => {
    const rows = parseCSV(await file.text());
    if (!rows.length) return setCsvMsg("읽을 수 있는 줄이 없습니다.");
    const start = isNaN(Number(String(rows[0][2] || "").replace(/,/g, ""))) ? 1 : 0;
    let add = 0, upd = 0, skipped = 0;
    update((p) => {
      const sup = [...p.suppliers];
      const ing = [...p.ingredients];
      rows.slice(start).forEach((r, k) => {
        const [name, unit, price, supplier, origin, allergy] = r.map((x) => (x || "").trim());
        if (!name) { skipped++; return; }
        let sid = "";
        if (supplier) {
          let f = sup.find((x) => x.name === supplier);
          if (!f) { f = { id: "sup" + Date.now().toString(36) + k, name: supplier, manager: "", phone: "", terms: "", note: "CSV로 추가" }; sup.push(f); }
          sid = f.id;
        }
        const u = ["kg", "L", "개"].includes(unit) ? unit : unit === "ℓ" || unit.toLowerCase() === "l" ? "L" : unit === "ea" || unit === "EA" ? "개" : "kg";
        const pr = Number(String(price).replace(/,/g, "")) || 0;
        const ex = ing.find((x) => x.name === name);
        if (ex) { Object.assign(ex, { unit: u, price: pr, supplierId: sid || ex.supplierId, origin: origin || ex.origin, allergy: allergy || ex.allergy }); upd++; }
        else { ing.push({ id: "ing" + Date.now().toString(36) + k, name, unit: u, price: pr, supplierId: sid || sup[0]?.id, origin, category: "", allergy }); add++; }
      });
      return { ...p, suppliers: sup, ingredients: ing };
    });
    setCsvMsg(`가져오기 완료 — 새로 ${add}개, 갱신 ${upd}개${skipped ? `, 건너뜀 ${skipped}줄` : ""}`);
  };

  const saveMenu = () => {
    update((p) => {
      const lines = menuEdit.lines.filter((l) => l.ingId && Number(l.amt) > 0).map((l) => ({ ingId: l.ingId, amt: Number(l.amt) }));
      const m = { ...menuEdit, lines };
      return { ...p, menus: p.menus.some((x) => x.id === m.id) ? p.menus.map((x) => (x.id === m.id ? m : x)) : [...p.menus, m] };
    });
    setMenuEdit(null);
  };
  const delMenu = (id) => confirm("이 메뉴를 삭제할까요? 식단표에 들어간 칸은 비게 됩니다.") && update((p) => ({ ...p, menus: p.menus.filter((m) => m.id !== id) }));

  return (
    <div>
      <PageHead icon={Boxes} title="재료·메뉴 관리" desc="식재료 단가, 메뉴별 1인분 사용량, 공급업체를 관리합니다.">
        {tab === 0 && (
          <>
            <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={(e) => e.target.files[0] && importCSV(e.target.files[0])} />
            <Btn icon={Upload} onClick={() => fileRef.current?.click()}>CSV 가져오기</Btn>
            <Btn icon={Plus} variant="primary" onClick={addIng}>재료 추가</Btn>
          </>
        )}
        {tab === 1 && <Btn icon={Plus} variant="primary" onClick={() => setMenuEdit({ id: "m" + Date.now().toString(36), name: "", cat: "메인찬", lines: [{ ingId: "", amt: "" }] })}>메뉴 추가</Btn>}
        {tab === 2 && <Btn icon={Plus} variant="primary" onClick={() => update((p) => ({ ...p, suppliers: [...p.suppliers, { id: "sup" + Date.now().toString(36), name: "새 업체", manager: "", phone: "", terms: "", note: "" }] }))}>업체 추가</Btn>}
      </PageHead>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === i ? "bg-slate-900 text-white" : "text-slate-500"}`}>
              {t} <span className="ml-1 text-xs opacity-60">{[s.ingredients.length, s.menus.length, s.suppliers.length][i]}</span>
            </button>
          ))}
        </div>
        {tab < 2 && (
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색" className={inputCls + " pl-9"} />
          </div>
        )}
        {csvMsg && <span className="text-sm text-emerald-600">{csvMsg}</span>}
      </div>

      {tab === 0 && (
        <>
          <p className="mb-3 text-xs text-slate-400">CSV 형식(첫 줄 제목은 자동 인식): <b>재료명, 단위(kg·L·개), 단가, 업체명, 원산지, 알러지</b> · 같은 이름은 갱신, 새 이름은 추가, 없는 업체는 자동 등록됩니다.</p>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500">
                  <th className="px-4 py-3">재료명</th><th className="px-2 py-3">단위</th><th className="px-2 py-3 text-right">단가(원)</th>
                  <th className="px-4 py-3">기본 발주처</th><th className="px-2 py-3">원산지</th><th className="px-2 py-3">알러지</th><th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ings.slice(0, 300).map((i) => (
                  <tr key={i.id}>
                    <td className="px-2 py-1"><input value={i.name} onChange={(e) => setIng(i.id, { name: e.target.value })} className="h-8 w-full rounded-md border border-transparent px-2 hover:border-slate-200 focus:border-rose-400" /></td>
                    <td className="px-2 py-1"><select value={i.unit} onChange={(e) => setIng(i.id, { unit: e.target.value })} className="h-8 rounded-md border border-slate-200 px-1 text-xs"><option>kg</option><option>L</option><option>개</option></select></td>
                    <td className="px-2 py-1"><input type="number" value={i.price} onChange={(e) => setIng(i.id, { price: Number(e.target.value) })} className="h-8 w-24 rounded-md border border-slate-200 px-2 text-right tabular-nums" /></td>
                    <td className="px-2 py-1"><select value={i.supplierId || ""} onChange={(e) => setIng(i.id, { supplierId: e.target.value })} className="h-8 w-full rounded-md border border-slate-200 px-1 text-xs">{s.suppliers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></td>
                    <td className="px-2 py-1"><input value={i.origin || ""} onChange={(e) => setIng(i.id, { origin: e.target.value })} className="h-8 w-24 rounded-md border border-transparent px-2 text-xs hover:border-slate-200" /></td>
                    <td className="px-2 py-1"><input value={i.allergy || ""} onChange={(e) => setIng(i.id, { allergy: e.target.value })} className="h-8 w-24 rounded-md border border-transparent px-2 text-xs hover:border-slate-200" /></td>
                    <td className="px-2"><button onClick={() => delIng(i.id)} className="text-slate-300 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ings.length > 300 && <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">{ings.length}개 중 300개만 표시합니다. 검색으로 좁혀 주세요.</p>}
            {ings.length === 0 && <Empty>재료가 없습니다.</Empty>}
          </Card>
        </>
      )}

      {tab === 1 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <th className="px-4 py-3">메뉴</th><th className="px-4 py-3">분류</th><th className="px-4 py-3">재료 (1인분)</th><th className="px-4 py-3 text-right">재료비/인</th><th className="w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {menus.map((m) => {
                const cost = m.lines.reduce((t, l) => {
                  const i = ingById[l.ingId];
                  return i ? t + (i.unit === "개" ? l.amt : l.amt / 1000) * i.price : t;
                }, 0);
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-900">{m.name}</td>
                    <td className="px-4 py-2.5"><Tag>{m.cat}</Tag></td>
                    <td className="max-w-[420px] truncate px-4 py-2.5 text-xs text-slate-500">
                      {m.lines.length ? m.lines.map((l) => `${ingById[l.ingId]?.name || "?"} ${l.amt}${ingById[l.ingId]?.unit === "개" ? "개" : "g"}`).join(", ") : <span className="font-semibold text-amber-600">재료 없음</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmt(cost)}원</td>
                    <td className="px-4 py-2.5 text-right text-xs font-medium">
                      <button onClick={() => setMenuEdit({ ...m, lines: m.lines.length ? m.lines.map((l) => ({ ...l })) : [{ ingId: "", amt: "" }] })} className="mr-3 text-rose-600 hover:underline">수정</button>
                      <button onClick={() => delMenu(m.id)} className="text-slate-400 hover:text-rose-600">삭제</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 2 && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <th className="px-4 py-3">업체명</th><th className="px-2 py-3">담당자</th><th className="px-2 py-3">연락처</th><th className="px-2 py-3">결제 조건</th><th className="px-2 py-3">취급 품목·메모</th><th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {s.suppliers.map((x) => {
                const set = (patch) => update((p) => ({ ...p, suppliers: p.suppliers.map((y) => (y.id === x.id ? { ...y, ...patch } : y)) }));
                const used = s.ingredients.filter((i) => i.supplierId === x.id).length;
                return (
                  <tr key={x.id}>
                    <td className="px-2 py-1"><input value={x.name} onChange={(e) => set({ name: e.target.value })} className="h-8 w-full rounded-md border border-slate-200 px-2 font-medium" /></td>
                    <td className="px-2 py-1"><input value={x.manager} onChange={(e) => set({ manager: e.target.value })} className="h-8 w-24 rounded-md border border-slate-200 px-2" /></td>
                    <td className="px-2 py-1"><input value={x.phone} onChange={(e) => set({ phone: e.target.value })} className="h-8 w-36 rounded-md border border-slate-200 px-2" /></td>
                    <td className="px-2 py-1"><input value={x.terms} onChange={(e) => set({ terms: e.target.value })} className="h-8 w-32 rounded-md border border-slate-200 px-2" /></td>
                    <td className="px-2 py-1"><input value={x.note} onChange={(e) => set({ note: e.target.value })} className="h-8 w-full rounded-md border border-slate-200 px-2" /><span className="text-[10px] text-slate-400">재료 {used}개</span></td>
                    <td className="px-2">
                      <button
                        onClick={() => used ? alert("이 업체를 기본 발주처로 쓰는 재료가 있어 삭제할 수 없습니다.") : update((p) => ({ ...p, suppliers: p.suppliers.filter((y) => y.id !== x.id) }))}
                        className="text-slate-300 hover:text-rose-500"
                      ><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">업체명·단가·연락처는 샘플입니다. 실제 업체 목록을 받으면 교체합니다.</p>
        </Card>
      )}

      {menuEdit && (
        <Modal title={s.menus.some((m) => m.id === menuEdit.id) ? "메뉴 수정" : "메뉴 추가"} onClose={() => setMenuEdit(null)}
          footer={<><Btn onClick={() => setMenuEdit(null)}>취소</Btn><Btn variant="primary" disabled={!menuEdit.name.trim()} onClick={saveMenu}>저장</Btn></>}>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Field label="메뉴명"><input autoFocus className={inputCls} value={menuEdit.name} onChange={(e) => setMenuEdit({ ...menuEdit, name: e.target.value })} /></Field></div>
            <Field label="분류"><select className={inputCls} value={menuEdit.cat} onChange={(e) => setMenuEdit({ ...menuEdit, cat: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></Field>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-slate-500">1인분 재료 (g·ml, 개 단위 재료는 개수)</p>
            <div className="space-y-2">
              {menuEdit.lines.map((l, k) => (
                <div key={k} className="flex items-center gap-2">
                  <select value={l.ingId} onChange={(e) => setMenuEdit({ ...menuEdit, lines: menuEdit.lines.map((x, j) => (j === k ? { ...x, ingId: e.target.value } : x)) })} className={inputCls}>
                    <option value="">재료 선택</option>
                    {s.ingredients.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                  </select>
                  <input type="number" min="0" step="0.1" placeholder="사용량" value={l.amt} onChange={(e) => setMenuEdit({ ...menuEdit, lines: menuEdit.lines.map((x, j) => (j === k ? { ...x, amt: e.target.value } : x)) })} className={inputCls + " w-24 text-right"} />
                  <button onClick={() => setMenuEdit({ ...menuEdit, lines: menuEdit.lines.filter((_, j) => j !== k) })} className="text-slate-300 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <button onClick={() => setMenuEdit({ ...menuEdit, lines: [...menuEdit.lines, { ingId: "", amt: "" }] })} className="mt-2 text-xs font-medium text-rose-600 hover:underline">+ 재료 추가</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
