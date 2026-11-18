import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { makeSeed } from "./data/seed.js";

const KEY = "meal-erp.v1";
const Ctx = createContext(null);

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* 저장소를 못 쓰는 환경(시크릿 창 등)에서는 샘플로 시작 */
  }
  return makeSeed();
}

export function StoreProvider({ children }) {
  const [s, setS] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* 저장 실패는 무시 */
    }
  }, [s]);

  const api = useMemo(
    () => ({
      s,
      site: s.sites.find((x) => x.id === s.siteId) || s.sites[0],
      // update(fn): fn(이전 상태) → 새 상태
      update: (fn) => setS((p) => fn(p)),
      set: (patch) => setS((p) => ({ ...p, ...patch })),
      patchSite: (id, patch) =>
        setS((p) => ({ ...p, sites: p.sites.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      reset: () => setS(makeSeed()),
    }),
    [s]
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
