import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import useTitle from "../lib/useTitle";

function useSubmit(action) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const loc = useLocation();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await action();
      navigate(loc.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return { submit, error, busy };
}

export function Login() {
  useTitle("Kirish");
  const { user, login } = useAuth();
  const loc = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const { submit, error, busy } = useSubmit(() => login(form.email, form.password));

  if (user) return <Navigate to={loc.state?.from || "/"} replace />;

  return (
    <div className="auth">
      <h1 className="display h1">Kirish</h1>
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" autoComplete="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="field">
          <span>Parol</span>
          <input className="input" type="password" autoComplete="current-password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? "Kirilmoqda..." : "Kirish"}</button>
        <p className="muted">Hisobingiz yo'qmi? <Link to="/register" style={{ textDecoration: "underline" }}>Ro'yxatdan o'ting</Link></p>
      </form>
    </div>
  );
}

export function Register() {
  useTitle("Ro'yxatdan o'tish");
  const { user, register } = useAuth();
  const loc = useLocation();
  const [form, setForm] = useState({ name: "", phone_number: "", email: "", password: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const { submit, error, busy } = useSubmit(() => register(form));

  if (user) return <Navigate to={loc.state?.from || "/"} replace />;

  return (
    <div className="auth">
      <h1 className="display h1">Ro'yxatdan o'tish</h1>
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Ism</span>
          <input className="input" autoComplete="name" required minLength={2} value={form.name} onChange={set("name")} />
        </label>
        <label className="field">
          <span>Telefon raqam</span>
          <input className="input" type="tel" autoComplete="tel" placeholder="+998901234567" required value={form.phone_number} onChange={set("phone_number")} />
        </label>
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" autoComplete="email" required value={form.email} onChange={set("email")} />
        </label>
        <label className="field">
          <span>Parol (kamida 6 belgi)</span>
          <input className="input" type="password" autoComplete="new-password" required minLength={6} value={form.password} onChange={set("password")} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? "Yaratilmoqda..." : "Hisob yaratish"}</button>
        <p className="muted">Hisobingiz bormi? <Link to="/login" style={{ textDecoration: "underline" }}>Kiring</Link></p>
      </form>
    </div>
  );
}
