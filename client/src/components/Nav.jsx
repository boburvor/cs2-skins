import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { money } from "../lib/rarity";
import { IconBag, IconCase, IconShield, IconStore, Logo } from "./Icons";

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="top">
      <div className="wrap">
        <Link to="/" className="brand" aria-label="SkinMarket, bosh sahifa">
          <Logo /> SkinMarket
        </Link>

        <nav className="nav" aria-label="Asosiy">
          <NavLink to="/" end><IconCase />Keyslar</NavLink>
          <NavLink to="/market"><IconStore />Bozor</NavLink>
          {user && <NavLink to="/inventory"><IconBag />Inventar</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin"><IconShield />Admin</NavLink>}
        </nav>

        {user ? (
          <div className="row">
            <Link to="/profile" className="wallet" aria-label="Hamyon va profil">
              <span className="num">{money(user.wallet)}</span>
              <small>{user.name}</small>
            </Link>
            <button
              className="btn ghost small"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Chiqish
            </button>
          </div>
        ) : (
          <div className="row">
            <Link to="/login" className="btn ghost small">Kirish</Link>
            <Link to="/register" className="btn small">Ro'yxatdan o'tish</Link>
          </div>
        )}
      </div>
    </header>
  );
}
