import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import SkinCard from "../components/SkinCard";
import { Empty, Failed, Loading } from "../components/Status";
import useTitle from "../lib/useTitle";
import { RARITIES, RARITY, money } from "../lib/rarity";
import { useToast } from "../toast";

export default function Market() {
  useTitle("Bozor");
  const { user, refresh } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [skins, setSkins] = useState(null);
  const [q, setQ] = useState("");
  const [rarity, setRarity] = useState(null);
  const [sort, setSort] = useState("price-asc");
  const [busy, setBusy] = useState(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    return api("/skins?owner=admin").then(setSkins).catch(() => setFailed(true));
  }, []);
  useEffect(() => { load(); }, [load]);

  const list = useMemo(() => {
    if (!skins) return [];
    const text = q.trim().toLowerCase();
    const out = skins.filter((s) => (!rarity || s.skinRarity === rarity) && (!text || s.skinName.toLowerCase().includes(text)));
    out.sort((a, b) => (sort === "price-asc" ? a.skinPrice - b.skinPrice : b.skinPrice - a.skinPrice));
    return out;
  }, [skins, q, rarity, sort]);

  const buy = async (skin) => {
    if (!user) return navigate("/login", { state: { from: "/market" } });
    setBusy(skin._id);
    try {
      await api(`/users/me/buy/${skin._id}`, { method: "POST" });
      toast(`${skin.skinName} sotib olindi`);
      await Promise.all([refresh(), load()]);
    } catch (e) {
      toast(e.message, "error");
      load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="head">
        <div>
          <h1 className="display h1">Bozor</h1>
          <p className="lead">Admin omboridagi skinlarni narxida sotib oling.{skins ? ` Hozir ${skins.length} ta skin sotuvda.` : ""}</p>
        </div>
      </div>

      <div className="toolbar">
        <input className="input" type="search" placeholder="Skin nomi bo'yicha qidirish" aria-label="Qidirish" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips" role="group" aria-label="Daraja bo'yicha filtr">
          {RARITIES.map((r) => (
            <button key={r} className="chip" aria-pressed={rarity === r} style={{ "--c": RARITY[r].color }} onClick={() => setRarity(rarity === r ? null : r)}>
              <i />{RARITY[r].label}
            </button>
          ))}
        </div>
        <select className="input" aria-label="Saralash" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="price-asc">Narx: arzonidan</option>
          <option value="price-desc">Narx: qimmatidan</option>
        </select>
      </div>

      {failed ? (
        <Failed onRetry={() => { setSkins(null); load(); }} />
      ) : !skins ? (
        <Loading />
      ) : list.length === 0 ? (
        <Empty title="Skin topilmadi">Filtrni o'zgartiring yoki keyinroq qaytib keling.</Empty>
      ) : (
        <div className="grid">
          {list.map((s) => (
            <SkinCard key={s._id} skin={s}>
              <button className="btn" disabled={busy === s._id} onClick={() => buy(s)}>
                {busy === s._id ? "Olinmoqda..." : `Sotib olish ${money(s.skinPrice)}`}
              </button>
            </SkinCard>
          ))}
        </div>
      )}
    </>
  );
}
