import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import Modal from "../components/Modal";
import SkinCard from "../components/SkinCard";
import { Empty } from "../components/Status";
import { money } from "../lib/rarity";
import useTitle from "../lib/useTitle";
import { useToast } from "../toast";

export default function Inventory() {
  useTitle("Inventar");
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => { refresh(); }, [refresh]);

  const skins = user?.skins ?? [];
  const owned = skins.filter((s) => !s.isWithdrawn);
  const withdrawn = skins.filter((s) => s.isWithdrawn);
  const total = owned.reduce((sum, s) => sum + s.skinPrice, 0);

  const act = async (skin, kind) => {
    setBusy(skin._id);
    try {
      const r = await api(`/users/me/${kind}/${skin._id}`, { method: "POST" });
      toast(r.message);
      await refresh();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  };

  return (
    <>
      <div className="head">
        <h1 className="display h1">Inventar</h1>
      </div>

      <div className="stats">
        <div><span>Skinlar</span><b className="num">{owned.length}</b></div>
        <div><span>Umumiy qiymat</span><b className="num">{money(total)}</b></div>
        <div><span>Hamyon</span><b className="num">{money(user?.wallet)}</b></div>
        <div><span>Yechib olingan</span><b className="num">{withdrawn.length}</b></div>
      </div>

      {owned.length === 0 ? (
        <Empty title="Inventar bo'sh">
          <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
            <Link to="/" className="btn">Keys ochish</Link>
            <Link to="/market" className="btn ghost">Bozorga o'tish</Link>
          </div>
        </Empty>
      ) : (
        <div className="grid">
          {owned.map((s) => (
            <SkinCard key={s._id} skin={s}>
              <button className="btn" disabled={busy === s._id} onClick={() => act(s, "sell")}>
                Sotish {money(s.skinPrice)}
              </button>
              <button className="btn ghost" disabled={busy === s._id} onClick={() => setConfirm(s)}>
                Yechib olish
              </button>
            </SkinCard>
          ))}
        </div>
      )}

      {withdrawn.length > 0 && (
        <>
          <hr className="divider" />
          <h2 className="display h2" style={{ marginBottom: 20 }}>Yechib olinganlar</h2>
          <div className="grid">
            {withdrawn.map((s) => <SkinCard key={s._id} skin={s} tag="Yechilgan" dim />)}
          </div>
        </>
      )}

      {confirm && (
        <Modal title="Skinni yechib olasizmi?" onClose={() => setConfirm(null)}>
          <p className="muted" style={{ margin: 0 }}>
            {confirm.skinName} saytdan chiqariladi va keyin sotib bo'lmaydi. Bu amalni qaytarib bo'lmaydi.
          </p>
          <div className="row">
            <button className="btn" onClick={() => act(confirm, "withdraw")}>Yechib olish</button>
            <button className="btn ghost" onClick={() => setConfirm(null)}>Bekor qilish</button>
          </div>
        </Modal>
      )}
    </>
  );
}
