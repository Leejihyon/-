import React from "react";
import { X, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { useStore } from "./store.jsx";

export const inputCls =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10";

export function Card({ className = "", children }) {
  return <div className={`rounded-xl border border-slate-200 bg-white ${className}`}>{children}</div>;
}

export function PageHead({ icon: Icon, title, desc, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
          {desc && <p className="mt-0.5 text-sm text-slate-500">{desc}</p>}
        </div>
      </div>
      <div className="no-print flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

const BTN = {
  primary: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
  dark: "bg-slate-900 text-white hover:bg-slate-800",
  ghost: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  green: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
  danger: "border border-rose-200 bg-white text-rose-600 hover:bg-rose-50",
};
export function Btn({ variant = "ghost", icon: Icon, className = "", children, ...p }) {
  return (
    <button
      {...p}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${BTN[variant]} ${className}`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function Chip({ on, onClick, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
        on ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Tag({ tone = "slate", children }) {
  const t = {
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
  }[tone];
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${t}`}>{children}</span>;
}

export function Stat({ label, value, sub, tone = "text-slate-900" }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight tabular-nums ${tone}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </Card>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Stepper({ label, onPrev, onNext, onToday }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
      <button onClick={onPrev} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[8.5rem] text-center text-sm font-semibold tabular-nums text-slate-800">{label}</span>
      <button onClick={onNext} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
        <ChevronRight className="h-4 w-4" />
      </button>
      {onToday && (
        <button onClick={onToday} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200">
          오늘
        </button>
      )}
    </div>
  );
}

// 업장 선택 상자 (모든 화면 상단에서 공통으로 사용)
export function SitePicker() {
  const { s, site, set } = useStore();
  return (
    <div className="no-print inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5">
      <Building2 className="h-4 w-4 text-rose-500" />
      <span className="text-xs font-semibold text-rose-600">업장</span>
      <select
        value={site.id}
        onChange={(e) => set({ siteId: e.target.value })}
        className="rounded-lg border border-rose-200 bg-white px-2 py-1 text-sm font-semibold text-slate-800 outline-none"
      >
        {s.sites.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Empty({ children }) {
  return <div className="py-14 text-center text-sm text-slate-400">{children}</div>;
}
