import { useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import { useAuth } from "../../auth";
import Confirm from "../../components/Confirm";
import { Loading } from "../../components/Status";
import { money } from "../../lib/rarity";
import { useToast } from "../../toast";

export default function AdminUsers() {
  const toast = useToast();
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(
    () => api("/users").then(setUsers).catch((e) => { toast(e.message, "error"); setUsers([]); }),
    [toast]
  );
  useEffect(() => { load(); }, [load]);

  const run = async (fn, okMsg) => {
    try {
      await fn();
      toast(okMsg);
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  };

  if (!users) return <Loading kind="rows" />;

  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Ism</th><th>Email</th><th>Telefon</th><th>Hamyon</th><th>Rol</th><th>Holat</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const self = u._id === me._id;
              return (
                <tr key={u._id}>
                  <td>{u.name}{self && <span className="muted"> (siz)</span>}</td>
                  <td>{u.email}</td>
                  <td className="num">{u.phone_number}</td>
                  <td className="num">{money(u.wallet)}</td>
                  <td>
                    <select className="input" style={{ minHeight: 34, padding: "4px 8px", width: 100 }} aria-label={`${u.name} roli`} value={u.role} disabled={self}
                      onChange={(e) => run(() => api(`/users/${u._id}`, { method: "PATCH", body: { role: e.target.value } }), "Rol o'zgardi")}>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>{u.isBanned ? <span className="badge bad">Bloklangan</span> : <span className="badge on">Faol</span>}</td>
                  <td>
                    <div className="cell-actions">
                      <button className="btn ghost small" disabled={self}
                        onClick={() => run(() => api(`/users/${u._id}/ban`, { method: "PATCH", body: { isBanned: !u.isBanned } }), u.isBanned ? "Blokdan chiqarildi" : "User bloklandi")}>
                        {u.isBanned ? "Blokdan chiqarish" : "Bloklash"}
                      </button>
                      <button className="btn danger small" disabled={self} onClick={() => setConfirm(u)}>O'chirish</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {confirm && (
        <Confirm
          title="Userni o'chirasizmi?"
          text={`${confirm.name} o'chadi, uning skinlari admin omboriga qaytadi.`}
          onYes={() => run(() => api(`/users/${confirm._id}`, { method: "DELETE" }), "User o'chirildi").then(() => setConfirm(null))}
          onClose={() => setConfirm(null)}
        />
      )}
    </>
  );
}
