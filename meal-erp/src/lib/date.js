export const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
export const MEALS = ["조식", "중식", "석식", "야식"];

const pad = (n) => String(n).padStart(2, "0");

// 로컬 날짜를 YYYY-MM-DD 로 (UTC 변환 없이)
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (s, n) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};
// 월요일 시작 주
export const weekStart = (s) => {
  const d = parse(s);
  const dow = (d.getDay() + 6) % 7; // 월=0
  d.setDate(d.getDate() - dow);
  return iso(d);
};
export const todayISO = () => iso(new Date());
export const md = (s) => {
  const d = parse(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};
export const weekLabel = (ws) => `${md(ws)} ~ ${md(addDays(ws, 6))}`;
export const monthOf = (s) => s.slice(0, 7);
export const daysInMonth = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
};
export const addMonths = (ym, n) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
export const dowKo = (s) => DAYS[(parse(s).getDay() + 6) % 7];
