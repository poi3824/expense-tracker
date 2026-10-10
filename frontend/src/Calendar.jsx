import { WEEKDAYS, toDateStr, todayStr, won } from "./constants.js";

export default function Calendar({ year, month, summaries, selected, onSelect }) {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = todayStr();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="calendar">
      <div className="weekdays">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="grid">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="cell empty" />;
          const date = toDateStr(year, month, d);
          const s = summaries[date];
          const cls = ["cell"];
          if (date === selected) cls.push("selected");
          if (date === today) cls.push("today");
          return (
            <button key={i} className={cls.join(" ")} onClick={() => onSelect(date)}>
              <span className="day">{d}</span>
              {s?.income > 0 && <span className="amt income">+{won(s.income)}</span>}
              {s?.expense > 0 && <span className="amt expense">-{won(s.expense)}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
