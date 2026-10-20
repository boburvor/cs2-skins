import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { dateFmt, money } from "../lib/rarity";
import useTitle from "../lib/useTitle";
import { useToast } from "../toast";

const QUICK = [100, 250, 500, 1000];

export default function Profile() {
  useTitle("Hamyon");
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", phone_number: "", email: "", password: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) setForm({ name: user.name, phone_number: user.phone_number, email: user.email, password: "" });
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const recharge = async (value) => {
    const n = Number(value);
    if (!n || n <= 0) return toast("Summani kiriting", "error");
    setBusy(true);
    try {
      const r = await api("/users/me/wallet", { method: "POST", body: { amount: n } });
      toast(r.message);
      setAmount("");
      await refresh();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    const body = {};
    for (const k of ["name", "phone_number", "email"]) if (form[k] !== user[k]) body[k] = form[k];
    if (form.password) body.password = form.password;
    if (Object.keys(body).length === 0) return toast("O'zgarish yo'q", "error");

    try {
      await api(`/users/${user._id}`, { method: "PATCH", body });
      toast("Profil saqlandi");
      setForm((f) => ({ ...f, password: "" }));
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const history = [...(user.recharge_history || [])].reverse();

  return (
    <>
      <div className="head">
        <div>
          <h1 className="display h1">Hamyon</h1>
          <div className="big-balance num" style={{ marginTop: 16 }}>{money(user.wallet)}</div>
        </div>
      </div>

      <div className="cols">
        <section className="stack">
          <h2 className="display h2">Hamyonni to'ldirish</h2>
          <div className="chips">
            {QUICK.map((n) => (
              <button key={n} className="chip" disabled={busy} onClick={() => recharge(n)}>+{money(n)}</button>
            ))}
          </div>
          <form className="row" onSubmit={(e) => { e.preventDefault(); recharge(amount); }}>
            <input className="input" style={{ width: 160 }} type="number" min="0.01" step="0.01" placeholder="Boshqa summa" aria-label="Summa" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button className="btn" disabled={busy}>To'ldirish</button>
          </form>
          <p className="muted" style={{ margin: 0 }}>Bu sinov rejimi: to'lov tizimi ulanmagan, summa to'g'ridan-to'g'ri hamyonga qo'shiladi.</p>

          <h3 className="h3" style={{ marginTop: 12 }}>To'ldirishlar tarixi</h3>
          {history.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>Hozircha to'ldirish bo'lmagan.</p>
          ) : (
            <ul className="history">
              {history.map((h, i) => (
                <li key={i}>
                  <span className="muted">{dateFmt(h.date)}</span>
                  <b className="num">+{money(h.amount)}</b>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="stack">
          <h2 className="display h2">Profil</h2>
          <form className="form" onSubmit={save}>
            <label className="field"><span>Ism</span>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="field"><span>Telefon raqam</span>
              <input className="input" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} /></label>
            <label className="field"><span>Email</span>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="field"><span>Yangi parol (o'zgartirmasangiz, bo'sh qoldiring)</span>
              <input className="input" type="password" autoComplete="new-password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
            {error && <p className="error" role="alert">{error}</p>}
            <button className="btn">Saqlash</button>
          </form>
        </section>
      </div>
    </>
  );
}
