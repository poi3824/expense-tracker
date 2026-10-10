import { useCallback, useEffect, useState } from "react";
import Calendar from "./Calendar.jsx";
import CategoryBars from "./CategoryBars.jsx";
import DayPanel from "./DayPanel.jsx";
import { getDailySummary } from "./api.js";
import { todayStr, won } from "./constants.js";

export default function App() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selected, setSelected] = useState(todayStr());
  const [summaries, setSummaries] = useState({});
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const loadSummary = useCallback(() => {
    const m = `${year}-${String(month).padStart(2, "0")}`;
    getDailySummary(m)
      .then((rows) => {
        setError("");
        setSummaries(Object.fromEntries(rows.map((r) => [r.date, r])));
      })
      .catch(() => setError("서버에 연결할 수 없습니다. 백엔드(uvicorn)가 켜져 있는지 확인하세요."));
  }, [year, month]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const moveMonth = (delta) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const rows = Object.values(summaries);
  const income = rows.reduce((a, r) => a + r.income, 0);
  const expense = rows.reduce((a, r) => a + r.expense, 0);

  return (
    <div className="app">
      <main className="main">
        <header className="head">
          <button onClick={() => moveMonth(-1)} aria-label="이전 달">‹</button>
          <h1>
            {year}년 {month}월
          </h1>
          <button onClick={() => moveMonth(1)} aria-label="다음 달">›</button>
          <div className="month-total">
            <span className="income">수입 {won(income)}</span>
            <span className="expense">지출 {won(expense)}</span>
            <span>합계 {won(income - expense)}</span>
          </div>
        </header>
        {error && <p className="error">{error}</p>}
        <Calendar year={year} month={month} summaries={summaries} selected={selected} onSelect={setSelected} />
        <CategoryBars month={`${year}-${String(month).padStart(2, "0")}`} version={version} />
      </main>
      <DayPanel
        date={selected}
        onChanged={() => {
          loadSummary();
          setVersion((v) => v + 1);
        }}
      />
    </div>
  );
}
