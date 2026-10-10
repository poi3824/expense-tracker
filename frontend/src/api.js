const BASE = "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let msg = `요청 실패 (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") msg = data.detail;
    } catch {}
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

export const getDailySummary = (month) => request(`/summary/daily?month=${month}`);
export const getCategorySummary = (month, type) =>
  request(`/summary/category?month=${month}&type=${type}`);
export const getTransactions = (date) => request(`/transactions?date=${date}`);
export const createTransaction = (body) =>
  request("/transactions", { method: "POST", body: JSON.stringify(body) });
export const deleteTransaction = (id) => request(`/transactions/${id}`, { method: "DELETE" });
