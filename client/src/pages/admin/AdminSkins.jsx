import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../api";
import Confirm from "../../components/Confirm";
import SkinArt from "../../components/SkinArt";
import { Loading } from "../../components/Status";
import { RARITIES, RARITY, money } from "../../lib/rarity";
import { useToast } from "../../toast";

const HOLDER = { admin: "Omborda", case: "Keysda", user: "Userda" };

function PriceCell({ skin, onSave }) {
  const [value, setValue] = useState(String(skin.skinPrice));
  const changed = Number(value) !== skin.skinPrice;
  return (
    <div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
      <input className="input num" style={{ width: 96, minHeight: 34, padding: "4px 8px" }} type="number" min="0" step="0.01" aria-label="Narx" value={value} onChange={(e) => setValue(e.target.value)} />
      {changed && <button className="btn small" onClick={() => onSave(skin, Number(value))}>Saqlash</button>}
    </div>
  );
}

export default function AdminSkins() {
  const toast = useToast();
  const [skins, setSkins] = useState(null);
  const [form, setForm] = useState({ skinName: "", skinRarity: "Common", skinPrice: "" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(
    () => api("/skins").then(setSkins).catch((e) => { toast(e.message, "error"); setSkins([]); }),
    [toast]
  );
  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("skinName", form.skinName);
      fd.append("skinRarity", form.skinRarity);
      fd.append("skinPrice", form.skinPrice);
      if (file) fd.append("skinImage", file);
      await api("/skins", { method: "POST", form: fd });
      toast("Skin qo'shildi");
      setForm({ skinName: "", skinRarity: "Common", skinPrice: "" });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const savePrice = async (skin, skinPrice) => {
    try {
      await api(`/skins/${skin._id}`, { method: "PATCH", body: { skinPrice } });
      toast("Narx saqlandi");
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const changeImage = async (skin, f) => {
    if (!f) return;
    try {
      const fd = new FormData();
      fd.append("skinImage", f);
      await api(`/skins/${skin._id}/image`, { method: "PATCH", form: fd });
      toast("Rasm yangilandi");
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const remove = async () => {
    try {
      await api(`/skins/${confirm._id}`, { method: "DELETE" });
      toast("Skin o'chirildi");
      load();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setConfirm(null);
    }
  };

  return (
    <div className="stack" style={{ gap: 28 }}>
      <form className="form wide panel" onSubmit={create}>
        <label className="field"><span>Nomi</span>
          <input className="input" required value={form.skinName} onChange={(e) => setForm({ ...form, skinName: e.target.value })} /></label>
        <label className="field"><span>Daraja</span>
          <select className="input" value={form.skinRarity} onChange={(e) => setForm({ ...form, skinRarity: e.target.value })}>
            {RARITIES.map((r) => <option key={r} value={r}>{RARITY[r].label}</option>)}
          </select></label>
        <label className="field"><span>Narxi ($)</span>
          <input className="input" type="number" min="0" step="0.01" required value={form.skinPrice} onChange={(e) => setForm({ ...form, skinPrice: e.target.value })} /></label>
        <label className="field"><span>Rasm (JPG, PNG, WEBP, 5MB gacha)</span>
          <input ref={fileRef} className="input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files[0] || null)} /></label>
        <button className="btn" disabled={busy}>{busy ? "Qo'shilmoqda..." : "Skin qo'shish"}</button>
      </form>

      {!skins ? (
        <Loading kind="rows" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th></th><th>Nomi</th><th>Daraja</th><th>Narxi</th><th>Qayerda</th><th></th></tr>
            </thead>
            <tbody>
              {skins.map((s) => (
                <tr key={s._id}>
                  <td className="thumb"><SkinArt skin={s} /></td>
                  <td>{s.skinName}</td>
                  <td>{RARITY[s.skinRarity]?.label}</td>
                  <td><PriceCell key={s.skinPrice} skin={s} onSave={savePrice} /></td>
                  <td>
                    <span className="badge">{HOLDER[s.owner || "admin"]}</span>{" "}
                    {s.isWithdrawn && <span className="badge bad">Yechilgan</span>}
                  </td>
                  <td>
                    <div className="cell-actions">
                      <label className="btn ghost small" style={{ cursor: "pointer" }}>
                        Rasm
                        <input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={(e) => { changeImage(s, e.target.files[0]); e.target.value = ""; }} />
                      </label>
                      <button className="btn danger small" onClick={() => setConfirm(s)}>O'chirish</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted" style={{ margin: 0 }}>Jami {skins?.length ?? 0} ta skin, umumiy narxi {money((skins || []).reduce((a, s) => a + s.skinPrice, 0))}.</p>

      {confirm && (
        <Confirm
          title="Skinni o'chirasizmi?"
          text={`${confirm.skinName} bazadan, userlar inventaridan va keyslardan ham olib tashlanadi.`}
          onYes={remove}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
