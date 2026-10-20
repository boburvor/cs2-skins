import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import SkinArt from "../components/SkinArt";
import { Empty, Failed, Loading } from "../components/Status";
import { money, rarityOf } from "../lib/rarity";
import useTitle from "../lib/useTitle";

const STEPS = [
  ["01", "Hamyonni to'ldiring", "Hamyon sahifasida kerakli summani qo'shing."],
  ["02", "Keysni oching", "Lenta aylanadi va ichidan bitta skin tushadi."],
  ["03", "Sotish yoki yechib olish", "Skinni pulga aylantiring yoki saytdan chiqarib oling."],
];

export default function Cases() {
  useTitle("Keyslar");
  const [cases, setCases] = useState(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    setCases(null);
    api("/cases").then(setCases).catch(() => setFailed(true));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="head">
        <div>
          <h1 className="display h1">Keyslar</h1>
          <p className="lead">Keysni oching, ichidagi skinlardan biri sizga tushadi.</p>
        </div>
      </div>

      <ol className="steps">
        {STEPS.map(([n, title, text]) => (
          <li key={n}>
            <span className="n">{n}</span>
            <b>{title}</b>
            <span className="t">{text}</span>
          </li>
        ))}
      </ol>

      {failed ? (
        <Failed onRetry={load} />
      ) : !cases ? (
        <Loading kind="cases" />
      ) : cases.length === 0 ? (
        <Empty title="Hozircha keys yo'q">Admin keys qo'shgandan keyin bu yerda ko'rinadi.</Empty>
      ) : (
        <div className="cases">
          {cases.map((c) => {
            const rar = rarityOf(c.rarity);
            const prices = c.skins.map((s) => s.skinPrice);
            const preview = [...c.skins].sort((a, b) => b.skinPrice - a.skinPrice).slice(0, 3);
            return (
              <Link key={c._id} to={`/cases/${c._id}`} className="case" style={{ "--rar": rar.color }}>
                <div className="fan" aria-hidden="true">
                  {preview.map((s) => <SkinArt key={s._id} skin={s} />)}
                </div>
                <div className="body">
                  <div>
                    <h2 className="h3">{c.name}</h2>
                    <div className="muted">
                      {prices.length
                        ? `${c.skins.length} ta skin, ${money(Math.min(...prices))} dan ${money(Math.max(...prices))} gacha`
                        : "Keys bo'sh"}
                    </div>
                  </div>
                  <div className="foot">
                    <span className="price num">{money(c.price)}</span>
                    <span className="btn small">Ochish</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
