export const CATEGORIES = {
  expense: ["식비", "카페/간식", "교통", "주거/통신", "쇼핑", "의료/건강", "문화/여가", "교육", "경조사", "기타"],
  income: ["급여", "용돈", "부수입", "기타"],
};

export const CATEGORY_COLORS = {
  // 지출
  "식비": "#f2704f",
  "카페/간식": "#b9824a",
  "교통": "#3b82f6",
  "주거/통신": "#8b5cf6",
  "쇼핑": "#ec4899",
  "의료/건강": "#10b981",
  "문화/여가": "#f59e0b",
  "교육": "#06b6d4",
  "경조사": "#84cc16",
  // 수입
  "급여": "#3b82f6",
  "용돈": "#f59e0b",
  "부수입": "#10b981",
  // 공통
  "기타": "#94a3b8",
  "미분류": "#b8bec9",
};

export const categoryColor = (name) => CATEGORY_COLORS[name] || "#94a3b8";

export const PAYMENT_METHODS = ["현금", "체크카드", "신용카드", "계좌이체", "간편결제"];

export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 로컬 시간 기준 YYYY-MM-DD (toISOString은 UTC라 날짜가 하루 밀릴 수 있음)
export function toDateStr(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function todayStr() {
  const t = new Date();
  return toDateStr(t.getFullYear(), t.getMonth() + 1, t.getDate());
}

export const won = (n) => `${Number(n).toLocaleString("ko-KR")}원`;
