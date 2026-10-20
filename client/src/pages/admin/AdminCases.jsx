import { useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import Confirm from "../../components/Confirm";
import { IconX } from "../../components/Icons";
import { Empty, Loading } from "../../components/Status";
import { RARITIES, RARITY, money } from "../../lib/rarity";
import { useToast } from "../../toast";

function CaseRow({ box, stock, onChange, onDelete, toast }) {
  const [price, setPrice] = useState(String(box.price));
  const [exp, setExp] = useState(String(box.expensiveFrom));
  const [add, setAdd] = useState("");
  const changed = Number(price) !== box.price || Number(exp) !== box.expensiveFrom;

  const run = async (fn, okMsg) => {
    try {
      await fn();
      if (okMsg) toast(okMsg);
      onChange();
    } catch (e) {
      toast(e.message, "error");
    }
  };

  return (
    <section className="panel stack" style={{ borderTop: `4px solid ${RARITY[box.rarity].color}` }}>
      <div className="row spread">
        <h3 className="h3">{box.name} <span className="muted" style={{ fontWeight: 500 }}>({RARITY[box.rarity].label})</span></h3>
        <button className="btn danger small" onClick={() => onDelete(box)}>Keysni o'chirish</button>
      </div>

      <div className="row">
        <label className="field"><span>Narxi ($)</span>
          <input className="input num" style={{ width: 120 }} type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
        <label className="field"><span>Qimmat skin chegarasi ($)</span>
          <input className="input num" style={{ width: 160 }} type="number" min="0" step="1" value={exp} onChange={(e) => setExp(e.target.value)} /></label>
        {changed && (
          <button className="btn small" style={{ alignSelf: "end", marginBottom: 6 }}
            onClick={() => run(() => api(`/cases/${box._id}`, { method: "PATCH", body: { price: Number(price), expensiveFrom: Number(exp) } }), "Keys saqlandi")}>
            Saqlash
          </button>
        )}
      </div>

      <div className="row" style={{ gap: 6 }}>
        {box.skins.length === 0 && <span className="muted">Keys bo'sh</span>}
        {box.skins.map((s) => (
          <span key={s._id} className="chip" style={{ "--c": RARITY[s.skinRarity].color, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <i />{s.skinName} <span className="num">{money(s.skinPrice)}</span>
            <button aria-label={`${s.skinName} ni keysdan olish`} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "inherit", display: "inline-flex" }}
              onClick={() => run(() => api(`/cases/${box._id}/skins/${s._id}`, { method: "DELETE" }), "Skin keysdan olindi")}>
              <IconX width="14" height="14" />
            </button>
          </span>
        ))}
      </div>

      <div className="row">
        <select className="input" style={{ width: "auto", minWidth: 240 }} aria-label="Keysga skin qo'shish" value={add} onChange={(e) => setAdd(e.target.value)}>
          <option value="">Omborddan skin tanlang</option>
          {stock.map((s) => <option key={s._id} value={s._id}>{s.skinName} ({money(s.skinPrice)})</option>)}
        </select>
        <button className="btn ghost small" disabled={!add}
          onClick={() => run(() => api(`/cases/${box._id}/skins/${add}`, { method: "POST" }), "Skin keysga qo'shildi").then(() => setAdd(""))}>
          Keysga qo'shish
        </button>
      </div>
    </section>
  );
}

export default function AdminCases() {
  const toast = useToast();
  const [cases, setCases] = useState(null);
  const [stock, setStock] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", rarity: "Rare", expensiveFrom: "500" });
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([api("/cases"), api("/skins?owner=admin")]);
      setCases(c);
      setStock(s);
      setPicked((p) => p.filter((id) => s.some((x) => x._id === id)));
    } catch (e) {
      toast(e.message, "error");
      setCases((c) => c || []);
    }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/cases", {
        method: "POST",
        body: { name: form.name, price: Number(form.price), rarity: form.rarity, expensiveFrom: Number(form.expensiveFrom), skins: picked },
      });
      toast("Keys yaratildi");
      setForm({ name: "", price: "", rarity: "Rare", expensiveFrom: "500" });
      setPicked([]);
      load();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    try {
      await api(`/cases/${confirm._id}`, { method: "DELETE" });
      toast("Keys o'chirildi, skinlar omborga qaytdi");
      load();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setConfirm(null);
    }
  };

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="stack" style={{ gap: 28 }}>
      <form className="stack panel" onSubmit={create}>
        <h2 className="h3">Yangi keys</h2>
        <div className="form wide">
          <label className="field"><span>Nomi</span>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="field"><span>Narxi ($)</span>
            <input className="input" type="number" min="0.01" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
          <label className="field"><span>Daraja</span>
            <select className="input" value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value })}>
              {RARITIES.map((r) => <option key={r} value={r}>{RARITY[r].label}</option>)}
            </select></label>
          <label className="field"><span>Qimmat skin chegarasi ($)</span>
            <input className="input" type="number" min="0" step="1" required value={form.expensiveFrom} onChange={(e) => setForm({ ...form, expensiveFrom: e.target.value })} /></label>
        </div>

        <div className="field">
          <span>Ichiga skinlar (omborda turganlari): {picked.length} ta tanlandi</span>
          {stock.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>Omborda bo'sh skin yo'q. Avval "Skinlar" bo'limida skin qo'shing.</p>
          ) : (
            <div className="picker">
              {stock.map((s) => (
                <label key={s._id} style={{ "--rar": RARITY[s.skinRarity].color }}>
                  <input type="checkbox" checked={picked.includes(s._id)} onChange={() => toggle(s._id)} />
                  <span className="sw" />
                  {s.skinName}
                  <span className="p num">{money(s.skinPrice)}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div><button className="btn" disabled={busy}>{busy ? "Yaratilmoqda..." : "Keys yaratish"}</button></div>
      </form>

      {!cases ? (
        <Loading />
      ) : cases.length === 0 ? (
        <Empty title="Keys yo'q">Yuqoridagi forma orqali birinchi keysni yarating.</Empty>
      ) : (
        cases.map((c) => <CaseRow key={c._id + c.price + c.expensiveFrom} box={c} stock={stock} onChange={load} onDelete={setConfirm} toast={toast} />)
      )}

      {confirm && (
        <Confirm title="Keysni o'chirasizmi?" text={`${confirm.name} o'chadi, ichidagi skinlar admin omboriga qaytadi.`} onYes={remove} onClose={() => setConfirm(null)} />
      )}
    </div>
  );
}
