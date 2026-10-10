import { useEffect, useState } from "react";
import { CATEGORIES, PAYMENT_METHODS, won } from "./constants.js";
import { createTransaction, deleteTransaction, getTransactions } from "./api.js";

const emptyForm = { amount: "", description: "", category: "", payment_method: "", memo: "" };

export default function DayPanel({ date, onChanged }) {
  const [items, setItems] = useState([]);
  const [type, setType] = useState("expense");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = () =>
    getTransactions(date)
      .then(setItems)
      .catch((e) => setError(e.message));

  useEffect(() => {
    setError("");
    load();
  }, [date]);

  const income = items.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const expense = items.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const changeType = (t) => {
    setType(t);
    setForm({ ...form, category: "" });
  };

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      await createTransaction({
        date,
        type,
        amount: Number(form.amount),
        description: form.description.trim(),
        category: form.category || null,
        payment_method: form.payment_method || null,
        memo: form.memo.trim() || null,
      });
      setForm(emptyForm);
      await load();
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    setError("");
    try {
      await deleteTransaction(id);
      await load();
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <aside className="panel">
      <h2>{date}</h2>

      <div className="totals">
        <div>
          <span>수입</span>
          <strong className="income">{won(income)}</strong>
        </div>
        <div>
          <span>지출</span>
          <strong className="expense">{won(expense)}</strong>
        </div>
        <div>
          <span>합계</span>
          <strong>{won(income - expense)}</strong>
        </div>
      </div>

      <ul className="list">
        {items.length === 0 && <li className="none">내역이 없습니다</li>}
        {items.map((t) => (
          <li key={t.id}>
            <div className="row">
              <span className="desc">{t.description}</span>
              <span className={`money ${t.type}`}>
                {t.type === "income" ? "+" : "-"}
                {won(t.amount)}
              </span>
              <button className="del" onClick={() => remove(t.id)} aria-label="삭제">
                ✕
              </button>
            </div>
            <div className="meta">
              {[t.category, t.payment_method, t.memo].filter(Boolean).join(" · ")}
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="form">
        <div className="toggle">
          <button type="button" className={type === "expense" ? "on expense" : ""} onClick={() => changeType("expense")}>
            지출
          </button>
          <button type="button" className={type === "income" ? "on income" : ""} onClick={() => changeType("income")}>
            수입
          </button>
        </div>
        <input type="number" min="1" placeholder="금액" value={form.amount} onChange={set("amount")} required />
        <input type="text" maxLength={100} placeholder="내용" value={form.description} onChange={set("description")} required />
        <select value={form.category} onChange={set("category")}>
          <option value="">카테고리 (선택)</option>
          {CATEGORIES[type].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={form.payment_method} onChange={set("payment_method")}>
          <option value="">결제수단 (선택)</option>
          {PAYMENT_METHODS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <input type="text" placeholder="메모 (선택)" value={form.memo} onChange={set("memo")} />
        <button type="submit" className="submit">추가</button>
        {error && <p className="error">{error}</p>}
      </form>
    </aside>
  );
}
