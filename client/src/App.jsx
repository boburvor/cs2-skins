import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth";
import Nav from "./components/Nav";
import { Empty, Loading } from "./components/Status";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import Market from "./pages/Market";
import Inventory from "./pages/Inventory";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import { Login, Register } from "./pages/AuthPages";

function Guard({ admin, children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Nav />
      <main className="wrap page">
        <Routes>
          <Route path="/" element={<Cases />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/market" element={<Market />} />
          <Route path="/inventory" element={<Guard><Inventory /></Guard>} />
          <Route path="/profile" element={<Guard><Profile /></Guard>} />
          <Route path="/admin" element={<Guard admin><Admin /></Guard>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="*"
            element={
              <Empty title="Sahifa topilmadi">
                <Link to="/" className="btn" style={{ marginTop: 16 }}>Keyslarga qaytish</Link>
              </Empty>
            }
          />
        </Routes>
      </main>
      <footer className="wrap foot-bar">
        <span>SkinMarket</span>
        <span>Sinov rejimi: haqiqiy to'lov yo'q, hamma summa virtual.</span>
      </footer>
    </>
  );
}
