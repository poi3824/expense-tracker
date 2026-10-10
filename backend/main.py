"""가계부 백엔드 (FastAPI + SQLite)

실행: uvicorn main:app --reload
API 문서: http://127.0.0.1:8000/docs
"""
import sqlite3
from contextlib import contextmanager
from datetime import date as Date
from pathlib import Path
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DB_PATH = Path(__file__).parent / "gagyebu.db"

app = FastAPI(title="가계부 API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@contextmanager
def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS transactions (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                date           TEXT    NOT NULL,           -- YYYY-MM-DD
                type           TEXT    NOT NULL CHECK (type IN ('income','expense')),
                amount         INTEGER NOT NULL CHECK (amount > 0),
                description    TEXT    NOT NULL,
                category       TEXT,
                payment_method TEXT,
                memo           TEXT
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date)")


init_db()


class TransactionIn(BaseModel):
    date: Date
    type: Literal["income", "expense"]
    amount: int = Field(gt=0, description="금액(원)")
    description: str = Field(min_length=1, max_length=100)
    category: Optional[str] = None
    payment_method: Optional[str] = None
    memo: Optional[str] = None


class TransactionOut(TransactionIn):
    id: int


def row_to_out(row: sqlite3.Row) -> dict:
    return dict(row)


@app.post("/transactions", response_model=TransactionOut, status_code=201)
def create_transaction(tx: TransactionIn):
    with db() as conn:
        cur = conn.execute(
            "INSERT INTO transactions (date,type,amount,description,category,payment_method,memo)"
            " VALUES (?,?,?,?,?,?,?)",
            (tx.date.isoformat(), tx.type, tx.amount, tx.description,
             tx.category, tx.payment_method, tx.memo),
        )
        row = conn.execute("SELECT * FROM transactions WHERE id=?", (cur.lastrowid,)).fetchone()
    return row_to_out(row)


@app.get("/transactions", response_model=list[TransactionOut])
def list_transactions(
    date: Optional[Date] = Query(None, description="특정 날짜 (YYYY-MM-DD)"),
    month: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$", description="특정 월 (YYYY-MM)"),
):
    sql, params = "SELECT * FROM transactions", []
    if date:
        sql += " WHERE date=?"
        params.append(date.isoformat())
    elif month:
        sql += " WHERE date LIKE ?"
        params.append(f"{month}-%")
    sql += " ORDER BY date, id"
    with db() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [row_to_out(r) for r in rows]


@app.put("/transactions/{tx_id}", response_model=TransactionOut)
def update_transaction(tx_id: int, tx: TransactionIn):
    with db() as conn:
        cur = conn.execute(
            "UPDATE transactions SET date=?,type=?,amount=?,description=?,"
            "category=?,payment_method=?,memo=? WHERE id=?",
            (tx.date.isoformat(), tx.type, tx.amount, tx.description,
             tx.category, tx.payment_method, tx.memo, tx_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(404, "내역을 찾을 수 없습니다")
        row = conn.execute("SELECT * FROM transactions WHERE id=?", (tx_id,)).fetchone()
    return row_to_out(row)


@app.delete("/transactions/{tx_id}", status_code=204)
def delete_transaction(tx_id: int):
    with db() as conn:
        cur = conn.execute("DELETE FROM transactions WHERE id=?", (tx_id,))
        if cur.rowcount == 0:
            raise HTTPException(404, "내역을 찾을 수 없습니다")


@app.get("/summary/daily")
def daily_summary(month: str = Query(..., pattern=r"^\d{4}-\d{2}$")):
    """캘린더 각 칸에 표시할 날짜별 수입/지출 합계"""
    with db() as conn:
        rows = conn.execute(
            """
            SELECT date,
                   SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS income,
                   SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expense
            FROM transactions WHERE date LIKE ? GROUP BY date ORDER BY date
            """,
            (f"{month}-%",),
        ).fetchall()
    return [
        {"date": r["date"], "income": r["income"], "expense": r["expense"],
         "balance": r["income"] - r["expense"]}
        for r in rows
    ]


@app.get("/summary/day/{day}")
def day_summary(day: Date):
    """선택한 날짜의 총합 (우측 패널용)"""
    with db() as conn:
        r = conn.execute(
            """
            SELECT COALESCE(SUM(CASE WHEN type='income'  THEN amount END),0) AS income,
                   COALESCE(SUM(CASE WHEN type='expense' THEN amount END),0) AS expense
            FROM transactions WHERE date=?
            """,
            (day.isoformat(),),
        ).fetchone()
    return {"date": day.isoformat(), "income": r["income"], "expense": r["expense"],
            "balance": r["income"] - r["expense"]}


@app.get("/summary/category")
def category_summary(
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    type: Literal["income", "expense"] = "expense",
):
    """월별 카테고리 합계 (막대 그래프용). 카테고리가 없으면 '미분류'로 묶음"""
    with db() as conn:
        rows = conn.execute(
            """
            SELECT COALESCE(category,'미분류') AS category,
                   SUM(amount) AS total, COUNT(*) AS count
            FROM transactions WHERE date LIKE ? AND type=?
            GROUP BY COALESCE(category,'미분류') ORDER BY total DESC
            """,
            (f"{month}-%", type),
        ).fetchall()
    return [dict(r) for r in rows]
