import React, { useState } from "react";
import {
  UtensilsCrossed, ShoppingCart, Search, Snowflake, CalendarCheck, BarChart3, ClipboardList, Building2, Boxes, RotateCcw, AlertTriangle,
} from "lucide-react";
import { useStore } from "./store.jsx";
import Plan from "./pages/Plan.jsx";
import Order from "./pages/Order.jsx";
import DailyClose from "./pages/DailyClose.jsx";
import MonthlyClose from "./pages/MonthlyClose.jsx";
import { Tasting, Preserve } from "./pages/Logs.jsx";
import Meeting from "./pages/Meeting.jsx";
import Sites from "./pages/Sites.jsx";
import Masters from "./pages/Masters.jsx";

const NAV = [
  { key: "plan", label: "영양사식단", icon: UtensilsCrossed },
  { key: "order", label: "발주 관리", icon: ShoppingCart },
  { key: "tasting", label: "검식일지", icon: Search },
  { key: "preserve", label: "보존식", icon: Snowflake },
  { key: "daily", label: "일마감", icon: CalendarCheck },
  { key: "monthly", label: "월마감", icon: BarChart3 },
  { key: "meeting", label: "영양사 회의자료", icon: ClipboardList },
  { sep: true },
  { key: "sites", label: "업장 관리", icon: Building2 },
  { key: "masters", label: "재료·메뉴 관리", icon: Boxes },
];

export default function App() {
  const { s, site, reset } = useStore();
  const [page, setPage] = useState("plan");
  const [params, setParams] = useState({});
  const nav = (p, prm = {}) => { setPage(p); setParams(prm); };
  const cur = NAV.find((n) => n.key === page);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased">
      <aside className="flex w-60 shrink-0 flex-col bg-slate-900 text-slate-300">
        <div className="border-b border-slate-800 px-5 py-5">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-rose-400">CATERING</p>
          <p className="text-lg font-bold text-white">위탁 영양사</p>
        </div>
        <div className="mx-4 mt-4 flex items-center gap-3 rounded-xl bg-slate-800/60 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-orange-400 text-sm font-bold text-white">이</div>
          <div className="leading-tight"><p className="text-sm font-semibold text-white">이지현</p><p className="text-[11px] text-slate-400">운영진</p></div>
        </div>
        <nav className="mt-4 flex-1 overflow-y-auto px-3">
          <ul className="space-y-0.5">
            {NAV.map((n, i) =>
              n.sep ? (
                <li key={i} className="!my-3 border-t border-slate-800" />
              ) : (
                <li key={n.key}>
                  <button
                    onClick={() => nav(n.key)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${page === n.key ? "bg-rose-600 font-medium text-white shadow-md shadow-rose-950/40" : "hover:bg-slate-800 hover:text-white"}`}
                  >
                    <n.icon className="h-4 w-4" />{n.label}
                  </button>
                </li>
              )
            )}
          </ul>
        </nav>
        <div className="space-y-2 border-t border-slate-800 px-5 py-4 text-[11px] text-slate-500">
          <p className="font-medium text-slate-400">(주)국제F&S 운영팀</p>
          <button onClick={() => confirm("모든 입력 내용을 지우고 샘플 데이터로 되돌릴까요?") && reset()} className="inline-flex items-center gap-1 text-slate-500 hover:text-white">
            <RotateCcw className="h-3 w-3" />샘플 데이터로 초기화
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-6 text-sm">
          <span className="text-slate-400">위탁 영양사</span><span className="text-slate-300">›</span>
          <span className="font-semibold text-slate-900">{cur?.label}</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
            <AlertTriangle className="h-3.5 w-3.5" />시연용 샘플 데이터 · 이 화면의 숫자는 실제 값이 아닙니다
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {page === "plan" && <Plan nav={nav} />}
          {page === "order" && <Order key={params.ws || "x"} initWs={params.ws} />}
          {page === "tasting" && <Tasting />}
          {page === "preserve" && <Preserve />}
          {page === "daily" && <DailyClose />}
          {page === "monthly" && <MonthlyClose nav={nav} />}
          {page === "meeting" && <Meeting />}
          {page === "sites" && <Sites />}
          {page === "masters" && <Masters />}
        </main>
      </div>
    </div>
  );
}
