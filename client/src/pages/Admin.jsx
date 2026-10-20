import { useEffect, useState } from "react";
import { api } from "../api";
import useTitle from "../lib/useTitle";
import AdminCases from "./admin/AdminCases";
import AdminSkins from "./admin/AdminSkins";
import AdminUsers from "./admin/AdminUsers";

const TABS = [
  { id: "skins", label: "Skinlar", view: AdminSkins },
  { id: "cases", label: "Keyslar", view: AdminCases },
  { id: "users", label: "Userlar", view: AdminUsers },
];

export default function Admin() {
  useTitle("Admin");
  const [tab, setTab] = useState("skins");
  const [stats, setStats] = useState(null);

  // Bo'lim almashganda sonlar yangilanadi
  useEffect(() => {
    Promise.all([api("/skins"), api("/cases"), api("/users")])
      .then(([skins, cases, users]) =>
        setStats({
          skins: skins.length,
          stock: skins.filter((s) => (s.owner || "admin") === "admin").length,
          cases: cases.length,
          users: users.length,
          banned: users.filter((u) => u.isBanned).length,
        })
      )
      .catch(() => setStats(null));
  }, [tab]);
  const View = TABS.find((t) => t.id === tab).view;

  return (
    <>
      <div className="head">
        <h1 className="display h1">Admin</h1>
      </div>
      {stats && (
        <div className="stats">
          <div><span>Skinlar (jami)</span><b className="num">{stats.skins}</b></div>
          <div><span>Omborda</span><b className="num">{stats.stock}</b></div>
          <div><span>Keyslar</span><b className="num">{stats.cases}</b></div>
          <div><span>Userlar</span><b className="num">{stats.users}</b></div>
          <div><span>Bloklangan</span><b className="num">{stats.banned}</b></div>
        </div>
      )}
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <View />
    </>
  );
}
