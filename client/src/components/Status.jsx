export function Loading({ kind = "grid", n = 8 }) {
  const items = (count, cls) => Array.from({ length: count }, (_, i) => <div key={i} className={`sk ${cls}`} />);
  if (kind === "rows") return <div role="status" aria-label="Yuklanmoqda">{items(6, "sk-row")}</div>;
  if (kind === "cases") return <div className="cases" role="status" aria-label="Yuklanmoqda">{items(3, "sk-case")}</div>;
  return <div className="grid" role="status" aria-label="Yuklanmoqda">{items(n, "sk-card")}</div>;
}

export const Empty = ({ title, children }) => (
  <div className="empty">
    <strong>{title}</strong>
    {children}
  </div>
);

export const Failed = ({ onRetry, text = "Backend ishlayotganini tekshiring (npm run dev)." }) => (
  <Empty title="Server bilan aloqa yo'q">
    {text}
    <div style={{ marginTop: 16 }}>
      <button className="btn" onClick={onRetry}>Qayta urinish</button>
    </div>
  </Empty>
);
