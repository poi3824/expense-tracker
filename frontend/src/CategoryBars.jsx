import { useEffect, useState } from "react";
import { getCategorySummary } from "./api.js";
import { categoryColor, won } from "./constants.js";

export default function CategoryBars({ month, version }) {
  const [type, setType] = useState("expense");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getCategorySummary(month, type)
      .then(setRows)
      .catch(() => setRows([]));
  }, [month, type, version]);

  const sum = rows.reduce((a, r) => a + r.total, 0);
  const max = rows.length ? rows[0].total : 0;

  return (
    <section className="cats">
      <div className="cats-head">
        <h2>카테고리별 {type === "expense" ? "지출" : "수입"}</h2>
        <div className="toggle small">
          <button className={type === "expense" ? "on expense" : ""} onClick={() => setType("expense")}>
            지출
          </button>
          <button className={type === "income" ? "on income" : ""} onClick={() => setType("income")}>
            수입
          </button>
        </div>
      </div>

      {rows.length === 0 && <p className="none">이번 달 내역이 없습니다</p>}
      {rows.map((r) => (
        <div key={r.category} className="bar-row">
          <span className="bar-name">{r.category}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(r.total / max) * 100}%`, background: categoryColor(r.category) }}
            />
          </div>
          <span className="bar-val">
            {won(r.total)} <em>{Math.round((r.total / sum) * 100)}%</em>
          </span>
        </div>
      ))}
    </section>
  );
}
